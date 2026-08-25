import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import zlib from "node:zlib";
import { webcrypto } from "node:crypto";
import { archivePaths, archiveToGithub, signToken, verifyToken } from "../worker/draft-archive-worker.mjs";

const clientSource=fs.readFileSync(new URL("../archive-client.js",import.meta.url),"utf8");
const appHtml=zlib.gunzipSync(fs.readFileSync(new URL("../app.html.gz",import.meta.url))).toString("utf8");
function mapStorage(initial={}){const values=new Map(Object.entries(initial));return{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}}
function clientContext(overrides={}){
  const context=vm.createContext({Date,Math,JSON,Promise,URL,structuredClone,crypto:webcrypto,console,setTimeout,clearTimeout,localStorage:mapStorage(),sessionStorage:mapStorage({daboyzArchiveSession_v1:"session-token"}),navigator:{onLine:true},location:{origin:"https://avodado.github.io"},document:{getElementById(){return null}},addEventListener(){},open(){},DABOYZ_ARCHIVE_CONFIG:{endpoint:"https://archive.example"},...overrides});
  vm.runInContext(clientSource,context);return context;
}
function stateFixture(pickCount=1){return{draftId:"draft-fixture-2026",teams:[{my:true,card:9,teamName:"No Chumps",ownerName:"Rob",profileId:"No Chumps"}],picks:Array.from({length:pickCount},(_,i)=>({overall:i+1,card:(i%10)+1,player:{id:`p${i+1}`,name:`Player ${i+1}`}})),settings:{mockSeed:2026}}}

test("manual snapshot sends the unmodified draft export and required index metadata",async()=>{
  let sent=null;const state=stateFixture(12),exported=structuredClone(state),context=clientContext({state,buildDraftStateExport(){return structuredClone(exported)},fetch:async(_url,options)=>{sent=JSON.parse(options.body);return new Response(JSON.stringify({path:"draft-archive/2026/mocks/id/snapshot.json",indexed:true}),{status:201,headers:{"Content-Type":"application/json"}})}});
  const result=await context.DABOYZ_DRAFT_ARCHIVE.archiveDraft("snapshot");
  assert.equal(result.ok,true);assert.equal(sent.archive.archiveKind,"snapshot");assert.equal(sent.archive.pickCount,12);assert.equal(sent.archive.completed,false);assert.equal(sent.archive.card,9);assert.equal(sent.archive.draftType,"mock");assert.match(sent.archive.modelVersion,/model-sha256:/);assert.deepEqual(sent.draftState,exported);
});

test("offline and gateway failures are non-blocking",async()=>{
  let calls=0;const offline=clientContext({state:stateFixture(3),buildDraftStateExport(){return stateFixture(3)},navigator:{onLine:false},fetch:async()=>{calls++;throw new Error("must not fetch")}});
  assert.equal((await offline.DABOYZ_DRAFT_ARCHIVE.archiveDraft("snapshot")).code,"OFFLINE");assert.equal(calls,0);
  const failed=clientContext({state:stateFixture(3),buildDraftStateExport(){return stateFixture(3)},fetch:async()=>{throw new Error("network")}});
  assert.equal((await failed.DABOYZ_DRAFT_ARCHIVE.archiveDraft("snapshot")).code,"NETWORK_FAILURE");
});

test("the 170th successful pick automatically archives exactly once",async()=>{
  const state=stateFixture(169),requests=[];const context=clientContext({state,buildDraftStateExport(){return structuredClone(state)},recordPick(player,source,doRender){state.picks.push({overall:170,card:10,player});return true},fetch:async(_url,options)=>{requests.push(JSON.parse(options.body));return new Response(JSON.stringify({path:"completed.json"}),{status:201,headers:{"Content-Type":"application/json"}})}});
  assert.equal(context.DABOYZ_DRAFT_ARCHIVE.installCompletionHook(),false,"hook installed during module load");
  vm.runInContext('recordPick({id:"p170",name:"Player 170"},"manual",true)',context);await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(requests.length,1);assert.equal(requests[0].archive.archiveKind,"completed");assert.equal(requests[0].archive.pickCount,170);assert.equal(requests[0].archive.completed,true);
  vm.runInContext('recordPick({id:"p171"},"manual",true)',context);await new Promise(resolve=>setTimeout(resolve,5));assert.equal(requests.length,1);
});

