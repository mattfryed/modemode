/* Body motion is evaluated once per frame, not for every fragment in the volume.
   Shell drivers remain broad and smooth; individual bodies have their own paths. */
(function(root){
  const fract=x=>x-Math.floor(x);
  const smooth=(lo,hi,x)=>{const p=Math.max(0,Math.min(1,(x-lo)/(hi-lo)));return p*p*(3-2*p);};
  function rotate(p,i,j,angle){const c=Math.cos(angle),s=Math.sin(angle),x=p[i],y=p[j];p[i]=c*x+s*y;p[j]=-s*x+c*y;}
  function create(balls){
    const count=balls.length/4,output=new Float32Array(balls.length);
    const seeds=Array.from({length:count},(_,i)=>fract(Math.sin(i*91.713+Math.floor(i/16)*17.17)*43758.5453));
    const states=Array.from({length:4},(_,state)=>Array.from({length:count},(_,i)=>{
      const p=balls.slice(i*4,i*4+3),seed=seeds[i];
      rotate(p,0,2,state*(.73+seed*.91));rotate(p,0,1,state*(-.48+seed*.67));
      const scale=.88+.24*fract(Math.sin(seed*47.1+state*13.7)*43758.5453);
      return p.map(v=>v*scale);
    }));
    return {update({time:t,from:a,to:b,morph,activity:act,spread,drivers,delta}){
      for(let i=0;i<count;i++){
        const g=Math.floor(i/16),h=seeds[i],gp=g*1.713+.4;
        const progress=smooth(.18*h,.78+.22*fract(h*17.31),morph);
        const start=states[a][i],end=states[b][i],local=start.map((v,j)=>(v+(end[j]-v)*progress)*spread);
        const arc=Math.sin(Math.PI*progress)**2*.075*spread;
        local[0]+=arc*Math.sin(i*2.19);local[1]+=arc*Math.cos(i*1.73);local[2]+=arc*Math.sin(i*2.71);
        const orbit=t*(.105+.105*h)*1.45*act;
        rotate(local,0,2,orbit+gp+.22*act*Math.sin(t*.29+i*.83));
        rotate(local,0,1,-orbit*.57+.16*act*Math.sin(t*.23+gp*1.37));
        rotate(local,1,2,.10*act*Math.sin(t*.31+i*1.19));
        const breathing=1+act*(.045*Math.sin(t*.43+gp+i*.31)+.025*Math.sin(t*.77+i));
        const drift=act*(.009+.013*h);
        const jitter=[Math.sin(t*(.43+.15*h)+i*2.19),Math.cos(t*(.37+.12*h)+i*1.73),Math.sin(t*(.33+.17*h)+i*2.71)];
        for(let axis=0;axis<3;axis++)output[i*4+axis]=drivers[g*4+axis]+delta[g*3+axis]*(progress-morph)+local[axis]*breathing+drift*jitter[axis];
        output[i*4+3]=balls[i*4+3];
      }
      return output;
    }};
  }
  root.MMAboutMotion={create};
  if(typeof module!=='undefined')module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
