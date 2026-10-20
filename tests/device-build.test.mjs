import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseProject} from '../packages/schema/index.ts';
import {runtimeFiles,runtimePatch,deviceFiles,validateDeviceTemplate,zipFiles} from '../packages/export/index.ts';
const project=()=>parseProject(readFileSync(new URL('../fixtures/morph-motion.project.json',import.meta.url),'utf8'));
const sources=()=>Object.fromEntries(runtimeFiles.map(name=>[name,readFileSync(new URL('../max/runtime/'+name,import.meta.url),'utf8')]));
// Synthetic envelope tests parsing only; it is not a host-created device fixture.
function envelope(patch){
 const payload=new TextEncoder().encode(JSON.stringify(patch)+'\0'),bytes=new Uint8Array(32+payload.length),view=new DataView(bytes.buffer);
 for(const [offset,tag] of [[0,'ampf'],[8,'aaaa'],[12,'meta'],[24,'ptch']])bytes.set(new TextEncoder().encode(tag),offset);
 view.setUint32(4,4,true);view.setUint32(16,4,true);view.setUint32(20,1,true);view.setUint32(28,payload.length,true);bytes.set(payload,32);return bytes;
}
test('device bundle preserves supplied shell byte for byte and selected registry without Node dependencies',()=>{
 const p=project(),template=envelope(runtimePatch(p)),before=template.slice(),files=deviceFiles(p,sources(),template);
 assert.deepEqual(files['Wrapper.amxd'],before);assert.deepEqual(template,before);assert.notEqual(files['Wrapper.amxd'],template);
 assert.deepEqual(JSON.parse(files['project.runtime.json']).parameters.map(p=>p.name),['Morph','Motion']);
 assert.ok(!Object.keys(files).some(name=>/capture|\.maxpat$/.test(name)));
 const subset={...p,widgets:[p.widgets[1]]};assert.deepEqual(JSON.parse(deviceFiles(subset,sources(),template)['project.runtime.json']).parameters.map(p=>p.name),['Motion']);
});
test('device generation rejects malformed, frozen, out-of-panel and Node-enabled shells',()=>{
 const good=envelope(runtimePatch(project()));assert.equal(validateDeviceTemplate(good),good);
 const bad=good.slice();bad[28]=0;assert.throws(()=>validateDeviceTemplate(bad));
 assert.throws(()=>validateDeviceTemplate(good.subarray(0,good.length-1)));
 for(const mutate of [p=>p.openinpresentation=0,p=>p.boxes.push({box:{text:'node.script writer.js'}}),p=>p.boxes.find(e=>e.box.id==='ui').box.presentation_rect[1]=200,p=>p.lines=[]]){
  const candidate=runtimePatch(project());mutate(candidate.patcher);assert.throws(()=>validateDeviceTemplate(envelope(candidate)));
 }
});
test('ZIP stores binary device bytes without UTF-8 conversion',()=>{
 const binary=new Uint8Array([0,255,128,1,254]),archive=zipFiles({'Wrapper.amxd':binary}),view=new DataView(archive.buffer);
 const nameLength=view.getUint16(26,true),extraLength=view.getUint16(28,true),size=view.getUint32(18,true),start=30+nameLength+extraLength;
 assert.equal(size,binary.length);assert.deepEqual(archive.subarray(start,start+size),binary);
});
