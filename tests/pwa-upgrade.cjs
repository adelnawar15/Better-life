const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),baseline='9155c340108353e6cd25ce7e04c4fa5666cdd92d';
(async()=>{for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 let upgraded=false;const browser=await type.launch({headless:true}),context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const server=http.createServer((req,res)=>{let file=new URL(req.url,'http://localhost').pathname.replace(/^\/Better-life\//,'')||'index.html';if(file==='favicon.ico'){res.writeHead(204).end();return}if(file.includes('..')){res.writeHead(400).end();return}try{const content=upgraded?fs.readFileSync(path.join(root,file)):execFileSync('git',['show',baseline+':'+file],{cwd:root,stdio:['ignore','pipe','ignore']});const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(content)}catch{res.writeHead(404).end()}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/Better-life/`;
 await page.goto(url);await page.evaluate(async()=>await navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
 await page.evaluate(()=>localStorage.setItem('better-life-v2',JSON.stringify({schemaVersion:3,habits:[{id:'keep',name:'Keep history',tracking:'yesno',frequency:'Daily',target:1}],logs:{'keep-2026-09-28':true},tasks:[],journal:[],goals:[]})));
 upgraded=true;await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();const worker=r.installing||r.waiting;if(worker&&worker.state!=='activated')await new Promise((resolve,reject)=>{worker.addEventListener('statechange',()=>{if(worker.state==='activated')resolve();if(worker.state==='redundant')reject(new Error('New worker installation failed'))})})});
 await page.reload();await page.waitForSelector('.v3-hero');assert.equal(await page.evaluate(()=>db.logs['keep-2026-09-28']),true);assert.equal(await page.evaluate(()=>db.habits[0].id),'keep');
 const keys=await page.evaluate(()=>caches.keys());assert.ok(keys.includes('better-life-v10'));assert.ok(!keys.includes('better-life-v9'));
 const cache=await page.evaluate(async()=>{const c=await caches.open('better-life-v10');return (await c.keys()).map(r=>new URL(r.url).pathname)});assert.ok(cache.includes('/Better-life/v3-ui.js'));assert.ok(cache.includes('/Better-life/assets/daily-landscape.webp'));
 // Real network loss, without the WebKit offline-emulation flag.
 await new Promise(resolve=>server.close(resolve));
 await page.reload();await page.waitForSelector('.v3-hero');await page.locator('[data-view=habits]').click();assert.equal(await page.locator('#hl .journey-day').count(),30);assert.equal(await page.evaluate(()=>db.logs['keep-2026-09-28']),true);assert.deepEqual(errors,[]);
 console.log(name+': PASS — baseline V9 → V10 activation, old-cache cleanup, /Better-life/ scope, preserved logs, offline reload with server stopped');await browser.close();
}})().catch(e=>{console.error(e);process.exit(1)});
