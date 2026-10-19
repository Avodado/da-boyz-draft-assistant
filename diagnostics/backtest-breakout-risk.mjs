import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
const root=new URL('../',import.meta.url), c=vm.createContext({});
for(const file of ['breakout-risk.js','breakout-evidence.js'])vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),c);
const api=c.DaBoyzBreakoutRisk;
const history=JSON.parse(fs.readFileSync(new URL('./breakout-history.json',import.meta.url),'utf8'));
const cases=history.cases.map(row=>({season:row.season,name:row.name,actualGames:row.outcome.games,outcomeSource:row.outcome.source,
  ...api.evaluate({},row.evidence,row.cutoff)}));
const html=zlib.gunzipSync(fs.readFileSync(new URL('app.html.gz',root))).toString();
const left=html.indexOf('const DEFAULT_MASTER_POOL=')+'const DEFAULT_MASTER_POOL='.length;
const pool=JSON.parse(html.slice(left,html.indexOf(';\nfunction freshMasterPool',left)));
const current=api.assessCollection(pool,c.DaBoyzBreakoutEvidence.players,c.DaBoyzBreakoutEvidence.cutoff);
const report={
  schemaVersion:1,mode:'SHADOW',weightsChanged:false,
  historicalValidation:{scope:history.scope,seasons:[2023,2024],cases,
    limitations:['Cases selected retrospectively; selection bias prevents performance claims.',
      'Games played are outcomes only and are never passed into the evaluator.',
      'A recovery flag is uncertainty, not a prediction of missed games or a bust.',
      'No historical frozen breakout scores, full role histories, matching ADP snapshots, or complete cohort supplied.'],
    performanceBacktest:{status:'NOT_RUN_MISSING_AS_OF_COHORT',existingModel:null,proposedModel:null,adpBaseline:null}},
  currentCandidates:current,
  promotionGate:{passed:false,required:['Frozen pre-draft inputs for every eligible player in each historical season',
    'Timestamped role, competition, health and production evidence',
    'Matched preseason ADP and final weekly PPR outcomes',
    'Walk-forward comparisons by position and draft cost against old model and ADP baseline',
    'Calibration, missed breakouts, costly busts and uncertainty intervals on held-out seasons']}
};
const output=process.argv[2];
if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({historicalCases:cases.length,availabilityFlags:cases.filter(x=>x.eligibility==='unavailable').length,
  currentCandidates:current.length,performanceBacktest:report.historicalValidation.performanceBacktest.status,weightsChanged:false},null,2));
