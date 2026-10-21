import {readFile,mkdir,writeFile,unlink,rmdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {parseRack,performanceFiles} from '../packages/performance/index.ts';
import {zipFiles} from '../packages/export/index.ts';
const [input,output]=process.argv.slice(2),created=[];let made=false;
try{
 if(!input||!output)throw new Error('Usage: node scripts/build-performance.mjs rack.json NEW_OUTPUT_DIRECTORY');
 const raw=await readFile(resolve(input));if(raw.length>1_000_000)throw new Error('Rack exceeds 1 MB');
 const rack=parseRack(raw.toString('utf8')),sources={};
 for(const name of ['performance-core.js','performance-controller.js','runtime-core.js','renderer.js'])sources[name]=await readFile(new URL('../max/runtime/'+name,import.meta.url),'utf8');
 const template=await readFile(new URL('../max/templates/wrapper.amxd',import.meta.url)),files=performanceFiles(rack,sources,template);files['performance-rack.zip']=zipFiles(files);
 await mkdir(dirname(resolve(output)),{recursive:true});await mkdir(resolve(output));made=true;
 for(const [name,body]of Object.entries(files)){const path=join(resolve(output),name);await writeFile(path,body,{flag:'wx'});created.push(path);}
 console.log('Experimental performance device: '+resolve(output));
}catch(error){for(const path of created)await unlink(path).catch(()=>{});if(made)await rmdir(resolve(output)).catch(()=>{});console.error(error.message);process.exitCode=1;}
