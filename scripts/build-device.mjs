import {readFile,mkdir,writeFile,unlink,rmdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {parseProject} from '../packages/schema/index.ts';
import {deviceFiles,runtimeFiles,zipFiles} from '../packages/export/index.ts';
const [input,output]=process.argv.slice(2);
if(!input||!output){console.error('Usage: node scripts/build-device.mjs project.json NEW_OUTPUT_DIRECTORY');process.exitCode=1;}
else{
 const created=[];let made=false;
 try{
  const raw=await readFile(resolve(input));if(raw.length>1_000_000)throw new Error('Project exceeds 1 MB');
  const project=parseProject(raw.toString('utf8')),sources={};
  for(const name of runtimeFiles)sources[name]=await readFile(new URL('../max/runtime/'+name,import.meta.url),'utf8');
  const template=await readFile(new URL('../max/templates/wrapper.amxd',import.meta.url));
  const files=deviceFiles(project,sources,template);files['wrapper-bundle.zip']=zipFiles(files);
  await mkdir(dirname(resolve(output)),{recursive:true});await mkdir(resolve(output));made=true;
  for(const [name,source] of Object.entries(files)){const file=join(resolve(output),name);await writeFile(file,source,{flag:'wx'});created.push(file);}
  console.log('Generated device bundle: '+resolve(output));
 }catch(error){for(const file of created)await unlink(file).catch(()=>{});if(made)await rmdir(resolve(output)).catch(()=>{});console.error(error.message);process.exitCode=1;}
}
