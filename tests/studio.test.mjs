import * as analysis from '../packages/analysis/index.ts';
import * as diagnostics from '../packages/diagnostics/index.ts';
import * as captures from '../packages/host-capture/index.ts';
import * as presets from '../packages/presets/index.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as schema from '../packages/schema/index.ts';
import * as store from '../packages/project-store/index.ts';
import * as layout from '../packages/layout-engine/index.ts';
import * as inventory from '../packages/inventory/index.ts';
import * as exporter from '../packages/export/index.ts';
import * as inspection from '../packages/plugin-inspection/index.ts';
import * as performance from '../packages/performance/index.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function harness(performancePage=false){
 let document;const ids=new Map();
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.attributes={};this.dataset={};this.value='';this.className='';this.listeners={};this.style={setProperty:(k,v)=>this.style[k]=v};this.namespaceURI='http://www.w3.org/2000/svg';this.classList={add:(...names)=>{this.className=[...new Set([...this.className.split(' '),...names])].filter(Boolean).join(' ');},remove:(...names)=>{this.className=this.className.split(' ').filter(n=>!names.includes(n)).join(' ');},contains:name=>this.className.split(' ').includes(name),toggle:(name,on)=>{const add=on??!this.classList.contains(name);add?this.classList.add(name):this.classList.remove(name);}};}
  append(...nodes){for(const node of nodes){this.children.push(node);node.parentElement=this;}}
  replaceChildren(...nodes){for(const n of this.children)n.parentElement=null;this.children=[];this.append(...nodes);}
  setAttribute(k,v){this.attributes[k]=String(v);if(k==='id')ids.set(String(v),this);}
  getAttribute(k){return this.attributes[k]??null;}
  matches(selector){return selector.split(',').some(s=>{s=s.trim();if(s.startsWith('.'))return this.classList.contains(s.slice(1));if(s.startsWith('#'))return this.getAttribute('id')===s.slice(1);if(s.startsWith('[')){const [,k,v]=s.match(/^\[([^=]+)="([^"]+)"\]$/)||[];return this.getAttribute(k)===v;}return this.tagName.toLowerCase()===s;});}
  closest(selector){let node=this;while(node){if(node.matches(selector))return node;node=node.parentElement;}return null;}
  querySelector(selector){for(const child of this.children){if(child.matches(selector))return child;const match=child.querySelector(selector);if(match)return match;}return null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  dispatch(type,props={}){const e={target:this,button:0,pointerId:1,clientX:0,clientY:0,shiftKey:false,preventDefault(){},stopPropagation(){},...props};this['on'+type]?.(e);for(const fn of this.listeners[type]||[])fn(e);return e;}
  click(){if(!this.disabled)this.dispatch('click');}
  focus(){if(document.activeElement!==this){document.activeElement=this;this.dispatch('focus');}}
  blur(){if(document.activeElement===this){this.dispatch('change');document.activeElement=null;this.dispatch('blur');}}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);}
  setPointerCapture(){}
  getBoundingClientRect(){return {left:0,top:0};}
  get valueAsNumber(){return this.value===''?NaN:Number(this.value);}
 }
 const root=new Element('root'),stack=[root];
 const html=read(performancePage?'apps/studio/performance.html':'apps/studio/index.html');
 for(const token of html.match(/<[^>]+>/g)){
  if(token.startsWith('<!'))continue;
  if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}
  const tag=token.match(/^<([a-zA-Z0-9]+)/)?.[1];if(!tag)continue;
  const element=new Element(tag);for(const [,k,v]of token.matchAll(/([\w-]+)="([^"]*)"/g)){element.setAttribute(k,v);if(k==='class')element.className=v;if(k==='value')element.value=v;}
  stack.at(-1).append(element);if(!['meta','link','input','hr','br'].includes(tag))stack.push(element);
 }
 const docListeners={};document={activeElement:null,getElementById:id=>ids.get(id),createElement:tag=>new Element(tag),createElementNS:(ns,tag)=>new Element(tag),createTextNode:text=>{const e=new Element('text');e.textContent=text;return e;},addEventListener:(type,fn)=>{(docListeners[type]??=[]).push(fn);}};
 const data=new Map();const localStorage={get length(){return data.size;},getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i]};
 const c=vm.createContext({...schema,...store,...layout,...presets,...captures,...diagnostics,...analysis,...inventory,...exporter,...inspection,...performance,document,localStorage,crypto:{randomUUID:()=>crypto.randomUUID()},confirm:()=>true,structuredClone,setTimeout,requestAnimationFrame:fn=>{setImmediate(fn);return 1;},Blob,URL,window:{location:{},addEventListener(){}},fetch:async path=>{if(path==='/api/inventory')return {ok:true,json:async()=>({inventoryVersion:1,mode:'static-no-plugin-execution',plugins:[],diagnostics:[]})};const source=read(path.replace(/^\//,''));return {ok:true,text:async()=>source,json:async()=>JSON.parse(source)};}});
 vm.runInContext(read('apps/studio/graphs.js').replace(/^import .*;\r?\n/gm,'').replaceAll('export ',''),c);
 vm.runInContext(read('apps/studio/knob.js').replaceAll('export ',''),c);
 vm.runInContext(read(performancePage?'apps/studio/performance.js':'apps/studio/app.js').replace(/^import .*;\r?\n/gm,''),c);
 const state=()=>performancePage?performance.validateRack(JSON.parse(JSON.stringify(vm.runInContext('rack',c)))):schema.validateProject(JSON.parse(JSON.stringify(vm.runInContext('project',c))));
 return {c,document,ids,state,docListeners,localStorage};
}
const ready=()=>new Promise(resolve=>setImmediate(resolve));

function installedDiscovery(verified=true){
 const id='a'.repeat(24),name=verified?'Augmented STRINGS':'Unverified effect';
 const inventory={inventoryVersion:1,mode:'static-no-plugin-execution',diagnostics:[],plugins:[{inventoryId:id,name,format:'VST3',installedPath:'C:/fixtures/effect.vst3',binaryPath:'C:/fixtures/effect.vst3',architecture:'x64',fingerprint:null,parameterStatus:'not-inspected',health:'inventory-only',capabilities:{nativeLoading:false,parameterDiscovery:false,guiCapture:false}}]};
 const data={inspectionVersion:1,status:'ok',inventoryId:id,name,vendor:'Test fixture',classId:verified?'41727475415649534153747250726F63':'1'.repeat(32),fingerprint:verified?'132f6b1a0e290c43c48ddab7f01b816f09470952b8e5d4eb0127b7aeada42e21':'b'.repeat(64),format:'VST3',source:'vst3-controller',bindingStatus:'not-verified-in-live',parameters:[1,4].map((id,index)=>({id,index,name:index?'Motion':'Morph',shortName:'',unit:'',stepCount:0,defaultNormalized:index?0:.5,reportedDefaultNormalized:index?0:.5,metadataValid:true,defaultDisplay:index?'0.0':'0.5',plainMin:0,plainMax:1,unitId:0,flags:1,enumLabels:[]}))};
 return {inventory,data};
}
test('installed plugin choice reads controls and checkboxes create the measured two-knob layout',async()=>{
 const h=harness();await ready();const {inventory,data}=installedDiscovery(),original=h.c.fetch;
 h.c.fetch=async path=>path==='/api/inventory'?{ok:true,json:async()=>inventory}:path.startsWith('/api/inspect-plugin?')?{ok:true,json:async()=>data}:original(path);
 await h.ids.get('scan-plugins').onclick();assert.equal(h.ids.get('inventory').children.length,1);
 await h.ids.get('inventory').children[0].children[0].onclick();assert.equal(h.state().widgets.length,0);assert.equal(h.ids.get('native-search-label').hidden,false);
 h.ids.get('parameters').children[1].children[0].checked=true;h.ids.get('parameters').children[1].children[0].dispatch('change');
 h.ids.get('parameters').children[2].children[0].checked=true;h.ids.get('parameters').children[2].children[0].dispatch('change');
 assert.deepEqual(h.state().widgets.map(w=>w.label),['Morph','Motion']);assert.equal(h.ids.get('export-max').disabled,false);
 assert.deepEqual(h.state().parameters.map(p=>p.id),['vst3-1','vst3-4']);
 h.ids.get('native-search').value='motion';h.ids.get('native-search').dispatch('input');assert.equal(h.ids.get('parameters').children.length,2);
 h.ids.get('undo').click();assert.equal(h.state().widgets.length,1);
});
test('unverified installed controls remain available for design but clearly block device generation',async()=>{
 const h=harness();await ready();const {inventory,data}=installedDiscovery(false),original=h.c.fetch;
 h.c.fetch=async path=>path==='/api/inventory'?{ok:true,json:async()=>inventory}:path.startsWith('/api/inspect-plugin?')?{ok:true,json:async()=>data}:original(path);
 await h.ids.get('scan-plugins').onclick();await h.ids.get('inventory').children[0].children[0].onclick();
 h.ids.get('parameters').children[1].children[0].checked=true;h.ids.get('parameters').children[1].children[0].dispatch('change');
 assert.equal(h.state().widgets.length,1);assert.equal(h.ids.get('export-max').disabled,true);assert.match(h.ids.get('export-max').title,/routing is not verified/);assert.match(h.ids.get('status').textContent,/not supported/);
});

test('Generate device packages checked controls through the actual studio handler',async()=>{
 const h=harness();await ready();h.ids.get('morph-motion').click();await ready();
 assert.equal(h.state().parameters.length,2);
 const checkbox=h.ids.get('parameters').children[0].children[0];checkbox.checked=false;checkbox.dispatch('change');
 const patch=exporter.runtimePatch(h.state()),payload=new TextEncoder().encode(JSON.stringify(patch)+'\0');
 const shell=new Uint8Array(32+payload.length),view=new DataView(shell.buffer);
 for(const [offset,tag] of [[0,'ampf'],[8,'aaaa'],[12,'meta'],[24,'ptch']])shell.set(new TextEncoder().encode(tag),offset);
 for(const [offset,n] of [[4,4],[16,4],[20,1],[28,payload.length]])view.setUint32(offset,n,true);shell.set(payload,32);
 const original=h.c.fetch,downloads=[];
 h.c.fetch=async path=>path==='/api/device-template'?{ok:true,arrayBuffer:async()=>shell.buffer}:original(path);
 h.c.URL={createObjectURL:blob=>{downloads.push(blob);return 'blob:test';},revokeObjectURL(){}};
 await h.ids.get('export-max').onclick();
 assert.equal(downloads.length,1);assert.match(h.ids.get('status').textContent,/Device bundle generated/);
 const zip=new Uint8Array(await downloads[0].arrayBuffer()),text=new TextDecoder().decode(zip);
 assert.match(text,/Wrapper\.amxd/);assert.match(text,/"name": "Motion"/);assert.equal(h.ids.get('export-max').disabled,false);
});

test('Generate device reports unavailable shell without downloading source as a device',async()=>{
 const h=harness();await ready();const original=h.c.fetch;
 h.c.fetch=async path=>path==='/api/device-template'?{ok:false}:original(path);
 await h.ids.get('export-max').onclick();assert.match(h.ids.get('status').textContent,/no compatible device shell/);
 assert.equal(h.ids.get('export-max').disabled,false);
});
test('studio boot, function selection, properties and style changes are wired to validated state',async()=>{
 const h=harness();await ready();assert.equal(h.state().widgets.length,1);assert.equal(h.ids.get('widgets').children.length,1);
 const widget=h.ids.get('widgets').children[0];widget.querySelector('button').focus();assert.equal(h.ids.get('designs').children.length,7);
 h.ids.get('designs').children[0].click();assert.equal(h.state().widgets[0].design,'selector');
 h.ids.get('label').value='My Morph';h.ids.get('properties').dispatch('submit');assert.equal(h.state().widgets[0].label,'My Morph');
 h.ids.get('undo').click();assert.equal(h.state().widgets[0].label,'Morph');h.ids.get('redo').click();assert.equal(h.state().widgets[0].label,'My Morph');
 h.ids.get('parameters').children[0].children[0].checked=false;h.ids.get('parameters').children[0].children[0].dispatch('change');assert.equal(h.state().widgets.length,0);
});
test('studio selection, duplication, grouping, lock and delete commands work through toolbar',async()=>{
 const h=harness();await ready();h.ids.get('compressor').click();await ready();assert.equal(h.state().widgets.length,5);
 h.ids.get('panel-height').value='600';h.ids.get('project-settings').dispatch('submit');h.ids.get('select-all').click();h.ids.get('group').click();assert.ok(h.state().widgets.every(w=>w.groupId));
 h.ids.get('duplicate').click();assert.equal(h.state().widgets.length,10);assert.notEqual(h.state().widgets[0].groupId,h.state().widgets[5].groupId);
 h.ids.get('lock').click();h.ids.get('delete').click();assert.equal(h.state().widgets.length,10);
 h.ids.get('unlock').click();h.ids.get('delete').click();assert.equal(h.state().widgets.length,5);h.ids.get('undo').click();assert.equal(h.state().widgets.length,10);
});
test('studio custom ratio stops, numeric editing and knob keys retain allowed values',async()=>{
 const h=harness();await ready();h.ids.get('compressor').click();await ready();
 const ratio=h.ids.get('widgets').children.find(w=>w.dataset.id==='ratio-control');const dial=ratio.querySelector('.knob');const field=ratio.querySelector('input');
 assert.equal(Number(field.value),4);dial.focus();dial.dispatch('keydown',{key:'ArrowUp'});assert.equal(Number(field.value),8);dial.dispatch('keydown',{key:'ArrowUp'});assert.equal(Number(field.value),10);
 field.value='6.8';field.dispatch('change');assert.equal(Number(field.value),8);
 h.ids.get('step-mode').value='continuous';h.ids.get('step-mode').dispatch('change');h.ids.get('properties').dispatch('submit');assert.deepEqual(h.state().widgets.find(w=>w.id==='ratio-control').stepValues,[]);
});
test('studio rejects out-of-bounds edits and local save round trips retain project',async()=>{
 const h=harness();await ready();h.ids.get('widgets').children[0].querySelector('button').focus();
 h.ids.get('x').value='9999';h.ids.get('properties').dispatch('submit');assert.equal(h.state().widgets[0].x,240);assert.match(h.ids.get('status').textContent,/expected finite/);
 h.ids.get('save').click();assert.equal(h.localStorage.length,1);assert.equal(h.ids.get('saved').children.length,1);h.ids.get('saved').children[0].click();assert.equal(h.state().name,'Augmented Strings');
});

test('Shift selection toggles off and grouped header drags preserve spacing',async()=>{
 const h=harness();await ready();h.ids.get('compressor').click();await ready();h.ids.get('panel-height').value='600';h.ids.get('project-settings').dispatch('submit');
 const first=h.ids.get('widgets').children[0].querySelector('button');const second=h.ids.get('widgets').children[1].querySelector('button');
 first.dispatch('pointerdown');first.dispatch('pointerup');second.dispatch('pointerdown',{shiftKey:true});assert.equal(vm.runInContext('selectedIds.size',h.c),2);
 second.dispatch('pointerdown',{shiftKey:true});assert.equal(vm.runInContext('selectedIds.size',h.c),1);
 second.dispatch('pointerdown',{shiftKey:true});h.ids.get('group').click();const handle=h.ids.get('widgets').children[0].querySelector('button');
 handle.dispatch('pointerdown',{clientX:20,clientY:100});handle.dispatch('pointermove',{clientX:36,clientY:276});handle.dispatch('pointerup');
 assert.equal(h.state().widgets[0].x,32);assert.equal(h.state().widgets[1].x,152);
});

test('function and layout presets stay separate in actual studio workflow',async()=>{
 const h=harness();await ready();h.ids.get('function-preset-name').value='Morph only';h.ids.get('save-functions').click();assert.equal(h.state().functionalityPresets.length,1);
 h.ids.get('layout-preset-name').value='Original layout';h.ids.get('save-layout').click();assert.equal(h.state().layoutPresets.length,1);
 const functionId=h.state().functionalityPresets[0].id,layoutId=h.state().layoutPresets[0].id;
 h.ids.get('functions-none').click();assert.equal(h.state().widgets.length,0);
 h.ids.get('layout-preset').value=layoutId;h.ids.get('layout-preset').dispatch('change');assert.equal(h.state().widgets.length,0);
 h.ids.get('function-preset').value=functionId;h.ids.get('function-preset').dispatch('change');assert.equal(h.state().widgets.length,1);
});

test('panel settings validate transactionally and empty layouts block native export',async()=>{
 const h=harness();await ready();h.ids.get('panel-width').value='800';h.ids.get('panel-height').value='400';h.ids.get('project-settings').dispatch('submit');assert.equal(h.state().panel.width,800);assert.equal(h.state().panel.height,400);
 h.ids.get('panel-width').value='320';h.ids.get('project-settings').dispatch('submit');assert.equal(h.state().panel.width,800);
 h.ids.get('functions-none').click();assert.equal(h.ids.get('export-max').disabled,true);assert.match(h.ids.get('diagnostic-count').textContent,/blocking/);
});

test('synthetic graphs update with knob values and disclose their source',async()=>{
 const h=harness();await ready();h.ids.get('compressor').click();await ready();
 const graph=h.ids.get('graphs').children[0],curve=graph.querySelector('path'),before=curve.getAttribute('d');
 const threshold=h.ids.get('widgets').children.find(w=>w.dataset.id==='threshold-control').querySelector('input');threshold.value='-30';threshold.dispatch('change');await ready();assert.notEqual(curve.getAttribute('d'),before);
 h.ids.get('eq').click();await ready();assert.equal(h.state().graphs[0].type,'peaking-eq');assert.equal(h.ids.get('graphs').children.length,1);assert.ok(h.ids.get('diagnostics').children.some(row=>row.textContent.includes('omitted from Max')));
});
test('canvas policy and decorative cable controls save through actual studio handlers',async()=>{
 const h=harness();await ready();h.ids.get('compressor').click();await ready();
 const ids=h.state().widgets.slice(0,2).map(w=>w.id);vm.runInContext('selectedIds=new Set('+JSON.stringify(ids)+');render();',h.c);
 h.ids.get('add-cable').click();assert.equal(h.state().connections.length,1);
 h.ids.get('panel-seams').value='groove';h.ids.get('panel-seams').dispatch('change');assert.equal(h.state().canvas.seams,'groove');
 h.ids.get('snap-grid').checked=false;h.ids.get('snap-grid').dispatch('change');assert.equal(h.state().canvas.snapToGrid,false);
 assert.ok(h.ids.get('panel-art').children.length>0);
});

test('performance workbench previews a macro across targets and saves the rack through handlers',async()=>{
 const h=harness(true);await ready();assert.equal(h.state().targets.length,2);assert.equal(h.state().routes.length,2);
 h.ids.get('rack-macros').children[0].querySelector('[role="slider"]').dispatch('keydown',{key:'End'});
 assert.equal(h.state().macros[0].value,1);assert.equal(h.ids.get('rack-values').children[0].children[1].textContent,'1');assert.equal(h.ids.get('rack-values').children[1].children[1].textContent,'1');
 h.ids.get('save-rack').click();h.ids.get('add-macro').click();assert.equal(h.state().macros.length,2);h.ids.get('restore-rack').click();assert.equal(h.state().macros.length,1);assert.equal(h.state().macros[0].value,1);
 assert.equal(h.ids.get('routing-graph').children.length,2);
});

test('performance route forms apply curves and reject colliding or out-of-range changes transactionally',async()=>{
 const h=harness(true);await ready();let form=h.ids.get('rack-routes').children[1].children[1];
 form.children.find(el=>el.textContent==='Curve · 1 is linear').children[0].value='3';form.dispatch('submit');assert.equal(h.state().routes[0].curve,3);
 form=h.ids.get('rack-routes').children[1].children[1];const grid=form.children.find(el=>el.className==='property-grid'&&el.children[0].textContent==='First output');grid.children[1].children[0].value='2';form.dispatch('submit');assert.equal(h.state().routes[0].outputMax,1);assert.match(h.ids.get('rack-status').textContent,/range/);
 h.ids.get('add-route').click();assert.equal(h.state().routes.length,2);assert.match(h.ids.get('rack-status').textContent,/All destinations/);
});

test('checked wrapper controls transfer to the performance rack and synthetic projects cannot transfer',async()=>{
 const h=harness();await ready();h.ids.get('morph-motion').click();await ready();h.ids.get('send-to-rack').click();
 assert.equal(h.c.window.location.href,'/apps/studio/performance.html');assert.ok(h.localStorage.getItem('interface-studio.performance.pending'));
 h.c.window.location.href='';h.ids.get('compressor').click();await ready();h.ids.get('send-to-rack').click();assert.equal(h.c.window.location.href,'');assert.match(h.ids.get('status').textContent,/No checked Live controls/);
});

test('performance handoff creates a target slot and an editable route without manual JSON assembly',async()=>{
 const h=harness(true);await ready();h.localStorage.setItem('interface-studio.performance.pending',read('fixtures/morph-motion.project.json'));await h.c.boot();
 assert.equal(h.state().targets.length,1);assert.deepEqual(h.state().targets[0].parameters.map(p=>p.name),['Motion']);assert.equal(h.state().routes.length,0);
 h.ids.get('add-route').click();assert.equal(h.state().routes.length,1);assert.equal(h.localStorage.getItem('interface-studio.performance.pending'),null);
});

test('discrete destinations can be configured in the workbench without editing JSON',async()=>{
 const h=harness(true);await ready();const rack=h.state();rack.targets[0].parameters[0].quantized=true;rack.routes=[];h.c.change(rack);
 h.ids.get('add-route').click();assert.equal(h.ids.get('discrete-route').hidden,false);assert.equal(h.state().routes.length,0);
 h.ids.get('new-route-stops').value='0, 0.25, 1';h.ids.get('discrete-route').dispatch('submit');assert.deepEqual(h.state().routes[0].steps,[0,.25,1]);assert.equal(h.ids.get('discrete-route').hidden,true);
});

test('performance Generate handler packages routing runtime and reports missing shell failures',async()=>{
 const h=harness(true);await ready();const patch=exporter.runtimePatch(schema.parseProject(read('fixtures/morph-motion.project.json'))),payload=new TextEncoder().encode(JSON.stringify(patch)+'\0'),shell=new Uint8Array(32+payload.length),view=new DataView(shell.buffer);
 for(const [offset,tag] of [[0,'ampf'],[8,'aaaa'],[12,'meta'],[24,'ptch']])shell.set(new TextEncoder().encode(tag),offset);
 for(const [offset,n]of [[4,4],[16,4],[20,1],[28,payload.length]])view.setUint32(offset,n,true);shell.set(payload,32);
 const original=h.c.fetch,downloads=[];h.c.fetch=async path=>path==='/api/device-template'?{ok:true,arrayBuffer:async()=>shell.buffer}:original(path);h.c.URL={createObjectURL:blob=>{downloads.push(blob);return 'blob:test';},revokeObjectURL(){}};
 await h.ids.get('generate-rack').onclick();assert.equal(downloads.length,1);const text=new TextDecoder().decode(await downloads[0].arrayBuffer());assert.ok(text.includes('performance-core.js'));assert.ok(text.includes('Strings A'));assert.equal(h.ids.get('generate-rack').disabled,false);
 h.c.fetch=async path=>path==='/api/device-template'?{ok:false}:original(path);await h.ids.get('generate-rack').onclick();assert.equal(downloads.length,1);assert.match(h.ids.get('rack-status').textContent,/No compatible local device shell/);
});
