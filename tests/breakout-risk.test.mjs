import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
const c = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../breakout-risk.js', import.meta.url), 'utf8'), c);
const api = c.DaBoyzBreakoutRisk;
const evidence = value => ({value, publishedAt:'2024-08-20', source:'https://example.org/dated-report'});
test('future evidence cannot change a historical assessment', () => {
  const old = api.evaluate({breakout_score:80}, {}, '2024-08-28');
  const future = api.evaluate({breakout_score:80}, {role:{...evidence('starter'), publishedAt:'2024-09-01'}}, '2024-08-28');
  assert.equal(future.roleSecurity, old.roleSecurity);
  assert.equal(future.evidenceCoverage, 0);
  assert.deepEqual([...future.rejectedEvidence], ['role']);
});
test('backup talent remains contingent and missing downside evidence stays unknown', () => {
  const result = api.evaluate({breakout_score:88}, {role:evidence('backup')}, '2024-08-28');
  assert.equal(result.eligibility, 'contingent');
  assert.equal(result.confidence, 'INCOMPLETE');
  assert.equal(result.evidenceCoverage, .25);
  assert.equal(api.evaluate({}, {}, '2024-08-28').bustRisk, 'UNKNOWN');
  assert.equal(api.evaluate({}, {}, '2024-08-28').breakoutScore, null);
});
test('shared workloads and recovery are separate flags, with no implicit penalty', () => {
  const player = {breakout_score:72, bust_score:'', intrinsic_confidence:'55'};
  const before = JSON.stringify(player);
  const result = api.evaluate(player, {role:evidence('committee'), competition:evidence('contested'),health:evidence('recovering')}, '2024-08-28');
  assert.equal(result.riskFlags.length, 3);
  assert.equal(result.existingBreakoutAdjustment, 2.2);
  assert.equal(result.affectsStrategy, false);
  assert.equal(JSON.stringify(player), before);
});
test('known unavailability overrides starter designation; malformed evidence fails closed', () => {
  assert.equal(api.evaluate({}, {role:evidence('starter'),health:evidence('unavailable')}, '2024-08-28').eligibility,'unavailable');
  assert.equal(api.evaluate({}, {role:{value:'starter'}}, '2024-08-28').roleSecurity,'unknown');
  assert.throws(()=>api.evaluate({}, {}, ''), /cutoff/);
});
test('mounted review covers all current candidates without changing draft state', () => {
  const html=zlib.gunzipSync(fs.readFileSync(new URL('../app.html.gz',import.meta.url))).toString();
  const left=html.indexOf('const DEFAULT_MASTER_POOL=')+'const DEFAULT_MASTER_POOL='.length;
  const players=JSON.parse(html.slice(left,html.indexOf(';\nfunction freshMasterPool',left)));
  const makeNode=()=>({style:{},children:[],appendChild(child){this.children.push(child)}});
  const document={createElement:makeNode,body:makeNode()};
  const state={players,picks:[{card:7,overall:1}],settings:{}};
  const before=JSON.stringify(state);
  const mounted=vm.createContext({state,document});
  for(const file of ['breakout-risk.js','breakout-evidence.js','breakout-review.js'])vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),mounted);
  assert.equal(mounted.DaBoyzBreakoutReview.rows.length,16);
  assert.equal(document.body.children[0].id,'breakoutRiskReview');
  assert.equal(JSON.stringify(state),before);
  assert.ok(mounted.DaBoyzBreakoutReview.rows.every(r=>r.confidence==='INCOMPLETE'));
  assert.equal(mounted.DaBoyzBreakoutReview.rows.find(r=>r.name==='Travis Hunter').eligibility,'contingent');
});
