import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {validateRack,parseRack,evaluateMacro,performanceFiles,targetFromProject} from '../packages/performance/index.ts';
import {parseProject} from '../packages/schema/index.ts';
import {runtimePatch} from '../packages/export/index.ts';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const fixture=()=>parseRack(read('fixtures/performance.rack.json'));
const plain=x=>JSON.parse(JSON.stringify(x));
test('macro fans out across targets with staged intervals, curves and reversed ranges',()=>{
 const rack=fixture();assert.equal(evaluateMacro(rack,'energy',.2)[1].value,0);assert.ok(Math.abs(evaluateMacro(rack,'energy',.7)[1].value-.25)<1e-12);
 rack.routes[1].outputMin=1;rack.routes[1].outputMax=0;
 assert.equal(evaluateMacro(rack,'energy',0)[1].value,1);assert.equal(evaluateMacro(rack,'energy',1)[1].value,0);
 assert.equal(evaluateMacro(rack,'energy',.7)[0].value,.7);
});
test('route contract rejects collisions, missing references, invalid curves and executable fields',()=>{
 for(const mutate of [r=>r.routes.push({...r.routes[0],id:'another'}),r=>r.routes[0].targetId='gone',r=>r.routes[0].curve=0,r=>r.routes[0].inputMax=0,r=>r.routes[0].outputMax=2,r=>r.routes[0].script='x',r=>r.macros[0].value=NaN,r=>r.targets=[]]){const rack=fixture();mutate(rack);assert.throws(()=>validateRack(rack));}
 const r=fixture();r.routes.push({...r.routes[0],id:'disabled',enabled:false});assert.doesNotThrow(()=>validateRack(r));assert.throws(()=>evaluateMacro(r,'missing',.5));assert.throws(()=>evaluateMacro(r,'energy',Infinity));
});
test('discrete routes require explicit legal endpoints and never smooth intermediate stops',()=>{
 const r=fixture();r.targets[0].parameters[0].quantized=true;assert.throws(()=>validateRack(r),/stops/);
 r.routes[0].steps=[0,.25,1];validateRack(r);assert.equal(evaluateMacro(r,'energy',.6)[0].value,.25);assert.equal(evaluateMacro(r,'energy',.6)[0].smoothingMs,0);
 r.routes[0].steps=[0,.25,.25,1];assert.throws(()=>validateRack(r));
});
test('rack serialization bounds UTF-8 and target imports exclude unverified and unknown metadata',()=>{
 const r=fixture();assert.deepEqual(parseRack(JSON.stringify(r)),r);assert.throws(()=>parseRack(' '.repeat(1_000_001)));
 const p=parseProject(read('fixtures/morph-motion.project.json')),t=targetFromProject(p,'slot');assert.deepEqual(t.parameters.map(p=>p.name),['Motion']);
 assert.throws(()=>targetFromProject(parseProject(read('fixtures/compressor.project.json')),'slot'));
});
function controller(rack=fixture()){
 const events=[],writes=[],instances=[],tasks=[];let selected=1;
 const objects={1:{type:'PluginDevice',name:'Augmented Strings',parameters:['id',2]},2:{type:'DeviceParameter',name:'Morph',min:0,max:1,value:.3,is_enabled:1,is_quantized:0},3:{type:'PluginDevice',name:'Augmented Strings',parameters:['id',4]},4:{type:'DeviceParameter',name:'Motion',min:0,max:1,value:.2,is_enabled:1,is_quantized:0}};
 function LiveAPI(callback,path){this.id=path==='live_set view selected_track view selected_device'?selected:Number(path.split(' ')[1]);this.callback=callback;Object.defineProperty(this,'type',{get:()=>objects[this.id]?.type||''});this.get=key=>{if(!objects[this.id])throw new Error('Missing target');const value=objects[this.id][key];return Array.isArray(value)?value:[value];};this.set=(key,value)=>{writes.push([this.id,key,value]);objects[this.id][key]=value;for(const i of instances)if(i.id===this.id&&i.property===key)i.callback?.([key,value]);};instances.push(this);}
 function Task(fn){this.cancelled=false;this.schedule=ms=>{assert.equal(ms,33);tasks.push(this);};this.cancel=()=>{this.cancelled=true;};this.run=()=>{if(!this.cancelled)fn();};}
 const c=vm.createContext({LiveAPI,Task,outlet:(...a)=>events.push(a)});c.include=name=>vm.runInContext(read('max/runtime/'+name),c);vm.runInContext(read('max/runtime/performance-controller.js'),c);c.loadmanifest(JSON.stringify(rack));
 return {c,rack,events,writes,instances,tasks,objects,select:id=>{selected=id;},bind(){c.bindselected();selected=3;c.bindselected();},drain(){for(let i=0;i<tasks.length;i++){assert.ok(i<200);tasks[i].run();}}};
}
test('explicit target binding distinguishes identical plugin instances and never writes on load or bind',()=>{
 const s=controller();s.c.bindselected();assert.equal(s.writes.length,0);s.c.bindselected();assert.match(s.events.at(-1)[1],/already bound/);s.select(3);s.c.bindselected();assert.match(s.events.at(-1)[1],/All targets ready/);assert.equal(s.writes.length,0);
});

