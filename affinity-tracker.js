(function(){
'use strict';
const TRACKER_VERSION=1;
const AFFECTS_SURVIVAL=false;
const STRONG_MARKET_WINDOW=8;
const PLAUSIBLE_MARKET_WINDOW=20;
const AFFINITIES=Object.freeze([
  {profileId:'AMERICAS TEAM',teams:['DAL'],basis:'historical strong signal'},
  {profileId:'Pelota Negro',teams:['LV'],basis:'historical strong signal'},
  {profileId:'DA BRONCOS',teams:['DEN'],basis:'user-known affinity; historical study non-detected'},
  {profileId:'URINE TROUBLE',teams:['DEN'],basis:'historical multi-season signal'},
  {profileId:"R Kelly's Golden Showers",teams:['SF'],basis:'historical multi-season signal'},
  {profileId:'SHOW ME YOUR TDS',teams:['MIA'],basis:'historical multi-season signal'},
  {profileId:'Jerry-Rigged',teams:['DET'],basis:'historical multi-season signal'},
  {profileId:'Cam + Guy',teams:['TB','BAL'],basis:'historical multi-team signal'},
  {profileId:'Go Diego Go!!!',teams:['NO'],basis:'historical multi-season signal'}
]);

function num(v,fallback=null){const n=Number(v);return Number.isFinite(n)?n:fallback}
function marketDistance(adp,overall){const a=num(adp),o=num(overall);return a==null||o==null?null:a-o}
function opportunityBand(bestAdp,overall){const d=marketDistance(bestAdp,overall);if(d==null)return 'NONE';if(d<=STRONG_MARKET_WINDOW)return 'STRONG';if(d<=PLAUSIBLE_MARKET_WINDOW)return 'PLAUSIBLE';return 'DEEP'}
function affinityForProfile(profileId){return AFFINITIES.find(x=>x.profileId===profileId)||null}
function profileIdForTeam(team){return team?.profileId||team?.presetId||team?.teamName||team?.name||null}
function playerMarketAdp(p){
  try{if(typeof planningAdp==='function'){const v=planningAdp(p);if(Number.isFinite(Number(v)))return Number(v)}}catch(e){}
  for(const k of ['planning_adp','consensus_adp','adp']){const v=num(p?.[k]);if(v!=null)return v}
  return null;
}
function playerMarketRank(p){for(const k of ['rank','market_rank','position_rank']){const v=num(p?.[k]);if(v!=null)return v}return null}
function genericPlayerContext(p){
  let intrinsic=null;
  try{if(typeof intrinsicScore==='function')intrinsic=num(intrinsicScore(p))}catch(e){}
  return {id:p?.id??null,name:p?.name??'Unknown',position:p?.position??null,nflTeam:p?.nfl_team??null,planningAdp:playerMarketAdp(p),marketRank:playerMarketRank(p),intrinsic,availability:p?.availability_status??null};
}
function availableAffinityPlayers(cur,affinity){
  if(typeof state==='undefined'||!Array.isArray(state.players))return [];
  return state.players.filter(p=>{
    if(!p||p.drafted||!affinity.teams.includes(p.nfl_team))return false;
    try{return typeof ownerCompletionFeasible!=='function'||ownerCompletionFeasible(cur.card,p)}catch(e){return true}
  }).map(genericPlayerContext).sort((a,b)=>(a.planningAdp??9999)-(b.planningAdp??9999)||(a.marketRank??9999)-(b.marketRank??9999)||a.name.localeCompare(b.name)).slice(0,5);
}
function buildShadowSnapshot(cur,player){
  if(!cur)return null;
  let team=null;
  try{team=typeof teamForCard==='function'?teamForCard(cur.card):null}catch(e){}
  const profileId=profileIdForTeam(team)||cur.team||null;
  const affinity=affinityForProfile(profileId);
  if(!affinity)return null;
  const options=availableAffinityPlayers(cur,affinity);
  const best=options[0]||null;
  const selected=genericPlayerContext(player||{});
  const selectedIsAffinity=affinity.teams.includes(selected.nflTeam);
  const band=opportunityBand(best?.planningAdp,cur.overall);
  return {
    version:TRACKER_VERSION,
    affectsSurvival:false,
    profileId,
    currentTeamName:team?.teamName||team?.name||cur.team||profileId,
    card:Number(cur.card),round:Number(cur.round),overall:Number(cur.overall),
    affinityTeams:[...affinity.teams],basis:affinity.basis,
    selected,
    selectedIsAffinity,
    selectedReachVsAdp:marketDistance(selected.planningAdp,cur.overall),
    opportunityBand:band,
    strongOpportunity:band==='STRONG',
    plausibleOpportunity:band==='STRONG'||band==='PLAUSIBLE',
    passedStrongOpportunity:!selectedIsAffinity&&band==='STRONG',
    bestAffinityMarketDistance:marketDistance(best?.planningAdp,cur.overall),
    availableAffinityCandidates:options,
    capturedAt:new Date().toISOString()
  };
}
function summarizeShadowRows(picks,profileId){
  const rows=(picks||[]).map(p=>p?.affinityShadow).filter(x=>x&&x.profileId===profileId);
  const reaches=rows.filter(x=>x.selectedIsAffinity&&num(x.selectedReachVsAdp)!=null).map(x=>Number(x.selectedReachVsAdp));
  return {
    profileId,
    picksTracked:rows.length,
    affinitySelections:rows.filter(x=>x.selectedIsAffinity).length,
    strongOpportunities:rows.filter(x=>x.strongOpportunity).length,
    plausibleOpportunities:rows.filter(x=>x.plausibleOpportunity).length,
    passedStrongOpportunities:rows.filter(x=>x.passedStrongOpportunity).length,
    averageAffinityReach:reaches.length?reaches.reduce((a,b)=>a+b,0)/reaches.length:null,
    maxAffinityReach:reaches.length?Math.max(...reaches):null
  };
}
function ensureMeta(){
  if(typeof state==='undefined')return;
  state.affinityTrackingMeta={
    version:TRACKER_VERSION,
    affectsSurvival:false,
    purpose:'Prospective 2026 validation of historical NFL-team affinity; diagnostic only',
    strongMarketWindow:STRONG_MARKET_WINDOW,
    plausibleMarketWindow:PLAUSIBLE_MARKET_WINDOW,
    trackedProfiles:AFFINITIES.map(x=>({profileId:x.profileId,teams:[...x.teams],basis:x.basis}))
  };
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function roomTrackedProfiles(){
  if(typeof state==='undefined'||!Array.isArray(state.teams))return [];
  const seen=new Set();const out=[];
  for(const t of state.teams){const id=profileIdForTeam(t);const a=affinityForProfile(id);if(a&&!seen.has(id)){seen.add(id);out.push(a)}}
  return out;
}
function ensureBox(){
  let box=document.getElementById('affinityTrackerBox');if(box)return box;
  const intel=document.querySelector('.sidebox .intel');if(!intel)return null;
  box=document.createElement('div');box.className='intelbox';box.id='affinityTrackerBox';
  box.innerHTML='<div class="intelhead"><span>NFL-Team Affinity Tracker</span><span>SHADOW</span></div><div class="mini" id="affinityTrackerIntel"></div>';
  const interpretation=document.getElementById('interpretationIntelBox');
  if(interpretation&&interpretation.parentNode===intel)interpretation.insertAdjacentElement('afterend',box);else intel.appendChild(box);
  return box;
}
function renderTracker(){
  if(typeof document==='undefined')return;
  ensureMeta();ensureBox();
  const el=document.getElementById('affinityTrackerIntel');if(!el)return;
  const profiles=roomTrackedProfiles();
  if(!profiles.length){el.innerHTML='No historically tracked affinity profile is in this room.<div style="margin-top:5px;color:var(--muted)">Diagnostic only • affects SURV: no</div>';return}
  let currentProfile=null;
  try{const c=typeof current==='function'?current():null,t=c&&typeof teamForCard==='function'?teamForCard(c.card):null;currentProfile=profileIdForTeam(t)}catch(e){}
  const rows=profiles.map(a=>{
    const s=summarizeShadowRows(state.picks,a.profileId);
    const onClock=currentProfile===a.profileId?' • on clock':'';
    const reach=s.averageAffinityReach==null?'':` • avg reach ${s.averageAffinityReach>=0?'+':''}${s.averageAffinityReach.toFixed(1)}`;
    return `<div style="margin-top:5px"><strong>${escapeHtml(a.profileId)} → ${escapeHtml(a.teams.join('/'))}</strong>${escapeHtml(onClock)}<br>${s.affinitySelections}/${s.picksTracked} affinity picks • strong opp ${s.strongOpportunities} • strong passes ${s.passedStrongOpportunities}${escapeHtml(reach)}</div>`;
  }).join('');
  el.innerHTML=rows+'<div style="margin-top:7px;color:var(--muted)">Prospective evidence only • current ADP opportunity/reach preserved in export • affects SURV: no</div>';
}

const api={version:TRACKER_VERSION,affectsSurvival:AFFECTS_SURVIVAL,affinities:AFFINITIES,marketDistance,opportunityBand,affinityForProfile,summarizeShadowRows};
if(typeof globalThis!=='undefined')globalThis.DABOYZ_AFFINITY_TRACKER=api;
if(typeof document!=='undefined'){
  ensureMeta();
  const baseRecordPick=recordPick;
  recordPick=function(player,source='manual',doRender=true){
    let shadow=null;try{shadow=buildShadowSnapshot(current(),player)}catch(e){}
    const ok=baseRecordPick(player,source,doRender);
    if(ok&&shadow){const pick=state.picks[state.picks.length-1];if(pick)pick.affinityShadow=shadow;ensureMeta();if(doRender){try{save('affinity-shadow')}catch(e){}renderTracker()}}
    return ok;
  };
  const baseRenderAll=renderAll;
  renderAll=function(){baseRenderAll();renderTracker()};
  renderTracker();
}
})();
