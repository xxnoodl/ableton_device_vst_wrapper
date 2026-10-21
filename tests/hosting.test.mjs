import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../max/hosting/'+name,import.meta.url),'utf8');
const config={hostingProbeVersion:1,pluginName:'Pro-C 3',pluginPath:'C:/plugins/FabFilter Pro-C 3.vst3'};
function probe({names=['Bypass','Ratio','Attack','Threshold','Release'],available=true,stream=true,createFailure=null}={}){
 const events=[],messages=[],objects=[],links=[],tasks=[];let c;
 const values={1:[0,'Off'],2:[.3,'4:1'],3:[.2,'20 ms'],4:[.4,'-18 dB'],5:[.6,'300 ms']};
 function node(maxclass,varname=''){
  const o={maxclass,varname,message(...args){messages.push([o.varname||o.maxclass,...args]);if(maxclass==='vst~'){
   if(args[0]==='get'&&args[1]===-4)c.hostvalue(-4,available?names.length:0);
   if(args[0]==='params'&&stream)for(const name of names)c.hostname(name);
   if(args[0]==='get'&&args[1]===-10)c.hostvalue(-10,128);
   if(args[0]==='get'&&args[1]>0)c.hostvalue(args[1],...values[args[1]]);
  }}};if(objects.length)objects.at(-1).nextobject=o;objects.push(o);return o;
 }
 const input=node('plugin~'),output=node('plugout~'),box=node('js'),ready=node('live.thisdevice');
 links.push([input,0,output,0],[input,1,output,1]);
 const patcher={firstobject:input,newdefault(x,y,type,...args){if(type===createFailure)throw Error('Fixture create failure');const o=node(type);o.args=args;return o;},connect(a,out,b,i){links.push([a,out,b,i]);},disconnect(a,out,b,i){for(let n=links.length-1;n>=0;n--)if(links[n][0]===a&&links[n][1]===out&&links[n][2]===b&&links[n][3]===i)links.splice(n,1);}};
 function File(){this.isopen=true;this.eof=1;this.position=0;this.readline=()=>{this.position=1;return JSON.stringify(config);};this.close=()=>{};}
 function Task(fn){this.cancelled=false;this.schedule=ms=>{this.delay=ms;tasks.push(this);};this.cancel=()=>{this.cancelled=true;};this.run=()=>{if(!this.cancelled)fn();};}
 c=vm.createContext({patcher,box,File,Task,arrayfromargs:a=>Array.from(a),outlet:(...a)=>events.push(a)});vm.runInContext(read('controller.js'),c);
 const runAll=()=>{for(let i=0;i<tasks.length;i++){assert.ok(i<100,'bounded tasks');tasks[i].run();}};
 return {c,events,messages,objects,links,tasks,input,output,box,ready,values,runAll,load:()=>c.read('project.runtime.json')};
}
test('hosting proof constructs an internal stereo graph, loads its own VST3 and resolves reordered names without Live selection',()=>{
 const s=probe();s.load();assert.equal(s.c.phase,'loading');s.runAll();assert.equal(s.c.phase,'ready');
 assert.deepEqual(Array.from(s.c.controls,c=>c.index),[4,2,3,5]);assert.deepEqual(Array.from(s.c.controls,c=>c.text),['-18 dB','4:1','20 ms','300 ms']);
 assert.ok(s.messages.some(m=>m[0]==='studio_probe_host'&&m[1]==='plug'&&m[2]===config.pluginPath));assert.ok(!s.messages.some(m=>m[1]==='list'));
 assert.equal(s.links.filter(l=>l[0]===s.input&&l[2]===s.output).length,0);
 for(const [channel,selector]of [[0,s.c.left],[1,s.c.right]]){
  assert.ok(s.links.some(l=>l[0]===s.input&&l[1]===channel&&l[2]===selector&&l[3]===1));
  assert.ok(s.links.some(l=>l[0]===s.c.host&&l[1]===channel&&l[2]===selector&&l[3]===2));
  assert.equal(s.links.filter(l=>l[2]===s.output&&l[3]===channel).length,1);
 }
 assert.equal(s.c.latency,128);assert.ok(s.events.some(e=>String(e[1]).includes('does not forward compensation')));
 assert.ok(!/new\s+LiveAPI|node\.script|new\s+XMLHttpRequest/.test(read('controller.js')));
});
test('native plugin edits preserve formatted text and never echo a write; only coalesced gestures write bounded normalized values',()=>{
 const s=probe();s.load();s.runAll();s.c.hostvalue(3,.55,'Auto','(tempo)');assert.equal(s.c.controls[2].text,'Auto (tempo)');assert.equal(s.messages.filter(m=>m[1]==='list').length,0);
 s.c.setcontrol(0,.2);s.c.setcontrol(0,.8);s.c.setcontrol(2,9);s.c.setcontrol(2,NaN);s.c.setcontrol(9,.2);s.runAll();
 assert.deepEqual(s.messages.filter(m=>m[1]==='list').map(m=>m.slice(1)),[['list',4,.8],['list',3,1]]);
 const before=s.messages.length;s.c.loadplugin();assert.equal(s.messages.length,before,'Retry must not reload a working sound');s.c.openplugin();assert.deepEqual(s.messages.at(-1),['studio_probe_host','open']);
});
test('ambiguous or incomplete metadata refuses controls and keeps stereo dry; absent plugins time out without writes',()=>{
 for(const options of [{names:['Threshold','Ratio','Attack','Release','Ratio']},{stream:false},{available:false}]){
  const s=probe(options);s.load();s.runAll();assert.equal(s.c.phase,'error');assert.equal(s.c.controls.length,0);assert.ok(!s.messages.some(m=>m[1]==='list'));for(const name of ['studio_probe_left','studio_probe_right'])assert.equal(s.messages.filter(m=>m[0]===name).at(-1)[1],1);
 }
});
test('initialization failure preserves the original dry chain without parallel duplicate paths',()=>{
 const s=probe({createFailure:'selector~'});s.load();assert.equal(s.c.phase,'error');for(const i of [0,1])assert.equal(s.links.filter(l=>l[2]===s.output&&l[3]===i).length,1);assert.ok(!s.messages.some(m=>m[1]==='plug'));
});
test('stop cancels pending loading, metadata work and gestures; repeated setup reuses objects and avoids duplicate connections',()=>{
 const s=probe();s.load();s.runAll();const total=s.objects.length,links=s.links.length;s.c.setcontrol(0,.8);s.c.disconnect();s.runAll();assert.ok(!s.messages.some(m=>m[1]==='list'));s.load();s.runAll();assert.equal(s.objects.length,total);assert.equal(s.links.length,links);
 const waiting=probe({available:false});waiting.load();waiting.c.disconnect();waiting.runAll();assert.equal(waiting.c.phase,'idle');assert.equal(waiting.messages.filter(m=>m[1]==='plug').length,1);
});
test('hosting UI opens the internal editor, reads units verbatim and emits gestures only when ready',()=>{
 const events=[],texts=[],widths=[],graphics=new Proxy({size:[220,139],init(){},redraw(){},text_measure:t=>[String(t).length*6,12],show_text:t=>texts.push(t)},{get:(o,k)=>k in o?o[k]:()=>{}});
 const message={maxclass:'message',message:(...a)=>widths.push(a)},ready={maxclass:'live.thisdevice',nextobject:message,message:(...a)=>widths.push(a)};
 const c=vm.createContext({mgraphics:graphics,box:{message:(...a)=>widths.push(a)},patcher:{firstobject:ready},outlet:(...a)=>events.push(a)});vm.runInContext(read('renderer.js'),c);
 c.onclick(76,80);c.ondrag(76,50,1,0,0);assert.equal(events.length,0);
 c.hosting(JSON.stringify({phase:'ready',controls:['Threshold','Ratio','Attack','Release'].map((name,i)=>({name,index:i+1,value:.5,text:['-18 dB','4:1','20 ms','Auto'][i]})),latency:128}));c.paint();for(const t of ['-18 dB','4:1','20 ms','Auto'])assert.ok(texts.includes(t));assert.ok(widths.some(a=>a[0]==='setwidth'&&a[1]===580));assert.ok(widths.some(a=>a[0]==='presentation'&&a[1]===0));
 c.onclick(355,15);assert.deepEqual(events.at(-1),[0,'openplugin']);c.onclick(76,80);c.ondrag(76,56,1,0,0);assert.deepEqual(events.at(-1),[0,'setcontrol',0,.6]);
 c.hosting(JSON.stringify({phase:'error',controls:[],latency:null}));const n=events.length;c.ondrag(76,50,1,0,0);assert.equal(events.length,n);
});
