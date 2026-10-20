export type InventoryPlugin={inventoryId:string;name:string;format:'VST3';installedPath:string;architecture:'x64'|'x86'|'arm64'|'unknown'|'invalid-pe';binaryPath:string|null;fingerprint:null;parameterStatus:'not-inspected';health:'inventory-only';capabilities:{nativeLoading:false;parameterDiscovery:false;guiCapture:false}};
export type Inventory={inventoryVersion:1;mode:'static-no-plugin-execution';plugins:InventoryPlugin[];diagnostics:{code:string;path?:string;message?:string}[]};
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid inventory object');return value as Record<string,unknown>;}
function text(value:unknown):string{if(typeof value!=='string'||!value.length||value.length>4096||/[\x00-\x1f]/.test(value))throw new Error('Invalid inventory text');return value;}
export function validateInventory(input:unknown):Inventory{
 const o=object(input);if(o.inventoryVersion!==1||o.mode!=='static-no-plugin-execution'||!Array.isArray(o.plugins)||o.plugins.length>256||!Array.isArray(o.diagnostics)||o.diagnostics.length>10000)throw new Error('Unsupported inventory');
 const seen=new Set<string>();
 const plugins=o.plugins.map(value=>{
  const p=object(value),cap=object(p.capabilities);const id=text(p.inventoryId);
  if(!/^[a-f0-9]{24}$/.test(id)||seen.has(id)||p.format!=='VST3'||!['x64','x86','arm64','unknown','invalid-pe'].includes(String(p.architecture))||p.fingerprint!==null||p.parameterStatus!=='not-inspected'||p.health!=='inventory-only'||cap.nativeLoading!==false||cap.parameterDiscovery!==false||cap.guiCapture!==false)throw new Error('Invalid inventory plugin');seen.add(id);
  return {inventoryId:id,name:text(p.name),format:'VST3' as const,installedPath:text(p.installedPath),architecture:p.architecture as InventoryPlugin['architecture'],binaryPath:p.binaryPath===null?null:text(p.binaryPath),fingerprint:null,parameterStatus:'not-inspected' as const,health:'inventory-only' as const,capabilities:{nativeLoading:false as const,parameterDiscovery:false as const,guiCapture:false as const}};
 });
 const diagnostics=o.diagnostics.map(value=>{const d=object(value);return {code:text(d.code),...(d.path?{path:text(d.path)}:{}),...(d.message?{message:text(d.message)}:{})};});
 return {inventoryVersion:1,mode:'static-no-plugin-execution',plugins,diagnostics};
}
