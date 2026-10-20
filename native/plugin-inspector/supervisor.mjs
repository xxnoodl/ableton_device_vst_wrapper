import {fork} from 'node:child_process';
export function runWorker(worker,message,{timeoutMs=15000,maxOutputBytes=2_000_000}={}){
 return new Promise((resolve,reject)=>{
  const child=fork(worker,[],{execArgv:['--max-old-space-size=96'],stdio:['ignore','ignore','ignore','ipc'],windowsHide:true,env:{SystemRoot:process.env.SystemRoot||'',WINDIR:process.env.WINDIR||'',TEMP:process.env.TEMP||''}});
  let settled=false;
  const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);if(child.connected)child.disconnect();child.kill();error?reject(error):resolve(result);};
  const timer=setTimeout(()=>finish(new Error('Inventory worker timed out')),timeoutMs);
  child.on('error',error=>finish(error));
  child.on('exit',(code,signal)=>{if(!settled)finish(new Error('Inventory worker exited before response ('+(signal||code)+')'));});
  child.on('message',response=>{
   try{if(JSON.stringify(response).length>maxOutputBytes)throw new Error('Inventory response exceeds limit');if(!response||typeof response.ok!=='boolean')throw new Error('Invalid worker response');if(!response.ok)throw new Error(response.error||'Worker failed');finish(null,response.result);}catch(error){finish(error);}
  });
  child.send(message,error=>{if(error)finish(error);});
 });
}
export function scanPluginDirectories(roots,options){return runWorker(new URL('./inventory-worker.mjs',import.meta.url),{operation:'inventory',roots},options);}