test('performance binding accepts host capitalization and surrounding whitespace while preserving exact instance assignment',()=>{
 const s=controller();s.objects[1].name=' Augmented STRINGS ';s.objects[2].name=' morph ';s.objects[3].name='AUGMENTED STRINGS';s.bind();assert.match(s.events.at(-1)[1],/All targets ready/);assert.equal(s.writes.length,0);
});

test('wrong device errors identify the actual Live selection instead of only repeating the expected name',()=>{
 const s=controller();s.objects[1].name='Other synth';s.c.bindselected();assert.match(s.events.at(-1)[1],/Live selected PluginDevice "Other synth"/);assert.equal(s.writes.length,0);
 s.objects[1].type='MaxDevice';s.objects[1].name='Performance rack';s.c.bindselected();assert.match(s.events.at(-1)[1],/Live selected MaxDevice "Performance rack"/);assert.match(s.events.at(-1)[1],/Keep the Max editor open/);
});
test('one macro coalesces gestures and reaches distinct destination values through smoothing',()=>{
 const s=controller();s.bind();s.c.queuewrite('energy',.4);s.c.queuewrite('energy',1);assert.equal(s.tasks.length,1);assert.equal(s.writes.length,0);s.drain();assert.equal(s.objects[2].value,1);assert.equal(s.objects[4].value,1);assert.equal(s.tasks.length,3);assert.equal(s.writes.filter(w=>w[0]===2).length,2);assert.equal(s.writes.filter(w=>w[0]===4).length,3);
});

test('cross-plugin routing uses each destination range rather than a shared normalized host value',()=>{
 const r=fixture();r.targets[1].pluginName='Mock effect';r.targets[1].parameters[0].max=100;r.routes[1].outputMax=100;
 const s=controller(r);s.objects[3].name='Mock effect';s.objects[4].max=100;s.bind();s.c.queuewrite('energy',1);s.drain();assert.equal(s.objects[2].value,1);assert.equal(s.objects[4].value,100);
});

test('parameter aliases and non-finite host values cannot become competing or invalid writes',()=>{
 const r=fixture();r.targets[0].parameters.push({...r.targets[0].parameters[0],id:'alias'});assert.throws(()=>validateRack(r),/alias/);
 const s=controller();s.objects[2].value=NaN;s.c.bindselected();assert.match(s.events.at(-1)[1],/Invalid current/);assert.equal(s.writes.length,0);
 const t=controller();t.bind();t.objects[4].value=Infinity;t.c.queuewrite('energy',1);assert.equal(t.tasks.length,0);assert.equal(t.writes.length,0);
});
test('unbound or missing target refuses the whole gesture and deletion cancels queued writes',()=>{
 const s=controller();s.c.bindselected();s.c.queuewrite('energy',1);assert.equal(s.tasks.length,0);assert.equal(s.writes.length,0);
 s.select(3);s.c.bindselected();s.c.queuewrite('energy',1);delete s.objects[3];s.drain();assert.equal(s.writes.length,0);assert.match(s.events.at(-1)[1],/Target unavailable/);
});
test('disconnect and reload cancel writes and obsolete observers cannot affect a new binding',()=>{
 const s=controller();s.bind();const observer=s.instances.find(i=>i.id===2&&i.property==='value');s.c.queuewrite('energy',1);s.c.disconnect();s.drain();assert.equal(s.writes.length,0);const count=s.events.length;observer.callback(['value',.9]);assert.equal(s.events.length,count);
 s.select(1);s.bind();s.c.queuewrite('energy',1);s.c.loadmanifest(JSON.stringify(s.rack));s.drain();assert.equal(s.writes.length,0);
});
test('direct destination edits mark mixed once, cancel macro ramps and never move other destinations',()=>{
 const s=controller();s.bind();s.c.queuewrite('energy',1);s.tasks[0].run();const observer=s.instances.find(i=>i.id===2&&i.property==='value'),before=s.writes.length;
 observer.callback(['value',.1]);observer.callback(['value',.2]);s.drain();assert.equal(s.writes.length,before);assert.equal(s.events.filter(e=>e[0]===1&&/^Mixed:/.test(e[1])).length,2); // one on initial bind, one on takeover interruption
 s.c.queuewrite('energy',.5);s.drain();assert.equal(s.objects[2].value,.5);
});

