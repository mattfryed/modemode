// Optional asset regeneration; requires Sharp. Committed JPEGs need no build at deploy time.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),meta=require('../data/site-meta.json');
async function download(src){const r=await fetch(src,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error('HTTP '+r.status+': '+src);return Buffer.from(await r.arrayBuffer());}
(async()=>{
 const logo=fs.readFileSync(path.join(root,'assets/mode-mode-logo.svg'),'utf8').replace(/<\?xml[^>]+>/,'').replace('<svg ','<svg x="230" y="158" width="740" height="292" ');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1" fill="#16160f" opacity=".16"/></pattern></defs><rect width="1200" height="630" fill="#f3f3f0"/><rect width="1200" height="630" fill="url(#dots)"/>${logo}</svg>`;
 fs.mkdirSync(path.join(root,'assets/share'),{recursive:true});
 await sharp(Buffer.from(svg)).jpeg({quality:90}).toFile(path.join(root,meta.home.image));
 for(const m of Object.values(meta))if(m.sourceImage){
  await sharp(await download(m.sourceImage)).rotate().resize(1200,630,{fit:'contain',background:'#f3f3f0'}).flatten({background:'#f3f3f0'}).jpeg({quality:85,mozjpeg:true}).toFile(path.join(root,m.image));
 }
 if(process.argv.includes('--stills')){
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/mm-stills.js'),'utf8'),context);
  fs.mkdirSync(path.join(root,'assets/stills'),{recursive:true});
  for(const [src,dest]of Object.entries(context.window.MMStills)){
   await sharp(await download(src),{pages:1}).flatten({background:'#f3f3f0'}).jpeg({quality:85,mozjpeg:true}).toFile(path.join(root,dest));
  }
 }
 console.log('Sharing images regenerated'+(process.argv.includes('--stills')?' with GIF stills.':'.'));
})().catch(e=>{console.error(e);process.exitCode=1;});
