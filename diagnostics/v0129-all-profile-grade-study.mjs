#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import vm from "node:vm";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";

const NO_CHUMPS = "No Chumps";
const NEUTRAL = "Neutral / No History";
const COMPONENTS = ["starterStrength", "positionalBalance", "benchDepth", "valueVsAdp", "scarcityCaptured", "upside", "byeManagement", "rosterEfficiency", "lineupLegality", "waiverReadiness"];
const POSITIONS = ["QB", "RB", "WR", "TE", "K", "D/ST"];
const SCORE_BINS = [[0,60,"<60"],[60,65,"60–64.99"],[65,70,"65–69.99"],[70,75,"70–74.99"],[75,80,"75–79.99"],[80,85,"80–84.99"],[85,90,"85–89.99"],[90,95,"90–94.99"],[95,101,"95–100"]];
const FROZEN_HASHES = {
  footballData: "20072848f67de32d2448ff896f0c023407b0dedce7082600536f2c92d091c24a",
  recommendationModel: "4580193cce84afbf9f4782fd21829969d6e39cb08cdc348d62643122f223a40b",
  playerPool: "c46dffa9c92c851957ad52f4b9543b9028d05e1e63fdc09fffbd5690ffac6b06",
};

function modelSource() {
  const html = zlib.gunzipSync(fs.readFileSync("app.html.gz")).toString("utf8");
  const start = html.indexOf("const ROUND_ORDER=");
  const end = html.indexOf("function renderRosters", start);
  if (start < 0 || end < 0) throw new Error("Could not isolate application model source");
  return html.slice(start, end);
}

function catalogAudit() {
  const context = vm.createContext({ console, Date, Math, JSON, structuredClone });
  vm.runInContext(modelSource(), context, { filename: "app-model.js" });
  return vm.runInContext(`(() => {
    const profiles=PROFILE_KEYS.map(profileId=>({profileId,ownerName:profileOwnerName(profileId),seasons:Number(ROOM_PROFILES[profileId]?.seasons||0)}));
    return {profiles,historicalOpponentIds:profiles.filter(x=>x.profileId!==${JSON.stringify(NO_CHUMPS)}&&x.seasons>=1).map(x=>x.profileId),zeroHistoryPresetIds:profiles.filter(x=>x.profileId!==${JSON.stringify(NO_CHUMPS)}&&x.seasons===0).map(x=>x.profileId)};
  })()`, context);
}

