#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {buildPrimarySpecs,createHarness,csv,loadAdpEnvironment,loadOutcomes,round,runArm,summarizeArm} from "./v0129-2025-backtest.mjs";

const DEFAULT_DRAFTS=1000,SEED_FIRST=20255001;
const productionFiles=["app.html.gz","sw.js","version.json","manifest.webmanifest"].filter(fs.existsSync);
const sha256=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const before=Object.fromEntries(productionFiles.map(file=>[file,sha256(file)]));
const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;

function poolWithBands(pool,size,label){return pool.map(player=>({...structuredClone(player),tier:String(Math.floor((Number(player.position_rank)-1)/size)+1),tier_method:label}))}
function patchCliffOnly(harness){vm.runInContext(String.raw`
const historicalTierInfo=tierInfo,historicalPositionalScarcityScore=positionalScarcityScore;
function historicalNoTierScarcity(p){if(p.position!=="TE"&&p.position!=="QB")return 50;const c=rosterCounts(),n=c[p.position]||0,pr=num(p.position_rank);if(n>0&&p.position==="QB")return 50;if(n>0&&p.position==="TE")return 48;let s=50;if(pr!=null){if(p.position==="TE")s+=Math.max(0,12-pr)*2.2;else s+=Math.max(0,6-pr)*1.4}if(p.position==="TE"&&n===0){const left=state.players.filter(x=>!x.drafted&&x.position==="TE"&&(num(x.position_rank)||999)<=12).length;if(left<=2)s+=14;else if(left<=4)s+=9;else if(left<=6)s+=5}return clamp(s)}
positionalScarcityScore=historicalNoTierScarcity;
function historicalBaseStrength(p){const cs=completionStatus(p);if(!cs.feasible)return 0;return clamp(intrinsicScore(p)*.57+situationScore(p)*.10+rosterUtility(p)*.22+50*.11)}
tierInfo=function(p){const tier=num(p.tier),pos=p.position,hz=ownerHazard(pos);if(tier==null)return{same:null,expected:hz.expected,urgency:50,hazardRatio:hz.ratio};const available=state.players.filter(x=>!x.drafted&&x.position===pos),same=available.filter(x=>num(x.tier)===tier),lower=[...new Set(available.map(x=>num(x.tier)).filter(x=>x!=null&&x>tier))].sort((a,b)=>a-b),next=lower[0],players=next==null?[]:available.filter(x=>num(x.tier)===next),best=players.length?Math.max(...players.map(historicalBaseStrength)):null,drop=best==null?0:Math.max(0,historicalBaseStrength(p)-best),urgency=clamp(50+5*drop+10*Math.max(0,hz.expected-Math.max(0,same.length-1)));return{same:same.length,expected:hz.expected,urgency,hazardRatio:hz.ratio}};
`,harness.context,{filename:"historical-cliff-only.js"})}

function constructionSummary(run){const mine=run.rows.filter(row=>row.my),counts=pos=>mean(mine.map(row=>row.construction.counts[pos]||0));return{averageCounts:{QB:counts("QB"),RB:counts("RB"),WR:counts("WR"),TE:counts("TE"),K:counts("K"),DST:counts("D/ST")},firstQbRound:mean(mine.map(r=>r.construction.qbRound).filter(x=>x<99)),firstTeRound:mean(mine.map(r=>r.construction.teRound).filter(x=>x<99)),twoQbFrequency:mine.filter(row=>row.construction.counts.QB>=2).length/mine.length,twoTeFrequency:mine.filter(row=>row.construction.counts.TE>=2).length/mine.length,secondQbRound:mean(mine.map(r=>r.construction.secondQbRound).filter(Number.isFinite)),secondTeRound:mean(mine.map(r=>r.construction.secondTeRound).filter(Number.isFinite))}}
function ncSignatures(run){return new Map(run.rows.filter(row=>row.my).map(row=>[row.seed,row.construction.pickSignature]))}

