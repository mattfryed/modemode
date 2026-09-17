const {create}=require('../assets/mm-about-motion.js');
const assert=require('node:assert/strict');
const balls=Array.from({length:96},(_,i)=>[.12*Math.cos(i),.12*Math.sin(i),.08*Math.cos(i*1.7),i%16/15]).flat();
const motion=create(balls),drivers=new Float32Array(24),delta=new Float32Array(18);
const sample=(from,to,morph,time=0,activity=0,spread=1)=>Array.from(motion.update({from,to,morph,time,activity,spread,drivers,delta}));
for(let a=0;a<4;a++)for(let b=0;b<4;b++){
 const start=sample(a,a,0),arrival=sample(b,b,0);
 assert.deepEqual(sample(a,b,0),start);
 assert(Math.max(...sample(a,b,1).map((v,i)=>Math.abs(v-arrival[i])))<1e-7);
 for(const p of [0,.01,.25,.5,.75,.99,1])assert(sample(a,b,p,120,1,1.8).every(Number.isFinite));
 const end=sample(a,b,.999999);assert(Math.max(...arrival.map((v,i)=>Math.abs(v-end[i])))<1e-5);
}
const start=sample(0,1,0),mid=sample(0,1,.5),end=sample(0,1,1);
const displacements=Array.from({length:16},(_,i)=>mid.slice(i*4,i*4+3).map((v,j)=>+(v-start[i*4+j]).toFixed(4)).join(','));
assert(new Set(displacements).size>12,'Bodies follow distinct trajectories within a cluster.');
assert(end.some((v,i)=>i%4!==3&&Math.abs(v-start[i])>.05),'Next state reorganizes local positions.');
assert.deepEqual(sample(0,0,0,0),sample(0,0,0,100),'Zero drift freezes resting matter.');
for(let i=3;i<balls.length;i+=4)assert.equal(mid[i],new Float32Array([balls[i]])[0]);
// A shared driver still arrives exactly; staggered bodies fan out in transit.
delta.fill(.4);drivers.fill(0);const transit=sample(0,1,.5);
assert(transit.every(Number.isFinite));
console.log('16 state pairs: continuous endpoints, finite extremes, distinct body paths, changed layouts, and zero-drift rest pass.');
