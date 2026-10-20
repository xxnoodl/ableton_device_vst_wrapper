import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseProject} from '../packages/schema/index.ts';
import {runtimeManifest,runtimePatch,exportFiles,zipFiles,runtimeFiles} from '../packages/export/index.ts';
const source=name=>readFileSync(new URL('../max/runtime/'+name,import.meta.url),'utf8');
const project=()=>parseProject(readFileSync(new URL('../fixtures/morph.project.json',import.meta.url),'utf8'));
const plain=x=>JSON.parse(JSON.stringify(x));
test('default patch omits suspended Node writer and capture save controls after host crashes',()=>{
 const patch=runtimePatch(project()).patcher;
 assert.equal(patch.boxes.some(({box})=>/node\.script|savedialog|prepend exportcapture/.test(box.text||'')),false);
 assert.ok(patch.boxes.some(({box})=>box.text==='captureselected'));
 assert.ok(patch.boxes.some(({box})=>box.text==='bindselected'));
 const ids=new Set(patch.boxes.map(({box})=>box.id));
 for(const {patchline} of patch.lines){assert.ok(ids.has(patchline.source[0]));assert.ok(ids.has(patchline.destination[0]));}
});
function core(){const c=vm.createContext({});vm.runInContext(source('runtime-core.js'),c);return c.RuntimeCore;}
function controller({duplicates=false,wrongRange=false,wrongDevice=false}={}){
 const events=[],writes=[],instances=[],tasks=[],saved=new Map();
 const objects={1:{type:'PluginDevice',name:wrongDevice?'Other synth':'Augmented Strings',parameters:duplicates?['id',2,'id',3]:['id',2]},2:{type:'DeviceParameter',name:'Morph',min:0,max:wrongRange?100:1,value:.3,is_enabled:1,is_quantized:0},3:{type:'DeviceParameter',name:'Morph',min:0,max:1,value:.4,is_enabled:1,is_quantized:0}};
 function LiveAPI(callback,path){
  this.id=path==='live_set view selected_track view selected_device'?1:Number(path.split(' ')[1]);this.callback=callback;
  Object.defineProperty(this,'type',{get:()=>objects[this.id]?.type||''});
  this.get=key=>{const object=objects[this.id];if(!object)throw new Error('Native invalid target');const value=object[key];return Array.isArray(value)?value:[value];};
  this.set=(key,value)=>{writes.push([this.id,key,value]);objects[this.id][key]=value;for(const instance of instances)if(instance.id===this.id&&instance.property===key)instance.callback?.([key,value]);};
  instances.push(this);
 }
 function File(path,mode){this.isopen=mode==='write'||saved.has(path);this.close=()=>{};this.writestring=text=>saved.set(path,text);}
 function Task(fn){this.cancelled=false;this.schedule=()=>tasks.push(this);this.cancel=()=>{this.cancelled=true;};this.run=()=>{if(!this.cancelled)fn();};}
 const c=vm.createContext({LiveAPI,Task,File,outlet:(...args)=>events.push(args)});c.include=name=>vm.runInContext(source(name),c);vm.runInContext(source('controller.js'),c);
 c.loadmanifest(JSON.stringify(runtimeManifest(project())));
 return {c,events,writes,instances,objects,tasks,saved};
}
test('runtime validates exported schema, blocks synthetic binding and unknown code fields',()=>{
 const c=core(),m=runtimeManifest(project());assert.equal(c.validate(m).pluginName,'Augmented Strings');
 assert.throws(()=>c.parse(JSON.stringify({...m,script:'evil'})));assert.throws(()=>c.parse(' '.repeat(1_000_001)));
 const demo=parseProject(readFileSync(new URL('../fixtures/compressor.project.json',import.meta.url),'utf8'));
 const manifest=runtimeManifest(demo);assert.equal(manifest.demoOnly,true);assert.throws(()=>c.validate({...manifest,demoOnly:false}));
});
test('controller binds by selected device/name/range; observations never write back',()=>{
 const s=controller();s.c.bindselected();assert.match(s.events.at(-1)[1],/^Bound 1/);
 assert.ok(s.events.some(e=>e[0]===0&&e[1]==='value'&&e[2]==='morph'&&e[3]===.3));assert.equal(s.writes.length,0);
 s.c.write('morph',.5);assert.deepEqual(s.writes,[[2,'value',.5]]);
 s.c.write('morph',.5);assert.equal(s.writes.length,1);
 s.c.disconnect();s.c.write('morph',.8);assert.equal(s.writes.length,1);
});
test('ambiguous names, wrong ranges and wrong selected device cannot bind',()=>{
 for(const options of [{duplicates:true},{wrongRange:true},{wrongDevice:true}]){const s=controller(options);s.c.bindselected();assert.match(s.events.at(-1)[1],/^Binding error:/);s.c.write('morph',.5);assert.equal(s.writes.length,0);}
});
test('target deletion and late callbacks cannot control a replacement target',()=>{
 const s=controller();s.c.bindselected();const observer=s.instances.find(i=>i.property==='value');delete s.objects[2];s.c.write('morph',.8);assert.equal(s.writes.length,0);assert.match(s.events.at(-1)[1],/^Write error:/);
 const length=s.events.length;observer.callback(['value',.9]);assert.equal(s.events.length,length);
 s.c.bindselected();assert.match(s.events.at(-1)[1],/^Binding error:/);
});
test('synthetic manifest refuses real binding and missing mapping leaves no subscriptions',()=>{
 const s=controller();const demo=parseProject(readFileSync(new URL('../fixtures/compressor.project.json',import.meta.url),'utf8'));s.c.loadmanifest(JSON.stringify(runtimeManifest(demo)));s.c.bindselected();assert.match(s.events.at(-1)[1],/Demo-only/);assert.equal(s.instances.length,0);
 const p=project();p.parameters.push({...p.parameters[0],id:'missing',name:'Missing'});p.widgets.push({...p.widgets[0],id:'second',parameterId:'missing'});s.c.loadmanifest(JSON.stringify(runtimeManifest(p)));s.c.bindselected();assert.ok(s.instances.every(i=>i.property!=='value'));
});
test('runtime and browser detents agree, preserving actual incoming host values',()=>{
 const c=core(),p={min:1,max:20},w={stepCount:0,stepValues:[4,8,10]};
 assert.equal(c.at(.5,p,w),8);assert.equal(c.position(10,p,w),1);assert.equal(c.snap(7,p,w),8);
});
test('native renderer paints and emits edits; incoming values do not emit writes',()=>{
 const events=[],draws=[];
 const graphics=new Proxy({size:[640,336],text_measure:t=>[t.length*6,12]},{get:(o,k)=>k in o?o[k]:(...args)=>{assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)));draws.push([k,...args]);}});
 const c=vm.createContext({mgraphics:graphics,outlet:(...a)=>events.push(a)});c.include=name=>vm.runInContext(source(name),c);vm.runInContext(source('renderer.js'),c);
 c.manifest(JSON.stringify(runtimeManifest(project())));c.paint();assert.ok(draws.some(d=>d[0]==='ellipse'));assert.equal(events.length,0);
 c.value('morph',.25);assert.equal(events.length,0);c.setvalue('morph-control',.7);assert.deepEqual(events.at(-1),[0,'queuewrite','morph',.7]);
 c.status('Disconnected');c.paint();
});
test('deterministic export contains source and references with no fabricated device or personal paths',()=>{
 const sources=Object.fromEntries(runtimeFiles.map(n=>[n,source(n)]));const files=exportFiles(project(),sources);
 assert.equal(Object.keys(files).length,9);assert.ok(!Object.keys(files).some(n=>n.endsWith('.amxd')));
 const patch=JSON.parse(files['controller.maxpat']).patcher;assert.ok(patch.lines.some(l=>l.patchline.source[0]==='controller'&&l.patchline.destination[0]==='ui'));
 assert.ok(!JSON.stringify(files).includes('C:/Users/'));assert.deepEqual(zipFiles(files),zipFiles(files));
 const archive=zipFiles({'hello.txt':'Knobs and UTF-8: \u2713'});const view=new DataView(archive.buffer);assert.equal(view.getUint32(0,true),0x04034b50);assert.equal(view.getUint32(archive.length-22,true),0x06054b50);
 assert.throws(()=>zipFiles({'../escape':'no'}));assert.throws(()=>exportFiles({...project(),widgets:[]},sources));
});

test('queued control writes coalesce and disconnect cancels stale scheduled work',()=>{
 const s=controller();s.c.bindselected();s.c.queuewrite('morph',.4);s.c.queuewrite('morph',.6);
 assert.equal(s.tasks.length,1);assert.equal(s.writes.length,0);s.tasks[0].run();assert.deepEqual(s.writes,[[2,'value',.6]]);
 s.c.queuewrite('morph',.8);s.c.disconnect();s.tasks[1].run();assert.equal(s.writes.length,1);
});

test('host capture records exposed values and delegates saving without writing from the controller',()=>{
 const s=controller();s.c.captureselected();assert.match(s.events.at(-1)[1],/^Captured 1/);s.c.exportcapture('new-capture.json');
 const event=s.events.find(e=>e[0]===2&&e[1]==='savecapture');assert.equal(event[2],'new-capture.json');const capture=JSON.parse(event[3]);
 assert.equal(capture.source,'live-exposed-parameters');assert.equal(capture.parameters[0].currentValue,.3);assert.equal('defaultValue' in capture.parameters[0],false);assert.equal('sdkId' in capture.parameters[0],false);assert.equal(s.saved.size,0);
});
