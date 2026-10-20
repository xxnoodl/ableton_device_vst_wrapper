import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseProject} from '../packages/schema/index.ts';
import {diagnoseProject} from '../packages/diagnostics/index.ts';
import {runtimeManifest} from '../packages/export/index.ts';
const sample=()=>parseProject(readFileSync(new URL('../fixtures/morph.project.json',import.meta.url),'utf8'));
test('diagnostics block ambiguous mappings even when the duplicate is hidden',()=>{
 const p=sample();p.parameters.push({...p.parameters[0],id:'duplicate'});assert.ok(diagnoseProject(p).some(d=>d.code==='ambiguous-parameter'&&d.severity==='error'));assert.throws(()=>runtimeManifest(p),/repeated name/);
});
test('diagnostics never turn schema success into host verification',()=>{
 const p=sample(),items=diagnoseProject(p);assert.equal(items.filter(d=>d.severity==='error').length,0);assert.ok(items.some(d=>d.code==='editor-disconnected'));assert.ok(items.some(d=>d.code==='runtime-unverified'));
});
