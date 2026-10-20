import {readFile,mkdir,writeFile,unlink,rmdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {parseProject} from '../packages/schema/index.ts';
import {exportFiles,runtimeFiles} from '../packages/export/index.ts';
const [input,output]=process.argv.slice(2);
if(!input||!output){console.error('Usage: node scripts/export-project.mjs project.json NEW_OUTPUT_DIRECTORY');process.exitCode=1;}
else {
 const created=[];let made=false;
 try{
  const project=parseProject(await readFile(resolve(input),'utf8'));const sources={};
  for(const name of runtimeFiles)sources[name]=await readFile(new URL('../max/runtime/'+name,import.meta.url),'utf8');
  const files=exportFiles(project,sources);await mkdir(dirname(resolve(output)),{recursive:true});await mkdir(resolve(output));made=true;
  for(const [name,source] of Object.entries(files)){const file=join(resolve(output),name);await writeFile(file,source,{flag:'wx'});created.push(file);}
  console.log('Exported Max patch source and external dependencies to '+resolve(output));console.log('Prototype only. Export an actual device in licensed Max/Live.');
 }catch(error){for(const file of created)await unlink(file).catch(()=>{});if(made)await rmdir(resolve(output)).catch(()=>{});console.error(error.message);process.exitCode=1;}
}