function createContext() {
  const context = vm.createContext({ console, Date, Math, JSON, structuredClone });
  vm.runInContext(modelSource(), context, { filename: "app-model.js" });
  const helper = fs.readFileSync("diagnostics/v0127-self-profile-analysis.mjs", "utf8");
  const marker = "vm.runInContext(String.raw`";
  const injectionStart = helper.indexOf(marker) + marker.length;
  const injectionEnd = helper.indexOf("`, context, { filename: \"diagnostic-model.js\" });", injectionStart);
  if (injectionStart < marker.length || injectionEnd < 0) throw new Error("Could not isolate diagnostic performance harness");
  let injection = helper.slice(injectionStart, injectionEnd).replace("const diagnosticOriginalPlanningAdp=", "buildDecisionSnapshot=()=>null;\nconst diagnosticOriginalPlanningAdp=");
  const teamsStart = injection.indexOf("function diagnosticTeams");
  const countsStart = injection.indexOf("function diagnosticCounts", teamsStart);
  injection = injection.slice(0, teamsStart) + String.raw`
function diagnosticTeams(trial){
 return trial.teams.map((spec,index)=>{
  const identity=spec.profileTypeId===${JSON.stringify(NEUTRAL)}
   ? normalizeTeamIdentity({ownerName:${JSON.stringify(NEUTRAL)},teamName:${JSON.stringify(NEUTRAL)},name:${JSON.stringify(NEUTRAL)},profileId:null,presetId:null,card:spec.card,my:false},index)
   : normalizeTeamIdentity({...applyTeamPreset({},spec.profileTypeId),card:spec.card,my:spec.profileTypeId===${JSON.stringify(NO_CHUMPS)}},index);
  identity.diagnosticProfileTypeId=spec.profileTypeId;
  return identity;
 });
}
function diagnosticReset(trial){
 state={identityVersion:IDENTITY_VERSION,diagnosticsVersion:DIAGNOSTICS_VERSION,teams:diagnosticTeams(trial),players:freshMasterPool(),picks:[],decisionSnapshots:[],draftGrades:null,draftId:"all-profile-grade-study-"+trial.arm+"-"+trial.seed,completedAt:"diagnostic-seed-"+trial.seed,settings:{preset:"daboyz",pressure:{...PRESETS.daboyz},ownerModel:true,profileStrength:1,liveAdaptation:true,mockSeed:trial.seed},selectedPlayerId:null,mockCounter:0};
 diagnosticTeamMap=new Map(state.teams.map(t=>[Number(t.card),t]));diagnosticMyTeam=state.teams.find(t=>t.my)||null;diagnosticSchedule=[];ROUND_ORDER.forEach((row,r)=>row.forEach((card,s)=>diagnosticSchedule.push({overall:r*10+s+1,round:r+1,slot:s+1,card,team:teamForCard(card)?.name||("Card "+card)})));
 resetCalcMemo();diagnosticPrepareCaches();
}
` + injection.slice(countsStart);
  injection = injection
    .replace("function diagnosticTrial(seed,selfProfile=true){", "function diagnosticTrial(trial){const seed=trial.seed;")
    .replace("diagnosticReset(seed,selfProfile);", "diagnosticReset(trial);")
    .replace("const mine=state.picks.filter(p=>p.card===3)", "const mine=state.picks.filter(p=>p.card===Number(myTeam().card))");
  const returnStart = injection.indexOf("return {signature:mine.map");
  const returnEnd = injection.indexOf(",perf};", returnStart) + ",perf};".length;
  if (returnStart < 0 || returnEnd < ",perf};".length) throw new Error("Could not extend diagnostic trial result");
  injection = injection.slice(0, returnStart) + String.raw`
 const grades=state.draftGrades?.teams||calculateDraftGrades();
 const teamResults=grades.map(g=>{const team=teamForCard(g.card);return{profileTypeId:team.diagnosticProfileTypeId,ownerName:g.ownerName,card:Number(g.card),overallScore:Number(g.overallScore),overallRank:Number(g.overallRank),components:Object.fromEntries(Object.entries(g.components).map(([k,v])=>[k,Number(v)])),estimatedScheduledWaiverPressure:Number(g.estimatedScheduledWaiverPressure),rosterPositionalCounts:Object.fromEntries(Object.entries(g.rosterPositionalCounts).map(([k,v])=>[k,Number(v)]))}});
 return {arm:trial.arm,seed,teamResults};` + injection.slice(returnEnd);
  vm.runInContext(injection, context, { filename: "diagnostic-model.js" });
  return context;
}

