import {scanPluginDirectories} from '../native/plugin-inspector/supervisor.mjs';
const roots=process.argv.slice(2);
if(!roots.length&&process.platform==='win32')roots.push('C:\\Program Files\\Common Files\\VST3');
try{if(!roots.length)throw new Error('Supply one or more VST3 directories');console.log(JSON.stringify(await scanPluginDirectories(roots),null,2));}
catch(error){console.error(error.message);process.exitCode=1;}