const dataDir=path.resolve(process.argv[2]||"../backtest-2025-data"),drafts=Number(process.argv[3]||DEFAULT_DRAFTS);
const adp=loadAdpEnvironment(path.join(dataDir,"FantasyPros_2025_Overall_ADP_Rankings_8_21_2025.csv")),baseHarness=createHarness(adp),profileIds=vm.runInContext("PROFILE_KEYS.filter(id=>id==='No Chumps'||ROOM_PROFILES[id]?.seasons>0)",baseHarness.context),specs=buildPrimarySpecs(profileIds,drafts).map((s,i)=>({...s,seed:SEED_FIRST+i})),outcomes=loadOutcomes(path.join(dataDir,"stats_player_week_2025.csv"),path.join(dataDir,"stats_team_week_2025.csv"),path.join(dataDir,"games.csv"));
const definitions={
 "tier-neutral":{adp,pool:"No tiers; exact frozen 2025 primary reconstruction",cliff:false,tierProxy:false},
 "adp-band-proxy":{adp:{...adp,proxyPool:poolWithBands(adp.neutralPool,6,"POSITION_ADP_BAND_6_SENSITIVITY_PROXY")},pool:"Six-player within-position ADP bands",cliff:false,tierProxy:true},
 "cliff-only-proxy":{adp:{...adp,proxyPool:poolWithBands(adp.neutralPool,6,"POSITION_ADP_BAND_6_CLIFF_ONLY_PROXY")},pool:"Six-player ADP bands with bounded local-cliff urgency only",cliff:true,tierProxy:true},
 "compressed-proxy":{adp:{...adp,proxyPool:poolWithBands(adp.neutralPool,12,"POSITION_ADP_BAND_12_COMPRESSED_PROXY")},pool:"Predeclared 12-player within-position ADP bands",cliff:false,tierProxy:true},
};
const runs={},summaries={};
for(const [arm,definition] of Object.entries(definitions)){const harness=arm==="tier-neutral"?baseHarness:createHarness(definition.adp);if(definition.cliff)patchCliffOnly(harness);const armSpecs=specs.map(s=>({...structuredClone(s),arm,tierProxy:definition.tierProxy}));runs[arm]=runArm(harness,armSpecs,outcomes,arm);summaries[arm]={...summarizeArm(runs[arm]),construction:constructionSummary(runs[arm]),tierPolicy:definition.pool}}
const baselineSignatures=ncSignatures(runs["tier-neutral"]);for(const arm of Object.keys(definitions)){const signatures=ncSignatures(runs[arm]);summaries[arm].pairedNoChumpsRosterDifferenceRate=[...baselineSignatures].filter(([seed,sig])=>signatures.get(seed)!==sig).length/drafts}
const after=Object.fromEntries(productionFiles.map(file=>[file,sha256(file)]));if(JSON.stringify(before)!==JSON.stringify(after))throw new Error("Production file changed during historical sensitivity");
const report={metadata:{generatedAt:new Date().toISOString(),analysisOnly:true,historicalTierTruthAvailable:false,interpretation:"Sensitivity analysis only. Genuine archived 2025 tiers are unavailable.",draftsPerArm:drafts,seeds:{first:SEED_FIRST,last:SEED_FIRST+drafts-1},productionHashesBefore:before,productionHashesAfter:after},predeclaredRules:{neutral:"Blank tiers",adpBand:"Six-player within-position ADP bands",cliffOnly:"Six-player bands; urgency=clamp(50+5*localBaseStrengthDrop+10*max(0,expectedDemand-(remaining-1))); explicit TE tier-number bonus removed",compressed:"Twelve-player within-position ADP bands, declared before outcomes"},arms:summaries};
fs.writeFileSync("diagnostics/v0129-tier-2025-sensitivity.json",JSON.stringify(report,null,2)+"\n");
const rows=Object.entries(summaries).map(([arm,x])=>({arm,drafts:x.drafts,tierPolicy:x.tierPolicy,averageRealizedOptimalPoints:mean(runs[arm].rows.map(r=>r.outcome.optimalLineupPoints)),noChumpsAverageRealizedOptimalPoints:x.noChumps.averageRealizedOptimalPoints,noChumpsRealizedFirstPlaceRate:x.noChumps.realizedFirstPlaceFrequency,noChumpsRealizedTopThreeRate:x.noChumps.realizedTop3Frequency,gradeToRealizedCorrelation:x.gradeOutcomeCorrelation,topMinusBottomGradeDecileRealizedGap:x.topVsBottom.difference,noChumpsAverageGrade:x.noChumps.averageGrade,noChumpsFirstQbRound:x.construction.firstQbRound,noChumpsFirstTeRound:x.construction.firstTeRound,noChumpsTwoQbFrequency:x.construction.twoQbFrequency,noChumpsTwoTeFrequency:x.construction.twoTeFrequency,noChumpsSecondQbRound:x.construction.secondQbRound,noChumpsSecondTeRound:x.construction.secondTeRound,noChumpsAverageQb:x.construction.averageCounts.QB,noChumpsAverageRb:x.construction.averageCounts.RB,noChumpsAverageWr:x.construction.averageCounts.WR,noChumpsAverageTe:x.construction.averageCounts.TE,pairedNoChumpsRosterDifferenceRate:x.pairedNoChumpsRosterDifferenceRate,runtimeSeconds:x.runtimeSeconds}));
fs.writeFileSync("diagnostics/v0129-tier-2025-sensitivity.csv",csv(rows,Object.keys(rows[0])));
console.log(JSON.stringify({outputs:["diagnostics/v0129-tier-2025-sensitivity.csv","diagnostics/v0129-tier-2025-sensitivity.json"],draftsPerArm:drafts,productionIntegrity:true,summary:rows},null,2));
