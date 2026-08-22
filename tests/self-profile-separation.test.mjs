import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import zlib from "node:zlib";
import vm from "node:vm";

const html = zlib.gunzipSync(fs.readFileSync(new URL("../app.html.gz", import.meta.url))).toString("utf8");

function harness() {
  const start = html.indexOf("const ROUND_ORDER=");
  const end = html.indexOf("function renderRosters", start);
  const context = vm.createContext({ Date, Math, JSON, structuredClone });
  vm.runInContext(html.slice(start, end), context);
  vm.runInContext(`
    function testTeams(selfProfile="No Chumps") {
      const opponentProfiles=PROFILE_KEYS.filter(x=>x!=="No Chumps").slice(0,9);
      return [{ownerName:"Rick Dauven",teamName:"No Chumps",name:"No Chumps",profileId:selfProfile,card:1,my:true},...opponentProfiles.map((profileId,i)=>({ownerName:profileOwnerName(profileId),teamName:profileId,name:profileId,profileId,card:i+2,my:false}))];
    }
    function testReset(selfProfile="No Chumps",seed=7001) {
      state={identityVersion:IDENTITY_VERSION,teams:testTeams(selfProfile),players:freshMasterPool(),picks:[],settings:{preset:"daboyz",pressure:{...PRESETS.daboyz},ownerModel:true,profileStrength:1,liveAdaptation:true,mockSeed:seed},selectedPlayerId:null,mockCounter:0};
      resetCalcMemo();
    }
    function selfSnapshot() {
      resetCalcMemo();
      const available=state.players.filter(p=>!p.drafted&&completionStatus(p).feasible);
      const ordered=[...available].sort((a,b)=>draftStrength(b)-draftStrength(a)||(planningAdp(a)??9999)-(planningAdp(b)??9999)).slice(0,30).map(p=>p.id);
      const hurts=state.players.find(p=>p.name==="Jalen Hurts");
      return {strength:draftStrength(hurts),survival:survivalProbability(hurts),ordered,choice:chooseMyTeamSimulatedPlayer(current()).id};
    }
  `, context);
  return context;
}

test("No Chumps historical profile cannot alter self Draft Strength, SURV, ordering, or simulated choice", () => {
  const context = harness();
  vm.runInContext("testReset('No Chumps')", context);
  const active = vm.runInContext("selfSnapshot()", context);
  vm.runInContext("state.teams.find(t=>t.my).profileId=null", context);
  const neutral = vm.runInContext("selfSnapshot()", context);
  assert.deepEqual(neutral, active);
});

test("opponent historical profiles remain active in hazards and simulated selections", () => {
  const context = harness();
  vm.runInContext("testReset('No Chumps')", context);
  const profiledHazard = vm.runInContext("ownerHazard('QB').expected", context);
  vm.runInContext("state.teams.find(t=>t.card===2).profileId=null; resetCalcMemo()", context);
  const neutralHazard = vm.runInContext("ownerHazard('QB').expected", context);
  assert.notEqual(profiledHazard, neutralHazard);

  let changed = false;
  for (let seed = 1; seed <= 80 && !changed; seed += 1) {
    context.__seed = seed;
    const profiled = vm.runInContext("testReset('No Chumps',__seed); state.picks.push({...schedule()[0],player:{...state.players[0]}}); state.players[0].drafted=true; resetCalcMemo(); chooseOpponentSimulatedPlayer(current()).id", context);
    const neutral = vm.runInContext("testReset('No Chumps',__seed); state.teams.find(t=>t.card===2).profileId=null; state.picks.push({...schedule()[0],player:{...state.players[0]}}); state.players[0].drafted=true; resetCalcMemo(); chooseOpponentSimulatedPlayer(current()).id", context);
    changed = profiled !== neutral;
  }
  assert.equal(changed, true);
});

test("self profile prediction remains diagnostic while the strategy distribution is neutral", () => {
  const context = harness();
  vm.runInContext("testReset('No Chumps')", context);
  const result = vm.runInContext(`(() => {const sp=current(),p=state.players.find(x=>x.name==="Jalen Hurts");return {strategy:ownerPickDistribution(sp),generic:genericPickDistribution(sp.round),prediction:profilePredictionSnapshot(sp,p)}})()`, context);
  assert.deepEqual(result.strategy, result.generic);
  assert.equal(result.prediction.profileId, "No Chumps");
  assert.notDeepEqual(result.prediction.baseDist, result.generic);
});

test("tier-cliff denial output is diagnostic-only", () => {
  const context = harness();
  vm.runInContext("testReset('No Chumps')", context);
  const result = vm.runInContext("tierCliffDiagnostic(state.players.find(p=>p.name==='Jalen Hurts'))", context);
  assert.equal(result.candidateTier, 3);
  assert.equal(result.affectsDraftStrength, false);
  assert.equal(typeof result.expectedOpponentDemand, "number");
  assert.equal(typeof result.denialSignal, "number");
  const strengthStart = html.indexOf("function draftStrength");
  const strengthEnd = html.indexOf("function recommendation", strengthStart);
  assert.doesNotMatch(html.slice(strengthStart, strengthEnd), /tierCliffDiagnostic/);
});
