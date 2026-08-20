const CACHE_PREFIX='daboyz-draft-assistant-';
const CACHE='daboyz-draft-assistant-v0.12-github-2';
const INDEX=new URL('./index.html',self.registration.scope).href;
const ASSETS=['./','./index.html','./app.html.gz','./manifest.webmanifest','./icon-192.svg','./icon-512.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;if(req.mode==='navigate'){event.respondWith(caches.match(INDEX).then(hit=>hit||fetch(req).then(resp=>{if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(INDEX,copy))}return resp}).catch(()=>caches.match(INDEX))));return}event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(resp=>{if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return resp}))) });
