import fs from 'node:fs';
import os from 'node:os';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {isMainThread,parentPort,Worker,workerData} from 'node:worker_threads';
import {fileURLToPath} from 'node:url';

await import('../interpretation-layer.js');
const I=globalThis.DABOYZ_INTERPRETATION;
const html=zlib.gunzipSync(fs.readFileSync(new URL('../app.html.gz',import.meta.url))).toString('utf8');

function harness(){
  const start=html.indexOf('const ROUND_ORDER='),end=html.indexOf('function renderRosters',start);
  const context=vm.createContext({Date,Math,JSON,structuredClone,confirm(){return true},document:{getElementById(){return null},querySelector(){return null}},alert(){}});
  vm.runInContext(html.slice(start,end),context);
  vm.runInContext(`
    save=()=>true;renderSetup=()=>{};renderAll=()=>{};
    function studyReset(seed,myCard){
      state={identityVersion:IDENTITY_VERSION,teams:DEFAULT_2026_ROOM_PRESET_IDS.map((id,i)=>normalizeTeamIdentity({...applyTeamPreset({},id),card:i+1,my:id==="No Chumps"},i)),players:freshMasterPool(),picks:[],decisionSnapshots:[],draftGrades:null,settings:{preset:"daboyz",pressure:{...PRESETS.daboyz},ownerModel:true,profileStrength:1,liveAdaptation:true,mockSeed:seed},selectedPlayerId:null,mockCounter:0};
      const mine=state.teams.find(t=>t.my),holder=state.teams.find(t=>Number(t.card)===Number(myCard));
      const prior=mine.card;mine.card=myCard;holder.card=prior;resetCalcMemo();
    }
    function studyCandidate(p){const bi=byeImpact(p),cs=completionStatus(p);return{id:p.id,name:p.name,position:p.position,draftStrength:draftStrength(p),survival:survivalProbability(p),recommendation:recommendation(p).label,rosterUtility:rosterUtility(p),contingentScore:num(p.contingent_score),byeAdjustment:bi.adjustment,byeSame:bi.same,byeWeek:bi.week,byeCoverage:bi.coverage,required:cs.required}}
    function studyStep(){
      const cur=current();if(!cur)return null;const mine=myTeam();let observation=null;
      if(Number(cur.card)===Number(mine.card)){
        const roster=draftedByMyTeam().map(x=>x.player),ordered=state.players.filter(p=>!p.drafted&&completionStatus(p).feasible).sort((a,b)=>draftStrength(b)-draftStrength(a)||(planningAdp(a)??9999)-(planningAdp(b)??9999)).slice(0,5);
        observation={round:cur.round,pick:cur.overall,card:cur.card,counts:rosterCounts(),roster:roster.map(p=>({name:p.name,position:p.position,bye:byeNumber(p)})),byeDistribution:roster.reduce((a,p)=>{const b=byeNumber(p);if(b!=null)a[b]=(a[b]||0)+1;return a},{}),candidates:ordered.map(studyCandidate)};
      }
      const selected=chooseSimulatedPlayer(cur);if(!selected||!recordPickBeforeV0128(selected,"simulated",false))throw new Error('Simulation stopped at pick '+cur.overall);
      if(observation)observation.selectedId=selected.id;return observation;
    }
  `,context);
  return context;
}

function reasonCode(text){
  if(text.startsWith('TE is still empty'))return 'LATE_ZERO_TE';
  if(text.startsWith('RB would become'))return 'RB5_NEEDS_WR';
  if(text.startsWith('WR would become'))return 'WR7_CONTINGENT_RB5';
  if(/ is early in Round /.test(text))return 'EARLY_SPECIALIST';
  if(text.startsWith('This would be a second'))return 'SECOND_SPECIALIST';
  if(/materially better .* bye coverage/.test(text))return 'BACKUP_BYE_COVERAGE';
  if(text.includes('would deepen Bye'))return 'BYE_CONCENTRATION';
  if(text.includes('roster-utility advantage'))return 'ROSTER_UTILITY';
  return 'OTHER';
}

