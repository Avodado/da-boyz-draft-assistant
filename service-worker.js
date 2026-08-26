const CACHE_PREFIX='daboyz-draft-assistant-';
const CACHE='daboyz-draft-assistant-v0.13.0-mock-toolbar-1';
const INDEX=new URL('./index.html',self.registration.scope).href;
const ASSETS=['./','./index.html','./app.html.gz','./version.json','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-192.svg','./icon-512.svg','./simulation-calibration.js','./interpretation-layer.js','./affinity-tracker.js','./archive-config.js','./archive-client.js','./mock-toolbar.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
async function networkFirst(req,fallback){
  try{const resp=await fetch(req,{cache:'no-store'});if(resp&&resp.ok){const copy=resp.clone();const c=await caches.open(CACHE);await c.put(fallback||req,copy);return resp}return (await caches.match(fallback||req))||resp}
  catch(e){return (await caches.match(fallback||req))||(fallback?await caches.match(INDEX):undefined)}
}
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){event.respondWith(networkFirst(req,INDEX));return}
 if(url.pathname.endsWith('/app.html.gz')||url.pathname.endsWith('/version.json')||url.pathname.endsWith('/index.html')){event.respondWith(networkFirst(req));return}
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(resp=>{if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return resp})))
});
