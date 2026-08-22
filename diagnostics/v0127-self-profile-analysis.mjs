import fs from "node:fs";
import zlib from "node:zlib";
import vm from "node:vm";

const sampleSize = Number(process.argv[2] || 2000);
const outputPath = process.argv[3] || "diagnostics/v0127-self-profile-analysis-2000.json";
const seedStart = Number(process.argv[4] || 10001);
const includeScenario = process.argv[5] !== "no-scenario";
const html = zlib.gunzipSync(fs.readFileSync("app.html.gz")).toString("utf8");
const start = html.indexOf("const ROUND_ORDER=");
const end = html.indexOf("function renderRosters", start);
if (start < 0 || end < 0) throw new Error("Could not isolate the application model source.");

const context = vm.createContext({ console, Date, Math, JSON, structuredClone });
vm.runInContext(html.slice(start, end), context, { filename: "app-model.js" });
vm.runInContext(String.raw`
const diagnosticOriginalPlanningAdp=planningAdp,diagnosticOriginalMarketConfidence=marketConfidence,diagnosticOriginalProjectionScore=projectionScore,diagnosticOriginalSituationScore=situationScore,diagnosticOriginalTeamByeFitMultiplier=teamByeFitMultiplier,diagnosticOriginalOwnerCompletionFeasible=ownerCompletionFeasible,diagnosticOriginalCompletionStatus=completionStatus,diagnosticOriginalTierInfo=tierInfo,diagnosticOriginalByeImpact=byeImpact,diagnosticOriginalLiveOwnerStats=liveOwnerStats;
let diagnosticStaticCache,diagnosticDynamicCache,diagnosticTeamMap,diagnosticMyTeam,diagnosticSchedule,diagnosticMarketOrder;
function diagnosticPrepareCaches(){
 diagnosticStaticCache={planning:new Map(),marketConfidence:new Map(),projection:new Map(),situation:new Map()};
 diagnosticDynamicCache={byeFit:new Map(),ownerFeasible:new Map(),completion:new Map(),tier:new Map(),picksByCard:new Map(),countsByCard:new Map(),rosterPlayers:new Map(),byeImpact:new Map(),liveStats:new Map()};
 state.players.forEach(p=>{diagnosticStaticCache.planning.set(p.id,diagnosticOriginalPlanningAdp(p));diagnosticStaticCache.marketConfidence.set(p.id,diagnosticOriginalMarketConfidence(p));diagnosticStaticCache.projection.set(p.id,diagnosticOriginalProjectionScore(p));diagnosticStaticCache.situation.set(p.id,diagnosticOriginalSituationScore(p))});
 diagnosticMarketOrder=[...state.players].sort((a,b)=>simulatedMarketAdp(a,1)-simulatedMarketAdp(b,1));
}
planningAdp=function(p){return diagnosticStaticCache?.planning.has(p.id)?diagnosticStaticCache.planning.get(p.id):diagnosticOriginalPlanningAdp(p)};
marketConfidence=function(p){return diagnosticStaticCache?.marketConfidence.has(p.id)?diagnosticStaticCache.marketConfidence.get(p.id):diagnosticOriginalMarketConfidence(p)};
projectionScore=function(p){return diagnosticStaticCache?.projection.has(p.id)?diagnosticStaticCache.projection.get(p.id):diagnosticOriginalProjectionScore(p)};
situationScore=function(p){return diagnosticStaticCache?.situation.has(p.id)?diagnosticStaticCache.situation.get(p.id):diagnosticOriginalSituationScore(p)};
teamByeFitMultiplier=function(card,p){const key=state.picks.length+"|"+card+"|"+p.position+"|"+(p.bye||"");if(diagnosticDynamicCache?.byeFit.has(key))return diagnosticDynamicCache.byeFit.get(key);const value=diagnosticOriginalTeamByeFitMultiplier(card,p);diagnosticDynamicCache?.byeFit.set(key,value);return value};
ownerCompletionFeasible=function(card,p){const key=state.picks.length+"|"+card+"|"+p.position;if(diagnosticDynamicCache?.ownerFeasible.has(key))return diagnosticDynamicCache.ownerFeasible.get(key);const value=diagnosticOriginalOwnerCompletionFeasible(card,p);diagnosticDynamicCache?.ownerFeasible.set(key,value);return value};
completionStatus=function(p){const key=state.picks.length+"|"+p.position;if(diagnosticDynamicCache?.completion.has(key))return diagnosticDynamicCache.completion.get(key);const value=diagnosticOriginalCompletionStatus(p);diagnosticDynamicCache?.completion.set(key,value);return value};
tierInfo=function(p){const key=state.picks.length+"|"+p.position+"|"+(p.tier||"");if(diagnosticDynamicCache?.tier.has(key))return diagnosticDynamicCache.tier.get(key);const value=diagnosticOriginalTierInfo(p);diagnosticDynamicCache?.tier.set(key,value);return value};
draftedByCard=function(card){const key=state.picks.length+"|"+card;if(diagnosticDynamicCache?.picksByCard.has(key))return diagnosticDynamicCache.picksByCard.get(key);const value=state.picks.filter(p=>p.card===Number(card));diagnosticDynamicCache?.picksByCard.set(key,value);return value};
draftedByMyTeam=function(){const m=myTeam();return m?draftedByCard(m.card):[]};
countsForCard=function(card){const key=state.picks.length+"|"+card;if(diagnosticDynamicCache?.countsByCard.has(key))return diagnosticDynamicCache.countsByCard.get(key);const c={QB:0,RB:0,WR:0,TE:0,K:0,"D/ST":0,OTHER:0};draftedByCard(card).forEach(p=>{const k=POSITIONS.includes(p.player.position)?p.player.position:"OTHER";c[k]=(c[k]||0)+1});diagnosticDynamicCache?.countsByCard.set(key,c);return c};
rosterCounts=function(){const m=myTeam();return m?countsForCard(m.card):{QB:0,RB:0,WR:0,TE:0,K:0,"D/ST":0,OTHER:0}};
myRosterPlayerObjects=function(){const key=state.picks.length;if(diagnosticDynamicCache?.rosterPlayers.has(key))return diagnosticDynamicCache.rosterPlayers.get(key);const value=draftedByMyTeam().map(x=>x.player).filter(Boolean);diagnosticDynamicCache?.rosterPlayers.set(key,value);return value};
byeImpact=function(p){const key=state.picks.length+"|"+p.position+"|"+(p.bye||"");if(diagnosticDynamicCache?.byeImpact.has(key))return diagnosticDynamicCache.byeImpact.get(key);const value=diagnosticOriginalByeImpact(p);diagnosticDynamicCache?.byeImpact.set(key,value);return value};
liveOwnerStats=function(card){const key=state.picks.length+"|"+card;if(diagnosticDynamicCache?.liveStats.has(key))return diagnosticDynamicCache.liveStats.get(key);const value=diagnosticOriginalLiveOwnerStats(card);diagnosticDynamicCache?.liveStats.set(key,value);return value};
teamForCard=function(card){return diagnosticTeamMap?.get(Number(card))||null};
myTeam=function(){return diagnosticMyTeam||null};
schedule=function(){return diagnosticSchedule||[]};
current=function(){return diagnosticSchedule?.[state.picks.length]||null};
chooseOpponentSimulatedPlayer=function(sp){const dist=ownerPickDistribution(sp),generic=genericPickDistribution(sp.round),shortlist=[];for(const p of diagnosticMarketOrder){if(!p.drafted&&ownerCompletionFeasible(sp.card,p)){shortlist.push(p);if(shortlist.length===55)break}}if(!shortlist.length)return null;const cur=sp.overall;let best=null,bestCost=1e9;shortlist.forEach(p=>{const adp=simulatedMarketAdp(p,cur),posRatio=(dist[p.position]||.001)/Math.max(.001,generic[p.position]||.001),prefShift=-8.5*Math.log(clamp(posRatio,.35,2.8)),intrShift=-(intrinsicScore(p)-50)*.045,byeShift=-4*Math.log(Math.max(.35,teamByeFitMultiplier(sp.card,p))),noise=simNoise(30.0),cost=adp+prefShift+intrShift+byeShift+noise;if(cost<bestCost){bestCost=cost;best=p}});return best};
chooseMyTeamSimulatedPlayer=function(sp){let best=null,bestStrength=-1,bestAdp=9999;for(const p of state.players){if(p.drafted||!ownerCompletionFeasible(sp.card,p)||!completionStatus(p).feasible)continue;const strength=draftStrength(p),adp=planningAdp(p)??9999;if(strength>bestStrength||(strength===bestStrength&&adp<bestAdp)){best=p;bestStrength=strength;bestAdp=adp}}return best};
function diagnosticTeams(selfProfile=true){
 const opponentProfiles=PROFILE_KEYS.filter(x=>x!=="No Chumps").slice(0,9),otherCards=[1,2,4,5,6,7,8,9,10];
 const mine=normalizeTeamIdentity({ownerName:profileOwnerName("No Chumps"),teamName:"No Chumps",name:"No Chumps",profileId:selfProfile?"No Chumps":null,presetId:selfProfile?"No Chumps":null,card:3,my:true},0);
 return [mine,...opponentProfiles.map((profileId,i)=>normalizeTeamIdentity({ownerName:profileOwnerName(profileId),teamName:profileId,name:profileId,profileId,presetId:profileId,card:otherCards[i],my:false},i+1))];
}
function diagnosticReset(seed,selfProfile=true){
 state={identityVersion:IDENTITY_VERSION,teams:diagnosticTeams(selfProfile),players:freshMasterPool(),picks:[],settings:{preset:"daboyz",pressure:{...PRESETS.daboyz},ownerModel:true,profileStrength:1,liveAdaptation:true,mockSeed:seed},selectedPlayerId:null,mockCounter:0};
 diagnosticTeamMap=new Map(state.teams.map(t=>[Number(t.card),t]));diagnosticMyTeam=state.teams.find(t=>t.my)||null;diagnosticSchedule=[];ROUND_ORDER.forEach((row,r)=>row.forEach((card,s)=>diagnosticSchedule.push({overall:r*10+s+1,round:r+1,slot:s+1,card,team:teamForCard(card)?.name||("Card "+card)})));
 resetCalcMemo();
 diagnosticPrepareCaches();
}
function diagnosticCounts(picks){const out=Object.fromEntries(POSITIONS.map(x=>[x,0]));picks.forEach(p=>out[p.player.position]=(out[p.player.position]||0)+1);return out}
function diagnosticRoundDistribution(rounds){const out={};rounds.filter(x=>x!=null).forEach(x=>out[x]=(out[x]||0)+1);return out}
function diagnosticMaxBye(picks){const loads={};picks.forEach(pk=>{const b=byeNumber(pk.player);if(b!=null)loads[b]=(loads[b]||0)+1});return Math.max(0,...Object.values(loads))}
function diagnosticTrial(seed,selfProfile=true){
 diagnosticReset(seed,selfProfile);
 const labels={},value={draftStrength:0,intrinsic:0,situation:0,rosterUtility:0,survival:0,survivalN:0};
 const perf={myChooseMs:0,opponentChooseMs:0,recordMs:0};
 while(current()){
  const sp=current(),mine=Number(sp.card)===Number(myTeam().card),chooseStarted=Date.now(),p=chooseSimulatedPlayer(sp);perf[mine?"myChooseMs":"opponentChooseMs"]+=Date.now()-chooseStarted;
  if(!p)throw new Error("No legal simulated pick at "+sp.overall);
  if(mine){const rec=recommendation(p),surv=survivalProbability(p);labels[rec.label]=(labels[rec.label]||0)+1;value.draftStrength+=draftStrength(p);value.intrinsic+=intrinsicScore(p);value.situation+=situationScore(p);value.rosterUtility+=rosterUtility(p);if(surv!=null){value.survival+=surv;value.survivalN++}}
  const recordStarted=Date.now();if(!recordPick(p,"simulated",false))throw new Error("Could not record pick "+sp.overall);perf.recordMs+=Date.now()-recordStarted;
 }
 const mine=state.picks.filter(p=>p.card===3),positions=mine.map(p=>p.player.position),rounds=mine.map(p=>p.round),qb=rounds.filter((_,i)=>positions[i]==="QB"),te=rounds.filter((_,i)=>positions[i]==="TE"),final=diagnosticCounts(mine),first6=diagnosticCounts(mine.slice(0,6)),first8=diagnosticCounts(mine.slice(0,8));
 return {signature:mine.map(p=>p.player.id).join("|"),positions,first6,first8,final,firstQb:qb[0]??null,firstTe:te[0]??null,secondQb:qb[1]??null,secondTe:te[1]??null,rb4ByR6:first6.RB>=4,wrR6:first6.WR,wrR8:first8.WR,legal:minPicksToValidLineup(final)===0,maxBye:diagnosticMaxBye(mine),bye3:diagnosticMaxBye(mine)>=3,labels,value,perf};
}
function diagnosticAggregate(trials){
 const sumCounts=()=>Object.fromEntries(POSITIONS.map(x=>[x,0])),first6=sumCounts(),first8=sumCounts(),final=sumCounts(),labels={},value={draftStrength:0,intrinsic:0,situation:0,rosterUtility:0,survival:0},seq={};let rb4=0,wr6=0,wr8=0,legal=0,maxBye=0,bye3=0,secondQbN=0,secondQbRound=0,secondTeN=0,secondTeRound=0;
 trials.forEach(t=>{POSITIONS.forEach(p=>{first6[p]+=t.first6[p]||0;first8[p]+=t.first8[p]||0;final[p]+=t.final[p]||0});rb4+=t.rb4ByR6;wr6+=t.wrR6;wr8+=t.wrR8;legal+=t.legal;maxBye+=t.maxBye;bye3+=t.bye3;if(t.secondQb!=null){secondQbN++;secondQbRound+=t.secondQb}if(t.secondTe!=null){secondTeN++;secondTeRound+=t.secondTe}Object.entries(t.labels).forEach(([k,v])=>labels[k]=(labels[k]||0)+v);Object.keys(value).forEach(k=>value[k]+=t.value[k]);const s=t.positions.slice(0,8).join("-");seq[s]=(seq[s]||0)+1});
 const avg=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v/trials.length])),pickCount=trials.length*17;
 return {sampleSize:trials.length,first6Average:avg(first6),first8Average:avg(first8),finalAverage:avg(final),firstQbRoundDistribution:diagnosticRoundDistribution(trials.map(t=>t.firstQb)),firstTeRoundDistribution:diagnosticRoundDistribution(trials.map(t=>t.firstTe)),secondQb:{frequency:secondQbN/trials.length,averageRound:secondQbN?secondQbRound/secondQbN:null},secondTe:{frequency:secondTeN/trials.length,averageRound:secondTeN?secondTeRound/secondTeN:null},rb4ByRound6:rb4/trials.length,wrAfterR6:wr6/trials.length,wrAfterR8:wr8/trials.length,starterLegality:legal/trials.length,averageLargestByeLoad:maxBye/trials.length,byeLoadAtLeast3:bye3/trials.length,recommendationLabels:Object.fromEntries(Object.entries(labels).map(([k,v])=>[k,v/pickCount])),valueProxies:{averageSelectedDraftStrength:value.draftStrength/pickCount,averageSelectedIntrinsic:value.intrinsic/pickCount,averageSelectedSituation:value.situation/pickCount,averageSelectedRosterUtility:value.rosterUtility/pickCount,averageSelectedSurvival:value.survival/pickCount},topFirst8Sequences:Object.entries(seq).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([sequence,count])=>({sequence,count,rate:count/trials.length}))};
}
function diagnosticScenario(selfProfile=true){
 diagnosticReset(810081,selfProfile);
 const forced=["Christian McCaffrey","Jaxon Smith-Njigba","Trey McBride","Drake London","David Montgomery","RJ Harvey","Jayden Daniels","Colston Loveland"],protectedNames=new Set([...forced,"Jalen Hurts"]),pending=new Set(protectedNames);
 state.players.forEach(p=>{if(pending.has(p.name))p.drafted=true});
 let forcedIndex=0;
 while(current()&&current().overall<81){
  const sp=current();let p;
  if(Number(sp.card)===3){const name=forced[forcedIndex++];p=state.players.find(x=>x.name===name);p.drafted=false;pending.delete(name)}else p=chooseOpponentSimulatedPlayer(sp);
  if(!p||!recordPick(p,"scenario",false))throw new Error("Scenario failed at "+sp.overall);
 }
 const hurts=state.players.find(p=>p.name==="Jalen Hurts");hurts.drafted=false;resetCalcMemo();
 const rows=state.players.filter(p=>!p.drafted&&completionStatus(p).feasible).map(p=>{const surv=survivalProbability(p),ti=tierInfo(p);return {name:p.name,position:p.position,tier:p.tier||null,intrinsic:intrinsicScore(p),situation:situationScore(p),rosterUtility:rosterUtility(p),survival:surv,tierUrgency:ti.urgency,draftStrength:draftStrength(p),label:recommendation(p).label}}).sort((a,b)=>b.draftStrength-a.draftStrength||(a.name.localeCompare(b.name))).slice(0,15);
 const prediction=profilePredictionSnapshot(current(),hurts),cliff=typeof tierCliffDiagnostic==="function"?tierCliffDiagnostic(hurts):null;
 return {current:current(),roster:state.picks.filter(p=>p.card===3).map(p=>p.player.name),ordering:rows,hurts:rows.find(x=>x.name==="Jalen Hurts")||{name:"Jalen Hurts",position:"QB",intrinsic:intrinsicScore(hurts),situation:situationScore(hurts),rosterUtility:rosterUtility(hurts),survival:survivalProbability(hurts),tierUrgency:tierInfo(hurts).urgency,draftStrength:draftStrength(hurts),label:recommendation(hurts).label},profilePrediction:prediction,tierCliff:cliff};
}
`, context, { filename: "diagnostic-model.js" });

