/* MODE MODE — shared site index. Mirrors the homepage legend verbatim
   (same .lg-* type scale, typography-on-ground look — no card / no border /
   no drop shadow). Always visible.

   mount({current, container}):
     - current: project slug, 'about', or 'home' — for the "current" state
     - container: CSS selector or HTMLElement to append into. When present,
       the legend flows INSIDE that container as the final block in the
       navigation stack (recommended for pages with a left rail — the site
       index becomes the last hierarchical block after in-page nav). When
       omitted, falls back to a position:fixed bottom-left placement. */
(function(){
  const ROSTER=[
    {code:'P-05',slug:'65porter',name:'65 PORTER',core:[136,212,32]},
    {code:'P-06',slug:'selected-arcade',name:'SELECTED ARCADE',core:[249,249,11]},
    {code:'P-02',slug:'massive',name:'MASSIVE',core:[30,111,224]},
    {code:'P-03',slug:'gif',name:'GIF',core:[0,167,255]},
    {code:'P-04',slug:'nightmare-kart',name:'NIGHTMARE KART',core:[196,0,33]},
    {code:'P-01',slug:'eyeknow-manor',name:'EYEKNOW MANOR',core:[215,3,89]}
  ];
  const SB={ url:'https://vjvjparfulrtsxdslrpg.supabase.co',
    anon:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqdmpwYXJmdWxydHN4ZHNscnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODM1ODIsImV4cCI6MjA5ODI1OTU4Mn0._A1WCuNyCtnJ2Y3U4iqWjvWQe2ANTA6i-sYfuhhcFq4' };
  let current=null, list=ROSTER.slice(), root=null;
  const rgb=a=>Array.isArray(a)?'rgb('+a.map(n=>Math.round(+n||0)).join(',')+')':'#9a9a94';
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* Style contract: two variants on #mm-legend, chosen by mount() at build
     time. .inline flows in a container; .floating is position:fixed bottom-
     left. Both share the same .lg-* type scale as the homepage legend so
     the site reads as one system. */
  function style(){ if(document.getElementById('mmm-style'))return; const st=document.createElement('style'); st.id='mmm-style';
    st.textContent=
     /* Index sits on a solid panel so ambient blobs behind the rail don't
        bleed through the project links (Matt, 2026-09-07). */
     '#mm-legend{display:flex;flex-direction:column;gap:1px;font-family:var(--text,ui-monospace,monospace);background:var(--panel,#FBFBF9);border:1px solid var(--hair,rgba(18,16,12,.17));border-radius:5px;padding:12px 12px 10px;position:relative;z-index:2;}'
    +'#mm-legend.floating{position:fixed;left:36px;bottom:34px;z-index:60;}'
    +'#mm-legend.inline{margin-top:22px;}'
    +'#mm-legend .lg-h{font-size:9.5px;letter-spacing:.2em;color:var(--grey-2,#B6B5AD);margin-bottom:8px;text-transform:uppercase;}'
    +'#mm-legend .lg-row{display:flex;align-items:center;gap:9px;padding:4px 8px 4px 4px;cursor:pointer;border:1px solid transparent;color:var(--ink,#15140F);text-decoration:none;transition:.2s;border-radius:3px;}'
    +'#mm-legend .lg-row:hover{background:var(--ground,#F3F3F0);border-color:var(--hair,rgba(18,16,12,.17));}'
    +'#mm-legend .lg-row.cur{background:var(--ground,#F3F3F0);border-color:var(--hair,rgba(18,16,12,.17));cursor:default;}'
    +'#mm-legend .lg-dot{width:9px;height:9px;border-radius:50%;flex:none;}'
    +'#mm-legend .lg-code{font-size:9.5px;letter-spacing:.1em;color:var(--grey,#7E7D75);width:30px;flex:none;}'
    +'#mm-legend .lg-name{font-size:10.5px;}'
    /* About / Field map read as continuations of the index — no top border,
       no gap, same row rhythm as the project rows above. */
    +'#mm-legend .lg-alt{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:0;padding:4px 8px 4px 4px;border:1px solid transparent;font-size:10.5px;letter-spacing:.02em;color:var(--grey,#7E7D75);cursor:pointer;text-decoration:none;transition:color .2s,background .2s;text-transform:none;}'
    +'#mm-legend .lg-alt:hover{color:var(--ink,#15140F);background:var(--panel,#FBFBF9);border-color:var(--hair,rgba(18,16,12,.17));}'
    +'#mm-legend .lg-alt.cur{color:var(--accent,#C40021);cursor:default;background:var(--panel,#FBFBF9);border-color:var(--hair,rgba(18,16,12,.17));}'
    +'#mm-legend .lg-alt .ar{color:var(--accent,#C40021);transition:transform .2s;}'
    +'#mm-legend .lg-alt:hover .ar{transform:translateX(3px);}'
    +'#mm-legend .lg-alt.back:hover .ar{transform:translateX(-3px);}';
    document.head.appendChild(st); }

  function renderList(){ if(!root)return;
    const rows=list.map(p=>{ const cur=current&&current===p.slug;
      const tag=cur?'div':'a';
      const attrs=cur?'class="lg-row cur"':'class="lg-row" href="'+esc(MMRoutes.href(p.slug))+'"';
      return '<'+tag+' '+attrs+'>'
        +'<span class="lg-dot" style="background:'+rgb(p.core)+'"></span>'
        +'<span class="lg-code">'+esc(p.code||'')+'</span>'
        +'<span class="lg-name">'+esc(p.name||'')+'</span></'+tag+'>'; }).join('');
    // Field map link removed — the MODE MODE wordmark at the top of the rail
    // already goes home (Julia, 2026-09-07). About arrow dropped too, to
    // consolidate vertical space so long classification lists fit.
    const about = current==='about'
      ? '<div class="lg-alt cur"><span>About the studio</span></div>'
      : '<a class="lg-alt" href="'+MMRoutes.href('about')+'"><span>About the studio</span></a>';
    root.innerHTML='<div class="lg-h">Index / '+String(list.length).padStart(2,'0')+'</div>'+rows+about;
  }
  function build(container){ if(root)return; style();
    root=document.createElement('nav'); root.id='mm-legend';
    root.setAttribute('aria-label','Site index');
    root.setAttribute('contenteditable','false');
    let host=null;
    if(container){
      host = typeof container==='string' ? document.querySelector(container) : container;
    }
    if(host){ root.classList.add('inline'); host.appendChild(root); }
    else{ root.classList.add('floating'); document.body.appendChild(root); }
  }
  async function refresh(){
    try{ const r=await fetch(SB.url+'/rest/v1/projects?select=slug,data',
        { headers:{apikey:SB.anon,Authorization:'Bearer '+SB.anon}, cache:'no-cache' });
      if(!r.ok)return; const rows=await r.json();
      const by={}; rows.forEach(row=>{ const d=row&&row.data; if(!d||!d.code)return;
        if(String(d.code).toUpperCase()==='ABOUT'||d.code==='P-07')return;
        by[d.code]={ code:d.code, slug:row.slug||d.slug, name:d.name||d.code,
          core:(d.colors&&d.colors.core)||[150,150,150] }; });
      if(!Object.keys(by).length)return;
      const seen={}, merged=[];
      ROSTER.forEach(p=>{ if(by[p.code]){ merged.push(by[p.code]); seen[p.code]=1; } else { merged.push(p); seen[p.code]=1; } });
      Object.keys(by).forEach(code=>{ if(!seen[code]) merged.push(by[code]); });
      list=merged; renderList();
    }catch(e){ /* offline → built-in roster stands */ }
  }
  // Backwards-compatible API — open()/close() are no-ops since the panel is
  // always visible now (matches the homepage).
  window.MMMenu={ mount(opts){ opts=opts||{}; current=opts.current||null; build(opts.container); renderList(); refresh(); },
                  open(){}, close(){} };
})();
