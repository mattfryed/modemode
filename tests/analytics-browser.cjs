// Offline browser smoke test. No production Analytics or CMS requests are sent.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const context=await browser.newContext({reducedMotion:'reduce'});
 const events=[],errors=[],tags=[];
 await context.exposeBinding('recordAnalytics',(_,args)=>events.push(args));
 await context.addInitScript(()=>{
   window.dataLayer=[];
   window.dataLayer.push=function(args){window.recordAnalytics(Array.from(args));return Array.prototype.push.call(this,args);};
 });
 await context.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='www.googletagmanager.com'){tags.push(u.href);return route.fulfill({contentType:'application/javascript',body:''});}
   if(!['modemode.studio','127.0.0.1'].includes(u.hostname))return route.abort();
   let relative=decodeURIComponent(u.pathname).replace(/^\//,'');
   if(!relative)relative='index.html';
   else if(!path.extname(relative))relative+='/index.html';
   const file=path.join(root,relative);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
   return route.fulfill({path:file});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://modemode.studio/');
 await page.locator('.legend .lg-row').first().waitFor();
 assert.equal(tags.length,1);
 assert.equal(events.filter(e=>e[0]==='config').length,1);
 const before=events.length;
 await page.locator('.legend .lg-row').filter({hasText:'EYEKNOW MANOR'}).click();
 await page.waitForURL('https://modemode.studio/eyeknow-manor');
 await page.locator('.ident .name').waitFor();
 const open=events.slice(before).filter(e=>e[1]==='project_open');
 assert.equal(open.length,1);assert.equal(open[0][2].project_slug,'eyeknow-manor');assert.equal(open[0][2].navigation_source,'index');
 await page.locator('.nav-item').filter({hasText:'Experiential Design'}).click();
 await page.waitForTimeout(100);
 let section=events.filter(e=>e[1]==='project_section_select').at(-1);
 assert.equal(section[2].section_name,'Experiential Design');assert.equal(section[2].project_slug,'eyeknow-manor');
 await page.locator('.main img[src*="squarespace"]').first().click();
 await page.locator('#lightbox.on').waitFor();await page.waitForTimeout(100);
 assert.equal(events.filter(e=>e[1]==='project_detail_open').length,1);
 await page.keyboard.press('Escape');
 await page.locator('#mm-legend a[data-mm-project="gif"]').click();
 await page.waitForURL('https://modemode.studio/gif');
 assert.equal(events.filter(e=>e[1]==='project_open').at(-1)[2].project_slug,'gif');
 await page.goto('https://modemode.studio/about');
 const contact=page.locator('#copy .contact a');
 await contact.waitFor();
 assert.equal(await contact.getAttribute('href'),'mailto:hello@modemode.studio');
 // Let the real delegated listener run, then cancel the mail-client default action.
 await page.evaluate(()=>document.addEventListener('click',e=>e.preventDefault()));
 await contact.dispatchEvent('click',{button:0,ctrlKey:true,bubbles:true,cancelable:true});
 await page.waitForTimeout(100);
 const contacts=events.filter(e=>e[1]==='contact_click');
 assert.equal(contacts.length,1);assert.equal(contacts[0][2].navigation_source,'about');
 assert.ok(!JSON.stringify(contacts).includes('@modemode.studio'));
 for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   await contact.scrollIntoViewIfNeeded();
   const box=await contact.boundingBox();
   assert.ok(box&&box.x>=0&&box.x+box.width<=width,'Contact link fits the viewport');
   await page.screenshot({path:path.join(process.env.TEMP||'/tmp','modemode-about-'+width+'.png')});
 }
 const count=events.length,tagCount=tags.length;
 for(const url of ['https://modemode.studio/?studio','https://modemode.studio/project.html?p=gif&edit','http://127.0.0.1/']){
   await page.goto(url);await page.waitForTimeout(200);
 }
 assert.equal(events.length,count);assert.equal(tags.length,tagCount);assert.deepEqual(errors,[]);
 console.log('PASS: one tag/config per public page; project, section, image, contact events; responsive contact link; navigation survives blocked Google; no editor/local tracking.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
