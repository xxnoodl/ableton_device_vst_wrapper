import {parseHostCapture,projectFromCapture,type HostCapture} from '../host-capture/index.ts';
import {validateProject,type Project} from '../schema/index.ts';
import {validateDeviceTemplate} from '../export/index.ts';
export type LiveDevice={id:string;label:string;pluginName:string;capture:HostCapture|null;diagnostic:string|null};
export type LiveCatalog={catalogVersion:1;source:'live-session-exposed';devices:LiveDevice[];diagnostics:string[]};
function fields(o:unknown,keys:string[]):Record<string,unknown>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(o,k)))throw new Error('Invalid Live session fields');return o as Record<string,unknown>;}
function text(value:unknown,max=160){if(typeof value!=='string'||!value.trim()||value.length>max||/[\x00-\x1f]/.test(value))throw new Error('Invalid Live session text');return value;}
export function validateLiveCatalog(input:unknown):LiveCatalog{
 const o=fields(input,['catalogVersion','source','devices','diagnostics']);
 if(o.catalogVersion!==1||o.source!=='live-session-exposed'||!Array.isArray(o.devices)||o.devices.length>128||!Array.isArray(o.diagnostics)||o.diagnostics.length>128)throw new Error('Invalid Live session catalog');
 const ids=new Set<string>();let count=0;
 const devices=o.devices.map(value=>{const d=fields(value,['id','label','pluginName','capture','diagnostic']),id=text(d.id,64),label=text(d.label,512),pluginName=text(d.pluginName);if(!/^device-[1-9][0-9]*$/.test(id)||ids.has(id))throw new Error('Invalid or duplicate Live device ID');ids.add(id);
  const capture=d.capture===null?null:parseHostCapture(JSON.stringify(d.capture));if(capture&&capture.pluginName!==pluginName)throw new Error('Capture and device names disagree');count+=capture?.parameters.length||0;if(count>4096)throw new Error('Too many Live controls');
  return {id,label,pluginName,capture,diagnostic:d.diagnostic===null?null:text(d.diagnostic,512)};
 });
 const result:LiveCatalog={catalogVersion:1,source:'live-session-exposed',devices,diagnostics:o.diagnostics.map(v=>text(v,512))};
 if(new TextEncoder().encode(JSON.stringify(result)).length>1_000_000)throw new Error('Live catalog exceeds 1 MB');return result;
}
export function projectFromLiveDevice(input:LiveDevice,selectedIds:string[]=[]):Project{
 // Validate the same shape accepted at the bridge boundary, without trusting browser state.
 const device=validateLiveCatalog({catalogVersion:1,source:'live-session-exposed',devices:[input],diagnostics:[]}).devices[0];
 if(!device.capture)throw new Error('No exposed controls. Use Live Configure, then refresh the session.');
 const base=projectFromCapture(device.capture),selected=new Set(selectedIds);
 if(!Array.isArray(selectedIds)||selected.size!==selectedIds.length||selected.size>60||selectedIds.some(id=>!base.parameters.some(p=>p.id===id)))throw new Error('Choose at most 60 available controls');
 const parameters=base.parameters.filter(p=>selected.has(p.id)),columns=Math.min(12,Math.max(2,Math.ceil(parameters.length/5))),rows=Math.max(1,Math.ceil(parameters.length/columns));
 return validateProject({...base,parameters:base.parameters,target:{...base.target,reconnect:'previous-on-load'},panel:{width:Math.max(320,columns*128+16),height:rows*168+56,grid:8},widgets:parameters.map((p,i)=>({id:'knob-'+p.id,type:'knob',parameterId:p.id,label:p.name,x:8+(i%columns)*128,y:48+Math.floor(i/columns)*168,width:120,height:160,design:'monitor',accent:'mint',stepCount:p.quantized&&p.enumLabels.length>1&&p.enumLabels.length<=128&&p.min===0&&p.max===p.enumLabels.length-1?p.enumLabels.length:0,stepValues:[]}))});
}
export function liveBridgeFiles(sources:Record<string,string>,template:Uint8Array):Record<string,string|Uint8Array>{
 validateDeviceTemplate(template);for(const name of ['session-bridge.js','session-bridge-renderer.js'])if(typeof sources[name]!=='string'||!sources[name].trim())throw new Error('Missing bridge source: '+name);
 return {'Live-Session-Bridge.amxd':new Uint8Array(template),'controller.js':sources['session-bridge.js'],'renderer.js':sources['session-bridge-renderer.js'],'project.runtime.json':'{"bridgeVersion":1}\n','README.txt':'Live session discovery bridge prototype. Keep all files together. With the local studio server running, drag Live-Session-Bridge.amxd onto any audio-capable track in Live. It reads plugin instances and exposed parameter metadata across tracks and rack chains, then sends a bounded catalog only to http://127.0.0.1:5173. It never writes plugin values, changes Configure or hosts DSP. No Node for Max is used.\n\nIn the studio, open Live session, click Refresh session and choose a plugin instance. Check the controls to show and generate its wrapper. Place that wrapper immediately after the intended plugin. Controls not exposed by Live still need Configure. The bridge cannot infer SDK IDs or physical units. Captured current values are reset baselines, not factory defaults.\n\nClick the bridge panel to rescan. bindselected is also a rescan alias on this reused development shell; it does not bind a plugin. Disconnect cancels scans, HTTP requests and polling. Click the panel to reconnect. Catalogs stay only in server memory and include track/device names and parameter values. One bridge per Live session is intended. New bridge host behavior and clean-machine dependencies still need verification.\n'};
}
