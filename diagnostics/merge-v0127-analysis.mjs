import fs from "node:fs";

const outputPath = process.argv[2];
const inputPaths = process.argv.slice(3);
if (!outputPath || inputPaths.length < 2) throw new Error("Usage: node merge-v0127-analysis.mjs OUTPUT INPUT...");
const reports = inputPaths.map(path=>JSON.parse(fs.readFileSync(path,"utf8")));

function weightedAverage(arms, field) {
  const total = arms.reduce((n,a)=>n+a.sampleSize,0);
  return arms.reduce((n,a)=>n+a[field]*a.sampleSize,0)/total;
}

function mergeObjectAverages(arms, field) {
  const keys = new Set(arms.flatMap(a=>Object.keys(a[field]||{})));
  return Object.fromEntries([...keys].map(key=>[key,arms.reduce((n,a)=>n+(a[field]?.[key]||0)*a.sampleSize,0)/arms.reduce((n,a)=>n+a.sampleSize,0)]));
}

function mergeDistribution(arms, field) {
  const out={};
  arms.forEach(a=>Object.entries(a[field]||{}).forEach(([key,value])=>out[key]=(out[key]||0)+value));
  return out;
}

function mergeSecond(arms, field) {
  let count=0,roundTotal=0,total=0;
  arms.forEach(a=>{const n=a.sampleSize*(a[field]?.frequency||0);count+=n;roundTotal+=n*(a[field]?.averageRound||0);total+=a.sampleSize});
  return {frequency:count/total,averageRound:count?roundTotal/count:null};
}

function mergeArm(arms) {
  const total=arms.reduce((n,a)=>n+a.sampleSize,0),sequences={};
  arms.forEach(a=>(a.topFirst8Sequences||[]).forEach(x=>sequences[x.sequence]=(sequences[x.sequence]||0)+x.count));
  return {
    sampleSize:total,
    first6Average:mergeObjectAverages(arms,"first6Average"),
    first8Average:mergeObjectAverages(arms,"first8Average"),
    finalAverage:mergeObjectAverages(arms,"finalAverage"),
    firstQbRoundDistribution:mergeDistribution(arms,"firstQbRoundDistribution"),
    firstTeRoundDistribution:mergeDistribution(arms,"firstTeRoundDistribution"),
    secondQb:mergeSecond(arms,"secondQb"),
    secondTe:mergeSecond(arms,"secondTe"),
    rb4ByRound6:weightedAverage(arms,"rb4ByRound6"),
    wrAfterR6:weightedAverage(arms,"wrAfterR6"),
    wrAfterR8:weightedAverage(arms,"wrAfterR8"),
    starterLegality:weightedAverage(arms,"starterLegality"),
    averageLargestByeLoad:weightedAverage(arms,"averageLargestByeLoad"),
    byeLoadAtLeast3:weightedAverage(arms,"byeLoadAtLeast3"),
    recommendationLabels:mergeObjectAverages(arms,"recommendationLabels"),
    valueProxies:mergeObjectAverages(arms,"valueProxies"),
    topFirst8Sequences:Object.entries(sequences).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([sequence,count])=>({sequence,count,rate:count/total})),
  };
}

const merged={
  generatedAt:new Date().toISOString(),
  sampleSizePerArm:reports.reduce((n,r)=>n+r.sampleSizePerArm,0),
  seeds:{first:Math.min(...reports.map(r=>r.seeds.first)),last:Math.max(...reports.map(r=>r.seeds.last))},
  baseline:mergeArm(reports.map(r=>r.baseline)),
  selfProfileNeutral:mergeArm(reports.map(r=>r.selfProfileNeutral)),
  pairedSelectionMismatches:reports.reduce((n,r)=>n+r.pairedSelectionMismatches,0),
  scenario:reports.find(r=>r.scenario)?.scenario||null,
  shards:inputPaths,
};
fs.writeFileSync(outputPath,`${JSON.stringify(merged,null,2)}\n`);
console.log(JSON.stringify({outputPath,sampleSizePerArm:merged.sampleSizePerArm,seeds:merged.seeds,pairedSelectionMismatches:merged.pairedSelectionMismatches},null,2));