test("loading the archive layer does not mutate existing local export behavior",()=>{
  const start=appHtml.indexOf("const ROUND_ORDER="),end=appHtml.indexOf("function renderRosters",start),context=vm.createContext({Date,Math,JSON,Promise,URL,structuredClone,crypto:webcrypto,console,setTimeout,clearTimeout,confirm(){return true},alert(){},localStorage:mapStorage(),sessionStorage:mapStorage(),navigator:{onLine:true},location:{origin:"https://avodado.github.io"},document:{getElementById(){return null},querySelector(){return null}},addEventListener(){}});
  vm.runInContext(appHtml.slice(start,end),context);vm.runInContext('save=()=>true;renderSetup=()=>{};renderAll=()=>{};state={identityVersion:IDENTITY_VERSION,teams:DEFAULT_2026_ROOM_PRESET_IDS.map((id,i)=>normalizeTeamIdentity({...applyTeamPreset({},id),card:i+1,my:id==="No Chumps"},i)),players:freshMasterPool(),picks:[],decisionSnapshots:[],draftGrades:null,settings:{preset:"daboyz",pressure:{...PRESETS.daboyz},ownerModel:true,profileStrength:1,liveAdaptation:true,mockSeed:2026},selectedPlayerId:null,mockCounter:0};',context);
  const before=vm.runInContext("serializeDraftStateExport()",context);context.DABOYZ_ARCHIVE_CONFIG={endpoint:""};vm.runInContext(clientSource,context);const after=vm.runInContext("serializeDraftStateExport()",context);assert.equal(after,before);
});

test("duplicate-safe names are append-only and preserve draft hierarchy",()=>{
  const archive={draftId:"Draft 9/Actual",archivedAt:"2026-08-25T19:12:45.123Z",draftType:"actual",archiveKind:"snapshot",card:9,pickCount:88};const a=archivePaths(archive,"abc123"),b=archivePaths(archive,"xyz789");
  assert.match(a.archivePath,/^draft-archive\/2026\/actual\/draft-9-actual\//);assert.notEqual(a.archivePath,b.archivePath);assert.match(a.eventPath,/^draft-archive\/index\/2026\//);assert.equal(a.indexPath,"draft-archive/index.json");
});

test("loader keeps archive hooks after simulation and observational layers",()=>{
  const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8"),names=["simulation-calibration.js","interpretation-layer.js","affinity-tracker.js","archive-config.js","archive-client.js"],offsets=names.map(name=>index.indexOf(name));assert.ok(offsets.every(offset=>offset>=0));assert.deepEqual(offsets,[...offsets].sort((a,b)=>a-b));
});

test("the core draft ID separates otherwise identical draft sessions",()=>{
  const context=clientContext(),one=stateFixture(10),two=stateFixture(10);one.draftId="draft-one";two.draftId="draft-two";assert.equal(context.DABOYZ_DRAFT_ARCHIVE.archiveIdentity(one).draftId,"draft-one");assert.equal(context.DABOYZ_DRAFT_ARCHIVE.archiveIdentity(two).draftId,"draft-two");
});

async function privateKeyPem(){const keys=await webcrypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]),pkcs8=new Uint8Array(await webcrypto.subtle.exportKey("pkcs8",keys.privateKey)),base64=Buffer.from(pkcs8).toString("base64").match(/.{1,64}/g).join("\n");return`-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`}
function payload(requestId="request-1"){const draftState=stateFixture(170);return{archiveSchemaVersion:1,requestId,archive:{draftId:"draft-9",draftStartedAt:"2026-08-25T18:00:00Z",archivedAt:"2026-08-25T19:12:45Z",archiveKind:"completed",draftType:"mock",card:9,pickCount:170,completed:true,appVersion:"v0.13.0",modelVersion:"model-sha256:test",buildVersion:"v0.13.0",mockSeed:2026,teamName:"No Chumps",ownerName:"Rob",profileId:"No Chumps"},draftState}}
function response(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})}

