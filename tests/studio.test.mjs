import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as schema from '../packages/schema/index.ts';
import * as store from '../packages/project-store/index.ts';
import * as layout from '../packages/layout-engine/index.ts';
import * as inventory from '../packages/inventory/index.ts';
import * as exporter from '../packages/export/index.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function harness(){
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
 const html=read('apps/studio/index.html');
 for(const token of html.match(/<[^>]+>/g)){
  if(token.startsWith('<!'))continue;
  if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}
  const tag=token.match(/^<([a-zA-Z0-9]+)/)?.[1];if(!tag)continue;
  const element=new Element(tag);for(const [,k,v]of token.matchAll(/([\w-]+)="([^"]*)"/g)){element.setAttribute(k,v);if(k==='class')element.className=v;if(k==='value')element.value=v;}
  stack.at(-1).append(element);if(!['meta','link','input','hr','br'].includes(tag))stack.push(element);
 }
 const docListeners={};document={activeElement:null,getElementById:id=>ids.get(id),createElement:tag=>new Element(tag),createElementNS:(ns,tag)=>new Element(tag),createTextNode:text=>{const e=new Element('text');e.textContent=text;return e;},addEventListener:(type,fn)=>{(docListeners[type]??=[]).push(fn);}};
 const data=new Map();const localStorage={get length(){return data.size;},getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),key:i=>[...data.keys()][i]};
 const c=vm.createContext({...schema,...store,...layout,...inventory,...exporter,document,localStorage,crypto:{randomUUID:()=>crypto.randomUUID()},confirm:()=>true,setTimeout,Blob,URL,window:{addEventListener(){}},fetch:async path=>{const source=read(path.replace(/^\//,''));return {ok:true,text:async()=>source,json:async()=>JSON.parse(source)};}});
 vm.runInContext(read('apps/studio/knob.js').replaceAll('export ',''),c);
 vm.runInContext(read('apps/studio/app.js').replace(/^import .*;\r?\n/gm,''),c);
 const state=()=>schema.validateProject(JSON.parse(JSON.stringify(vm.runInContext('project',c))));
 return {c,document,ids,state,docListeners,localStorage};
}
const ready=()=>new Promise(resolve=>setImmediate(resolve));
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
 h.ids.get('select-all').click();h.ids.get('group').click();assert.ok(h.state().widgets.every(w=>w.groupId));
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
 const h=harness();await ready();h.ids.get('compressor').click();await ready();
 const first=h.ids.get('widgets').children[0].querySelector('button');const second=h.ids.get('widgets').children[1].querySelector('button');
 first.dispatch('pointerdown');first.dispatch('pointerup');second.dispatch('pointerdown',{shiftKey:true});assert.equal(vm.runInContext('selectedIds.size',h.c),2);
 second.dispatch('pointerdown',{shiftKey:true});assert.equal(vm.runInContext('selectedIds.size',h.c),1);
 second.dispatch('pointerdown',{shiftKey:true});h.ids.get('group').click();const handle=h.ids.get('widgets').children[0].querySelector('button');
 handle.dispatch('pointerdown',{clientX:20,clientY:100});handle.dispatch('pointermove',{clientX:36,clientY:116});handle.dispatch('pointerup');
 assert.equal(h.state().widgets[0].x,32);assert.equal(h.state().widgets[1].x,152);
});
