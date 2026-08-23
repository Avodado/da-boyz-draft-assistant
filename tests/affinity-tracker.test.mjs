import assert from 'node:assert/strict';
import fs from 'node:fs';

await import('../affinity-tracker.js');
const A=globalThis.DABOYZ_AFFINITY_TRACKER;
assert.ok(A);

assert.equal(A.affectsSurvival,false);
assert.deepEqual(A.enabledTeamsFor('URINE TROUBLE',{}),['DEN']);
assert.deepEqual(new Set(A.enabledTeamsFor('Cam + Guy',{})),new Set(['TB','BAL']));
assert.deepEqual(new Set(A.enabledTeamsFor('Go Diego Go!!!',{})),new Set(['NO','DEN']));
assert.match(A.basisFor('Go Diego Go!!!','NO'),/historical Saints selection signal/);
assert.match(A.basisFor('Go Diego Go!!!','DEN'),/Broncos fandom/);

const custom=A.normalizedSettings({
  'URINE TROUBLE':{DEN:false,KC:true},
  'Custom Owner':{SEA:true}
});
assert.deepEqual(A.enabledTeamsFor('URINE TROUBLE',custom),['KC']);
assert.deepEqual(A.enabledTeamsFor('Custom Owner',custom),['SEA']);
assert.equal(A.basisFor('URINE TROUBLE','KC'),'manual prospective 2026 tracking hypothesis');

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

const discovery=A.summarizeDiscoveryRows([
  {affinityDiscovery:{profileId:'Go Diego Go!!!',selected:{nflTeam:'DEN'},selectedReachVsAdp:7,marketOpportunityByTeam:[{team:'DEN',band:'STRONG'},{team:'NO',band:'PLAUSIBLE'}]}},
  {affinityDiscovery:{profileId:'Go Diego Go!!!',selected:{nflTeam:'NO'},selectedReachVsAdp:2,marketOpportunityByTeam:[{team:'NO',band:'STRONG'},{team:'DEN',band:'STRONG'}]}},
  {affinityDiscovery:{profileId:'Go Diego Go!!!',selected:{nflTeam:'DEN'},selectedReachVsAdp:-3,marketOpportunityByTeam:[{team:'DEN',band:'PLAUSIBLE'},{team:'KC',band:'STRONG'}]}},
  {affinityDiscovery:{profileId:'Pelota Negro',selected:{nflTeam:'LV'},selectedReachVsAdp:5,marketOpportunityByTeam:[{team:'LV',band:'STRONG'}]}}
],'Go Diego Go!!!');
assert.equal(discovery.picksTracked,3);
assert.equal(discovery.topSelectionTeams[0].team,'DEN');
assert.equal(discovery.topSelectionTeams[0].selections,2);
assert.equal(discovery.teams.find(x=>x.team==='DEN').strongOpportunities,2);
assert.equal(discovery.teams.find(x=>x.team==='NO').plausibleOpportunities,2);

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(index,/interpretation-layer\.js/);
assert.match(index,/affinity-tracker\.js/);
assert.ok(index.indexOf('interpretation-layer.js')<index.indexOf('affinity-tracker.js'));

const source=fs.readFileSync(new URL('../affinity-tracker.js',import.meta.url),'utf8');
assert.match(source,/affectsSurvival:false/);
assert.match(source,/PASSIVE_ALL_TEAM_DISCOVERY/);
assert.match(source,/Passive discovery watches all 32 NFL teams/);
assert.doesNotMatch(source,/survivalProbability\s*=|ownerHazard\s*=|draftStrength\s*=|recommendation\s*=/);

console.log('affinity tracker tests passed');