test("successful gateway archive atomically writes immutable state, event, and aggregate index",async()=>{
  const env={GITHUB_APP_ID:"1",GITHUB_APP_PRIVATE_KEY:await privateKeyPem(),GITHUB_INSTALLATION_ID:"2",GITHUB_REPOSITORY_OWNER:"Avodado",GITHUB_REPOSITORY_NAME:"da-boyz-draft-assistant",GITHUB_ARCHIVE_BRANCH:"main"},blobBodies=[],treeBodies=[];let blob=0;
  const fetcher=async(url,options={})=>{
    const method=options.method||"GET";
    if(url.includes("/access_tokens"))return response({token:"installation-token"});
    if(url.includes("/contents/draft-archive/index.json"))return response({message:"Not Found"},404);
    if(url.includes("/contents/draft-archive/"))return response({message:"Not Found"},404);
    if(url.endsWith("/git/blobs")&&method==="POST"){blobBodies.push(JSON.parse(options.body));return response({sha:`blob-${++blob}`})}
    if(url.includes("/git/ref/heads/"))return response({object:{sha:"parent-sha"}});
    if(url.endsWith("/git/commits/parent-sha"))return response({tree:{sha:"base-tree"}});
    if(url.endsWith("/git/trees")&&method==="POST"){treeBodies.push(JSON.parse(options.body));return response({sha:"new-tree"})}
    if(url.endsWith("/git/commits")&&method==="POST")return response({sha:"new-commit"});
    if(url.includes("/git/refs/heads/")&&method==="PATCH")return response({object:{sha:"new-commit"}});
    throw new Error(`Unexpected ${method} ${url}`);
  };
  const result=await archiveToGithub(payload(),"Avodado",env,fetcher);assert.equal(result.indexed,true);assert.equal(result.duplicate,false);assert.equal(blobBodies.length,3);assert.equal(treeBodies[0].tree.length,3);assert.ok(treeBodies[0].tree.some(row=>row.path===result.path));assert.ok(treeBodies[0].tree.some(row=>row.path==="draft-archive/index.json"));
  const documents=blobBodies.map(row=>JSON.parse(row.content)),index=documents.find(row=>Array.isArray(row.entries)),event=documents.find(row=>row.schemaVersion===1&&row.path);assert.equal(index.entries[0].draftId,"draft-9");assert.equal(index.entries[0].pickCount,170);assert.equal(index.entries[0].completed,true);assert.equal(event.requestId,"request-1");
});

test("an already-indexed request is idempotent and creates no archive blobs",async()=>{
  const env={GITHUB_APP_ID:"1",GITHUB_APP_PRIVATE_KEY:await privateKeyPem(),GITHUB_INSTALLATION_ID:"2",GITHUB_REPOSITORY_OWNER:"Avodado",GITHUB_REPOSITORY_NAME:"da-boyz-draft-assistant",GITHUB_ARCHIVE_BRANCH:"main"},existing={schemaVersion:1,entries:[{requestId:"request-1",path:"draft-archive/existing.json"}]};let blobs=0;
  const fetcher=async(url,options={})=>{if(url.includes("/access_tokens"))return response({token:"installation-token"});if(url.includes("/contents/draft-archive/index.json"))return response({content:Buffer.from(JSON.stringify(existing)).toString("base64")});if(url.endsWith("/git/blobs")){blobs++;return response({sha:"unexpected"})}throw new Error(`Unexpected ${url}`)};
  const result=await archiveToGithub(payload(),"Avodado",env,fetcher);assert.equal(result.duplicate,true);assert.equal(result.path,"draft-archive/existing.json");assert.equal(blobs,0);
});

test("origin-bound session tokens expire and cannot be forged",async()=>{
  const secret="a sufficiently long random session signing secret",valid=await signToken({sub:"Avodado",origin:"https://avodado.github.io",exp:Math.floor(Date.now()/1000)+60},secret);assert.equal((await verifyToken(valid,secret)).sub,"Avodado");assert.equal(await verifyToken(valid+"x",secret),null);const expired=await signToken({sub:"Avodado",exp:1},secret);assert.equal(await verifyToken(expired,secret),null);
});

test("the public client and config contain no GitHub write credential",()=>{
  const configSource=fs.readFileSync(new URL("../archive-config.js",import.meta.url),"utf8"),publicSource=clientSource+configSource;for(const token of ["GITHUB_APP_PRIVATE_KEY","GITHUB_OAUTH_CLIENT_SECRET","GITHUB_INSTALLATION_ID","ghp_","github_pat_"])assert.doesNotMatch(publicSource,new RegExp(token));assert.match(configSource,/endpoint:\s*""/);
});
