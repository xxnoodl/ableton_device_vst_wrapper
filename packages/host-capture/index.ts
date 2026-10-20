import {validateProject,type Project} from '../schema/index.ts';
export type HostCapture={captureVersion:1;source:'live-exposed-parameters';pluginName:string;parameters:{index:number;name:string;min:number;max:number;currentValue:number;quantized:boolean;enumLabels:string[]}[]};
function text(value:unknown):string{if(typeof value!=='string'||!value.trim()||value.length>160||/[\x00-\x1f]/.test(value))throw new Error('Invalid host capture text');return value;}
export function parseHostCapture(source:string):HostCapture{
 if(typeof source!=='string'||source.length>1_000_000)throw new Error('Host capture exceeds 1 MB');const o=JSON.parse(source);
 if(!o||o.captureVersion!==1||o.source!=='live-exposed-parameters'||!Array.isArray(o.parameters)||!o.parameters.length||o.parameters.length>256)throw new Error('Invalid Live capture');
 if(Object.keys(o).some(key=>!['captureVersion','source','pluginName','parameters'].includes(key)))throw new Error('Unknown capture field');
 const seen=new Set<number>();const parameters=o.parameters.map((p:Record<string,unknown>)=>{
  if(!p||typeof p.index!=='number'||!Number.isInteger(p.index)||p.index<0||p.index>255||seen.has(p.index))throw new Error('Invalid capture parameter index');seen.add(p.index);if(Object.keys(p).some(key=>!['index','name','min','max','currentValue','quantized','enumLabels'].includes(key)))throw new Error('Unknown captured parameter field');
  if(typeof p.min!=='number'||typeof p.max!=='number'||typeof p.currentValue!=='number'||![p.min,p.max,p.currentValue].every(Number.isFinite)||p.min>=p.max||p.currentValue<p.min||p.currentValue>p.max||typeof p.quantized!=='boolean'||!Array.isArray(p.enumLabels)||p.enumLabels.length>256)throw new Error('Invalid captured parameter range/value');
  return {index:p.index,name:text(p.name),min:p.min,max:p.max,currentValue:p.currentValue,quantized:p.quantized,enumLabels:p.enumLabels.map(text)};
 });
 return {captureVersion:1,source:'live-exposed-parameters',pluginName:text(o.pluginName),parameters};
}
export function projectFromCapture(capture:HostCapture):Project{
 capture=parseHostCapture(JSON.stringify(capture));
 let hash=2166136261;for(const char of JSON.stringify(capture.parameters.map(p=>[p.index,p.name,p.min,p.max]))){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
 const id='live-'+capture.pluginName.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80)+'-'+(hash>>>0).toString(16);
 return validateProject({schemaVersion:2,id,name:capture.pluginName,plugin:{name:capture.pluginName,vendor:'Unknown (Live capture)',format:'unknown',classId:null},target:{kind:'live-exposed',liveVersion:'Unrecorded',maxVersion:'Unrecorded',reconnect:'explicit'},parameters:capture.parameters.map(p=>({id:'exposed-'+p.index,name:p.name,min:p.min,max:p.max,defaultValue:p.currentValue,unit:'',evidence:'host-captured',resetSource:'captured-current',quantized:p.quantized,enumLabels:p.enumLabels})),widgets:[],panel:{width:800,height:320,grid:8},theme:'dark',dataSource:'demo-only',functionalityPresets:[],layoutPresets:[],migration:null});
}
