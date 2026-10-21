import {readFile,mkdir,writeFile,unlink,rmdir,stat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {validateDeviceTemplate,zipFiles} from '../packages/export/index.ts';
const [output,plugin=String.raw`C:\Program Files\Common Files\VST3\FabFilter\FabFilter Pro-C 3.vst3`]=process.argv.slice(2),created=[];let made=false;
try{
 if(!output)throw new Error('Usage: node scripts/build-hosting-probe.mjs NEW_OUTPUT_DIRECTORY [PRO_C_3_VST3_PATH]');
 const pluginPath=resolve(plugin);if(!/^[A-Za-z]:[\\/].+\.vst3$/i.test(pluginPath)||/[\x00-\x1f]/.test(pluginPath))throw new Error('Expected a Windows Pro-C 3 VST3 path');await stat(pluginPath);
 const template=await readFile(new URL('../max/templates/wrapper.amxd',import.meta.url));validateDeviceTemplate(template);
 const files={'Pro-C-3-Studio-Test.amxd':new Uint8Array(template),
  'controller.js':await readFile(new URL('../max/hosting/controller.js',import.meta.url),'utf8'),
  'renderer.js':await readFile(new URL('../max/hosting/renderer.js',import.meta.url),'utf8'),
  'project.runtime.json':JSON.stringify({hostingProbeVersion:1,pluginName:'Pro-C 3',pluginPath:pluginPath.replaceAll('\\','/')},null,2)+'\n',
  'README.txt':'Internal Pro-C 3 hosting proof, not a production device. Keep these files together. Drag Pro-C-3-Studio-Test.amxd onto a separate test audio track in Live. Do not add a separate Pro-C 3 instance or bind anything. It creates its own vst~ host and loads the installed plugin. Click Open plugin to open that internal instance. Four test knobs read formatted text from vst~; vertical drag writes normalized values. Read values refreshes them. Missing/ambiguous names fail visibly and retain dry pass-through. Retry cannot reset an already loaded plugin.\n\nThis proof has no automation lanes, guaranteed preset/Set persistence, latency compensation, external sidechain or instrument support. Do not use it as a replacement in an existing production Set. On initialization the dry path remains active until metadata resolves; then stereo audio passes only through the internal plugin. Error/Stop returns to dry. Removing this device removes its internal host. Native window, audio, formatted values and state must be checked in Live; simulated tests cannot establish them. No Node for Max, LiveAPI binding, server or bundled plugin binary is used. The Max-authored shell is copied unchanged; objects and wiring are created locally on initialization. A public release still needs approved shell/dependency packaging.\n'};
 files['hosting-test.zip']=zipFiles(files);await mkdir(dirname(resolve(output)),{recursive:true});await mkdir(resolve(output));made=true;
 for(const [name,body]of Object.entries(files)){const file=join(resolve(output),name);await writeFile(file,body,{flag:'wx'});created.push(file);}
 console.log('Internal hosting proof: '+resolve(output));
}catch(error){for(const file of created)await unlink(file).catch(()=>{});if(made)await rmdir(resolve(output)).catch(()=>{});console.error(error.message);process.exitCode=1;}
