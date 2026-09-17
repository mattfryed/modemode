// Optional asset-authoring tool: requires sharp. Runtime/build uses the committed PNG.
// Zhang–Suen medial axis + exact Euclidean distance transforms, normalized by
// local stroke thickness. Thresholding grows every letter out from its centerline.
const sharp = require('sharp'), path = require('node:path');
function edt(mask, w, h, zero) {
  const data = Float64Array.from(mask, v => v === zero ? 0 : 1e10);
  const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  function line(length) {
    let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
    for (let q = 1; q < length; q++) {
      let s;
      do { const r = v[k]; s = ((f[q] + q*q) - (f[r] + r*r)) / (2*q - 2*r); if (s <= z[k]) k--; else break; } while (k >= 0);
      k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < length; q++) { while (z[k + 1] < q) k++; d[q] = (q-v[k])**2 + f[v[k]]; }
  }
  for (let y=0;y<h;y++) { for(let x=0;x<w;x++)f[x]=data[y*w+x];line(w);for(let x=0;x<w;x++)data[y*w+x]=d[x]; }
  for (let x=0;x<w;x++) { for(let y=0;y<h;y++)f[y]=data[y*w+x];line(h);for(let y=0;y<h;y++)data[y*w+x]=Math.sqrt(d[y]); }
  return data;
}
(async () => {
  const root = path.join(__dirname, '..');
  // Transparent padding keeps edge-touching glyphs from becoming false skeletons.
  const { data, info } = await sharp(path.join(root,'assets/mode-mode-logo.svg'), { density: 144 }).extend({top:2,bottom:2,left:2,right:2,background:{r:0,g:0,b:0,alpha:0}}).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width:w, height:h }=info, mask=Uint8Array.from({length:w*h},(_,i)=>data[i*4+3]>127?1:0), skeleton=mask.slice();
  let changed=true;
  while(changed) {
    changed=false;
    for(let pass=0;pass<2;pass++) {
      const remove=[];
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++) {
        const i=y*w+x;if(!skeleton[i])continue;
        const p=[skeleton[i-w],skeleton[i-w+1],skeleton[i+1],skeleton[i+w+1],skeleton[i+w],skeleton[i+w-1],skeleton[i-1],skeleton[i-w-1]];
        const count=p.reduce((a,b)=>a+b,0);if(count<2||count>6)continue;
        let transitions=0;for(let j=0;j<8;j++)if(!p[j]&&p[(j+1)%8])transitions++;
        if(transitions!==1)continue;
        if(pass===0 ? p[0]*p[2]*p[4] || p[2]*p[4]*p[6] : p[0]*p[2]*p[6] || p[0]*p[4]*p[6])continue;
        remove.push(i);
      }
      if(remove.length)changed=true;for(const i of remove)skeleton[i]=0;
    }
  }
  const center=edt(skeleton,w,h,1), edge=edt(mask,w,h,0);
  for(let i=0;i<mask.length;i++) {
    const threshold=Math.round(255*center[i]/Math.max(.001,center[i]+edge[i]));
    data[i*4]=data[i*4+1]=data[i*4+2]=threshold;
  }
  await sharp(data,{raw:info}).extract({left:2,top:2,width:w-4,height:h-4}).png().toFile(path.join(root,'assets/mode-mode-logo-growth.png'));
  console.log(`Generated ${w-4} × ${h-4} centerline distance field.`);
})();