const baseline = [];
const neutral = [];
const startedAt = Date.now();
for (let i = 0; i < sampleSize; i += 1) {
  context.__seed = seedStart + i;
  baseline.push(vm.runInContext("diagnosticTrial(__seed,true)", context));
  neutral.push(vm.runInContext("diagnosticTrial(__seed,false)", context));
  if ((i + 1) % 100 === 0) process.stderr.write(`completed ${i + 1}/${sampleSize} paired drafts\n`);
}
process.stderr.write(`paired drafts finished in ${((Date.now()-startedAt)/1000).toFixed(1)}s\n`);

const pairedMismatches = baseline.reduce((n,trial,i)=>n+(trial.signature===neutral[i].signature?0:1),0);
const scenarioStartedAt = Date.now();
const report = {
  generatedAt: new Date().toISOString(),
  sampleSizePerArm: sampleSize,
  seeds: { first: seedStart, last: seedStart + sampleSize - 1 },
  baseline: vm.runInContext("diagnosticAggregate", context)(baseline),
  selfProfileNeutral: vm.runInContext("diagnosticAggregate", context)(neutral),
  pairedSelectionMismatches: pairedMismatches,
  firstTrialPerformance: { baseline: baseline[0]?.perf||null, selfProfileNeutral: neutral[0]?.perf||null },
  scenario: includeScenario ? {
    selfProfileActive: vm.runInContext("diagnosticScenario(true)", context),
    selfProfileNeutral: vm.runInContext("diagnosticScenario(false)", context),
  } : null,
};
process.stderr.write(`scenario diagnostics finished in ${((Date.now()-scenarioStartedAt)/1000).toFixed(1)}s\n`);
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, sampleSize, seeds: report.seeds, pairedSelectionMismatches: pairedMismatches }, null, 2));
