import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {stat,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export function runNativeProcess(executable,args,{timeoutMs=20000,maxOutputBytes=8_000_000}={}){
 return new Promise((resolve,reject)=>{
  const child=spawn(executable,args,{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{SystemRoot:process.env.SystemRoot||'',WINDIR:process.env.WINDIR||'',TEMP:process.env.TEMP||'',APPDATA:process.env.APPDATA||'',LOCALAPPDATA:process.env.LOCALAPPDATA||'',ProgramData:process.env.ProgramData||'',USERPROFILE:process.env.USERPROFILE||''}});
  const chunks=[];let length=0,stderr='',settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);child.kill();error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(new Error('Plugin inspection timed out')),timeoutMs);
  child.on('error',error=>finish(error));
  child.stdout.on('data',chunk=>{length+=chunk.length;if(length>maxOutputBytes){finish(new Error('Plugin inspection response exceeds limit'));return;}chunks.push(chunk);});
  child.stderr.on('data',chunk=>{if(stderr.length<8192)stderr+=chunk.toString('utf8').slice(0,8192-stderr.length);});
  child.on('close',(code,signal)=>{
   if(settled)return;
   try{if(signal||code!==0){let detail='';try{detail=JSON.parse(Buffer.concat(chunks).toString('utf8')).error||'';}catch{}throw new Error(detail||'Plugin inspection process failed ('+(signal||code)+')');}
    const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(value.status==='error')throw new Error(value.error||'Plugin inspection failed');finish(null,value);
   }catch(error){finish(error);}
  });
 });
}
export async function fingerprintBinary(path){
 const before=await stat(path);if(!before.isFile()||before.size>1_000_000_000)throw new Error('Invalid or oversized plugin binary');
 const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);
 const after=await stat(path);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw new Error('Plugin changed during fingerprinting');
 return {sha256:hash.digest('hex'),size:after.size,mtimeMs:after.mtimeMs};
}
export async function inspectPlugin(plugin,{classId,...options}={}){
 if(process.platform!=='win32'||plugin.architecture!=='x64'||!plugin.binaryPath)throw new Error('Native inspection currently requires a Windows x64 plugin');
 if(classId!==undefined&&!/^[A-Fa-f0-9]{32}$/.test(classId))throw new Error('Invalid component class ID');
 const path=await realpath(plugin.binaryPath),identity=await fingerprintBinary(path);
 const executable=fileURLToPath(new URL('../../artifacts/native-inspector/Release/studio-inspector.exe',import.meta.url));
 const result=await runNativeProcess(executable,[path,...(classId?[classId.toUpperCase()]:[])],options);
 const after=await stat(path);if(after.size!==identity.size||after.mtimeMs!==identity.mtimeMs)throw new Error('Plugin changed during inspection');
 return {...result,inventoryId:plugin.inventoryId,fingerprint:identity.sha256,format:'VST3',source:'vst3-controller',bindingStatus:'not-verified-in-live'};
}