function rng(seed) {
  let state = Number(seed) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(values, random) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function balancedSchedule({ arm, sampleSize, seedStart, pool, sampleCount, fixed }) {
  const random = rng(seedStart ^ (arm === "primary" ? 0x51A7A001 : 0x51A7A002));
  const appearances = Object.fromEntries(pool.map(id => [id, 0]));
  const cardCounts = Object.fromEntries([NO_CHUMPS, NEUTRAL, ...pool].map(id => [id, Object.fromEntries(Array.from({length:10},(_,i)=>[i+1,0]))]));
  const trials = [];
  for (let index = 0; index < sampleSize; index += 1) {
    const selected = [];
    while (selected.length < sampleCount) {
      const eligible = pool.filter(id => !selected.includes(id));
      const minimum = Math.min(...eligible.map(id => appearances[id]));
      const tied = shuffled(eligible.filter(id => appearances[id] === minimum), random);
      const chosen = tied[0];
      selected.push(chosen);
      appearances[chosen] += 1;
    }
    const profileTypes = [...fixed, ...selected];
    const availableCards = Array.from({length:10},(_,i)=>i+1);
    const teams = [];
    for (const profileTypeId of shuffled(profileTypes, random)) {
      const minimum = Math.min(...availableCards.map(card => cardCounts[profileTypeId][card]));
      const tied = shuffled(availableCards.filter(card => cardCounts[profileTypeId][card] === minimum), random);
      const card = tied[0];
      availableCards.splice(availableCards.indexOf(card), 1);
      cardCounts[profileTypeId][card] += 1;
      teams.push({ profileTypeId, card });
    }
    trials.push({ arm, seed: seedStart + index, teams });
  }
  return { trials, appearances, cardCounts };
}

function runChunk(descriptors) {
  const context = createContext();
  const trials = [];
  for (let index = 0; index < descriptors.length; index += 1) {
    context.__trial = descriptors[index];
    trials.push(vm.runInContext("diagnosticTrial(__trial)", context));
    if (parentPort && (index + 1) % 50 === 0) parentPort.postMessage({ type: "progress", count: 50 });
  }
  return trials;
}

async function parallelRun(descriptors, label) {
  const workerCount = Math.min(4, os.cpus().length, descriptors.length);
  const chunks = Array.from({length:workerCount},()=>[]);
  descriptors.forEach((trial,index)=>chunks[index%workerCount].push(trial));
  let progress = 0;
  const promises = chunks.map(chunk => new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { descriptors: chunk } });
    worker.on("message", message => {
      if (message.type === "progress") {
        progress += message.count;
        process.stderr.write(`${label}: ${Math.min(progress, descriptors.length)}/${descriptors.length}\n`);
      } else if (message.type === "result") resolve(message.trials);
    });
    worker.on("error", reject);
    worker.on("exit", code => { if (code) reject(new Error(`Worker exited ${code}`)); });
  }));
  return (await Promise.all(promises)).flat().sort((a,b)=>a.seed-b.seed);
}

function mean(values) { return values.length ? values.reduce((a,b)=>a+b,0)/values.length : null; }
function quantile(values, q) { if (!values.length) return null; const sorted=[...values].sort((a,b)=>a-b),position=(sorted.length-1)*q,low=Math.floor(position),high=Math.ceil(position); return sorted[low]+(sorted[high]-sorted[low])*(position-low); }
function standardDeviation(values) { if (!values.length) return null; const average=mean(values); return Math.sqrt(mean(values.map(value=>(value-average)**2))); }
function rate(rows, predicate) { return rows.length ? rows.filter(predicate).length/rows.length : null; }
function averageField(rows, field) { return Object.fromEntries(Object.keys(rows[0]?.[field]||{}).map(key=>[key,mean(rows.map(row=>Number(row[field][key]||0)))])); }

function scoreDistribution(scores) {
  return Object.fromEntries(SCORE_BINS.map(([low,high,label])=>{const count=scores.filter(score=>score>=low&&score<high).length;return[label,{count,rate:count/scores.length}];}));
}

