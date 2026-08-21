import gzip
import hashlib
import json
import re
import struct
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_BUILD = "v0.12.3"
EXPECTED_CACHE = "daboyz-draft-assistant-v0.12.3-github-2"
EXPECTED_DATA_SHA256 = "20072848f67de32d2448ff896f0c023407b0dedce7082600536f2c92d091c24a"
EXPECTED_MODEL_SHA256 = "a4ccc98562bcbc84ca8fa3e1f0b7c77c744f5abcf286653cba9dab3317dc5ec1"
EXPECTED_POOL_SHA256 = "c46dffa9c92c851957ad52f4b9543b9028d05e1e63fdc09fffbd5690ffac6b06"


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def segment(text: str, start: str, end: str) -> str:
    left = text.index(start)
    right = text.index(end, left)
    return text[left:right]


def png_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise AssertionError(f"{path.name} is not a PNG")
    return struct.unpack(">II", data[16:24])


class PwaAcceptanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = gzip.decompress((ROOT / "app.html.gz").read_bytes()).decode("utf-8")
        cls.index = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
        cls.version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
        cls.worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")

    def test_release_metadata_matches_embedded_build(self) -> None:
        self.assertEqual(self.version["build"], EXPECTED_BUILD)
        self.assertIn(f'const CURRENT_BUILD="{EXPECTED_BUILD}"', self.html)
        self.assertIn(f"Loading {EXPECTED_BUILD}", self.index)
        self.assertEqual(self.manifest["name"], f"DA BOYZ Draft Assistant {EXPECTED_BUILD}")
        self.assertEqual(self.manifest["short_name"], f"DA BOYZ {EXPECTED_BUILD}")
        self.assertIn(EXPECTED_BUILD, self.manifest["description"])

    def test_football_data_and_recommendation_logic_are_byte_bound(self) -> None:
        data_span = segment(self.html, "const ROUND_ORDER=", "function freshMasterPool")
        model_span = segment(self.html, "function teamForCard", "function renderHistory")
        self.assertEqual(sha256(data_span), EXPECTED_DATA_SHA256)
        self.assertEqual(sha256(model_span), EXPECTED_MODEL_SHA256)

    def test_master_pool_remains_exactly_331_unique_players(self) -> None:
        match = re.search(
            r"const DEFAULT_MASTER_POOL=(\[.*\]);\nfunction freshMasterPool",
            self.html,
        )
        self.assertIsNotNone(match)
        pool = json.loads(match.group(1))
        canonical = json.dumps(pool, ensure_ascii=False, separators=(",", ":"))
        self.assertEqual(sha256(canonical), EXPECTED_POOL_SHA256)
        self.assertEqual(len(pool), 331)
        self.assertEqual(len({player["id"] for player in pool}), 331)
        self.assertEqual(len({player["name"] for player in pool}), 331)
        coverage = {}
        for player in pool:
            key = player.get("model_coverage", "")
            coverage[key] = coverage.get(key, 0) + 1
        self.assertEqual(coverage["DRAFTED_ROOKIE_LOOKUP_ONLY"], 55)
        self.assertEqual(sum(count for key, count in coverage.items() if key != "DRAFTED_ROOKIE_LOOKUP_ONLY"), 276)

    def test_state_keys_and_migration_order_remain_compatible(self) -> None:
        self.assertIn(
            'const KEY="daboyzDraftAssistant_v12",RECOVERY_KEY="daboyzDraftAssistant_v12_recovery",META_KEY="daboyzDraftAssistant_v12_meta",LEGACY_KEYS=["daboyzDraftAssistant_v11","daboyzDraftAssistant_v10"]',
            self.html,
        )
        load_source = segment(self.html, "function load()", "function runtimeMode")
        expected_order = [
            '{key:KEY,label:"current autosave"}',
            '{key:RECOVERY_KEY,label:"previous autosave"}',
            "...LEGACY_KEYS.map",
        ]
        offsets = [load_source.index(token) for token in expected_order]
        self.assertEqual(offsets, sorted(offsets))
        self.assertIn("normalizeLoadedState", load_source)
        self.assertIn('save("recovered")', load_source)

    def test_required_draft_controls_and_filters_are_present(self) -> None:
        for element_id in (
            "playerList",
            "manualName",
            "manualPos",
            "manualDraft",
            "undoPick",
            "setupRows",
        ):
            self.assertIn(f'id="{element_id}"', self.html)
        setup_filter = segment(self.html, "function refreshSetupAvailability", "function renderSetup")
        self.assertIn("usedProfiles", setup_filter)
        self.assertIn("!usedProfiles.includes(k)", setup_filter)
        self.assertIn("usedCards", setup_filter)
        self.assertIn("!usedCards.includes(card)", setup_filter)
        self.assertIn('document.getElementById("manualDraft").onclick', self.html)
        self.assertIn('document.getElementById("undoPick").onclick=undo', self.html)

    def test_update_handler_preserves_the_working_cache(self) -> None:
        update_source = segment(self.html, "async function applyHostedUpdate", "function renderReadiness")
        self.assertNotIn("caches.delete", update_source)
        self.assertIn('save("pre-update")', update_source)
        self.assertIn("navigator.serviceWorker.getRegistration()", update_source)
        self.assertNotIn("getRegistrations", update_source)
        self.assertIn('worker.postMessage("SKIP_WAITING")', update_source)
        self.assertIn('worker.state==="activated"', update_source)
        self.assertIn("current offline cache remain available", update_source)

    def test_install_icons_exist_and_match_declared_sizes(self) -> None:
        self.assertEqual(png_dimensions(ROOT / "icon-192.png"), (192, 192))
        self.assertEqual(png_dimensions(ROOT / "icon-512.png"), (512, 512))
        manifest_icons = {(icon["src"], icon["sizes"], icon["type"]) for icon in self.manifest["icons"]}
        self.assertEqual(
            manifest_icons,
            {
                ("icon-192.png", "192x192", "image/png"),
                ("icon-512.png", "512x512", "image/png"),
            },
        )
        for href in re.findall(r'<link[^>]+href="([^"]+)"', self.html + self.index):
            if "://" not in href:
                self.assertTrue((ROOT / href).is_file(), f"missing linked asset: {href}")

    def test_worker_cache_metadata_and_assets_are_complete(self) -> None:
        self.assertIn(f"const CACHE='{EXPECTED_CACHE}'", self.worker)
        assets_match = re.search(r"const ASSETS=\[(.*?)\];", self.worker)
        self.assertIsNotNone(assets_match)
        assets = re.findall(r"'([^']+)'", assets_match.group(1))
        self.assertIn("./version.json", assets)
        self.assertIn("./icon-192.png", assets)
        self.assertIn("./icon-512.png", assets)
        for asset in assets:
            if asset != "./":
                self.assertTrue((ROOT / asset.removeprefix("./")).is_file(), asset)
        self.assertIn("return (await caches.match(fallback||req))||resp", self.worker)

    def test_obsolete_partial_payload_chunk_is_removed(self) -> None:
        self.assertFalse((ROOT / "app" / "00.b64").exists())


if __name__ == "__main__":
    unittest.main()
