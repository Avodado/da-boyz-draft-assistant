import assert from 'node:assert/strict';
import fs from 'node:fs';

await import('../affinity-tracker.js');
const A=globalThis.DABOYZ_AFFINITY_TRACKER;
assert.ok(A);

assert.equal(A.affectsSurvival,false);
assert.deepEqual(A.enabledTeamsFor('URINE TROUBLE',{}),['DEN']);
assert.deepEqual(new Set(A.enabledTeamsFor('Cam + Guy',{})),new Set(['TB','BAL']));

const custom=A.normalizedSettings({
  'URINE TROUBLE':{DEN:false,KC:true},
  'Custom Owner':{SEA:true}
});
assert.deepEqual(A.enabledTeamsFor('URINE TROUBLE',custom),['KC']);
assert.deepEqual(A.enabledTeamsFor('Custom Owner',custom),['SEA']);
assert.equal(A.basisFor('URINE TROUBLE','KC'),'manual prospective 2026 tracking');

assert.equal(A.opportunityBand(108,100),'STRONG');
assert.equal(A.opportunityBand(108.01,100),'PLAUSIBLE');
assert.equal(A.opportunityBand(120,100),'PLAUSIBLE');
assert.equal(A.opportunityBand(120.01,100),'DEEP');
assert.equal(A.marketDistance(85,100),-15);
assert.equal(A.marketDistance(120,100),20);

const summary=A.summarizeShadowRows([
  {affinityShadow:{profileId:'URINE TROUBLE',selectedIsAffinity:true,strongOpportunity:true,plausibleOpportunity:true,passedStrongOpportunity:false,selectedReachVsAdp:12}},
  {affinityShadow:{profileId:'URINE TROUBLE',selectedIsAffinity:false,strongOpportunity:true,plausibleOpportunity:true,passedStrongOpportunity:true,selectedReachVsAdp:null}},
  {affinityShadow:{profileId:'URINE TROUBLE',selectedIsAffinity:true,strongOpportunity:false,plausibleOpportunity:true,passedStrongOpportunity:false,selectedReachVsAdp:-4}},
  {affinityShadow:{profileId:'Pelota Negro',selectedIsAffinity:true,strongOpportunity:true,plausibleOpportunity:true,passedStrongOpportunity:false,selectedReachVsAdp:5}}
],'URINE TROUBLE');
assert.equal(summary.picksTracked,3);
assert.equal(summary.affinitySelections,2);
assert.equal(summary.strongOpportunities,2);
assert.equal(summary.passedStrongOpportunities,1);
assert.equal(summary.averageAffinityReach,4);
assert.equal(summary.maxAffinityReach,12);

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(index,/interpretation-layer\.js/);
assert.match(index,/affinity-tracker\.js/);
assert.ok(index.indexOf('interpretation-layer.js')<index.indexOf('affinity-tracker.js'));

const source=fs.readFileSync(new URL('../affinity-tracker.js',import.meta.url),'utf8');
assert.match(source,/affectsSurvival:false/);
assert.doesNotMatch(source,/survivalProbability\s*=|ownerHazard\s*=|draftStrength\s*=|recommendation\s*=/);

console.log('affinity tracker tests passed');