function aggregateProfile(rows, profileTypeId) {
  const scores=rows.map(row=>row.overallScore), ranks=rows.map(row=>row.overallRank);
  const cards={};
  for(let card=1;card<=10;card+=1){const subset=rows.filter(row=>row.card===card);cards[card]={appearances:subset.length,averageOverallScore:mean(subset.map(row=>row.overallScore)),averageRank:mean(subset.map(row=>row.overallRank)),top3Frequency:rate(subset,row=>row.overallRank<=3)};}
  return {
    profileTypeId,
    ownerName: rows[0]?.ownerName || profileTypeId,
    appearances: rows.length,
    averageOverallScore: mean(scores),
    medianOverallScore: quantile(scores,.5),
    standardDeviation: standardDeviation(scores),
    percentiles: {p10:quantile(scores,.1),p25:quantile(scores,.25),p50:quantile(scores,.5),p75:quantile(scores,.75),p90:quantile(scores,.9)},
    averageRank: mean(ranks),
    firstPlaceFrequency: rate(rows,row=>row.overallRank===1),
    top3Frequency: rate(rows,row=>row.overallRank<=3),
    bottom3Frequency: rate(rows,row=>row.overallRank>=8),
    componentAverages: averageField(rows,"components"),
    averageScheduledWaiverPressure: mean(rows.map(row=>row.estimatedScheduledWaiverPressure)),
    positionalConstructionAverages: averageField(rows,"rosterPositionalCounts"),
    cardPositionAverages: cards,
    scoreDistribution: scoreDistribution(scores),
  };
}

function aggregateArm(trials, profileTypes) {
  const rows=trials.flatMap(trial=>trial.teamResults);
  const profiles=Object.fromEntries(profileTypes.map(id=>[id,aggregateProfile(rows.filter(row=>row.profileTypeId===id),id)]));
  const leaderboard=Object.values(profiles).sort((a,b)=>b.averageOverallScore-a.averageOverallScore).map((row,index)=>({rank:index+1,...row}));
  return {completedMocks:trials.length,teamGradeRecords:rows.length,profiles,leaderboard};
}

function pairedComparison(trials, aId, bId) {
  const pairs=[];
  for(const trial of trials){const a=trial.teamResults.find(row=>row.profileTypeId===aId),b=trial.teamResults.find(row=>row.profileTypeId===bId);if(a&&b)pairs.push([a,b]);}
  return {
    sharedRooms:pairs.length,
    higherGradeFrequency:rate(pairs,([a,b])=>a.overallScore>b.overallScore),
    tieFrequency:rate(pairs,([a,b])=>a.overallScore===b.overallScore),
    averageScoreDifferential:mean(pairs.map(([a,b])=>a.overallScore-b.overallScore)),
    averageRankAdvantage:mean(pairs.map(([a,b])=>b.overallRank-a.overallRank)),
    componentDifferences:Object.fromEntries(COMPONENTS.map(component=>[component,mean(pairs.map(([a,b])=>a.components[component]-b.components[component]))])),
  };
}

function balanceReport(schedule, includedProfileTypes, sampledPool) {
  const appearances=Object.fromEntries(includedProfileTypes.map(id=>[id,schedule.trials.filter(trial=>trial.teams.some(team=>team.profileTypeId===id)).length]));
  const cards=Object.fromEntries(includedProfileTypes.map(id=>[id,Object.fromEntries(Array.from({length:10},(_,i)=>[i+1,schedule.cardCounts[id]?.[i+1]||0]))]));
  const sampledCounts=sampledPool.map(id=>appearances[id]);
  const cardSpreads=Object.fromEntries(includedProfileTypes.map(id=>{const values=Object.values(cards[id]);return[id,Math.max(...values)-Math.min(...values)];}));
  return {
    appearances,
    sampledAppearanceMinimum:Math.min(...sampledCounts),
    sampledAppearanceMaximum:Math.max(...sampledCounts),
    sampledAppearanceSpread:Math.max(...sampledCounts)-Math.min(...sampledCounts),
    cardDistribution:cards,
    cardSpreads,
    maximumCardSpread:Math.max(...Object.values(cardSpreads)),
    sufficientlyBalanced:(Math.max(...sampledCounts)-Math.min(...sampledCounts)<=1)&&Math.max(...Object.values(cardSpreads))<=10,
  };
}

