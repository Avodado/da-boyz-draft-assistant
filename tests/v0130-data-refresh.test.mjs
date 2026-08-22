import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import zlib from "node:zlib";

const html = zlib.gunzipSync(fs.readFileSync(new URL("../app.html.gz", import.meta.url))).toString("utf8");
const pool = JSON.parse(html.match(/const DEFAULT_MASTER_POOL=(\[.*\]);\nfunction freshMasterPool/)[1]);
const byName = new Map(pool.map(player => [player.name, player]));

test("v0.13.0 pool is unique, structurally valid, and fully source-stamped", () => {
  assert.equal(pool.length, 337);
  assert.equal(new Set(pool.map(player=>player.id)).size, 337);
  assert.equal(new Set(pool.map(player=>player.name)).size, 337);
  assert.ok(pool.every(player=>["QB","RB","WR","TE","K","D/ST"].includes(player.position)));
  assert.ok(pool.every(player=>Number.isInteger(Number(player.bye)) && Number(player.bye)>=5 && Number(player.bye)<=14));
  assert.ok(pool.every(player=>player.nfl_team && player.market_as_of==="2026-08-22" && player.market_refresh_version==="v0.13.0"));
  assert.ok(pool.every(player=>player.availability_status && player.injury_summary && player.injury_source && player.injury_as_of));
  const noDefensibleCurrentAdp = pool.filter(player=>!(Number(player.planning_adp)>0));
  assert.equal(noDefensibleCurrentAdp.length, 37);
  assert.ok(noDefensibleCurrentAdp.every(player=>player.market_confidence==="LOW" && player.model_coverage==="DRAFTED_ROOKIE_LOOKUP_ONLY"));
});

test("six conservative current-market additions are present and no production Berry fields leak in", () => {
  const additions = ["Rashod Bateman","Brandon Aiyuk","Troy Franklin","Blake Grupe","Cincinnati Bengals","Atlanta Falcons"];
  for (const name of additions) assert.equal(byName.get(name)?.model_coverage, "CURRENT_MARKET_LOOKUP_ONLY");
  const forbidden = ["berryOverallRank","berryPositionRank","berryTags","berryRankDelta","fantasyLifeRank"];
  assert.ok(pool.every(player=>forbidden.every(key=>!(key in player))));
  assert.doesNotMatch(html.slice(html.indexOf("function draftStrength"), html.indexOf("function recommendation")), /Berry|Fantasy Life|berry/i);
  assert.match(html, /Built-in Master Pool v1\.3:<\/b> 337 players/);
  assert.doesNotMatch(html, /331-player pool|<\/b> 331 players/);
});

test("named injury cases retain explicit conservative availability", () => {
  assert.equal(byName.get("Jayden Higgins").availability_status, "OUT_SEASON");
  assert.equal(byName.get("Jayden Higgins").health_score, "5");
  assert.equal(byName.get("Tyler Warren").availability_status, "EXPECTED_WEEK1_READY");
  assert.equal(byName.get("Sam LaPorta").availability_status, "QUESTIONABLE");
  assert.equal(byName.get("Keon Coleman").availability_status, "QUESTIONABLE");
  assert.equal(byName.get("Breece Hall").availability_status, "QUESTIONABLE");
  assert.equal(byName.get("Brandon Aiyuk").availability_status, "RESERVE_LEFT_SQUAD");
});

test("compact diagnostic reports remain reproducible and analysis-only", () => {
  const refresh = fs.readFileSync(new URL("../diagnostics/v0130-data-refresh.md", import.meta.url), "utf8");
  const berry = fs.readFileSync(new URL("../diagnostics/v0130-berry-analysis.md", import.meta.url), "utf8");
  const deltaRows = fs.readFileSync(new URL("../diagnostics/v0130-berry-rank-deltas.csv", import.meta.url), "utf8").trim().split(/\r?\n/);
  assert.match(refresh, /331 → 337/);
  assert.match(refresh, /Players without a genuine prior planning ADP are excluded/);
  assert.match(berry, /matched to the app: 236/);
  assert.match(berry, /Pearson rank correlation.*0\.9226/);
  assert.equal(deltaRows.length, 51);
});
