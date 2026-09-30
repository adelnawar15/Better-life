const C='better-life-v10';
const SHELL=['./','./index.html','./daily-state.js','./v3-ui.js','./v3.css','./manifest.json','./icon.svg','./mountains.svg','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
const IMAGES=['./assets/daily-landscape.webp','./assets/calm-sky.webp'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(async c=>{await c.addAll(SHELL);await Promise.allSettled(IMAGES.map(url=>c.add(url)))}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(a=>Promise.all(a.filter(x=>x.startsWith('better-life-')&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(C).then(async c=>(await c.match(e.request))||fetch(e.request)))});
