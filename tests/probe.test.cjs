const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(options={}) {
 const events=[],instances=[],writes=[];
 function LiveAPI(callback,path) {
  this.id=options.missing?0:42; this.type='DeviceParameter'; this.callback=callback; this.path=path;
  this.data={name:'Synthetic threshold',min:-60,max:0,value:-12,is_enabled:1,is_quantized:0,...options};
  this.get=k=>[this.data[k]];
  this.set=(k,v)=>{writes.push(v);this.data[k]=v;callback(['value',v]);};
  instances.push(this);
 }
 const context=vm.createContext({LiveAPI,outlet:(...args)=>events.push(args)});
 vm.runInContext(fs.readFileSync('max/renderer/parameter-probe.js','utf8'),context);
 return {context,events,instances,writes};
}
test('explicit path, initial read, bounded write and observer update',()=>{
 const s=setup();s.context.bind(0,1,2);
 assert.equal(s.instances[0].path,'live_set tracks 0 devices 1 parameters 2');
 assert.deepEqual(s.events.at(-1),[0,'set',-12]);
 s.context.write(-99);assert.deepEqual(s.writes,[-60]);assert.deepEqual(s.events.at(-1),[0,'set',-60]);
 s.context.write(-60);assert.equal(s.writes.length,1);
});
test('invalid paths and nonfinite values cannot write',()=>{
 const s=setup();s.context.bind(-1,0,0);assert.equal(s.instances.length,0);
 s.context.bind(0,0,0);s.context.write(NaN);s.context.write(Infinity);s.context.write('0');assert.equal(s.writes.length,0);
});
test('missing and disabled targets fail visibly',()=>{
 for(const options of [{missing:true},{is_enabled:0}]) {const s=setup(options);s.context.bind(0,0,0);s.context.write(-20);assert.equal(s.writes.length,0);assert.match(s.events.at(-1)[1],/^error:/);}
});
test('rebind detaches observer and ignores late callbacks',()=>{
 const s=setup();s.context.bind(0,0,0);const old=s.instances[0];s.context.bind(1,0,0);
 assert.equal(old.property,'');const count=s.events.length;old.callback(['value',-5]);assert.equal(s.events.length,count);
 s.context.disconnect();s.context.write(-3);assert.equal(s.writes.length,0);
});
test('quantized values round and deleted targets reject writes',()=>{
 const s=setup({min:0,max:3,value:0,is_quantized:1});s.context.bind(0,0,0);s.context.write(1.7);assert.deepEqual(s.writes,[2]);
 s.instances[0].id=0;s.context.write(1);assert.equal(s.writes.length,1);
});
test('empty host response disconnects after one read and blocks further reads',()=>{
 const s=setup();s.context.bind(0,0,0);let reads=0;
 const old=s.instances[0];old.get=()=>{reads++;return [];};
 s.context.write(-20);
 assert.equal(reads,1);assert.equal(old.property,'');assert.equal(s.writes.length,0);
 assert.equal(s.events.at(-1)[1],'error: target unavailable; bind explicitly');
 s.context.write(-30);assert.equal(reads,1);
 const count=s.events.length;old.callback(['value',-5]);assert.equal(s.events.length,count);
});
test('invalid target type disconnects without reading properties',()=>{
 const s=setup();s.context.bind(0,0,0);s.instances[0].type='';
 s.instances[0].get=()=>{throw new Error('must not read missing object');};
 s.context.write(-20);assert.equal(s.writes.length,0);assert.equal(s.instances[0].property,'');
 assert.equal(s.events.at(-1)[1],'error: target unavailable; bind explicitly');
});
