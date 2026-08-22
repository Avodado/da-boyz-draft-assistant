import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import zlib from "node:zlib";
import vm from "node:vm";

const html = zlib.gunzipSync(fs.readFileSync(new URL("../app.html.gz", import.meta.url))).toString("utf8");

function harness() {
  const start = html.indexOf("const ROUND_ORDER="), end = html.indexOf("function renderRosters", start);
  const context = vm.createContext({ Date, Math, JSON, structuredClone, document: { getElementById() { return null; } }, alert() {} });
  vm.runInContext(html.slice(start, end), context);
  vm.runInContext(`
    save=()=>true; renderSetup=()=>{}; renderAll=()=>{};
    function v128Reset(seed=8128) {
      state={identityVersion:IDENTITY_VERSION,teams:DEFAULT_2026_ROOM_PRESET_IDS.map((id,i)=>normalizeTeamIdentity({...applyTeamPreset({},id),card:i+1,my:id==="No Chumps"},i)),players:freshMasterPool(),picks:[],decisionSnapshots:[],settings:{preset:"daboyz",pressure:{...PRESETS.daboyz},ownerModel:true,profileStrength:1,liveAdaptation:true,mockSeed:seed},selectedPlayerId:null,mockCounter:0};
      const firstCard=schedule()[0].card,my=state.teams.find(t=>t.my),first=state.teams.find(t=>t.card===firstCard); first.card=my.card;my.card=firstCard;resetCalcMemo();
    }
    function v128CompleteDraft() {
      v128Reset(); const sc=schedule(); state.picks=sc.map((sp,i)=>({...sp,source:"fixture",player:{...state.players[i]}})); state.picks.forEach(pk=>{const p=state.players.find(x=>x.id===pk.player.id);if(p)p.drafted=true}); resetCalcMemo(); return finalizeDraftGrades();
    }
  `, context);
  return context;
}

test("Randomize Setup uses ten unique default 2026 presets and cards while preserving No Chumps as My Team", () => {
  const c = harness();
  assert.deepEqual([...vm.runInContext("DEFAULT_2026_ROOM_PRESET_IDS", c)], ["No Chumps","Kickers Are People Too","Jerry-Rigged","Cam + Guy","DA BRONCOS","El Pacifesta","Pimpin since '99","Pelota Negro","R Kelly's Golden Showers","URINE TROUBLE"]);
  assert.equal(vm.runInContext("Object.isFrozen(DEFAULT_2026_ROOM_PRESET_IDS)", c), true);
  vm.runInContext("v128Reset(); randomizeSetup(()=>.314159)", c);
  const result = vm.runInContext("({presets:state.teams.map(t=>t.presetId),cards:state.teams.map(t=>t.card),my:state.teams.filter(t=>t.my).map(t=>t.presetId)})", c);
  assert.equal(new Set(result.presets).size, 10);
  assert.deepEqual([...result.cards].sort((a,b)=>a-b), [1,2,3,4,5,6,7,8,9,10]);
  assert.deepEqual([...result.my], ["No Chumps"]);
  assert.equal(vm.runInContext("PROFILE_KEYS.length", c) > 10, true, "historical profiles remain available outside the randomizer pool");
  const before = vm.runInContext("JSON.stringify(state.teams)", c);
  vm.runInContext("state.picks.push({...schedule()[0],player:{id:'held',name:'Held Pick',position:'RB'}})", c);
  assert.equal(vm.runInContext("randomizeSetup(()=>.9)", c), false);
  assert.equal(vm.runInContext("JSON.stringify(state.teams)", c), before);
});

test("manual and simulated No Chumps picks capture pre-pick top-10 component snapshots and Undo removes them", () => {
  const c = harness(); vm.runInContext("v128Reset()", c);
  const first = vm.runInContext("chooseMyTeamSimulatedPlayer(current())", c);
  c.__id = first.id;
  assert.equal(vm.runInContext("recordPick(state.players.find(p=>p.id===__id),'manual',false)", c), true);
  const snapshot = vm.runInContext("state.decisionSnapshots[0]", c);
  assert.equal(snapshot.selectionSource, "manual"); assert.equal(snapshot.topCandidates.length, 10); assert.equal(snapshot.pick.overall, 1);
  assert.equal(snapshot.context.rosterPlayerIds.length, 0); assert.equal(snapshot.selectedInTop10, true);
  const top = snapshot.topCandidates[0];
  assert.ok(Number.isFinite(top.components.intrinsicContribution)); assert.ok(Number.isFinite(top.components.ownerHazardRatio));
  assert.equal(top.components.tierCliff.affectsDraftStrength, false);
  vm.runInContext("undo()", c); assert.equal(vm.runInContext("state.decisionSnapshots.length", c), 0);

  vm.runInContext("v128Reset()", c); c.__id = vm.runInContext("chooseMyTeamSimulatedPlayer(current()).id", c);
  vm.runInContext("recordPick(state.players.find(p=>p.id===__id),'simulated',false)", c);
  assert.equal(vm.runInContext("state.decisionSnapshots[0].selectionSource", c), "sim");
});

