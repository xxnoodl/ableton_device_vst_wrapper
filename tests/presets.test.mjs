import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseProject,serializeProject} from '../packages/schema/index.ts';
import {saveFunctionalityPreset,saveLayoutPreset,applyFunctionalityPreset,applyLayoutPreset,exposeParameters} from '../packages/presets/index.ts';
const sample=()=>parseProject(readFileSync(new URL('../fixtures/compressor.project.json',import.meta.url),'utf8'));
test('v1 migration is deterministic, preserves layout and rejects future versions',()=>{
 const source=readFileSync(new URL('../fixtures/morph.project.json',import.meta.url),'utf8');const migrated=parseProject(source);assert.equal(migrated.schemaVersion,2);assert.equal(migrated.migration.fromVersion,1);assert.equal(migrated.widgets[0].x,240);assert.equal(serializeProject(parseProject(serializeProject(migrated))),serializeProject(migrated));assert.throws(()=>parseProject(source.replace('"schemaVersion": 1','"schemaVersion": 99')));
});
test('function presets retain selected IDs and re-expose controls without replacing styles',()=>{
 let p=sample();p={...p,widgets:p.widgets.slice(0,2)};p=saveFunctionalityPreset(p,'two','Two');const empty=exposeParameters(p,[],()=> 'unused');let id=0;const applied=applyFunctionalityPreset(empty,'two',()=>`new-${id++}`);assert.equal(applied.widgets.length,2);assert.notEqual(applied.widgets[0].x,applied.widgets[1].x);assert.throws(()=>saveFunctionalityPreset(p,'again','two'),/exists/);assert.deepEqual(parseProject(serializeProject(p)).functionalityPresets,p.functionalityPresets);
});
test('layout presets leave function selection intact and undo data immutable',()=>{
 let p=sample();p=saveLayoutPreset(p,'layout','Full layout');const current={...p,widgets:p.widgets.slice(0,2).map(w=>({...w,x:w.x+8}))};const result=applyLayoutPreset(current,'layout');assert.equal(result.widgets.length,2);assert.equal(result.widgets[0].x,p.widgets[0].x);assert.equal(current.widgets[0].x,p.widgets[0].x+8);assert.deepEqual(parseProject(serializeProject(p)).layoutPresets,p.layoutPresets);
});
test('invalid preset references and hiding locked controls are rejected transactionally',()=>{
 const p=sample();p.widgets[0].locked=true;assert.throws(()=>exposeParameters(p,[],()=> 'new'),/Unlock/);assert.throws(()=>exposeParameters(p,['missing'],()=> 'new'));
 assert.throws(()=>applyFunctionalityPreset(p,'missing',()=> 'new'));assert.throws(()=>saveLayoutPreset(p,'layout',''));
 const bad={...p,functionalityPresets:[{id:'bad',name:'Bad',parameterIds:['missing']}]};assert.throws(()=>serializeProject(bad));
});
