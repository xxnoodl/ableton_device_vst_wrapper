// Static inventory only. Never dlopen/LoadLibrary/execute a plugin binary.
import {lstat,readdir,open,realpath} from 'node:fs/promises';
import {join,resolve,extname,basename} from 'node:path';
import {createHash} from 'node:crypto';
const MAX_ENTRIES=10000,MAX_PLUGINS=256;
export async function peArchitecture(path){
 const file=await open(path,'r');
 try{
  const header=Buffer.alloc(64);const {bytesRead}=await file.read(header,0,64,0);
  if(bytesRead<64||header.readUInt16LE(0)!==0x5a4d)return 'unknown';
  const offset=header.readUInt32LE(60);if(offset>524288)return 'invalid-pe';
  const pe=Buffer.alloc(6);const result=await file.read(pe,0,6,offset);
  if(result.bytesRead!==6||pe.readUInt32LE(0)!==0x4550)return 'invalid-pe';
  return {0x8664:'x64',0x14c:'x86',0xaa64:'arm64'}[pe.readUInt16LE(4)]||'unknown';
 }finally{await file.close();}
}
async function bundleBinary(path){
 const folder=join(path,'Contents','x86_64-win');
 try{const entries=await readdir(folder,{withFileTypes:true});const files=entries.filter(e=>e.isFile()&&extname(e.name).toLowerCase()==='.vst3');return files.length===1?join(folder,files[0].name):null;}catch{return null;}
}
export async function inventory(roots){
 if(!Array.isArray(roots)||roots.length<1||roots.length>16||roots.some(r=>typeof r!=='string'||r.length>4096))throw new Error('Expected 1?16 directory paths');
 const queue=roots.map(r=>resolve(r)),visited=new Set(),plugins=[],diagnostics=[];let entries=0;
 while(queue.length&&entries<MAX_ENTRIES&&plugins.length<MAX_PLUGINS){
  const path=queue.shift();entries++;
  try{
   const stat=await lstat(path);if(stat.isSymbolicLink()){diagnostics.push({path,code:'symlink-skipped'});continue;}
   const canonical=await realpath(path);const key=process.platform==='win32'?canonical.toLowerCase():canonical;if(visited.has(key))continue;visited.add(key);
   if(extname(path).toLowerCase()==='.vst3'){
    const binary=stat.isDirectory()?await bundleBinary(path):stat.isFile()?path:null;
    let architecture='unknown';if(binary)try{architecture=await peArchitecture(binary);}catch(error){diagnostics.push({path:binary,code:error.code||'header-read-error'});}
    plugins.push({inventoryId:createHash('sha256').update(key).digest('hex').slice(0,24),name:basename(path,'.vst3'),format:'VST3',installedPath:canonical,architecture,binaryPath:binary,fingerprint:null,parameterStatus:'not-inspected',health:'inventory-only',capabilities:{nativeLoading:false,parameterDiscovery:false,guiCapture:false}});
   }else if(stat.isDirectory()){
    const children=await readdir(path,{withFileTypes:true});children.sort((a,b)=>a.name.localeCompare(b.name));
    for(const child of children){if(child.isSymbolicLink())continue;if(child.isDirectory()||extname(child.name).toLowerCase()==='.vst3')queue.push(join(path,child.name));if(queue.length>MAX_ENTRIES)break;}
   }
  }catch(error){diagnostics.push({path,code:error.code||'read-error'});}
 }
 if(queue.length)diagnostics.push({code:'inventory-limit',message:'Scan limited to 10,000 entries and 256 plugins'});
 plugins.sort((a,b)=>a.installedPath.localeCompare(b.installedPath));
 return {inventoryVersion:1,mode:'static-no-plugin-execution',plugins,diagnostics};
}
if(process.send){process.once('message',async message=>{try{if(!message||message.operation!=='inventory'||Object.keys(message).some(k=>!['operation','roots'].includes(k)))throw new Error('Invalid inventory request');process.send({ok:true,result:await inventory(message.roots)},()=>process.exit(0));}catch(error){process.send({ok:false,error:error.message},()=>process.exit(1));}});}