test("emergency No Chumps pick captures the normal board before advancing", () => {
  const c = harness(); vm.runInContext("v128Reset()", c);
  vm.runInContext(`recordPick({id:"manual_x",name:"Emergency Player",position:"OTHER",drafted:true},"unlisted",false)`, c);
  const result = vm.runInContext("({pick:state.picks[0],snap:state.decisionSnapshots[0]})", c);
  assert.equal(result.pick.player.name, "Emergency Player"); assert.equal(result.snap.topCandidates.length, 10);
  assert.equal(result.snap.selectedInTop10, false); assert.equal(result.snap.selectionSource, "emergency");
  vm.runInContext("undo()", c); assert.equal(vm.runInContext("state.picks.length+state.decisionSnapshots.length", c), 0);
});

test("completed grades are deterministic, ranked, and export every machine-readable field", () => {
  const c = harness(); const first = vm.runInContext("v128CompleteDraft()", c); const second = vm.runInContext("calculateDraftGrades()", c);
  assert.deepEqual(second.map(x=>x.overallScore), first.teams.map(x=>x.overallScore));
  assert.deepEqual([...first.teams.map(x=>x.overallRank)].sort((a,b)=>a-b), [1,2,3,4,5,6,7,8,9,10]);
  for (const team of first.teams) {
    for (const key of ["ownerName","teamName","profileId","presetId","aggregationKey","card","my","draftId","completedAt","overallScore","rawWeightedScore","letterGrade","overallRank","components","estimatedScheduledWaiverPressure","rosterPositionalCounts"]) assert.ok(key in team, key);
    assert.ok(team.completedAt);
    assert.equal(Object.keys(team.components).length, Object.keys(vm.runInContext("GRADE_WEIGHTS", c)).length);
    assert.equal(Object.values(team.rosterPositionalCounts).reduce((a,b)=>a+b,0), 17);
    assert.ok(team.bestValueAllPositions === null || Number.isFinite(team.bestValueAllPositions.delta));
    assert.ok(team.biggestReachAllPositions === null || Number.isFinite(team.biggestReachAllPositions.delta));
    assert.ok(team.bestValue === null || (["QB","RB","WR","TE"].includes(team.bestValue.position) && team.bestValue.delta >= 5));
    assert.ok(team.biggestReach === null || (["QB","RB","WR","TE"].includes(team.biggestReach.position) && team.biggestReach.delta <= -8));
  }
  const valueCheck = vm.runInContext(`(() => {const g=state.draftGrades.teams[0],ps=state.picks.filter(x=>x.card===g.card&&planningAdp(x.player)!=null),expected=clamp(50+ps.reduce((a,x)=>a+planningAdp(x.player)-x.overall,0)/ps.length*1.2);return {actual:g.components.valueVsAdp,expected}})()`, c);
  assert.ok(Math.abs(valueCheck.actual-valueCheck.expected)<1e-12, "all-position valueVsAdp component remains unchanged");
  const specialTeamsArtifact = vm.runInContext(`(() => {const pick=state.picks.find(x=>["K","D/ST"].includes(x.player.position)),team=state.teams.find(t=>Number(t.card)===Number(pick.card));pick.player.planning_adp=1;const g=gradeTeam(team);return {raw:g.bestValueAllPositions,headline:g.bestValue}})()`, c);
  assert.ok(["K","D/ST"].includes(specialTeamsArtifact.raw.position), "synthetic raw all-position value is special teams");
  assert.ok(specialTeamsArtifact.headline === null || ["QB","RB","WR","TE"].includes(specialTeamsArtifact.headline.position));
});

test("v0.12.4 migration adds optional diagnostics safely without changing picks", () => {
  const c = harness();
  c.__legacy = { teams: [{name:"No Chumps",profileId:"No Chumps",card:1,my:true}], picks: [{overall:1,card:1,player:{id:"x",name:"X",position:"RB"}}], players: [{id:"x",name:"X",position:"RB",drafted:true}], settings:{preset:"daboyz",pressure:{},mockSeed:2026} };
  const result = vm.runInContext("normalizeLoadedState(__legacy)", c);
  assert.equal(result.diagnosticsVersion, 1); assert.deepEqual([...result.decisionSnapshots], []); assert.equal(result.picks.length, 1);
});

test("grading and diagnostic-only tier code are absent from the frozen Draft Strength function", () => {
  const start = html.indexOf("function draftStrength"), end = html.indexOf("function recommendation", start), source = html.slice(start, end);
  assert.doesNotMatch(source, /grade|decisionSnapshot|tierCliffDiagnostic/);
});
