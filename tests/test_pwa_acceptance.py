import gzip
import hashlib
import json
import re
import struct
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_BUILD = "v0.12.9"
EXPECTED_CACHE = "daboyz-draft-assistant-v0.12.9-github-1"
EXPECTED_DATA_SHA256 = "20072848f67de32d2448ff896f0c023407b0dedce7082600536f2c92d091c24a"
EXPECTED_MODEL_SHA256 = "4580193cce84afbf9f4782fd21829969d6e39cb08cdc348d62643122f223a40b"
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

    def test_pre_v0124_release_labels_are_not_advertised_by_current_artifacts(self) -> None:
        for artifact in (self.html, self.index, self.manifest["name"], self.manifest["short_name"], self.manifest["description"], self.worker):
            self.assertNotIn("v0.12.3", artifact)

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

    def test_soft_rb_wr_balance_is_a_soft_imbalance_adjustment(self) -> None:
        model = segment(self.html, "function teamForCard", "function renderHistory")
        self.assertIn(
            'const imbalance=Math.max(0,n-(c.WR||0)-1);u-=6*imbalance',
            model,
        )
        self.assertNotIn("CANNOT DRAFT", model[model.index("function rosterUtility"):model.index("function tierInfo")])
        self.assertIn("contingent_score", model[model.index("function rosterUtility"):model.index("function tierInfo")])

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
        self.assertIn("needsIdentityMigration", load_source)
        self.assertIn('save(c.key===KEY?"identity-migration":"recovered")', load_source)

    def test_v0125_identity_schema_and_v0124_migration_are_explicit(self) -> None:
        self.assertIn("const IDENTITY_VERSION=2", self.html)
        self.assertIn("ownerName,teamName,name:teamName,profileId", self.html)
        self.assertIn("x.teams=normalizeTeamIdentities(x.teams||defaultTeams)", self.html)
        self.assertIn("x.identityVersion=IDENTITY_VERSION", self.html)
        self.assertIn("profileId?profileOwnerName(profileId):legacyName", self.html)
        self.assertIn("profileId:team.profileId&&!profileMatchesOwner", self.html)

    def test_v0126_known_team_presets_are_derived_and_non_authoritative(self) -> None:
        self.assertIn(
            "const TEAM_PRESETS=Object.fromEntries(PROFILE_KEYS.map(profileId=>[profileId,{presetId:profileId,ownerName:profileOwnerName(profileId),teamName:profileId,profileId}]))",
            self.html,
        )
        self.assertIn("function applyTeamPreset", self.html)
        self.assertIn("function availableTeamPresetIds", self.html)
        self.assertIn("presetId=t.presetId&&TEAM_PRESETS[t.presetId]?t.presetId:null", self.html)
        read_start = self.html.rindex("function readSetup")
        read_end = self.html.index("function renderRosterIntel", read_start)
        self.assertNotIn("applyTeamPreset(state.teams[i]", self.html[read_start:read_end])

    def test_v0127_self_profile_strategy_boundary_is_explicit(self) -> None:
        self.assertIn("const historicalOwnerPickDistribution=ownerPickDistribution", self.html)
        self.assertIn(
            "Number(sp?.card)===Number(myTeam()?.card)?genericPickDistribution(sp.round):historicalOwnerPickDistribution(sp)",
            self.html,
        )
        self.assertIn("function tierCliffDiagnostic", self.html)
        self.assertIn("affectsDraftStrength:false", self.html)
        strength = segment(self.html, "function draftStrength", "function recommendation")
        self.assertNotIn("profileForCard", strength)
        self.assertNotIn("profilePrediction", strength)
        self.assertNotIn("tierCliffDiagnostic", strength)
        opponent = segment(self.html, "function ownerPickDistributionBase", "function liveOwnerStats")
        self.assertIn("profileForCard(sp.card)", opponent)
        self.assertIn("round_phase_model", opponent)
        adaptive = segment(self.html, "function liveOwnerStats", "function profilePredictionSnapshot")
        self.assertIn("livePositionMultiplier", adaptive)

    def test_v0128_reporting_layers_are_explicit_and_strategy_independent(self) -> None:
        self.assertIn("const DIAGNOSTICS_VERSION=1,GRADES_VERSION=1", self.html)
        self.assertIn(
            'DEFAULT_2026_ROOM_PRESET_IDS=Object.freeze(["No Chumps","Kickers Are People Too","Jerry-Rigged","Cam + Guy","DA BRONCOS","El Pacifesta","Pimpin since \'99","Pelota Negro","R Kelly\'s Golden Showers","URINE TROUBLE"])',
            self.html,
        )
        self.assertNotIn("DEFAULT_2026_ROOM_PRESET_IDS=PROFILE_KEYS.slice", self.html)
        self.assertIn("function randomizeSetup", self.html)
        self.assertIn("function buildDecisionSnapshot", self.html)
        self.assertIn("function calculateDraftGrades", self.html)
        self.assertIn('id="grades"', self.html)
        self.assertIn('id="randomizeSetup"', self.html)
        self.assertIn("gradeGrid", self.html)
        self.assertIn("No Chumps report:", self.html)
        self.assertIn("Best Value Skill Pick:", self.html)
        self.assertIn("GRADE_HEADLINE_POLICY", self.html)
        self.assertIn("grid-template-columns:repeat(6,1fr)", self.html)
        strategy = segment(self.html, "function teamForCard", "function renderHistory")
        for token in ("calculateDraftGrades", "GRADE_WEIGHTS", "decisionSnapshots", "randomizeSetup"):
            self.assertNotIn(token, strategy)

    def test_v0128_export_and_offline_aggregation_are_machine_readable(self) -> None:
        for token in (
            "aggregationKey", "completedAt", "overallScore", "letterGrade", "overallRank",
            "estimatedScheduledWaiverPressure", "rosterPositionalCounts",
        ):
            self.assertIn(token, self.html)
        utility = (ROOT / "diagnostics" / "aggregate_mock_grades.mjs").read_text(encoding="utf-8")
        self.assertIn("function stableIdentity", utility)
        self.assertIn("function aggregateExports", utility)
        self.assertIn("function compareActual", utility)
        self.assertNotIn("app.html.gz", utility)

    def test_v0129_export_builder_prepares_reporting_and_identifies_runtime(self) -> None:
        self.assertIn("const EXPORT_SCHEMA_VERSION=1", self.html)
        self.assertIn("function buildDraftStateExport", self.html)
        self.assertIn("function serializeDraftStateExport", self.html)
        export_source = segment(self.html, "function buildDraftStateExport", "const renderSelectedIntelBase")
        self.assertIn("ensureReportingState()", export_source)
        self.assertIn("if(state.picks.length===170)finalizeDraftGrades()", export_source)
        self.assertIn("exportedByBuild:CURRENT_BUILD", export_source)
        self.assertIn("diagnosticsVersion:state.diagnosticsVersion", export_source)
        self.assertIn("gradesVersion:state.draftGrades?.gradesVersion??null", export_source)

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
        setup_start = self.html.rindex("function refreshSetupAvailability")
        setup_end = self.html.index("function renderSetup", setup_start)
        setup_filter = self.html[setup_start:setup_end]
        self.assertIn("usedProfiles", setup_filter)
        self.assertIn("!usedProfiles.includes(k)", setup_filter)
        self.assertIn("usedCards", setup_filter)
        self.assertIn("!usedCards.includes(card)", setup_filter)
        self.assertIn("usedOwners", setup_filter)
        for label in ("Known Team / Preset", "Owner", "Team", "Historical Profile", "Card"):
            self.assertIn(f"<label>{label}</label>", self.html)
        self.assertIn('data-team-preset=', self.html)
        self.assertIn('data-team-owner=', self.html)
        self.assertIn('data-team-name=', self.html)
        self.assertIn('Custom / New Team', self.html)
        self.assertIn('No History / Neutral', self.html)
        self.assertIn('document.getElementById("manualDraft").onclick', self.html)
        self.assertIn('document.getElementById("undoPick").onclick=undo', self.html)

    def test_android_portrait_and_landscape_setup_layouts_are_covered(self) -> None:
        self.assertIn("@media(max-width:900px)", self.html)
        self.assertIn(".teamrow{grid-template-columns:28px minmax(0,1fr) minmax(0,1fr)}", self.html)
        self.assertIn(".teamrow .setupfield.preset-field,.teamrow .setupfield.profile-field{grid-column:2/4}", self.html)
        self.assertIn(".teamrow .setupfield.owner-field{grid-column:2/3}", self.html)
        self.assertIn(".teamrow .setupfield.team-field{grid-column:3/4}", self.html)
        self.assertIn("@media(max-width:1150px){.setup-grid{grid-template-columns:1fr}}", self.html)
        self.assertIn(".draft-grid,.draft-grid>.card{min-width:0;max-width:100%}", self.html)
        self.assertIn(".playerrow{grid-template-columns:minmax(0,1fr) 46px 52px 68px", self.html)

    def test_draft_undo_and_emergency_pick_paths_remain_connected(self) -> None:
        record = segment(self.html, "function recordPick", "function makePick")
        undo = segment(self.html, "function undo", "function renderHistory")
        self.assertIn("state.picks.push(pick)", record)
        self.assertIn('source==="unlisted"', record)
        self.assertIn("state.picks.pop()", undo)
        self.assertIn("original.drafted=false", undo)
        self.assertIn('recordPick(p,"unlisted",true)', self.html)
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