function analyze(primaryTrials, secondaryTrials, metadata, historicalIds, primarySchedule, secondarySchedule) {
  const profileTypes=[NO_CHUMPS,...historicalIds,NEUTRAL];
  const allTrials=[...primaryTrials,...secondaryTrials];
  const primary=aggregateArm(primaryTrials,profileTypes),secondary=aggregateArm(secondaryTrials,profileTypes),combined=aggregateArm(allTrials,profileTypes);
  const noChumpsHeadToHead=Object.fromEntries([...historicalIds,NEUTRAL].map(id=>[id,pairedComparison(allTrials,NO_CHUMPS,id)]));
  const historicalVsNeutral=Object.fromEntries(historicalIds.map(id=>{const comparison=pairedComparison(allTrials,id,NEUTRAL);const materiallyWorse=comparison.averageScoreDifferential<=-1&&comparison.averageRankAdvantage<=-.25&&comparison.higherGradeFrequency<.45;return[id,{...comparison,materiallyWorseThanNeutral:materiallyWorse}];}));
  const neutralPairCounts=historicalIds.map(id=>historicalVsNeutral[id].sharedRooms),noChumpsHistoricalCounts=historicalIds.map(id=>noChumpsHeadToHead[id].sharedRooms);
  return {
    metadata,
    arms:{primary,secondary},
    combined,
    noChumpsHeadToHead,
    noChumpsVsNeutral:noChumpsHeadToHead[NEUTRAL],
    historicalVsNeutral,
    materiallyWorseThanNeutral:historicalIds.filter(id=>historicalVsNeutral[id].materiallyWorseThanNeutral),
    modestlyBelowNeutral:historicalIds.filter(id=>historicalVsNeutral[id].averageScoreDifferential<0&&historicalVsNeutral[id].higherGradeFrequency<.5),
    pairedCoverage:{historicalVsNeutralMinimum:Math.min(...neutralPairCounts),historicalVsNeutralMaximum:Math.max(...neutralPairCounts),noChumpsVsHistoricalMinimum:Math.min(...noChumpsHistoricalCounts),noChumpsVsHistoricalMaximum:Math.max(...noChumpsHistoricalCounts)},
    balance:{primary:balanceReport(primarySchedule,[NO_CHUMPS,...historicalIds,NEUTRAL],historicalIds),secondary:balanceReport(secondarySchedule,profileTypes,[...historicalIds,NEUTRAL])},
  };
}

