import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectPlugin,runNativeProcess,fingerprintBinary} from '../native/plugin-inspector/native-supervisor.mjs';
import {validatePluginInspection} from '../packages/plugin-inspection/index.ts';
const binary=mode=>fileURLToPath(new URL('../artifacts/native-inspector/Release/inspector-fixture-'+mode+'.vst3',import.meta.url));
const available=process.platform==='win32'&&existsSync(binary('normal'));
const plugin=mode=>({inventoryId:'e'.repeat(24),architecture:'x64',binaryPath:binary(mode)});
test('native process supervisor bounds output and deadlines and rejects malformed replies',async()=>{
 await assert.rejects(runNativeProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{timeoutMs:200}),/timed out/);
 await assert.rejects(runNativeProcess(process.execPath,['-e','console.log("x".repeat(10000))'],{maxOutputBytes:100}),/exceeds/);
 await assert.rejects(runNativeProcess(process.execPath,['-e','console.log("not json")']));
 assert.deepEqual(await runNativeProcess(process.execPath,['-e','console.log(JSON.stringify({status:"ok"}))']),{status:'ok'});
});
test('compiled inspector reads original ABI fixture and retains invalid-default diagnostics',{skip:!available},async()=>{
 const before=await fingerprintBinary(binary('normal')),r=validatePluginInspection(await inspectPlugin(plugin('normal')));
 assert.equal(r.status,'ok');assert.equal(r.parameters.length,3);assert.equal(r.parameters[0].name,'Level');assert.equal(r.parameters[0].plainMin,-24);assert.deepEqual(r.parameters[1].enumLabels,['Clean','Warm','Bright','Dark']);assert.equal(r.parameters[2].defaultNormalized,null);
 assert.equal((await fingerprintBinary(binary('normal'))).sha256,before.sha256);
});
test('compiled crash and hang fixtures stay isolated and the next scan succeeds',{skip:!available},async()=>{
 await assert.rejects(inspectPlugin(plugin('crash')),/failed/);
 await assert.rejects(inspectPlugin(plugin('hang'),{timeoutMs:300}),/timed out/);
 assert.equal((await inspectPlugin(plugin('normal'))).status,'ok');
});
test('compiled multi-component fixture asks for a class and honors only explicit IDs',{skip:!available},async()=>{
 const list=validatePluginInspection(await inspectPlugin(plugin('multi')));assert.equal(list.status,'choose-class');assert.equal(list.classes.length,2);
 const r=await inspectPlugin(plugin('multi'),{classId:list.classes[1].classId});assert.equal(r.classId,list.classes[1].classId);assert.equal(r.name,'Second test component');
 await assert.rejects(inspectPlugin(plugin('multi'),{classId:'F'.repeat(32)}),/class not found/);
});
