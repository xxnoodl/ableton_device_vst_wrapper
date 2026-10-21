import {validateProject,type Project} from '../schema/index.ts';
export type NativeParameter={id:number;index:number;name:string;shortName:string;unit:string;stepCount:number;defaultNormalized:number|null;metadataValid:boolean;reportedDefaultNormalized:number|null;defaultDisplay:string|null;plainMin:number|null;plainMax:number|null;unitId:number;flags:number;enumLabels:(string|null)[]};
type Base={inspectionVersion:1;inventoryId:string;fingerprint:string;format:'VST3';source:'vst3-controller';bindingStatus:'not-verified-in-live';vendor:string};
export type PluginInspection=Base&({status:'choose-class';classes:{classId:string;name:string}[]}|{status:'ok';name:string;classId:string;parameters:NativeParameter[]});
function object(v:unknown,keys:string[]){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k))||keys.some(k=>!Object.prototype.hasOwnProperty.call(v,k)))throw new Error('Invalid inspection object');return v as Record<string,unknown>;}
function text(v:unknown,max=1024){if(typeof v!=='string'||v.length>max||v.includes('\0'))throw new Error('Invalid inspection text');return v;}
function integer(v:unknown,min:number,max:number){if(typeof v!=='number'||!Number.isInteger(v)||v<min||v>max)throw new Error('Invalid inspection integer');return v;}
function numeric(v:unknown){if(v!==null&&(typeof v!=='number'||!Number.isFinite(v)))throw new Error('Invalid inspection number');return v as number|null;}
function identifier(v:unknown,size:number){if(typeof v!=='string'||!new RegExp('^[A-Fa-f0-9]{'+size+'}$').test(v))throw new Error('Invalid inspection identity');return v;}
export function validatePluginInspection(input:unknown):PluginInspection{
 const fields=['inspectionVersion','status','inventoryId','fingerprint','format','source','bindingStatus','vendor'];
 const status=(input as {status?:string})?.status;if(status!=='ok'&&status!=='choose-class')throw new Error('Unsupported inspection status');
 const o=object(input,[...fields,...(status==='ok'?['name','classId','parameters']:['classes'])]);
 if(o.inspectionVersion!==1||o.format!=='VST3'||o.source!=='vst3-controller'||o.bindingStatus!=='not-verified-in-live')throw new Error('Unsupported inspection contract');
 const base:Base={inspectionVersion:1,inventoryId:identifier(o.inventoryId,24),fingerprint:identifier(o.fingerprint,64).toLowerCase(),format:'VST3',source:'vst3-controller',bindingStatus:'not-verified-in-live',vendor:text(o.vendor)};
 if(status==='choose-class'){
  if(!Array.isArray(o.classes)||!o.classes.length||o.classes.length>256)throw new Error('Invalid component classes');
  const classes=o.classes.map(v=>{const c=object(v,['classId','name']);return {classId:identifier(c.classId,32).toUpperCase(),name:text(c.name)};});
  if(new Set(classes.map(c=>c.classId)).size!==classes.length)throw new Error('Duplicate component class');return {...base,status,classes};
 }
 if(!Array.isArray(o.parameters)||o.parameters.length>16384)throw new Error('Invalid native parameter list');
 const parameters=o.parameters.map((v,i):NativeParameter=>{
  const p=object(v,['id','index','name','shortName','unit','stepCount','defaultNormalized','metadataValid','reportedDefaultNormalized','defaultDisplay','plainMin','plainMax','unitId','flags','enumLabels']);
  const id=integer(p.id,0,0xffffffff),index=integer(p.index,0,16383),stepCount=integer(p.stepCount,-0x80000000,0x7fffffff),value=numeric(p.defaultNormalized),reported=numeric(p.reportedDefaultNormalized);
  const valid=reported!==null&&reported>=0&&reported<=1&&stepCount>=0;
  if(index!==i||p.metadataValid!==valid||(valid?value!==reported:value!==null))throw new Error('Inconsistent parameter provenance');
  if(!Array.isArray(p.enumLabels)||p.enumLabels.length>33||p.enumLabels.some(v=>v!==null&&typeof v!=='string')||(p.enumLabels.length&&!(stepCount>0&&stepCount<=32&&p.enumLabels.length===stepCount+1)))throw new Error('Invalid enum metadata');
  return {id,index,name:text(p.name),shortName:text(p.shortName),unit:text(p.unit),stepCount,defaultNormalized:value,metadataValid:valid,reportedDefaultNormalized:reported,defaultDisplay:p.defaultDisplay===null?null:text(p.defaultDisplay),plainMin:numeric(p.plainMin),plainMax:numeric(p.plainMax),unitId:integer(p.unitId,-0x80000000,0x7fffffff),flags:integer(p.flags,-0x80000000,0x7fffffff),enumLabels:p.enumLabels.map(v=>v===null?null:text(v))};
 });
 if(new Set(parameters.map(p=>p.id)).size!==parameters.length)throw new Error('Duplicate native parameter ID');
 return {...base,status,name:text(o.name),classId:identifier(o.classId,32).toUpperCase(),parameters};
}
export function selectableParameter(p:NativeParameter){return p.metadataValid&&!!(p.flags&1)&&!(p.flags&(2|16|32768));}
// Narrow, measured adapter: SDK identity and names/ranges match the user-tested Live controls.
// This does not claim that other native parameters are exposed by Live.
export function verifiedLiveBinding(inspection:PluginInspection,p:NativeParameter){
 if(inspection.status!=='ok'||inspection.classId!=='41727475415649534153747250726F63'.toUpperCase()||inspection.fingerprint!=='132f6b1a0e290c43c48ddab7f01b816f09470952b8e5d4eb0127b7aeada42e21')return null;
 if(!selectableParameter(p)||p.stepCount!==0||p.plainMin!==0||p.plainMax!==1)return null;
 if((p.id===1&&p.name==='Morph')||(p.id===4&&p.name==='Motion'))return {name:p.name,min:0,max:1};return null;
}
export function projectFromInspection(input:PluginInspection,selectedIds:number[]):Project{
 const inspection=validatePluginInspection(input);if(inspection.status!=='ok')throw new Error('Choose a plugin component first');
 if(!Array.isArray(selectedIds)||new Set(selectedIds).size!==selectedIds.length||selectedIds.length>60)throw new Error('Choose at most 60 controls for one panel');
 const ids=new Set(selectedIds),selected=inspection.parameters.filter(p=>ids.has(p.id));
 if(selected.length!==ids.size||selected.some(p=>!selectableParameter(p)))throw new Error('Selected parameter is unavailable or read-only');
 const columns=Math.min(12,Math.max(2,Math.ceil(selected.length/5))),rows=Math.max(1,Math.ceil(selected.length/columns));
 const parameters=selected.map(p=>{const binding=verifiedLiveBinding(inspection,p);return {id:'vst3-'+p.id,name:p.name.replace(/[\x00-\x1f]/g,' ').trim()||'Parameter '+p.id,min:binding?binding.min:0,max:binding?binding.max:1,defaultValue:p.defaultNormalized as number,unit:'',evidence:binding?'user-reported':'native-inspected',resetSource:'project-default',quantized:p.stepCount>0,enumLabels:[]};});
 return validateProject({schemaVersion:2,id:'plugin-'+inspection.classId.toLowerCase(),name:inspection.name,plugin:{vendor:inspection.vendor||'Unknown vendor',name:inspection.name,format:'VST3',classId:inspection.classId},target:{kind:'live-exposed',liveVersion:'unverified',maxVersion:'unverified',reconnect:'previous-on-load'},parameters,
  widgets:selected.map((p,i)=>({id:'knob-'+p.id,type:'knob',parameterId:'vst3-'+p.id,label:parameters[i].name,x:8+(i%columns)*128,y:48+Math.floor(i/columns)*168,width:120,height:160,design:'monitor',accent:'mint',stepCount:p.stepCount>0&&p.stepCount<128?p.stepCount+1:0,stepValues:[]})),panel:{width:Math.max(320,columns*128+16),height:rows*168+56,grid:8},theme:'dark',dataSource:'demo-only'});
}
