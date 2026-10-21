import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import http from 'node:http';
import {once} from 'node:events';
import {validateLiveCatalog,projectFromLiveDevice,liveBridgeFiles} from '../packages/live-session/index.ts';
import {runtimeManifest,runtimePatch,deviceFiles,runtimeFiles} from '../packages/export/index.ts';
import {parseProject,serializeProject} from '../packages/schema/index.ts';
import {createLiveBridgeState} from '../scripts/live-bridge-state.mjs';
import {handleLiveBridge} from '../scripts/live-bridge-http.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
const catalog=()=>({catalogVersion:1,source:'live-session-exposed',diagnostics:[],devices:[{id:'device-20',label:'Lead / Example instrument',pluginName:'Example instrument',diagnostic:null,capture:{captureVersion:1,source:'live-exposed-parameters',pluginName:'Example instrument',parameters:[{index:0,name:'Cutoff',min:20,max:20000,currentValue:800,quantized:false,enumLabels:[]},{index:1,name:'Mode',min:0,max:2,currentValue:1,quantized:true,enumLabels:['Low','Mid','High']}]}}]});
function shell(){const payload=new TextEncoder().encode(JSON.stringify(runtimePatch(parseProject(read('fixtures/morph.project.json'))))+'\0'),bytes=new Uint8Array(32+payload.length),v=new DataView(bytes.buffer);for(const [offset,tag]of [[0,'ampf'],[8,'aaaa'],[12,'meta'],[24,'ptch']])bytes.set(new TextEncoder().encode(tag),offset);for(const [offset,n]of [[4,4],[16,4],[20,1],[28,payload.length]])v.setUint32(offset,n,true);bytes.set(payload,32);return bytes;}
test('Live session creates a generic captured registry and automatic checked-only layout without native ID guesses',()=>{
 const d=validateLiveCatalog(catalog()).devices[0],p=projectFromLiveDevice(d,['exposed-0','exposed-1']);assert.equal(p.widgets.length,2);assert.equal(p.widgets[1].stepCount,3);assert.equal(p.parameters[0].min,20);assert.equal(p.parameters[0].defaultValue,800);assert.equal(p.parameters[0].resetSource,'captured-current');assert.equal(p.parameters[0].evidence,'host-captured');assert.equal(p.plugin.classId,null);assert.equal(p.target.reconnect,'previous-on-load');assert.equal(runtimeManifest(p).demoOnly,false);assert.ok(!serializeProject(p).includes('device-20'));assert.ok(!serializeProject(p).includes('Lead /'));
 assert.throws(()=>projectFromLiveDevice(d,['unknown']));assert.throws(()=>projectFromLiveDevice(d,['exposed-0','exposed-0']));
});
test('catalog validation rejects identity aliases, mismatched captures, unknown fields and forged SDK IDs',()=>{
 for(const mutate of [c=>c.devices.push(c.devices[0]),c=>c.devices[0].id='../path',c=>c.devices[0].capture.pluginName='Another',c=>c.devices[0].capture.parameters[0].sdkId=10,c=>c.devices[0].script='x',c=>c.devices[0].capture.parameters[0].currentValue=Infinity,c=>c.devices[0].label='bad\nname']){const c=catalog();mutate(c);assert.throws(()=>validateLiveCatalog(c));}
 const c=catalog();c.devices[0].capture=null;c.devices[0].diagnostic='No exposed controls';validateLiveCatalog(c);assert.throws(()=>projectFromLiveDevice(c.devices[0]),/Configure/);
});
test('automatic layout supports sixty captured controls and refuses more without mutating the catalog',()=>{
 const c=catalog(),d=c.devices[0];d.capture.parameters=Array.from({length:61},(_,i)=>({...d.capture.parameters[0],index:i,name:'Control '+i}));const ids=d.capture.parameters.map(p=>'exposed-'+p.index),p=projectFromLiveDevice(d,ids.slice(0,60));assert.equal(p.widgets.length,60);assert.equal(p.panel.height,896);assert.throws(()=>projectFromLiveDevice(d,ids),/60/);assert.equal(d.capture.parameters.length,61);
});
test('session bridge packaging preserves shell bytes and introduces no Node or parameter-writing runtime',()=>{
 const sources=Object.fromEntries(['session-bridge.js','session-bridge-renderer.js'].map(n=>[n,read('max/runtime/'+n)])),bytes=shell(),files=liveBridgeFiles(sources,bytes);assert.equal(Object.keys(files).length,5);assert.deepEqual(files['Live-Session-Bridge.amxd'],bytes);assert.notEqual(files['Live-Session-Bridge.amxd'],bytes);assert.ok(!files['controller.js'].includes('.set('));assert.ok(!files['controller.js'].includes('node.script'));assert.throws(()=>liveBridgeFiles({},bytes));
});
test('bridge state expires heartbeats, rejects stale scans and never preserves catalog IDs across a new server',()=>{
 let now=100;const state=createLiveBridgeState({now:()=>now,token:'a'.repeat(64)});assert.equal(state.session().connected,false);assert.equal(state.authorized('é'.repeat(64)),false);assert.equal(state.authorized('a'.repeat(64)),true);state.poll();assert.equal(state.session().connected,true);state.accept({requestId:0,catalog:catalog()});assert.equal(state.session().pending,false);state.refresh();assert.equal(state.session().pending,true);assert.throws(()=>state.accept({requestId:0,catalog:catalog()}),/Stale/);now+=45001;assert.equal(state.session().connected,false);assert.equal(createLiveBridgeState().session().catalog,null);
});
test('Live HTTP endpoints require capabilities, valid JSON and bounded bodies; arbitrary commands are refused',async t=>{
 const state=createLiveBridgeState(),server=http.createServer(async(req,res)=>{if(!await handleLiveBridge(req,res,state)){res.writeHead(404);res.end();}});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());const base='http://127.0.0.1:'+server.address().port,config=await (await fetch(base+'/api/live/config')).json(),headers={'X-Studio-Bridge':config.token,'Content-Type':'application/json'};
 assert.equal((await fetch(base+'/api/live/catalog',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
 assert.equal((await fetch(base+'/api/live/catalog',{method:'POST',headers:{'X-Studio-Bridge':config.token},body:'{}'})).status,415);
 assert.equal((await fetch(base+'/api/live/catalog',{method:'POST',headers,body:'bad'})).status,400);
 assert.equal((await fetch(base+'/api/live/catalog',{method:'POST',headers,body:JSON.stringify({requestId:0,catalog:catalog()})})).status,200);
 assert.equal((await (await fetch(base+'/api/live/session')).json()).catalog.devices.length,1);
 assert.equal((await fetch(base+'/api/live/refresh',{method:'POST',headers,body:'{"command":"write"}'})).status,400);
 assert.equal((await fetch(base+'/api/live/refresh',{method:'POST',headers,body:'{}'})).status,200);
 assert.equal((await fetch(base+'/api/live/catalog',{method:'POST',headers,body:JSON.stringify({requestId:0,catalog:catalog()})})).status,409);
 assert.equal((await fetch(base+'/api/live/catalog',{method:'POST',headers,body:' '.repeat(1_000_001)})).status,413);
 assert.equal((await fetch(base+'/api/live/write',{method:'POST',headers,body:'{}'})).status,404);
 assert.equal((await fetch(base+'/api/live/refresh')).status,405);
});
function bridge(){
 let state=createLiveBridgeState({token:'a'.repeat(64)}),respond=true,inTask=false;const requests=[],events=[],writes=[],tasks=[],objects={
  1:{type:'Song',tracks:['id',10],return_tracks:['id',11]},10:{type:'Track',name:'Lead',devices:['id',20,'id',30,'id',50]},11:{type:'Track',name:'Return',devices:[]},12:{type:'Track',name:'Main',devices:[]},
  20:{type:'PluginDevice',name:'Example instrument',parameters:['id',21,'id',22]},21:{type:'DeviceParameter',name:'Cutoff',min:20,max:20000,value:800,is_quantized:0},22:{type:'DeviceParameter',name:'Mode',min:0,max:2,value:1,is_quantized:1,value_items:['Low','Mid','High']},
  30:{type:'RackDevice',name:'FX rack',can_have_chains:1,chains:['id',31]},31:{type:'Chain',name:'Wet',devices:['id',40]},40:{type:'PluginDevice',name:'Example effect',parameters:['id',41]},41:{type:'DeviceParameter',name:'Mix',min:0,max:100,value:25,is_quantized:0},50:{type:'MaxDevice',name:'Bridge',can_have_chains:0}};
 function LiveAPI(callback,path){assert.ok(inTask,'LiveAPI reads belong in scheduled scan tasks, not HTTP callbacks');assert.ok(!path.includes('selected_device'));this.id=path==='live_set'?1:path==='live_set master_track'?12:Number(path.split(' ')[1]);Object.defineProperty(this,'type',{get:()=>objects[this.id]?.type||''});this.get=key=>{if(!objects[this.id])throw new Error('Missing object');const value=objects[this.id][key];return Array.isArray(value)?value:[value];};this.set=(...args)=>{writes.push(args);throw new Error('Bridge must never write');};}
 function Task(fn){this.cancelled=false;this.ran=false;this.fn=fn;this.schedule=ms=>{this.delay=ms;tasks.push(this);};this.cancel=()=>{this.cancelled=true;};this.run=()=>{this.ran=true;if(!this.cancelled){inTask=true;try{fn();}finally{inTask=false;}}};}
 function XHR(){this.readyState=0;this.headers={};this.open=(method,url)=>{this.method=method;this.url=url;};this.setRequestHeader=(k,v)=>this.headers[k.toLowerCase()]=v;this.abort=()=>{this.aborted=true;};this.reply=(status,body)=>{this.status=status;this.responseText=JSON.stringify(body);this.readyState=4;this.onreadystatechange?.();};this.send=raw=>{requests.push(this);if(!respond)return;const path=this.url.replace('http://127.0.0.1:5173','');try{if(path==='/api/live/config')return this.reply(200,state.config());if(!state.authorized(this.headers['x-studio-bridge']))return this.reply(401,{});if(path==='/api/live/poll')return this.reply(200,state.poll());if(path==='/api/live/refresh')return this.reply(200,state.refresh());if(path==='/api/live/catalog')return this.reply(200,state.accept(JSON.parse(raw)));throw new Error('Unexpected URL');}catch(e){this.reply(e.status||400,{error:e.message});}};}
 const c=vm.createContext({LiveAPI,Task,XMLHttpRequest:XHR,outlet:(...args)=>events.push(args)});vm.runInContext(read('max/runtime/session-bridge.js'),c);
 return {c,objects,requests,events,writes,tasks,get state(){return state;},set state(value){state=value;},respond:value=>{respond=value;},drain(){let count=0;for(;;){const task=tasks.find(t=>!t.cancelled&&!t.ran&&t.delay===10);if(!task)break;assert.ok(count++<2000);task.run();}},poll(){const task=tasks.find(t=>!t.cancelled&&!t.ran&&t.delay===2000);assert.ok(task);task.run();}};
}
test('Max bridge discovers tracks, returns, main and nested rack plugins without touching selection or values',()=>{
 const s=bridge();s.c.read('project.runtime.json');s.drain();const session=s.state.session();assert.equal(session.catalog.devices.length,2);assert.equal(session.catalog.devices[0].capture.parameters[0].currentValue,800);assert.equal(session.catalog.devices[0].capture.parameters[1].enumLabels.length,3);assert.match(session.catalog.devices[1].label,/Lead \/ FX rack \/ Wet/);assert.equal(s.writes.length,0);assert.ok(s.requests.every(r=>r.url.startsWith('http://127.0.0.1:5173/api/live/')));
 const p=projectFromLiveDevice(session.catalog.devices[1],['exposed-0']),sources=Object.fromEntries(runtimeFiles.map(n=>[n,read('max/runtime/'+n)])),files=deviceFiles(p,sources,shell());assert.equal(JSON.parse(files['project.runtime.json']).parameters[0].name,'Mix');assert.equal(JSON.parse(files['project.runtime.json']).parameters[0].max,100);
});

test('generic discovered controls bind and write their actual host range through the generated regular runtime',()=>{
 const s=bridge();s.c.read();s.drain();const effect=s.state.session().catalog.devices.find(d=>d.pluginName==='Example effect'),p=projectFromLiveDevice(effect,['exposed-0']),sources=Object.fromEntries(runtimeFiles.map(n=>[n,read('max/runtime/'+n)])),files=deviceFiles(p,sources,shell()),writes=[];
 const objects={10:{type:'MaxDevice'},11:{type:'Track',devices:['id',40,'id',10]},40:{type:'PluginDevice',name:'Example effect',parameters:['id',41]},41:{type:'DeviceParameter',name:'Mix',min:0,max:100,value:25,is_enabled:1,is_quantized:0}};
 function LiveAPI(callback,path){this.id=path==='this_device'?10:path==='this_device canonical_parent'?11:Number(path.split(' ')[1]);Object.defineProperty(this,'type',{get:()=>objects[this.id]?.type||''});this.get=key=>{const v=objects[this.id][key];return Array.isArray(v)?v:[v];};this.set=(key,value)=>{writes.push([this.id,key,value]);objects[this.id][key]=value;};}
 const c=vm.createContext({LiveAPI,outlet(){},Task:function(){this.schedule=()=>{};this.cancel=()=>{};}});c.include=name=>vm.runInContext(files[name],c);vm.runInContext(files['controller.js'],c);c.loadmanifest(files['project.runtime.json']);assert.equal(writes.length,0);c.write('exposed-0',75);assert.deepEqual(writes,[[41,'value',75]]);
});

test('refresh requested during a scan rejects the obsolete upload and publishes only the next snapshot',()=>{
 const s=bridge();s.c.read();s.state.refresh();s.drain();assert.equal(s.state.session().catalog,null);s.poll();s.drain();assert.equal(s.state.session().pending,false);assert.equal(s.state.session().catalog.devices.length,2);
});
test('refresh captures updated exposure and deletion as new snapshots without parameter writes',()=>{
 const s=bridge();s.c.read();s.drain();s.objects[20].parameters=[];delete s.objects[40];s.state.refresh();s.poll();s.drain();const devices=s.state.session().catalog.devices;assert.equal(devices.length,1);assert.equal(devices[0].capture,null);assert.match(devices[0].diagnostic,/Configure/);assert.equal(s.writes.length,0);
});
test('server restart reauthenticates and rescans even when the new request counter is zero again',()=>{
 const s=bridge();s.c.read();s.drain();s.state=createLiveBridgeState({token:'b'.repeat(64)});s.poll();s.poll();s.drain();assert.equal(s.state.session().catalog.devices.length,2);assert.equal(s.writes.length,0);
});
test('disconnect aborts network work and stale callbacks cannot publish or restart polling',()=>{
 const s=bridge();s.respond(false);s.c.read();assert.equal(s.requests.length,1);const req=s.requests[0];s.c.disconnect();const count=s.events.length;req.reply(200,s.state.config());for(const task of s.tasks)task.run();assert.equal(req.aborted,true);assert.equal(s.events.length,count);assert.equal(s.state.session().catalog,null);
 const t=bridge();t.c.read();t.c.disconnect();t.drain();assert.equal(t.state.session().catalog,null);
 const r=bridge();r.c.read();const stale=r.tasks.find(task=>task.delay===10);r.c.disconnect();r.c.read();const beforeStale=r.events.length;stale.fn();assert.equal(r.events.length,beforeStale);r.drain();assert.equal(r.state.session().catalog.devices.length,2);
});
test('scan errors and rack cycles are bounded and invalid values never become fabricated defaults',()=>{
 const s=bridge();s.objects[31].devices.push('id',30);s.objects[21].value=NaN;s.c.read();s.drain();const result=s.state.session().catalog;assert.equal(result.devices.length,2);assert.equal(result.devices[0].capture.parameters.length,1);assert.equal(result.devices[0].capture.parameters[0].name,'Mode');assert.ok(result.devices[0].diagnostic);assert.equal(s.writes.length,0);
 const t=bridge();t.objects[21].name=' ';t.c.read();t.drain();assert.equal(t.state.session().catalog.devices[0].capture.parameters.length,1);assert.ok(t.state.session().catalog.diagnostics.length>0);
});
test('network timeout reports a failure and schedules a bounded retry without synchronous requests',()=>{
 const s=bridge();s.respond(false);s.c.read();const timeout=s.tasks.find(t=>t.delay===10000);timeout.run();assert.match(s.events.at(-1)[1],/timed out/);assert.ok(s.tasks.some(t=>t.delay===2000));assert.equal(s.requests[0].aborted,true);
});

test('oversized exposure lists are visibly refused instead of generating fabricated or partial indexes',()=>{
 const s=bridge();s.objects[20].parameters=Array.from({length:257},(_,i)=>['id',1000+i]).flat();s.c.read();s.drain();const device=s.state.session().catalog.devices.find(d=>d.id==='device-20');assert.equal(device.capture,null);assert.match(device.diagnostic,/scan limit/);assert.equal(s.writes.length,0);
});

test('large enum metadata stays within the transfer budget and omissions remain visible',()=>{
 const s=bridge();s.objects[20].parameters=[];for(let i=0;i<20;i++){const id=1000+i;s.objects[20].parameters.push('id',id);s.objects[id]={type:'DeviceParameter',name:'Mode '+i,min:0,max:255,value:1,is_quantized:1,value_items:Array.from({length:256},(_,j)=>('Label '+j+' ').padEnd(160,'x'))};}s.c.read();s.drain();const catalog=s.state.session().catalog,device=catalog.devices.find(d=>d.id==='device-20');assert.ok(device.capture.parameters.length<20);assert.match(device.diagnostic,/transfer limit/);assert.ok(JSON.stringify(catalog).length<240000);assert.equal(s.writes.length,0);
});
