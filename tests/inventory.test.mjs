import {validateInventory} from '../packages/inventory/index.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scanPluginDirectories,runWorker} from '../native/plugin-inspector/supervisor.mjs';
import {inventory} from '../native/plugin-inspector/inventory-worker.mjs';
function pe(machine=0x8664){const b=Buffer.alloc(134);b.write('MZ');b.writeUInt32LE(128,60);b.write('PE\0\0',128);b.writeUInt16LE(machine,132);return b;}
test('isolated inventory detects fake PE architecture without execution, deduplicates roots and leaves binaries intact',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'vst-inventory-'));
 try{const binary=join(dir,'Synthetic.vst3');const data=pe();await writeFile(binary,data);await writeFile(join(dir,'ignored.txt'),'ignored');
  const result=await scanPluginDirectories([dir,dir]);assert.equal(validateInventory(result).mode,'static-no-plugin-execution');assert.equal(result.plugins.length,1);assert.equal(result.plugins[0].architecture,'x64');assert.equal(result.plugins[0].parameterStatus,'not-inspected');assert.deepEqual(await readFile(binary),data);
  const bundle=join(dir,'Bundle.vst3','Contents','x86_64-win');await mkdir(bundle,{recursive:true});await writeFile(join(bundle,'Bundle.vst3'),pe(0xaa64));
  const second=await inventory([dir]);assert.equal(second.plugins.length,2);assert.equal(second.plugins.find(p=>p.name==='Bundle').architecture,'arm64');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('missing paths report diagnostics and malformed inputs fail',async()=>{
 const result=await scanPluginDirectories([join(tmpdir(),'nonexistent-vst-inventory-unique')]);assert.equal(result.plugins.length,0);assert.ok(result.diagnostics.length);await assert.rejects(()=>scanPluginDirectories([]),/directory paths/);
});
test('supervisor times out hung workers and recovers after crash',async()=>{
 await assert.rejects(()=>runWorker(new URL('../fixtures/worker-hang.mjs',import.meta.url),{}, {timeoutMs:150}),/timed out/);
 await assert.rejects(()=>runWorker(new URL('../fixtures/worker-crash.mjs',import.meta.url),{}),/exited before response/);
 const result=await scanPluginDirectories([join(tmpdir(),'missing-after-crash')]);assert.equal(result.mode,'static-no-plugin-execution');
});

test('inventory payload validation cannot claim parameter discovery or plugin execution',()=>{
 assert.throws(()=>validateInventory({inventoryVersion:1,mode:'native-host',plugins:[],diagnostics:[]}));
 const plugin={inventoryId:'a'.repeat(24),name:'Synthetic',format:'VST3',installedPath:'local',architecture:'x64',binaryPath:'local',fingerprint:null,parameterStatus:'not-inspected',health:'inventory-only',capabilities:{nativeLoading:true,parameterDiscovery:false,guiCapture:false}};
 assert.throws(()=>validateInventory({inventoryVersion:1,mode:'static-no-plugin-execution',plugins:[plugin],diagnostics:[]}));
});