test('automation observations before the first tick do not prevent deliberate macro takeover',()=>{
 const s=controller();s.bind();s.c.queuewrite('energy',1);s.objects[2].value=.4;s.instances.find(i=>i.id===2&&i.property==='value').callback(['value',.4]);s.drain();assert.equal(s.objects[2].value,1);assert.equal(s.objects[4].value,1);
});
test('binding rejects ambiguous parameters, range/quantization mismatch and disabled writes',()=>{
 for(const mutation of [s=>{s.objects[2].max=100;},s=>{s.objects[2].is_quantized=1;},s=>{s.objects[5]={...s.objects[2]};s.objects[1].parameters.push('id',5);}]){const s=controller();mutation(s);s.c.bindselected();assert.match(s.events.at(-1)[1],/Binding error/);assert.equal(s.writes.length,0);}
 const s=controller();s.bind();s.objects[4].is_enabled=0;s.c.queuewrite('energy',1);assert.equal(s.tasks.length,0);assert.equal(s.writes.length,0);
});
test('parameter removal within a surviving plugin invalidates the binding before any write',()=>{
 const s=controller();s.bind();s.c.queuewrite('energy',1);s.objects[3].parameters=[];s.drain();assert.equal(s.writes.length,0);
});
test('display manifest supports maximum macros and validates in the existing native renderer core',()=>{
 const r=fixture();r.macros=Array.from({length:16},(_,i)=>({id:'x'.repeat(150)+i,label:'Macro '+i,value:0}));r.routes=[];
 const c=vm.createContext({});vm.runInContext(read('max/runtime/performance-core.js'),c);vm.runInContext(read('max/runtime/runtime-core.js'),c);assert.doesNotThrow(()=>c.RuntimeCore.validate(c.PerformanceRouting.display(validateRack(r))));
});
test('performance device export copies the local Max shell and includes every runtime dependency',()=>{
 const sources=Object.fromEntries(['performance-core.js','performance-controller.js','runtime-core.js','renderer.js'].map(n=>[n,read('max/runtime/'+n)]));
 // Synthetic envelope tests container parsing only, never a host-valid device claim.
 const payload=new TextEncoder().encode(JSON.stringify(runtimePatch(parseProject(read('fixtures/morph-motion.project.json'))))+'\0'),shell=new Uint8Array(32+payload.length),view=new DataView(shell.buffer);
 for(const [offset,tag]of [[0,'ampf'],[8,'aaaa'],[12,'meta'],[24,'ptch']])shell.set(new TextEncoder().encode(tag),offset);
 view.setUint32(4,4,true);view.setUint32(16,4,true);view.setUint32(20,1,true);view.setUint32(28,payload.length,true);shell.set(payload,32);
 const files=performanceFiles(fixture(),sources,shell);
 assert.deepEqual(files['Wrapper.amxd'],new Uint8Array(shell));assert.equal(files['controller.js'],sources['performance-controller.js']);assert.equal(Object.keys(files).length,8);assert.ok(!Object.keys(files).some(n=>/node|capture/.test(n)));assert.deepEqual(parseRack(files['project.runtime.json']),fixture());assert.throws(()=>performanceFiles(fixture(),{},shell));
});
