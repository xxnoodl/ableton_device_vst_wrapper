const {writeFile}=require('node:fs/promises');
async function saveCapture(path,source){
 if(typeof path!=='string'||path.length>4096||!/\.json$/i.test(path)||typeof source!=='string'||source.length>1_000_000)throw new Error('Choose a new JSON filename and a valid capture');
 const parsed=JSON.parse(source);
 if(!parsed||parsed.captureVersion!==1||parsed.source!=='live-exposed-parameters'||typeof parsed.pluginName!=='string'||!Array.isArray(parsed.parameters)||!parsed.parameters.length||parsed.parameters.length>256)throw new Error('Invalid capture payload');
 await writeFile(path,source+'\n',{flag:'wx',encoding:'utf8'});
 return path;
}
module.exports={saveCapture};
