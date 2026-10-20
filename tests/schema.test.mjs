import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseProject,serializeProject,validateProject,normalize,denormalize,moveWidget} from '../packages/schema/index.ts';
import {saveProject,loadProject} from '../packages/project-store/index.ts';
const sample=()=>parseProject(readFileSync(new URL('../fixtures/morph.project.json',import.meta.url),'utf8'));
test('project round trip is deterministic; compressor fixture is valid',()=>{
 const p=sample();assert.deepEqual(parseProject(serializeProject(p)),p);assert.equal(serializeProject(parseProject(serializeProject(p))),serializeProject(p));
 assert.equal(parseProject(readFileSync(new URL('../fixtures/compressor.project.json',import.meta.url),'utf8')).widgets.length,5);
});
test('reject malformed files, unknown versions, code fields, dangling bindings and overflow',()=>{
 assert.throws(()=>parseProject('{'));assert.throws(()=>parseProject(' '.repeat(1_000_001)));
 for(const mutate of [p=>p.schemaVersion=2,p=>p.code='alert(1)',p=>p.widgets[0].parameterId='missing',p=>p.widgets[0].x=10000,p=>p.parameters.push(p.parameters[0]),p=>p.parameters[0].defaultValue=NaN,p=>p.plugin.path='private path']){const p=sample();mutate(p);assert.throws(()=>validateProject(p));}
});
test('normalized value transforms clamp, invert and reject invalid ranges',()=>{
 const p={...sample().parameters[0],min:-60,max:0};assert.equal(normalize(-30,p),.5);assert.equal(denormalize(.5,p),-30);assert.equal(normalize(-100,p),0);assert.equal(denormalize(2,p),0);assert.throws(()=>normalize(0,{...p,max:-60}));assert.throws(()=>denormalize(NaN,p));
});
test('movement snaps, clamps and preserves original project',()=>{
 const p=sample();const next=moveWidget(p,'morph-control',19,10000);assert.equal(next.widgets[0].x,16);assert.equal(next.widgets[0].y,140);assert.equal(p.widgets[0].x,240);assert.throws(()=>moveWidget(p,'missing',0,0));
});
test('local saves validate before mutation and preserve previous version as backup',()=>{
 const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};const p=sample();saveProject(storage,'p',p);const first=values.get('p');saveProject(storage,'p',{...p,name:'Edited'});assert.equal(values.get('p.backup'),first);assert.equal(loadProject(storage,'p').name,'Edited');assert.throws(()=>saveProject(storage,'p',{...p,schemaVersion:2}));assert.equal(loadProject(storage,'p').name,'Edited');values.set('p','broken');assert.throws(()=>loadProject(storage,'p'));assert.deepEqual(loadProject(storage,'p.backup'),p);
});