function interpretObservation(observation){
  const interpreted=I.interpretationAdvice({round:observation.round,counts:observation.counts,candidates:observation.candidates});
  const alternativeRank=interpreted.alternative?observation.candidates.findIndex(x=>x.id===interpreted.alternative.id)+1:null;
  return {...observation,status:interpreted.status,alternative:interpreted.alternative?.name||null,alternativeRank:alternativeRank||null,gap:interpreted.gap,reasons:interpreted.reasons||[],reasonCodes:(interpreted.reasons||[]).map(reasonCode)};
}

function runIndices(indices){
  const context=harness(),decisions=[],selections=[];
  for(const index of indices){
    const seed=130000+index,myCard=index%10+1;
    context.__seed=seed;context.__card=myCard;vm.runInContext('studyReset(__seed,__card)',context);
    const draftSelections=[];
    for(let pick=0;pick<170;pick+=1){
      const observation=vm.runInContext('studyStep()',context);if(observation){
        decisions.push(interpretObservation({...observation,mock:index,seed}));
      }
      draftSelections.push(vm.runInContext('state.picks[state.picks.length-1].player.id',context));
    }
    selections.push({mock:index,seed,myCard,playerIds:draftSelections});
  }
  return {decisions,selections};
}

function aggregate(decisions,mocks){
  const countBy=(items,key)=>items.reduce((a,x)=>{const k=key(x);a[k]=(a[k]||0)+1;return a},{});
  const lean=decisions.filter(x=>x.status==='LEAN_ALT'),statusCounts=countBy(decisions,x=>x.status);
  const reasonCounts={};for(const row of lean)for(const code of row.reasonCodes)reasonCounts[code]=(reasonCounts[code]||0)+1;
  return {mocks,decisions:decisions.length,statusCounts,statusRates:Object.fromEntries(Object.entries(statusCounts).map(([k,v])=>[k,v/decisions.length])),leanAltRate:lean.length/decisions.length,byRound:countBy(decisions,x=>`${x.round}:${x.status}`),byTopPosition:countBy(decisions,x=>`${x.candidates[0]?.position||'NONE'}:${x.status}`),byCard:countBy(decisions,x=>`${x.card}:${x.status}`),reasonCounts,alternativeRanks:countBy(lean,x=>String(x.alternativeRank)),stackedRules:lean.filter(x=>x.reasonCodes.length>1).length,averageLeanGap:lean.length?lean.reduce((s,x)=>s+Number(x.gap||0),0)/lean.length:0,maximumLeanGap:lean.length?Math.max(...lean.map(x=>Number(x.gap||0))):0};
}

if(!isMainThread){parentPort.postMessage(runIndices(workerData.indices));}
else{
  const args=process.argv.slice(2),value=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:null};
  const reprocess=value('--reprocess'),output=value('--output');
  if(reprocess){
    const prior=JSON.parse(fs.readFileSync(reprocess)),decisions=prior.decisions.map(interpretObservation),mocks=Number(prior.method.mocks),summary=aggregate(decisions,mocks);
    const result={...prior,generatedAt:new Date().toISOString(),method:{...prior.method,reprocessedFrom:reprocess},summary,decisions};
    if(output)fs.writeFileSync(output,JSON.stringify(result));console.log(JSON.stringify({output,reprocessedFrom:reprocess,...summary},null,2));process.exit(0);
  }
  const mocks=Number(value('--mocks')||500),workers=Math.max(1,Math.min(Number(value('--workers')||Math.min(10,os.availableParallelism())),mocks));
  const shards=Array.from({length:workers},()=>[]);for(let i=0;i<mocks;i+=1)shards[i%workers].push(i);
  const parts=await Promise.all(shards.map(indices=>new Promise((resolve,reject)=>{const worker=new Worker(fileURLToPath(import.meta.url),{workerData:{indices}});worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code)reject(new Error('Worker exited '+code))})})));
  const decisions=parts.flatMap(x=>x.decisions),selections=parts.flatMap(x=>x.selections).sort((a,b)=>a.mock-b.mock),summary=aggregate(decisions,mocks);
  const result={generatedAt:new Date().toISOString(),method:{mocks,seeds:`130000..${130000+mocks-1}`,cards:'round-robin 1..10',selectionPolicy:'unchanged frozen core simulator',nearTie:I.nearTie},summary,decisions,selections};
  if(output)fs.writeFileSync(output,JSON.stringify(result));
  console.log(JSON.stringify({output,workers,...summary},null,2));
}
