import {readFile,mkdir,writeFile,unlink,rmdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {liveBridgeFiles} from '../packages/live-session/index.ts';
import {zipFiles} from '../packages/export/index.ts';
const [output]=process.argv.slice(2),created=[];let made=false;
try{
 if(!output)throw new Error('Usage: node scripts/build-live-bridge.mjs NEW_OUTPUT_DIRECTORY');
 const sources={};for(const name of ['session-bridge.js','session-bridge-renderer.js'])sources[name]=await readFile(new URL('../max/runtime/'+name,import.meta.url),'utf8');
 const template=await readFile(new URL('../max/templates/wrapper.amxd',import.meta.url)),files=liveBridgeFiles(sources,template);files['live-session-bridge.zip']=zipFiles(files);
 await mkdir(dirname(resolve(output)),{recursive:true});await mkdir(resolve(output));made=true;
 for(const [name,body]of Object.entries(files)){const file=join(resolve(output),name);await writeFile(file,body,{flag:'wx'});created.push(file);}
 console.log('Live discovery bridge prototype: '+resolve(output));
}catch(error){for(const file of created)await unlink(file).catch(()=>{});if(made)await rmdir(resolve(output)).catch(()=>{});console.error(error.message);process.exitCode=1;}
