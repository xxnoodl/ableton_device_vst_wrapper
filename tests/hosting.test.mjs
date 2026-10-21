import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {hostingAutomationPatch,hostingControls} from '../scripts/hosting-automation-bank.mjs';
const read=name=>readFileSync(new URL('../max/hosting/'+name,import.meta.url),'utf8');
const config={hostingProbeVersion:1,pluginName:'Pro-C 3',pluginPath:'C:/plugins/FabFilter Pro-C 3.vst3'};
function probe({names=['Bypass','Ratio','Attack','Threshold','Release'],available=true,stream=true,createFailure=null,restoredPlugin='',restoredValues={}}={}){
 const events=[],messages=[],objects=[],links=[],tasks=[];let c;
 const defaults={1:[0,'Off'],2:[.3,'4:1'],3:[.2,'20 ms'],4:[.4,'-18 dB'],5:[.6,'300 ms']},values={...defaults,...restoredValues};
 function node(maxclass,varname=''){
  const o={maxclass,varname,currentplug:restoredPlugin,subpatcher:()=>maxclass==='hosting-automation'?{}:null,getattr:key=>key==='currentplug'?o.currentplug:undefined,message(...args){messages.push([o.varname||o.maxclass,...args]);if(maxclass==='vst~'){
   if(args[0]==='plug'){o.currentplug=args[1];Object.assign(values,defaults);}
   if(args[0]==='get'&&args[1]===-4)c.hostvalue(-4,available?names.length:0);
   if(args[0]==='params'&&stream)for(const name of names)c.hostname(name);
   if(args[0]==='get'&&args[1]===-10)c.hostvalue(-10,128);
   if(args[0]==='get'&&args[1]>0)c.hostvalue(args[1],...values[args[1]]);
   if(args[0]==='list')values[args[1]]=[args[2],values[args[1]][1]];
  }if(maxclass==='hosting-automation'&&args[0]==='gesture')c.automationvalue(args[1],args[2]);}};if(objects.length)objects.at(-1).nextobject=o;objects.push(o);return o;
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
 const before=s.messages.length;s.c.loadplugin();assert.equal(s.messages.length,before,'Retry must not reload a working sound');s.c.openplugin();assert.deepEqual(s.messages.slice(-2),[['studio_probe_host','floateditorwindow',1],['studio_probe_host','open']]);
 assert.ok(s.c.host.args.includes('@floateditorwindow'));assert.equal(s.c.host.args[s.c.host.args.indexOf('@floateditorwindow')+1],1);
});
test('reopened hosts retain separate native states and repeated initialization never reloads a restored plugin',()=>{
 const a=probe({restoredPlugin:'C74_VST3:/FabFilter Pro-C 3',restoredValues:{4:[.2,'-30 dB'],3:[.8,'100 ms']}}),b=probe({restoredPlugin:'Pro-C 3',restoredValues:{4:[.7,'-5 dB']}});
 for(const s of [a,b]){s.load();s.runAll();assert.equal(s.c.phase,'ready');assert.ok(!s.messages.some(m=>m[1]==='plug'||m[1]==='list'));}
 assert.equal(a.c.controls[0].text,'-30 dB');assert.equal(b.c.controls[0].text,'-5 dB');assert.equal(a.c.controls[2].text,'100 ms');
 a.load();a.runAll();assert.equal(a.c.controls[0].text,'-30 dB');assert.ok(!a.messages.some(m=>m[1]==='plug'));
 // A native-editor-only value is left entirely untouched, not reconstructed from four knobs.
 a.values[99]=[.8,'Punch'];a.load();a.runAll();assert.deepEqual(a.values[99],[.8,'Punch']);
});
test('startup refuses a different saved plugin instead of silently replacing its sound',()=>{
 const s=probe({restoredPlugin:'Other compressor'});s.load();s.runAll();assert.equal(s.c.phase,'error');assert.ok(!s.messages.some(m=>m[1]==='plug'||m[1]==='list'));assert.ok(s.events.some(e=>String(e[1]).includes('another plugin')));
});
test('four static named automation parameters use silent sync and stored gesture paths with stable identifiers',()=>{
 const p=hostingAutomationPatch().patcher,boxes=new Map(p.boxes.map(({box})=>[box.id,box])),dials=p.boxes.map(b=>b.box).filter(b=>b.maxclass==='live.dial');
 assert.deepEqual(dials.map(d=>d.saved_attribute_attributes.valueof.parameter_longname),hostingControls);assert.equal(new Set(dials.map(d=>d.varname)).size,4);
 const linked=(a,out,b)=>p.lines.some(({patchline:l})=>l.source[0]===a&&l.source[1]===out&&l.destination[0]===b);
 for(let i=0;i<4;i++){const attrs=dials[i].saved_attribute_attributes.valueof;assert.equal(attrs.parameter_mmin,0);assert.equal(attrs.parameter_mmax,1);assert.equal(attrs.parameter_initial_enable,0);assert.equal(attrs.parameter_invisible,0);assert.equal(attrs.parameter_type,0);assert.ok(linked('sync',i,'silent-'+i));assert.equal(boxes.get('silent-'+i).text,'prepend set');assert.ok(linked('silent-'+i,0,'parameter-'+i));assert.ok(linked('gesture',i,'parameter-'+i));assert.ok(linked('parameter-'+i,0,'return-'+i));}
 assert.ok(!/_parameter_(longname|type|range)/.test(read('controller.js')),'parameter definitions must not mutate at runtime');
});
test('automation playback writes the internal host without echoing parameter edits; restored defaults are ignored until ready',()=>{
 const s=probe({restoredPlugin:'Pro-C 3',restoredValues:{4:[.2,'-30 dB']}});s.load();s.c.automationvalue(0,0);s.runAll();assert.equal(s.c.controls[0].value,.2);assert.equal(s.messages.filter(m=>m[1]==='list').length,0);
 const syncs=s.messages.filter(m=>m[1]==='sync').length;s.c.automationvalue(0,.75);s.runAll();assert.equal(s.c.controls[0].value,.75);assert.deepEqual(s.messages.filter(m=>m[1]==='list').map(m=>m.slice(1)),[['list',4,.75]]);assert.equal(s.messages.filter(m=>m[1]==='sync').length,syncs);assert.equal(s.messages.filter(m=>m[1]==='gesture').length,0);
 s.c.hostvalue(4,.35,'-22 dB');assert.deepEqual(s.messages.at(-1),['studio_probe_automation','sync',0,.35]);s.runAll();assert.equal(s.messages.filter(m=>m[1]==='list').length,1);
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
