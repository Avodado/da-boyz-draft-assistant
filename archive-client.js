(function(root){
"use strict";
const CLIENT_VERSION="1.0",ARCHIVE_SCHEMA_VERSION=1,COMPLETED_PICK_COUNT=170;
const SESSION_KEY="daboyzArchiveSession_v1",IDENTITY_KEY="daboyzArchiveIdentity_v1",TYPE_KEY="daboyzArchiveDraftType_v1";
const MODEL_HASH="4580193cce84afbf9f4782fd21829969d6e39cb08cdc348d62643122f223a40b";
const DATA_HASH="1c5e95623b0aed0ba266758928f6e87f65d6522b1b205dba2d6537f729d371a5";
const POOL_HASH="e3321e205d4a35df456d1d066848bf4cda0033ac91245f33b9b8af951ac18dcf";
const memoryStore=new Map();
const storage={
  get(key,session=false){try{return (session?root.sessionStorage:root.localStorage)?.getItem(key)??memoryStore.get(key)??null}catch(e){return memoryStore.get(key)??null}},
  set(key,value,session=false){memoryStore.set(key,value);try{(session?root.sessionStorage:root.localStorage)?.setItem(key,value)}catch(e){}},
  remove(key,session=false){memoryStore.delete(key);try{(session?root.sessionStorage:root.localStorage)?.removeItem(key)}catch(e){}}
};
function nowIso(){return new Date().toISOString()}
function uuid(){return root.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}
function config(){const raw=root.DABOYZ_ARCHIVE_CONFIG||{};return{endpoint:String(raw.endpoint||"").replace(/\/$/,"")}}
function draftType(){const value=storage.get(TYPE_KEY);return value==="actual"?"actual":"mock"}
function setDraftType(value){const next=value==="actual"?"actual":"mock";storage.set(TYPE_KEY,next);return next}
function firstPickKey(s){const p=s?.picks?.[0];return p?`${p.overall||1}:${p.card||""}:${p.player?.id||p.player?.name||""}`:""}
function archiveIdentity(s){
  const first=firstPickKey(s),count=s?.picks?.length||0,canonical=String(s?.draftId||"").trim();let prior=null;
  try{prior=JSON.parse(storage.get(IDENTITY_KEY)||"null")}catch(e){}
  const reset=prior&&(count===0&&prior.lastPickCount>0),differentCanonical=prior&&canonical&&prior.canonicalDraftId!==canonical,differentFirst=prior&&!canonical&&first&&prior.firstPickKey&&first!==prior.firstPickKey;
  if(!prior||reset||differentCanonical||differentFirst)prior={draftId:canonical||uuid(),canonicalDraftId:canonical||null,startedAt:nowIso(),firstPickKey:first,lastPickCount:count};
  if(first&&!prior.firstPickKey)prior.firstPickKey=first;
  prior.lastPickCount=count;storage.set(IDENTITY_KEY,JSON.stringify(prior));return prior;
}
function currentBuild(){try{return typeof CURRENT_BUILD!=="undefined"?CURRENT_BUILD:"unknown"}catch(e){return"unknown"}}
function teamMetadata(s){const mine=s?.teams?.find(t=>t.my);return{card:Number(mine?.card)||null,teamName:mine?.teamName||mine?.name||null,ownerName:mine?.ownerName||null,profileId:mine?.profileId||null}}
function makeRequest(kind,s,draftState){
  const identity=archiveIdentity(s),team=teamMetadata(s),pickCount=s?.picks?.length||0,completed=pickCount===COMPLETED_PICK_COUNT;
  return{archiveSchemaVersion:ARCHIVE_SCHEMA_VERSION,requestId:uuid(),archive:{draftId:identity.draftId,draftStartedAt:identity.startedAt,archivedAt:nowIso(),archiveKind:kind==="completed"?"completed":"snapshot",draftType:draftType(),card:team.card,pickCount,completed,appVersion:currentBuild(),buildVersion:currentBuild(),modelVersion:`model-sha256:${MODEL_HASH}`,archiveClientVersion:CLIENT_VERSION,dataSha256:DATA_HASH,modelSha256:MODEL_HASH,poolSha256:POOL_HASH,mockSeed:s?.settings?.mockSeed??null,teamName:team.teamName,ownerName:team.ownerName,profileId:team.profileId,simulationCalibrationVersion:root.DABOYZ_SIMULATION_CALIBRATION?.version??null,affinityTrackerVersion:root.DABOYZ_AFFINITY_TRACKER?.version??null,interpretationLayerVersion:root.DABOYZ_INTERPRETATION_LAYER?.version??null},draftState};
}
function status(message,kind="") {const el=root.document?.getElementById?.("archiveActionStatus");if(el){el.className=`mini ${kind}`.trim();el.textContent=message}}
function sessionToken(){return storage.get(SESSION_KEY,true)}
function authUrl(){const endpoint=config().endpoint,origin=root.location?.origin||"";return endpoint?`${endpoint}/auth/start?origin=${encodeURIComponent(origin)}`:""}
function beginAuth(){const url=authUrl();if(!url){status("Archive is not configured on this build.","statuswarn");return false}root.open?.(url,"daboyzArchiveAuth","popup,width=620,height=760");status("Complete GitHub sign-in, then archival will retry.","statuswarn");return true}
async function sendArchive(request){
  const endpoint=config().endpoint;if(!endpoint)return{ok:false,code:"NOT_CONFIGURED",message:"Archive is not configured on this build."};
  if(root.navigator?.onLine===false)return{ok:false,code:"OFFLINE",message:"Offline: draft progress is safe locally; archive was not sent."};
  const token=sessionToken();if(!token)return{ok:false,code:"AUTH_REQUIRED",message:"GitHub sign-in is required."};
  try{
    const response=await root.fetch(`${endpoint}/api/archives`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},body:JSON.stringify(request)});
    let body={};try{body=await response.json()}catch(e){}
    if(response.status===401){storage.remove(SESSION_KEY,true);return{ok:false,code:"AUTH_REQUIRED",message:"GitHub sign-in expired."}}
    if(!response.ok)return{ok:false,code:body.code||"ARCHIVE_FAILED",message:body.message||`Archive failed (${response.status}).`};
    return{ok:true,...body};
  }catch(e){return{ok:false,code:"NETWORK_FAILURE",message:"Archive service could not be reached; draft progress is unaffected."}}
}
let pending=null,authRetryKind=null;
async function archiveDraft(kind="snapshot",options={}){
  if(pending)return pending;
  pending=(async()=>{
    try{
      if(typeof state==="undefined"||typeof buildDraftStateExport!=="function")return{ok:false,code:"APP_NOT_READY"};
      if(kind==="completed"&&state.picks.length!==COMPLETED_PICK_COUNT)return{ok:false,code:"NOT_COMPLETE"};
      const request=makeRequest(kind,state,buildDraftStateExport());
      status(kind==="completed"?"Archiving completed draft…":"Archiving snapshot…");
      const result=await sendArchive(request);
      if(result.ok)status(`${kind==="completed"?"Completed draft":"Snapshot"} archived • ${result.path||request.archive.draftId}.`,"statusgood");
      else{status(result.message,"statuswarn");if(result.code==="AUTH_REQUIRED"&&!options.automatic){authRetryKind=kind;beginAuth()}}
      return result;
    }catch(e){status("Archive failed safely; draft progress and local export are unaffected.","statuswarn");return{ok:false,code:"CLIENT_FAILURE"}}
    finally{pending=null}
  })();return pending;
}
function mount(){
  const exportButton=root.document?.getElementById?.("exportState");if(!exportButton||root.document.getElementById("archiveSnapshot"))return false;
  const select=root.document.createElement("select");select.id="archiveDraftType";select.className="secondary";select.setAttribute("aria-label","Draft archive type");select.innerHTML='<option value="mock">Mock draft</option><option value="actual">Actual draft</option>';select.value=draftType();select.onchange=()=>setDraftType(select.value);
  const button=root.document.createElement("button");button.id="archiveSnapshot";button.className="secondary";button.type="button";button.textContent="Archive Snapshot";button.onclick=()=>archiveDraft("snapshot");
  exportButton.insertAdjacentElement("afterend",button);button.insertAdjacentElement("afterend",select);
  const existing=root.document.getElementById("exportActionStatus"),line=root.document.createElement("div");line.id="archiveActionStatus";line.className="mini";line.setAttribute("role","status");line.setAttribute("aria-live","polite");line.style.marginTop="7px";line.textContent=config().endpoint?"Archive is ready; GitHub sign-in is requested only when needed.":"Archive gateway must be configured before use.";existing?.insertAdjacentElement("afterend",line);
  return true;
}
function installCompletionHook(){
  try{if(typeof recordPick!=="function"||recordPick.__daboyzArchiveWrapped)return false;const base=recordPick;recordPick=function(player,source="manual",doRender=true){const before=state?.picks?.length||0,ok=base(player,source,doRender),after=state?.picks?.length||0;if(ok&&before<COMPLETED_PICK_COUNT&&after===COMPLETED_PICK_COUNT)Promise.resolve().then(()=>archiveDraft("completed",{automatic:true}));return ok};recordPick.__daboyzArchiveWrapped=true;return true}catch(e){return false}
}
root.addEventListener?.("message",event=>{if(event.origin!==new URL(config().endpoint||root.location?.origin||"http://invalid").origin||event.data?.type!=="daboyz-archive-auth"||!event.data.token)return;storage.set(SESSION_KEY,String(event.data.token),true);const retry=authRetryKind;authRetryKind=null;if(retry)archiveDraft(retry);else status("GitHub sign-in complete; archive is ready.","statusgood")});
const api={version:CLIENT_VERSION,completedPickCount:COMPLETED_PICK_COUNT,makeRequest,sendArchive,archiveDraft,archiveIdentity,draftType,setDraftType,mount,installCompletionHook};root.DABOYZ_DRAFT_ARCHIVE=api;
if(root.document){mount();installCompletionHook()}
})(globalThis);
