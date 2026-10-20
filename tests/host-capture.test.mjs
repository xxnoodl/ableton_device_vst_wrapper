import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHostCapture,projectFromCapture} from '../packages/host-capture/index.ts';
import {exposeParameters} from '../packages/presets/index.ts';
import {runtimeManifest} from '../packages/export/index.ts';
const capture=()=>({captureVersion:1,source:'live-exposed-parameters',pluginName:'Example synth',parameters:[{index:0,name:'Mode',min:0,max:2,currentValue:1,quantized:true,enumLabels:['Low','Mid','High']},{index:1,name:'Amount',min:0,max:1,currentValue:.4,quantized:false,enumLabels:[]}]});
test('capture import preserves provenance and current reset baseline without claiming SDK identity or format',()=>{
 const project=projectFromCapture(parseHostCapture(JSON.stringify(capture())));assert.equal(project.plugin.classId,null);assert.equal(project.plugin.format,'unknown');assert.equal(project.parameters[1].defaultValue,.4);assert.equal(project.parameters[1].resetSource,'captured-current');assert.equal(project.parameters[0].evidence,'host-captured');assert.equal(project.widgets.length,0);
 let n=0;const exposed=exposeParameters(project,['exposed-0'],()=>`widget-${++n}`);assert.equal(exposed.widgets[0].stepCount,3);assert.equal(runtimeManifest(exposed).demoOnly,false);
});
test('capture rejects malformed ranges, duplicate indexes, executable fields and unknown versions',()=>{
 for(const mutate of [c=>c.captureVersion=2,c=>c.parameters[0].currentValue=99,c=>c.parameters[1].index=0,c=>c.script='evil',c=>c.parameters[0].sdkId='fake',c=>c.parameters[0].quantized='true']){const c=capture();mutate(c);assert.throws(()=>parseHostCapture(JSON.stringify(c)));}
});
