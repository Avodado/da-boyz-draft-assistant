import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import vm from "node:vm";
import { analyzeDirectory } from "../diagnostics/aggregate_mock_grades.mjs";

const html = zlib.gunzipSync(fs.readFileSync(new URL("../app.html.gz", import.meta.url))).toString("utf8");

function harness() {
  const start = html.indexOf("const ROUND_ORDER="), end = html.indexOf("function renderRosters", start);
  const context = vm.createContext({ Date, Math, JSON, structuredClone, confirm() { return true; }, document: { getElementById() { return null; }, querySelector() { return null; } }, alert() {} });
  vm.runInContext(html.slice(start, end), context);
  vm.runInContext(`
    save=()=>true; renderSetup=()=>{}; renderAll=()=>{};
    function exportReset(seed=8129) {
      state={identityVersion:IDENTITY_VERSION,teams:DEFAULT_2026_ROOM_PRESET_IDS.map((id,i)=>normalizeTeamIdentity({...applyTeamPreset({},id),card:i+1,my:id==="No Chumps"},i)),players:freshMasterPool(),picks:[],decisionSnapshots:[],draftGrades:null,settings:{preset:"daboyz",pressure:{...PRESETS.daboyz},ownerModel:true,profileStrength:1,liveAdaptation:true,mockSeed:seed},selectedPlayerId:null,mockCounter:0};
      resetCalcMemo();
    }
  `, context);
  return context;
}

function parseExport(context) {
  return JSON.parse(vm.runInContext("serializeDraftStateExport()", context));
}

test("manual, simulated, emergency, and Undo paths are reflected in exports", () => {
  const c = harness();
  for (const [source, expected] of [["manual", "manual"], ["simulated", "sim"], ["unlisted", "emergency"]]) {
    vm.runInContext("exportReset()", c);
    if (source === "unlisted") vm.runInContext(`recordPick({id:"manual_export",name:"Emergency Export",position:"OTHER",drafted:true},"unlisted",false)`, c);
    else vm.runInContext(`recordPick(chooseMyTeamSimulatedPlayer(current()),${JSON.stringify(source)},false)`, c);
    let exported = parseExport(c);
    assert.equal(exported.decisionSnapshots.length, 1);
    assert.equal(exported.decisionSnapshots[0].selectionSource, expected);
    assert.equal(exported.decisionSnapshots[0].pick.overall, 1);
    assert.equal(exported.decisionSnapshots[0].topCandidates.length, 10);
    vm.runInContext("undo()", c);
    exported = parseExport(c);
    assert.equal(exported.picks.length, 0);
    assert.equal(exported.decisionSnapshots.length, 0);
  }
});

test("full 17-round export contains diagnostics and grades, round-trips, and aggregates offline", () => {
  const c = harness();
  vm.runInContext("exportReset(); randomizeSetup(()=>.271828); simulateFullRoom()", c);
  const exported = parseExport(c), mine = exported.teams.find(t => t.my), myPicks = exported.picks.filter(p => Number(p.card) === Number(mine.card));
  assert.equal(exported.picks.length, 170);
  assert.equal(exported.diagnosticsVersion, 1);
  assert.equal(exported.decisionSnapshots.length, 17);
  assert.deepEqual(exported.decisionSnapshots.map(s => s.pick.overall), myPicks.map(p => p.overall));
  for (const snapshot of exported.decisionSnapshots) {
    assert.equal(snapshot.topCandidates.length, 10);
    assert.ok(snapshot.topCandidates.every(row => Number.isFinite(row.draftStrength) && "survivalProbability" in row && row.recommendationLabel && row.components));
    assert.ok(snapshot.topCandidates.every(row => row.components.tierCliff && row.components.tierCliff.affectsDraftStrength === false));
    assert.ok(snapshot.context.rosterPlayerIds.length === snapshot.sequence - 1, "snapshot is captured before its selected player is added");
  }
  assert.equal(exported.draftGrades.gradesVersion, 1);
  assert.equal(exported.draftGrades.teams.length, 10);
  assert.equal(exported.draftGrades.teams.filter(t => t.my && t.profileId === "No Chumps").length, 1);
  assert.equal(exported.exportMetadata.exportSchemaVersion, 1);
  assert.equal(exported.exportMetadata.exportedByBuild, "v0.12.9");
  assert.equal(exported.exportMetadata.diagnosticsVersion, 1);
  assert.equal(exported.exportMetadata.gradesVersion, 1);
  c.__imported = structuredClone(exported);
  vm.runInContext("state={...state,...normalizeLoadedState(__imported)}; resetCalcMemo()", c);
  const roundTripped = parseExport(c);
  assert.deepEqual(roundTripped.picks.map(p => [p.overall, p.card, p.player.id]), exported.picks.map(p => [p.overall, p.card, p.player.id]));
  assert.deepEqual(roundTripped.decisionSnapshots, exported.decisionSnapshots);
  assert.deepEqual(roundTripped.draftGrades, exported.draftGrades);
  assert.deepEqual(roundTripped.teams, exported.teams);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "daboyz-v0129-export-"));
  try {
    const file = path.join(dir, "completed.json"), json = JSON.stringify(roundTripped, null, 2);
    fs.writeFileSync(file, json);
    const before = fs.readFileSync(file, "utf8"), report = analyzeDirectory(dir);
    assert.equal(report.completedDrafts, 1);
    assert.equal(Object.keys(report.owners).length, 10);
    assert.ok(report.owners["profile:No Chumps"]);
    assert.equal(fs.readFileSync(file, "utf8"), before);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("old states without reporting fields migrate neutrally and reporting fields cannot alter strategy", () => {
  const c = harness();
  vm.runInContext("exportReset()", c);
  const before = vm.runInContext("state.players.filter(p=>!p.drafted).slice().sort((a,b)=>draftStrength(b)-draftStrength(a)).slice(0,20).map(p=>[p.id,draftStrength(p),recommendation(p).label])", c);
  c.__old = vm.runInContext("({identityVersion:IDENTITY_VERSION,teams:structuredClone(state.teams),players:structuredClone(state.players),picks:[],settings:structuredClone(state.settings),mockCounter:0})", c);
  vm.runInContext("state={...state,...normalizeLoadedState(__old)}; state.decisionSnapshots=[{topCandidates:[{draftStrength:999}]}]; state.draftGrades={gradesVersion:1,teams:[{overallScore:100}]}; resetCalcMemo()", c);
  const after = vm.runInContext("state.players.filter(p=>!p.drafted).slice().sort((a,b)=>draftStrength(b)-draftStrength(a)).slice(0,20).map(p=>[p.id,draftStrength(p),recommendation(p).label])", c);
  assert.equal(JSON.stringify(after), JSON.stringify(before));
  const migrated = vm.runInContext("normalizeLoadedState(__old)", c);
  assert.equal(migrated.diagnosticsVersion, 1);
  assert.deepEqual([...migrated.decisionSnapshots], []);
  assert.equal(migrated.draftGrades, null);
});
