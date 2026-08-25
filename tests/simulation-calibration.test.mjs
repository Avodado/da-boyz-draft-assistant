import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import zlib from 'node:zlib';

await import('../simulation-calibration.js');
const C=globalThis.DABOYZ_SIMULATION_CALIBRATION;

test('opponent variance is tightly market-anchored early and widens later',()=>{
  assert.ok(C);
  assert.equal(C.version,'1.0');
  assert.equal(C.legacyNoiseScale,30);
  assert.equal(C.opponentNoiseScale({round:1}),6);
  assert.equal(C.opponentNoiseScale({round:2}),7.2);
  assert.equal(C.opponentNoiseScale({round:5}),10.8);
  assert.equal(C.opponentNoiseScale({round:13}),20);
  assert.equal(C.opponentNoiseScale({round:17}),20);
  assert.equal(C.calibratedNoiseScale(30,{round:1}),6);
  assert.equal(C.calibratedNoiseScale(5,{round:1}),5);
});

test('calibration is limited to the legacy opponent-noise call',()=>{
  const source=fs.readFileSync(new URL('../simulation-calibration.js',import.meta.url),'utf8');
  const html=zlib.gunzipSync(fs.readFileSync(new URL('../app.html.gz',import.meta.url))).toString('utf8');
  const legacyCalls=[...html.matchAll(/simNoise\(30(?:\.0)?\)/g)];
  assert.equal(legacyCalls.length,1);
  const chooser=html.slice(html.indexOf('function chooseOpponentSimulatedPlayer'),html.indexOf('function chooseMyTeamSimulatedPlayer'));
  assert.match(chooser,/simNoise\(30\.0\)/);
  assert.match(source,/LEGACY_OPPONENT_NOISE_SCALE=30/);
  assert.match(source,/const baseSimNoise=simNoise/);
  assert.match(source,/simNoise=function/);
  assert.doesNotMatch(source,/chooseOpponentSimulatedPlayer\s*=|ownerPickDistribution\s*=|draftStrength\s*=|survivalProbability\s*=|recommendation\s*=/);
});

test('index loads simulation calibration before interpretation and affinity layers',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(index,/simulation-calibration\.js/);
  assert.match(index,/interpretation-layer\.js/);
  assert.match(index,/affinity-tracker\.js/);
  assert.ok(index.indexOf('simulation-calibration.js')<index.indexOf('interpretation-layer.js'));
  assert.ok(index.indexOf('interpretation-layer.js')<index.indexOf('affinity-tracker.js'));
});

test('known Card-9 failure seeds no longer leave Jahmyr Gibbs available at 1.09',()=>{
  const html=zlib.gunzipSync(fs.readFileSync(new URL('../app.html.gz',import.meta.url))).toString('utf8');
  const start=html.indexOf('const ROUND_ORDER='),end=html.indexOf('function renderRosters',start);
  const context=vm.createContext({Date,Math,JSON,structuredClone,console,alert(){},confirm(){return true},document:{getElementById(){return null},querySelector(){return null}}});
  vm.runInContext(html.slice(start,end),context);
  vm.runInContext(fs.readFileSync(new URL('../simulation-calibration.js',import.meta.url),'utf8'),context);
  vm.runInContext(`
    function regressionTeamsCard9(){
      const ids=["Kickers Are People Too","Jerry-Rigged","Cam + Guy","DA BRONCOS","El Pacifesta","Pimpin since '99","Pelota Negro","R Kelly's Golden Showers","URINE TROUBLE"];
      const cards=[1,2,3,4,5,6,7,8,10];
      const mine=normalizeTeamIdentity({...applyTeamPreset({},"No Chumps"),card:9,my:true},0);
      return [mine,...ids.map((id,i)=>normalizeTeamIdentity({...applyTeamPreset({},id),card:cards[i],my:false},i+1))];
    }
    function regressionToCard9(seed){
      state={identityVersion:IDENTITY_VERSION,teams:regressionTeamsCard9(),players:freshMasterPool(),picks:[],settings:{preset:"daboyz",pressure:{...PRESETS.daboyz},ownerModel:true,profileStrength:1,liveAdaptation:true,mockSeed:seed},selectedPlayerId:null,mockCounter:0};
      resetCalcMemo();
      while(current()&&current().overall<9){
        const sp=current(),p=chooseOpponentSimulatedPlayer(sp);
        if(!p)throw new Error('No simulated opponent pick at '+sp.overall);
        state.picks.push({...sp,source:'regression',player:{...p}});
        p.drafted=true;
        resetCalcMemo();
      }
      return {gibbsDrafted:state.players.find(p=>p.name==='Jahmyr Gibbs').drafted,picks:state.picks.map(p=>p.player.name)};
    }
  `,context);
  for(const seed of [1,5,10,15,25,37,46,49]){
    context.__seed=seed;
    const result=vm.runInContext('regressionToCard9(__seed)',context);
    assert.equal(result.gibbsDrafted,true,`seed ${seed}: ${result.picks.join(', ')}`);
  }
});
