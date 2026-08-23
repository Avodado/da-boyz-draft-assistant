(function(){
'use strict';
const TRACKER_VERSION=2;
const AFFECTS_SURVIVAL=false;
const STRONG_MARKET_WINDOW=8;
const PLAUSIBLE_MARKET_WINDOW=20;
const NFL_TEAMS=Object.freeze(['ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LV','LAC','LAR','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SEA','SF','TB','TEN','WAS']);
const DEFAULT_AFFINITIES=Object.freeze([
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
function defaultSettingMap(){const out={};for(const a of DEFAULT_AFFINITIES){out[a.profileId]={};for(const team of a.teams)out[a.profileId][team]=true}return out}
function normalizedSettings(settings){
  const out=defaultSettingMap();
  if(settings&&typeof settings==='object')for(const [profile,teams] of Object.entries(settings)){
    if(!out[profile])out[profile]={};
    if(teams&&typeof teams==='object')for(const [team,enabled] of Object.entries(teams)){const t=String(team).toUpperCase();if(NFL_TEAMS.includes(t))out[profile][t]=Boolean(enabled)}
  }
  return out;
}
function enabledTeamsFor(profileId,settings){const row=normalizedSettings(settings)[profileId]||{};return Object.entries(row).filter(([,v])=>v).map(([k])=>k)}
function knownTeamsFor(profileId,settings){const row=normalizedSettings(settings)[profileId]||{};return Object.keys(row)}
function basisFor(profileId,team){const a=DEFAULT_AFFINITIES.find(x=>x.profileId===profileId&&x.teams.includes(team));return a?.basis||'manual prospective 2026 tracking'}
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
function ensureSettings(){if(typeof state==='undefined')return{};state.affinityTrackingSettings=normalizedSettings(state.affinityTrackingSettings);return state.affinityTrackingSettings}
function activeAffinityForProfile(profileId){const settings=ensureSettings(),teams=enabledTeamsFor(profileId,settings);if(!teams.length)return null;return{profileId,teams,basisByTeam:Object.fromEntries(teams.map(t=>[t,basisFor(profileId,t)]))}}
function availableAffinityPlayers(cur,affinity){
  if(typeof state==='undefined'||!Array.isArray(state.players))return [];
  return state.players.filter(p=>{
    if(!p||p.drafted||!affinity.teams.includes(p.nfl_team))return false;
    try{return typeof ownerCompletionFeasible!=='function'||ownerCompletionFeasible(cur.card,p)}catch(e){return true}
  }).map(genericPlayerContext).sort((a,b)=>(a.planningAdp??9999)-(b.planningAdp??9999)||(a.marketRank??9999)-(b.marketRank??9999)||a.name.localeCompare(b.name)).slice(0,5);
}
function buildShadowSnapshot(cur,player){
  if(!cur)return null;
  let team=null;try{team=typeof teamForCard==='function'?teamForCard(cur.card):null}catch(e){}
  const profileId=profileIdForTeam(team)||cur.team||null;
  const affinity=activeAffinityForProfile(profileId);if(!affinity)return null;
  const options=availableAffinityPlayers(cur,affinity),best=options[0]||null,selected=genericPlayerContext(player||{});
  const selectedIsAffinity=affinity.teams.includes(selected.nflTeam),band=opportunityBand(best?.planningAdp,cur.overall);
  return {
    version:TRACKER_VERSION,affectsSurvival:false,profileId,
    ownerName:team?.ownerName||null,currentTeamName:team?.teamName||team?.name||cur.team||profileId,
    card:Number(cur.card),round:Number(cur.round),overall:Number(cur.overall),
    affinityTeams:[...affinity.teams],basisByTeam:{...affinity.basisByTeam},
    selected,selectedIsAffinity,
    selectedReachVsAdp:marketDistance(selected.planningAdp,cur.overall),
    opportunityBand:band,strongOpportunity:band==='STRONG',plausibleOpportunity:band==='STRONG'||band==='PLAUSIBLE',
    passedStrongOpportunity:!selectedIsAffinity&&band==='STRONG',bestAffinityMarketDistance:marketDistance(best?.planningAdp,cur.overall),
    availableAffinityCandidates:options,capturedAt:new Date().toISOString()
  };
}
function summarizeShadowRows(picks,profileId){
  const rows=(picks||[]).map(p=>p?.affinityShadow).filter(x=>x&&x.profileId===profileId);
  const reaches=rows.filter(x=>x.selectedIsAffinity&&num(x.selectedReachVsAdp)!=null).map(x=>Number(x.selectedReachVsAdp));
  return {profileId,picksTracked:rows.length,affinitySelections:rows.filter(x=>x.selectedIsAffinity).length,strongOpportunities:rows.filter(x=>x.strongOpportunity).length,plausibleOpportunities:rows.filter(x=>x.plausibleOpportunity).length,passedStrongOpportunities:rows.filter(x=>x.passedStrongOpportunity).length,averageAffinityReach:reaches.length?reaches.reduce((a,b)=>a+b,0)/reaches.length:null,maxAffinityReach:reaches.length?Math.max(...reaches):null};
}
function ensureMeta(){
  if(typeof state==='undefined')return;const settings=ensureSettings();
  state.affinityTrackingMeta={version:TRACKER_VERSION,affectsSurvival:false,purpose:'Prospective 2026 validation of owner-specific NFL-team affinity; diagnostic only',strongMarketWindow:STRONG_MARKET_WINDOW,plausibleMarketWindow:PLAUSIBLE_MARKET_WINDOW,settings:JSON.parse(JSON.stringify(settings))};
}
function setTracking(profileId,team,enabled){if(typeof state==='undefined')return false;const t=String(team||'').toUpperCase();if(!profileId||!NFL_TEAMS.includes(t))return false;const settings=ensureSettings();if(!settings[profileId])settings[profileId]={};settings[profileId][t]=Boolean(enabled);ensureMeta();try{save('affinity-setting')}catch(e){}try{renderTracker()}catch(e){}return true}
function removeTracking(profileId,team){if(typeof state==='undefined')return false;const settings=ensureSettings(),t=String(team||'').toUpperCase();if(!settings[profileId]||!(t in settings[profileId]))return false;delete settings[profileId][t];if(!Object.keys(settings[profileId]).length)delete settings[profileId];ensureMeta();try{save('affinity-setting')}catch(e){}try{renderTracker()}catch(e){}return true}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function teamLabelForProfile(profileId){if(typeof state==='undefined')return profileId;const t=(state.teams||[]).find(x=>profileIdForTeam(x)===profileId);return t?.ownerName?`${t.ownerName} (${profileId})`:profileId}
function roomProfiles(){if(typeof state==='undefined'||!Array.isArray(state.teams))return[];const out=[],seen=new Set();for(const t of state.teams){const id=profileIdForTeam(t);if(id&&!seen.has(id)){seen.add(id);out.push(id)}}return out}
function roomTrackedProfiles(){return roomProfiles().map(id=>activeAffinityForProfile(id)).filter(Boolean)}
function ensureBox(){
  let box=document.getElementById('affinityTrackerBox');if(box)return box;
  const intel=document.querySelector('.sidebox .intel');if(!intel)return null;
  box=document.createElement('div');box.className='intelbox';box.id='affinityTrackerBox';
  box.innerHTML='<div class="intelhead"><span>NFL-Team Affinity Tracker</span><span>SHADOW</span></div><div class="mini" id="affinityTrackerIntel"></div>';
  const interpretation=document.getElementById('interpretationIntelBox');if(interpretation&&interpretation.parentNode===intel)interpretation.insertAdjacentElement('afterend',box);else intel.appendChild(box);return box;
}
function configHtml(){
  const settings=ensureSettings(),profiles=roomProfiles();
  const rows=profiles.map(id=>{
    const teams=knownTeamsFor(id,settings);
    const chips=teams.length?teams.map(team=>{const checked=settings[id]?.[team]?'checked':'';return `<label style="display:inline-flex;align-items:center;gap:3px;margin:2px 6px 2px 0"><input type="checkbox" data-affinity-profile="${escapeHtml(id)}" data-affinity-team="${team}" ${checked}>${team}</label>`}).join(''):'<span style="color:var(--muted)">none</span>';
    return `<div style="margin-top:5px"><strong>${escapeHtml(teamLabelForProfile(id))}</strong><br>${chips}</div>`;
  }).join('');
  const ownerOptions=profiles.map(id=>`<option value="${escapeHtml(id)}">${escapeHtml(teamLabelForProfile(id))}</option>`).join('');
  const teamOptions=NFL_TEAMS.map(t=>`<option value="${t}">${t}</option>`).join('');
  return `<details style="margin-top:8px"><summary style="cursor:pointer">Configure owner/team tracking</summary>${rows}<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:7px"><select id="affinityAddOwner" style="max-width:210px">${ownerOptions}</select><select id="affinityAddTeam">${teamOptions}</select><button type="button" id="affinityAddButton">Add / enable</button></div><div style="margin-top:5px;color:var(--muted)">Unchecked = do not track that owner/team pair. Add any team to any owner. Tracking does not affect SURV.</div></details>`;
}
function bindConfig(){
  document.querySelectorAll('[data-affinity-profile][data-affinity-team]').forEach(el=>{el.onchange=()=>setTracking(el.dataset.affinityProfile,el.dataset.affinityTeam,el.checked)});
  const add=document.getElementById('affinityAddButton');if(add)add.onclick=()=>{const p=document.getElementById('affinityAddOwner')?.value,t=document.getElementById('affinityAddTeam')?.value;if(p&&t)setTracking(p,t,true)};
}
function renderTracker(){
  if(typeof document==='undefined')return;ensureMeta();ensureBox();const el=document.getElementById('affinityTrackerIntel');if(!el)return;
  const profiles=roomTrackedProfiles();let currentProfile=null;try{const c=typeof current==='function'?current():null,t=c&&typeof teamForCard==='function'?teamForCard(c.card):null;currentProfile=profileIdForTeam(t)}catch(e){}
  const rows=profiles.length?profiles.map(a=>{const s=summarizeShadowRows(state.picks,a.profileId),onClock=currentProfile===a.profileId?' • on clock':'',reach=s.averageAffinityReach==null?'':` • avg reach ${s.averageAffinityReach>=0?'+':''}${s.averageAffinityReach.toFixed(1)}`;return `<div style="margin-top:5px"><strong>${escapeHtml(teamLabelForProfile(a.profileId))} → ${escapeHtml(a.teams.join('/'))}</strong>${escapeHtml(onClock)}<br>${s.affinitySelections}/${s.picksTracked} affinity picks • strong opp ${s.strongOpportunities} • strong passes ${s.passedStrongOpportunities}${escapeHtml(reach)}</div>`}).join(''):'No enabled affinity tracking in this room.';
  el.innerHTML=rows+'<div style="margin-top:7px;color:var(--muted)">Prospective evidence only • current ADP opportunity/reach preserved in export • affects SURV: no</div>'+configHtml();bindConfig();
}

const api={version:TRACKER_VERSION,affectsSurvival:AFFECTS_SURVIVAL,defaultAffinities:DEFAULT_AFFINITIES,nflTeams:NFL_TEAMS,marketDistance,opportunityBand,defaultSettingMap,normalizedSettings,enabledTeamsFor,basisFor,summarizeShadowRows,setTracking,removeTracking};
if(typeof globalThis!=='undefined')globalThis.DABOYZ_AFFINITY_TRACKER=api;
if(typeof document!=='undefined'){
  ensureSettings();ensureMeta();
  const baseRecordPick=recordPick;
  recordPick=function(player,source='manual',doRender=true){let shadow=null;try{shadow=buildShadowSnapshot(current(),player)}catch(e){}const ok=baseRecordPick(player,source,doRender);if(ok&&shadow){const pick=state.picks[state.picks.length-1];if(pick)pick.affinityShadow=shadow;ensureMeta();if(doRender){try{save('affinity-shadow')}catch(e){}renderTracker()}}return ok};
  const baseRenderAll=renderAll;renderAll=function(){baseRenderAll();renderTracker()};renderTracker();
}
})();
