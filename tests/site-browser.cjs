// Run with Playwright available: node tests/site-browser.cjs [base URL]
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.argv[2]||'http://127.0.0.1:8875';
const out=path.resolve(__dirname,'../../site-validation');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--enable-webgl']});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 // Exercise bundled content fallback without changing live CMS content.
 await context.route('**/rest/v1/**',route=>route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/');
 await page.screenshot({path:path.join(out,'home-entrance.png')});
 await page.waitForFunction(()=>!document.documentElement.classList.contains('logo-waiting')&&!document.documentElement.classList.contains('field-entering'));
 assert.deepEqual(errors,[]);
 const home=await page.evaluate(()=>({inspector:getComputedStyle(document.querySelector('.inspector')).display,logo:document.querySelector('.mm-logo').getBoundingClientRect().width,axis:document.querySelector('#ax-object').getBoundingClientRect().top,root:MMRoutes.home,links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}));
 assert.equal(home.inspector,'none');assert(home.logo>150);assert(home.axis>800);assert.equal(home.root,'/');
 assert(home.links.includes('/about'));await page.screenshot({path:path.join(out,'home-ready.png')});
 console.log('Homepage renders, hides legacy UI, settles entrance, links to clean About URL.');
 // A slow roster must not hold the logo/grid hostage or expose unpositioned UI.
 const slow=await context.newPage();slow.on('pageerror',e=>errors.push(e.message));
 await slow.route('**/rest/v1/roster*',async route=>{await new Promise(r=>setTimeout(r,2500));await route.abort().catch(()=>{});});
 await slow.goto(base+'/',{waitUntil:'domcontentloaded'});
 const before=await slow.evaluate(()=>({ready:document.documentElement.classList.contains('home-ready'),width:document.querySelector('.mm-logo').getBoundingClientRect().width,inspector:getComputedStyle(document.querySelector('.inspector')).display,axis:document.querySelector('#ax-object').getBoundingClientRect().top}));
 assert(before.ready&&before.width>150&&before.inspector==='none'&&before.axis>800);
 await slow.waitForFunction(()=>document.querySelector('.legend .lg-row'),null,{timeout:6000});await slow.close();
 console.log('Slow roster: early layout and bounded fallback pass.');
 for(const slug of ['eyeknow-manor','nightmare-kart','65porter','massive','gif','selected-arcade']){
   const response=await page.goto(base+'/'+slug);assert.equal(response.status(),200);
   await page.locator('.ident .name').waitFor();assert.equal(new URL(page.url()).pathname,'/'+slug);
   assert.equal(await page.evaluate(()=>MMRoutes.slug),slug);
   await page.reload();await page.locator('.ident .name').waitFor();assert.equal(new URL(page.url()).pathname,'/'+slug);
 }
 console.log('All six clean project URLs return 200, select correct content, and survive refresh.');
 await page.goto(base+'/project.html?p=eyeknow-manor');await page.locator('.ident .name').waitFor();assert.equal(new URL(page.url()).pathname,'/eyeknow-manor');assert.equal(new URL(page.url()).search,'');
 await page.setViewportSize({width:2560,height:1440});
 assert.equal(await page.locator('.stage').evaluate(e=>e.getBoundingClientRect().width),1280);
 await page.evaluate(()=>scrollTo(0,900));await page.waitForTimeout(700);
 const gaps=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {above:r('.ident .name').top-r('.wordmark').bottom,below:r('.nav').top-r('.ident .name').bottom};});
 assert(Math.abs(gaps.above-gaps.below)<1,JSON.stringify(gaps));assert(gaps.above>=23);
 await page.screenshot({path:path.join(out,'project-wide-scrolled.png')});
 await page.locator('.wordmark').click();await page.waitForURL(base+'/');
 console.log('Legacy project URL canonicalizes; 1280px cap, equal title gaps, and home logo navigation pass.');
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(base+'/about');await page.waitForTimeout(1200);
 assert.equal(new URL(page.url()).pathname,'/about');
 const about=await page.evaluate(()=>({failure:getComputedStyle(document.getElementById('glfail')).display,error:document.getElementById('cv').getContext('webgl2').getError(),paths:document.querySelectorAll('svg path').length}));
 assert.equal(about.failure,'none');assert.equal(about.error,0);assert(about.paths>0);
 await page.screenshot({path:path.join(out,'about.png')});
 await page.keyboard.press('ArrowRight');await page.waitForTimeout(1500);
 await page.screenshot({path:path.join(out,'about-morph.png')});
 assert.equal(await page.evaluate(()=>document.getElementById('cv').getContext('webgl2').getError()),0);
 console.log('About shader compiles and renders during a shell transition without GL errors.');
 await page.goto(base+'/project.html?p=eyeknow-manor&edit');assert(new URL(page.url()).search.includes('edit'));
 await page.goto(base+'/?studio');await page.waitForTimeout(500);await page.locator('#mEdit').click();assert.notEqual(await page.locator('.inspector').evaluate(e=>getComputedStyle(e).display),'none');
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/');await page.waitForTimeout(300);
 assert.equal(await page.locator('.mm-logo').evaluate(e=>getComputedStyle(e).visibility),'visible');
 assert(!await page.evaluate(()=>document.documentElement.classList.contains('field-entering')));
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/eyeknow-manor');await page.locator('.ident .name').waitFor();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('Editor access, reduced motion, mobile overflow, and runtime errors pass.');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
