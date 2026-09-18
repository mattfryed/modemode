// Offline browser checks: no production Analytics, CMS writes, or media downloads.
const {chromium}=require('playwright');
const sharp=require('sharp'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),meta=require('../data/site-meta.json');
const base='https://modemode.studio';
async function route(context){
 await context.route('**/*',r=>{
  const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
  let rel=decodeURIComponent(u.pathname).replace(/^\//,'');if(!rel)rel='index.html';else if(!path.extname(rel))rel=rel.replace(/\/$/,'')+'/index.html';
  const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:''});
  return r.fulfill({path:file});
 });
}
(async()=>{
 for(const m of Object.values(meta)){
  const info=await sharp(path.join(root,m.image)).metadata();assert.equal(info.width,1200);assert.equal(info.height,630);assert(fs.statSync(path.join(root,m.image)).size<300000);
 }
 const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,8);
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--enable-webgl']});
 try{
  const noJS=await browser.newContext({javaScriptEnabled:false});await route(noJS);const raw=await noJS.newPage();
  for(const [slug,m]of Object.entries(meta)){
   const url=base+(slug==='home'?'/':'/'+slug);await raw.goto(url);
   assert.equal(await raw.title(),m.title);assert.equal(await raw.locator('meta[name="description"]').getAttribute('content'),m.description);
   assert.equal(await raw.locator('link[rel="canonical"]').getAttribute('href'),url);
   assert.equal(await raw.locator('meta[property="og:url"]').getAttribute('content'),url);
   assert.equal(await raw.locator('meta[property="og:image"]').getAttribute('content'),base+'/'+m.image);
   assert.equal(await raw.locator('meta[name="twitter:card"]').getAttribute('content'),'summary_large_image');
   assert.equal(await raw.locator('h1').count(),1);assert(await raw.locator('h1').isVisible());
   assert.equal(await raw.locator('meta[name="robots"][content*="noindex"]').count(),0);
  }
  await noJS.close();console.log('All eight public pages expose brief, unique metadata, canonical URLs, sharing cards, and readable content without JavaScript.');
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1200,height:850}});await route(context);
  await context.addInitScript(()=>{
   window.drawCounts={};
   for(const [prototype,method]of [[CanvasRenderingContext2D.prototype,'clearRect'],[WebGL2RenderingContext.prototype,'drawArrays']]){
    const original=prototype[method];prototype[method]=function(...args){const id=this.canvas.id;if(id)drawCounts[id]=(drawCounts[id]||0)+1;return original.apply(this,args);};
   }
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const count=id=>page.evaluate(id=>drawCounts[id]||0,id);
  async function stable(id){await page.waitForTimeout(500);const n=await count(id);assert(n>0,id+' drew content');await page.waitForTimeout(350);assert.equal(await count(id),n,id+' is still');}
  async function moving(id){const n=await count(id);await page.waitForTimeout(550);assert(await count(id)>n,id+' resumes');}
  await page.goto(base+'/');await page.waitForFunction(()=>!document.documentElement.classList.contains('field-entering'));await stable('field');
  assert.equal(await page.locator('.legend .lg-row[href]').count(),6);
  await page.emulateMedia({reducedMotion:'no-preference'});await moving('field');await page.emulateMedia({reducedMotion:'reduce'});await stable('field');
  await page.goto(base+'/65porter');await page.locator('#minimap').waitFor();await stable('minimap');
  await page.emulateMedia({reducedMotion:'no-preference'});await moving('minimap');await page.emulateMedia({reducedMotion:'reduce'});await stable('minimap');
  const n=await count('minimap');await page.locator('.nav-item.live').nth(1).hover();await page.waitForTimeout(200);assert(await count('minimap')>n,'Hover still updates the minimap');
  // GIF opt-in, new media insertion, and changing the OS preference after load.
  const gif=await page.evaluate(()=>Object.keys(MMStills)[0]);
  await page.evaluate(src=>{const f=document.createElement('figure');f.id='motion-fixture';f.style='position:fixed;top:0;right:0;width:100px;height:100px;z-index:9999';f.innerHTML='<img alt="Animation test" style="width:100%">';f.querySelector('img').src=src;document.body.appendChild(f);},gif);
  await page.locator('#motion-fixture button').waitFor();assert.match(await page.locator('#motion-fixture img').getAttribute('src'),/^assets\/stills\//);
  await page.locator('#motion-fixture button').click();assert.equal(await page.locator('#motion-fixture img').getAttribute('src'),gif);
  await page.locator('#motion-fixture button').click();assert.match(await page.locator('#motion-fixture img').getAttribute('src'),/^assets\/stills\//);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(100);assert.equal(await page.locator('#motion-fixture img').getAttribute('src'),gif);assert.equal(await page.locator('#motion-fixture button').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#motion-fixture button').waitFor();
  await page.evaluate(()=>{const v=document.createElement('video');v.id='video-fixture';v.autoplay=true;document.body.appendChild(v);});await page.waitForTimeout(100);
  assert.deepEqual(await page.locator('#video-fixture').evaluate(v=>({autoplay:v.autoplay,controls:v.controls,paused:v.paused})),{autoplay:false,controls:true,paused:true});
  console.log('Homepage and project fields honor live preference changes; hover, GIF play/pause, and video controls work.');
  await page.goto(base+'/about');await page.locator('#cv').waitFor();await stable('cv');
  const before=await page.locator('#shellSvg').innerHTML();await page.keyboard.press('ArrowRight');await page.waitForTimeout(250);
  assert.notEqual(await page.locator('#shellSvg').innerHTML(),before,'Manual shell change remains available');await stable('cv');
  await page.setViewportSize({width:1050,height:800});await stable('cv');
  await page.emulateMedia({reducedMotion:'no-preference'});await moving('cv');
  await page.evaluate(()=>document.getElementById('cv').style.transform='translateY(2000px)');const off=await count('cv');await page.waitForTimeout(350);assert.equal(await count('cv'),off,'Offscreen canvas pauses');
  await page.evaluate(()=>document.getElementById('cv').style.transform='');await moving('cv');await page.emulateMedia({reducedMotion:'reduce'});await stable('cv');
  assert.deepEqual(errors,[]);console.log('About remains still, supports manual state changes and resizing, resumes on preference changes, and pauses offscreen. No runtime errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