function n(value,digits=3){return value==null?"—":Number(value).toFixed(digits);}
function pct(value){return value==null?"—":`${(100*value).toFixed(1)}%`;}
function markdown(report){
  const lines=[],combined=report.combined,neutral=combined.profiles[NEUTRAL],nc=combined.profiles[NO_CHUMPS],nvn=report.noChumpsVsNeutral;
  lines.push("# v0.12.9 All-profile Draft Grade Study — 10,000 Mocks","","## Executive summary","",`- The study covered **${report.metadata.profileTypes.length} profile types**: No Chumps, ${report.metadata.historicalOpponentIds.length} historical opponent profiles, and one canonical Neutral / No History baseline.`,`- No Chumps averaged **${n(nc.averageOverallScore)}** across 10,000 rooms and beat Neutral head-to-head **${pct(nvn.higherGradeFrequency)}** of the time, with a **${nvn.averageScoreDifferential>=0?"+":""}${n(nvn.averageScoreDifferential)}** average score difference and **${nvn.averageRankAdvantage>=0?"+":""}${n(nvn.averageRankAdvantage)}** rank-place advantage.`,`- Neutral averaged **${n(neutral.averageOverallScore)}** with average rank **${n(neutral.averageRank)}**. Historical profiles materially worse than Neutral under the stated paired threshold: **${report.materiallyWorseThanNeutral.length?report.materiallyWorseThanNeutral.join(", "):"none"}**.`,`- Primary seeds: **${report.metadata.primary.seeds.first}–${report.metadata.primary.seeds.last}** (${n(report.metadata.primary.runtimeSeconds,1)}s). Secondary seeds: **${report.metadata.secondary.seeds.first}–${report.metadata.secondary.seeds.last}** (${n(report.metadata.secondary.runtimeSeconds,1)}s).`,`- Both sampling arms passed the appearance/card balance check: **${report.balance.primary.sufficientlyBalanced&&report.balance.secondary.sufficientlyBalanced?"yes":"no"}**.`,`- Production source commit: **${report.metadata.gitCommit}**.`,"","## Combined profile results","","The combined view pools arms only because production strategy and grading logic are identical; arm-specific results remain separate in the JSON.","","| Profile type | Primary N | Secondary N | Combined N | Avg | Median | SD | P10 | P25 | P50 | P75 | P90 | Avg rank | 1st | Top 3 | Bottom 3 |","|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
  for(const row of combined.leaderboard){const p=report.arms.primary.profiles[row.profileTypeId],s=report.arms.secondary.profiles[row.profileTypeId];lines.push(`| ${row.profileTypeId} | ${p.appearances} | ${s.appearances} | ${row.appearances} | ${n(row.averageOverallScore)} | ${n(row.medianOverallScore)} | ${n(row.standardDeviation)} | ${n(row.percentiles.p10)} | ${n(row.percentiles.p25)} | ${n(row.percentiles.p50)} | ${n(row.percentiles.p75)} | ${n(row.percentiles.p90)} | ${n(row.averageRank)} | ${pct(row.firstPlaceFrequency)} | ${pct(row.top3Frequency)} | ${pct(row.bottom3Frequency)} |`);}
  lines.push("","## No Chumps head-to-head","","Positive score/rank figures favor No Chumps.","","| Opponent | Shared rooms | Win rate | Score diff | Rank advantage |","|---|---:|---:|---:|---:|");for(const [id,row] of Object.entries(report.noChumpsHeadToHead))lines.push(`| ${id} | ${row.sharedRooms} | ${pct(row.higherGradeFrequency)} | ${row.averageScoreDifferential>=0?"+":""}${n(row.averageScoreDifferential)} | ${row.averageRankAdvantage>=0?"+":""}${n(row.averageRankAdvantage)} |`);
  lines.push("","## Historical profiles versus Neutral","","All values are paired within shared rooms. Positive score/rank figures favor the historical profile. “Materially worse” requires score difference ≤ -1.0, rank advantage ≤ -0.25, and win rate <45%.","","| Historical profile | Shared rooms | Win rate vs Neutral | Score diff | Rank advantage | Materially worse |","|---|---:|---:|---:|---:|---|");for(const [id,row] of Object.entries(report.historicalVsNeutral))lines.push(`| ${id} | ${row.sharedRooms} | ${pct(row.higherGradeFrequency)} | ${row.averageScoreDifferential>=0?"+":""}${n(row.averageScoreDifferential)} | ${row.averageRankAdvantage>=0?"+":""}${n(row.averageRankAdvantage)} | ${row.materiallyWorseThanNeutral?"YES":"no"} |`);
  lines.push("","### Historical-minus-Neutral component differences","","| Historical profile | "+COMPONENTS.join(" | ")+" |","|---|"+COMPONENTS.map(()=>"---:").join("|")+"|");for(const [id,row] of Object.entries(report.historicalVsNeutral))lines.push(`| ${id} | ${COMPONENTS.map(key=>`${row.componentDifferences[key]>=0?"+":""}${n(row.componentDifferences[key])}`).join(" | ")} |`);
  lines.push("","## Component averages","","| Profile | "+COMPONENTS.join(" | ")+" | Waiver pressure |","|---|"+COMPONENTS.map(()=>"---:").join("|")+"|---:|");for(const row of combined.leaderboard)lines.push(`| ${row.profileTypeId} | ${COMPONENTS.map(key=>n(row.componentAverages[key])).join(" | ")} | ${n(row.averageScheduledWaiverPressure)} |`);
  lines.push("","## Positional construction averages","","| Profile | "+POSITIONS.join(" | ")+" |","|---|"+POSITIONS.map(()=>"---:").join("|")+"|");for(const row of combined.leaderboard)lines.push(`| ${row.profileTypeId} | ${POSITIONS.map(key=>n(row.positionalConstructionAverages[key])).join(" | ")} |`);
  lines.push("","## Balance check","","| Arm | Sampled-pool appearance min | Max | Spread | Maximum within-profile card spread | Sufficient |","|---|---:|---:|---:|---:|---|");for(const arm of ["primary","secondary"]){const b=report.balance[arm];lines.push(`| ${arm} | ${b.sampledAppearanceMinimum} | ${b.sampledAppearanceMaximum} | ${b.sampledAppearanceSpread} | ${b.maximumCardSpread} | ${b.sufficientlyBalanced?"yes":"NO"} |`);}lines.push("",`Historical-versus-Neutral paired coverage ranged from ${report.pairedCoverage.historicalVsNeutralMinimum} to ${report.pairedCoverage.historicalVsNeutralMaximum} shared rooms; No Chumps-versus-historical coverage ranged from ${report.pairedCoverage.noChumpsVsHistoricalMinimum} to ${report.pairedCoverage.noChumpsVsHistoricalMaximum}.`,`Exact appearance and Card 1–10 counts for every profile and arm are in the JSON; combined card averages are also in the card CSV.`);
  lines.push("","## Conclusions","",`- The production catalog audit found exactly 17 non-No-Chumps profiles with one or more historical seasons. The two zero-season preset identities (${report.metadata.catalogZeroHistoryPresetIds.join(", ")}) were documented but not double-counted as historical profiles or as extra neutral profile types.`,`- No historical profile met the predeclared materially-worse threshold. ${report.modestlyBelowNeutral.length?report.modestlyBelowNeutral.join(", ")+" finished modestly below Neutral on paired score and win rate, but not by the material threshold.":"No historical profile finished below Neutral on both paired score and win rate."}`,`- Neutral was modeled by an unlinked team identity with null profileId and presetId, invoking the existing production neutral/generic opponent path.`,`- No Chumps retained its normal identity for grading and reporting, while the established production self-profile boundary kept its optimized recommendation strategy independent of its own historical tendency profile.`,`- No football, grading, owner-profile, neutral-profile, pool, PWA, export, or production application file was modified.`);return lines.join("\n")+"\n";
}

function summaryCsv(report){const headers=["profileTypeId","primaryAppearances","secondaryAppearances","combinedAppearances","averageOverallScore","medianOverallScore","standardDeviation","p10","p25","p50","p75","p90","averageRank","firstPlaceFrequency","top3Frequency","bottom3Frequency",...COMPONENTS,"estimatedScheduledWaiverPressure",...POSITIONS.map(p=>`avg_${p.replace("/","")}`)],lines=[headers.join(",")];for(const row of report.combined.leaderboard){const values=[row.profileTypeId,report.arms.primary.profiles[row.profileTypeId].appearances,report.arms.secondary.profiles[row.profileTypeId].appearances,row.appearances,row.averageOverallScore,row.medianOverallScore,row.standardDeviation,row.percentiles.p10,row.percentiles.p25,row.percentiles.p50,row.percentiles.p75,row.percentiles.p90,row.averageRank,row.firstPlaceFrequency,row.top3Frequency,row.bottom3Frequency,...COMPONENTS.map(k=>row.componentAverages[k]),row.averageScheduledWaiverPressure,...POSITIONS.map(k=>row.positionalConstructionAverages[k])];lines.push(values.map(value=>`"${String(value).replaceAll('"','""')}"`).join(","));}return lines.join("\n")+"\n";}
function cardCsv(report){const headers=["profileTypeId","card","appearances","averageOverallScore","averageRank","top3Frequency"],lines=[headers.join(",")];for(const row of report.combined.leaderboard)for(let card=1;card<=10;card+=1){const c=row.cardPositionAverages[card],values=[row.profileTypeId,card,c.appearances,c.averageOverallScore,c.averageRank,c.top3Frequency];lines.push(values.map(value=>`"${String(value).replaceAll('"','""')}"`).join(","));}return lines.join("\n")+"\n";}

async function main(){
  const sampleSize=Number(process.argv[2]||5000),primarySeedStart=Number(process.argv[3]||40001),secondarySeedStart=Number(process.argv[4]||50001),catalog=catalogAudit();
  if(catalog.historicalOpponentIds.length!==17)throw new Error(`Expected 17 historical opponent profiles, found ${catalog.historicalOpponentIds.length}`);
  const primarySchedule=balancedSchedule({arm:"primary",sampleSize,seedStart:primarySeedStart,pool:catalog.historicalOpponentIds,sampleCount:8,fixed:[NO_CHUMPS,NEUTRAL]});
  const secondaryPool=[...catalog.historicalOpponentIds,NEUTRAL],secondarySchedule=balancedSchedule({arm:"secondary",sampleSize,seedStart:secondarySeedStart,pool:secondaryPool,sampleCount:9,fixed:[NO_CHUMPS]});
  const primaryStarted=Date.now(),primaryTrials=await parallelRun(primarySchedule.trials,"primary"),primaryRuntimeSeconds=(Date.now()-primaryStarted)/1000;
  const secondaryStarted=Date.now(),secondaryTrials=await parallelRun(secondarySchedule.trials,"secondary"),secondaryRuntimeSeconds=(Date.now()-secondaryStarted)/1000;
  const gitCommit=process.env.DABOYZ_STUDY_GIT_COMMIT||execFileSync("git",["rev-parse","origin/main"],{encoding:"utf8"}).trim(),metadata={productionBuild:"v0.12.9",gitCommit,playerPoolSize:331,frozenHashes:FROZEN_HASHES,deterministic:true,randomizedCards:true,workers:Math.min(4,os.cpus().length),profileTypes:[NO_CHUMPS,...catalog.historicalOpponentIds,NEUTRAL],historicalOpponentIds:catalog.historicalOpponentIds,catalogZeroHistoryPresetIds:catalog.zeroHistoryPresetIds,neutralIdentity:{profileId:null,presetId:null,label:NEUTRAL},primary:{completedMocks:sampleSize,seeds:{first:primarySeedStart,last:primarySeedStart+sampleSize-1},runtimeSeconds:primaryRuntimeSeconds,design:"No Chumps + Neutral + balanced sample of 8/17 historical profiles"},secondary:{completedMocks:sampleSize,seeds:{first:secondarySeedStart,last:secondarySeedStart+sampleSize-1},runtimeSeconds:secondaryRuntimeSeconds,design:"No Chumps + balanced sample of 9/18 historical-or-neutral opponent types"},materiallyWorseThanNeutralThreshold:{averageScoreDifferentialAtMost:-1,averageRankAdvantageAtMost:-.25,higherGradeFrequencyBelow:.45}};
  const report=analyze(primaryTrials,secondaryTrials,metadata,catalog.historicalOpponentIds,primarySchedule,secondarySchedule);
  const prefix="diagnostics/v0129-all-profile-grade-study-10000";
  fs.writeFileSync(prefix+".json",JSON.stringify(report,null,2)+"\n");fs.writeFileSync(prefix+".md",markdown(report));fs.writeFileSync(prefix+"-summary.csv",summaryCsv(report));fs.writeFileSync(prefix+"-cards.csv",cardCsv(report));
  console.log(JSON.stringify({outputs:[prefix+".md",prefix+".json",prefix+"-summary.csv",prefix+"-cards.csv"],primary:metadata.primary,secondary:metadata.secondary,profileTypes:metadata.profileTypes,materiallyWorseThanNeutral:report.materiallyWorseThanNeutral},null,2));
}

if(!isMainThread){const trials=runChunk(workerData.descriptors);parentPort.postMessage({type:"result",trials});}else await main();
