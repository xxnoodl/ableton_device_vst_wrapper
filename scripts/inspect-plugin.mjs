import {scanPluginDirectories} from '../native/plugin-inspector/supervisor.mjs';
import {inspectPlugin} from '../native/plugin-inspector/native-supervisor.mjs';
import {validatePluginInspection} from '../packages/plugin-inspection/index.ts';
const [filter,classId]=process.argv.slice(2);
try{
 if(!filter)throw new Error('Usage: node scripts/inspect-plugin.mjs "plugin name" [classId]');
 const inventory=await scanPluginDirectories(['C:\\Program Files\\Common Files\\VST3']);
 const matches=inventory.plugins.filter(p=>p.name.toLowerCase().includes(filter.toLowerCase()));
 if(matches.length!==1)throw new Error('Expected one installed plugin, found '+matches.length);
 console.log(JSON.stringify(validatePluginInspection(await inspectPlugin(matches[0],{classId})),null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
