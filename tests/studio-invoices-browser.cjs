// Local fixtures only: no production sign-in, database requests, email, or writes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base='https://studio.test';
const ids={draft:'11111111-1111-4111-8111-111111111111',issued:'22222222-2222-4222-8222-222222222222',paid:'33333333-3333-4333-8333-333333333333',proposal:'44444444-4444-4444-8444-444444444444'};

function fixture(){
  const company={studioName:'MODE MODE',legalName:'Test Studio',invoicePrefix:'MM-I',proposalPrefix:'MM-P',defaultDueDays:30};
  const client={name:'Example client',email:'client@example.test',address:'Example address'};
  const content={title:'Example installation',issueDate:'2026-09-01',dueDate:'2026-10-01',reference:'EXAMPLE',items:[{description:'Design services',quantity:'1',unit:'project',rate:'1000.00',showRate:true}],tax:'0.00',terms:'Net 30',paymentInstructions:'Payment details supplied separately.',notes:'',internalNotes:'Private note must never appear in PDF',sections:{scope:'Example scope'}};
  const rows=Object.entries(ids).map(([name,id])=>({id,project_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',kind:name==='proposal'?'proposal':'invoice',status:name==='draft'?'draft':'issued',number:name==='draft'?null:'MM-'+(name==='proposal'?'P':'I')+'-2026-'+name,revision:1,data:structuredClone(content),snapshot:name==='draft'?null:{kind:name==='proposal'?'proposal':'invoice',company,client,data:{...content,internalNotes:undefined},number:'MM-'+(name==='proposal'?'P':'I')+'-2026-'+name},source_id:null,pdf_path:name==='draft'?null:name+'.pdf',pdf_hash:'original-hash',issued_at:'2026-09-01T12:00:00Z',created_at:'2026-09-01T12:00:00Z',updated_at:'2026-09-01T12:00:00Z'}));
  const db={studio_meta:[{key:'settings',value:company}],studio_clients:[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',data:client}],studio_projects:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',client_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',data:{name:'Example installation',clientId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}}],studio_documents:rows,studio_payments:[{id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',document_id:ids.paid,amount_cents:60000,paid_on:'2026-09-02',created_at:'2026-09-02T12:00:00Z',reversed_at:null}],studio_events:[]};
  window.__fixture={db,fail:null,conflict:false,downloads:[]};
  window.__SB_STUB__={auth:{getSession:async()=>({data:{session:{user:{email:'test@example.test'}}}})},storage:{from:()=>({createSignedUrl:async file=>{window.__fixture.downloads.push(file);return {error:{message:'Use snapshot fallback'}};}})},from(table){
    const filters=[];let op='select',value,mode,sort;
    const q={select(){return q;},eq(k,v){filters.push(r=>r[k]===v);return q;},neq(k,v){filters.push(r=>r[k]!==v);return q;},order(k,o){sort=[k,o];return q;},update(v){op='update';value=v;return q;},insert(v){op='insert';value=v;return q;},maybeSingle(){mode='maybe';return q;},single(){mode='single';return q;},then(resolve,reject){
      try{
        if(window.__fixture.fail===table){window.__fixture.fail=null;return Promise.resolve({data:null,error:{message:'Simulated permission error'}}).then(resolve,reject);}
        if(op==='update'&&window.__fixture.conflict){window.__fixture.conflict=false;return Promise.resolve({data:null,error:null}).then(resolve,reject);}
        let found=db[table].filter(r=>filters.every(f=>f(r)));
        if(op==='update')found.forEach(r=>Object.assign(r,structuredClone(value)));
        if(op==='insert'){const r={id:crypto.randomUUID(),revision:1,status:'draft',created_at:new Date().toISOString(),...structuredClone(value)};db[table].push(r);found=[r];}
        if(sort)found.sort((a,b)=>String(a[sort[0]]).localeCompare(String(b[sort[0]]))*(sort[1]?.ascending===false?-1:1));
        return Promise.resolve({data:structuredClone(mode?found[0]||null:found),error:null}).then(resolve,reject);
      }catch(e){return Promise.reject(e).then(resolve,reject);}
    }};return q;
  }};
}

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
    const errors=[];
    await context.route('**/*',async r=>{
      const u=new URL(r.request().url());
      if(!['http:','https:'].includes(u.protocol))return r.continue();
      if(u.hostname==='esm.sh')return r.fulfill({contentType:'text/javascript',body:'export function createClient(){throw new Error("Fixture missing");}'});
      if(u.hostname==='cdn.jsdelivr.net'){
        // Optional local cache; otherwise fetch only the two pinned public PDF scripts.
        const name=path.basename(u.pathname),cache=process.env.STUDIO_PDF_CACHE;
        if(!['pdfmake.min.js','vfs_fonts.js'].includes(name))throw new Error('Unexpected external script');
        if(cache)return r.fulfill({contentType:'text/javascript',path:path.join(cache,name)});
        return r.continue();
      }
      if(u.origin!==base)throw new Error('Unexpected network request: '+u.origin);
      let rel=decodeURIComponent(u.pathname).slice(1);if(rel.endsWith('/'))rel+='index.html';
      const file=path.resolve(root,rel);
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:''});
      return r.fulfill({path:file});
    });
    await context.addInitScript(({source,ids})=>{window.ids=ids;(0,eval)('('+source+')()');},{source:fixture.toString(),ids});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const open=async id=>{await page.goto(base+'/studio/#document/'+id);await page.locator('#doc-preview').waitFor();};
    const row=id=>page.evaluate(id=>structuredClone(__fixture.db.studio_documents.find(d=>d.id===id)),id);
    const api=(url,method,body)=>page.evaluate(async({url,method,body})=>{try{return {ok:true,value:await __STUDIO__.api(url,method,body)}}catch(e){return {ok:false,error:e.message}}},{url,method,body});
    const click=action=>page.locator('[data-action="'+action+'"]').click();
    const confirm=async label=>{await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});};

    await open(ids.issued);
    await click('edit-invoice');
    await page.locator('[data-item="rate"]').fill('1250.00');
    await page.locator('[data-tab="details"]').click();
    await page.locator('[data-field="title"]').fill('Revised installation');
    await page.locator('[data-field="dueDate"]').fill('2026-10-15');
    await click('save');await confirm('Save changes');
    let updated=await row(ids.issued);
    assert.equal(updated.number,'MM-I-2026-issued');assert.equal(updated.status,'issued');assert.equal(updated.revision,2);
    assert.equal(updated.data.items[0].rate,'1250.00');assert.equal(updated.snapshot.data.title,'Revised installation');
    assert.equal(updated.snapshot.data.dueDate,'2026-10-15');assert(!('_studio' in updated.snapshot.data));assert(!('internalNotes' in updated.snapshot.data));
    assert.equal(updated.pdf_path,null);assert.equal(updated.data._studio.versions.length,1);
    assert.equal(updated.data._studio.versions[0].snapshot.data.items[0].rate,'1000.00');assert.equal(updated.data._studio.versions[0].pdfPath,'issued.pdf');
    await page.locator('[data-tab="activity"]').click();await page.getByText(/Previous invoice.*revision 1/).waitFor();
    const download=page.waitForEvent('download');await click('version-pdf');const previousPDF=await download;assert(previousPDF.suggestedFilename().endsWith('.pdf'));
    assert.deepEqual(await page.evaluate(()=>__fixture.downloads),['issued.pdf']);
    const currentDownload=page.waitForEvent('download');await click('original-pdf');const currentPDF=await currentDownload;assert(currentPDF.suggestedFilename().endsWith('.pdf'));
    for(const pdf of [previousPDF,currentPDF])assert.equal(fs.readFileSync(await pdf.path()).subarray(0,5).toString(),'%PDF-');
    if(process.env.STUDIO_SCREENSHOT_DIR){
      fs.mkdirSync(process.env.STUDIO_SCREENSHOT_DIR,{recursive:true});
      await previousPDF.saveAs(path.join(process.env.STUDIO_SCREENSHOT_DIR,'invoice-previous.pdf'));
      await currentPDF.saveAs(path.join(process.env.STUDIO_SCREENSHOT_DIR,'invoice-current.pdf'));
    }
    await click('edit-invoice');await page.locator('[data-item="rate"]').fill('1400.00');
    page.once('dialog',d=>d.accept());await click('cancel-edit');assert.equal((await row(ids.issued)).data.items[0].rate,'1250.00');
    await page.locator('[data-tab="activity"]').click();await page.getByText(/Previous invoice.*revision 1/).waitFor();
    if(process.env.STUDIO_SCREENSHOT_DIR){fs.mkdirSync(process.env.STUDIO_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'invoice-history.png'),fullPage:true});}
    console.log('Issued edits retain number, status, previous PDF and private notes; both PDFs download; cancel keeps saved data.');

    // A stale tab, an atomic-write conflict, permission errors, and missing required fields must not report success.
    assert.match((await api('/api/documents/'+ids.issued,'PUT',{revision:1,data:updated.data,reviewed:true})).error,/another tab/);
    await page.evaluate(()=>__fixture.conflict=true);
    assert.match((await api('/api/documents/'+ids.issued,'PUT',{revision:2,data:updated.data,reviewed:true})).error,/another tab/);
    assert.equal((await row(ids.issued)).revision,2);
    await page.evaluate(()=>__fixture.fail='studio_payments');
    assert.match((await api('/api/documents/'+ids.issued,'PUT',{revision:2,data:updated.data,reviewed:true})).error,/permission/);
    assert.equal((await row(ids.issued)).revision,2);
    assert.match((await api('/api/documents/'+ids.issued,'PUT',{revision:2,data:{...updated.data,dueDate:''},reviewed:true})).error,/due date/);
    const proposal=await row(ids.proposal);
    assert.equal((await api('/api/documents/'+ids.proposal,'PUT',{revision:1,data:proposal.data,reviewed:true})).ok,false);
    console.log('Stale writes, conflicting updates, payment-read failures and invalid issued edits are rejected; proposals remain frozen.');

    // Paid invoice edits retain the ledger and cannot create a negative balance.
    const paid=await row(ids.paid),low=structuredClone(paid.data);low.items[0].rate='500.00';
    assert.match((await api('/api/documents/'+ids.paid,'PUT',{revision:1,data:low,reviewed:true})).error,/recorded payments/);
    low.items[0].rate='600.00';
    assert.equal((await api('/api/documents/'+ids.paid,'PUT',{revision:1,data:low,reviewed:true})).ok,true);
    const paidView=(await api('/api/documents/'+ids.paid)).value;
    assert.equal(paidView.displayStatus,'paid');assert.equal(paidView.paidCents,60000);assert.equal(paidView.balanceCents,0);
    assert.equal((await api('/api/documents/'+ids.paid,'DELETE',{revision:2})).ok,true);
    let state=(await api('/api/state')).value;
    assert(!state.documents.some(d=>d.id===ids.paid));assert.equal(state.removedDocuments[0].payments.length,1);
    assert.equal((await api('/api/documents/'+ids.paid,'PUT',{revision:3,data:low,reviewed:true})).ok,false);
    assert.equal((await api('/api/payments/cccccccc-cccc-4ccc-8ccc-cccccccccccc/reverse','POST',{reason:'Test'})).ok,false);
    await page.goto(base+'/studio/#dashboard');
    await page.locator('.stats').waitFor();
    assert.equal(await page.locator('.stat').nth(2).locator('.value').innerText(),'$600.00');
    assert.equal((await api('/api/documents/'+ids.paid+'/restore','POST',{revision:3})).ok,true);
    assert.equal((await api('/api/documents/'+ids.paid)).value.displayStatus,'paid');
    console.log('Paid invoices retain payments across edits/removal/restoration; totals cannot drop below recorded payments.');

    // Test actual removal UI, cancellation, filtered totals, restore, and a draft after restore.
    await open(ids.draft);
    await page.locator('[data-tab="fees"]').click();
    await page.locator('[data-item="rate"]').fill('750.00');await click('save');
    await page.getByText('Draft saved.',{exact:true}).waitFor();
    await click('remove-invoice');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
    assert(!(await row(ids.draft)).data._studio?.removedAt);
    await click('remove-invoice');await confirm('Remove invoice');
    await page.getByRole('heading',{name:'Invoices',exact:true}).waitFor();
    assert.equal(await page.locator('#document-list a[href="#document/'+ids.draft+'"]').count(),0);
    await page.getByRole('link',{name:'Removed (1)',exact:true}).click();
    await page.getByRole('heading',{name:'Removed invoices'}).waitFor();
    await page.locator('#document-list a[href="#document/'+ids.draft+'"]').first().click();
    await page.locator('[data-action="restore-invoice"]').waitFor();
    assert.equal(await page.locator('[data-action="save"]').count(),0);assert.equal(await page.locator('[data-action="remove-invoice"]').count(),0);
    await click('restore-invoice');await page.locator('[data-action="save"]').waitFor();
    await page.locator('[data-item="rate"]').fill('900.00');await click('save');await page.getByText('Draft saved.',{exact:true}).waitFor();
    const draft=await row(ids.draft);assert.equal(draft.data.items[0].rate,'900.00');assert.equal(draft.data._studio.changes.length,2);assert.equal(draft.data._studio.removedAt,null);
    const clone=await api('/api/documents/'+ids.draft+'/clone','POST',{});assert.equal(clone.ok,true);
    assert(!('_studio' in (await row(clone.value.id)).data));
    console.log('Remove confirmation/cancel, Removed list, Restore and draft saves work; cloned invoices start without lifecycle metadata.');

    await open(ids.issued);await click('edit-invoice');
    await page.setViewportSize({width:390,height:844});
    assert(await page.locator('[data-action="save"]').isVisible());assert(await page.locator('[data-action="remove-invoice"]').isVisible());
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(process.env.STUDIO_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'invoice-edit-mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]);console.log('Mobile controls fit the screen. No browser runtime errors.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
