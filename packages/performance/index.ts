import '../../max/runtime/performance-core.js';
import {validateDeviceTemplate} from '../export/index.ts';
import {validateProject,type Project} from '../schema/index.ts';
export type RackParameter={id:string;name:string;min:number;max:number;quantized:boolean};
export type RackTarget={id:string;label:string;pluginName:string;parameters:RackParameter[]};
export type Macro={id:string;label:string;value:number};
export type Route={id:string;macroId:string;targetId:string;parameterId:string;inputMin:number;inputMax:number;outputMin:number;outputMax:number;curve:number;steps:number[];smoothingMs:number;enabled:boolean};
export type Rack={rackVersion:1;name:string;targets:RackTarget[];macros:Macro[];routes:Route[]};
const core=(globalThis as any).PerformanceRouting;
export const validateRack=(input:unknown):Rack=>{const rack=core.validate(input);if(new TextEncoder().encode(JSON.stringify(rack)).length>1_000_000)throw new Error('Rack exceeds 1 MB');return rack;};
export const parseRack=(raw:string):Rack=>{if(new TextEncoder().encode(raw).length>1_000_000)throw new Error('Rack exceeds 1 MB');return core.parse(raw);};
export const evaluateMacro=(rack:Rack,id:string,value:number):{routeId:string;targetId:string;parameterId:string;value:number;smoothingMs:number}[]=>core.evaluate(rack,id,value);
export function targetFromProject(input:Project,id:string):RackTarget{
 const project=validateProject(input),used=new Set(project.widgets.map(w=>w.parameterId));
 const parameters=project.parameters.filter(p=>used.has(p.id)&&['host-captured','user-reported'].includes(p.evidence)&&p.quantized!==null).map(({id,name,min,max,quantized})=>({id,name,min,max,quantized:quantized as boolean}));
 if(!parameters.length)throw new Error('No checked Live controls with known quantization. Capture metadata first; native-only and synthetic controls cannot route.');
 const target={id,label:project.plugin.name,pluginName:project.plugin.name,parameters};validateRack({rackVersion:1,name:'Target validation',targets:[target],macros:[{id:'macro',label:'Macro',value:0}],routes:[]});return target;
}
export function performanceFiles(input:unknown,sources:Record<string,string>,template:Uint8Array):Record<string,string|Uint8Array>{
 const rack=validateRack(input);validateDeviceTemplate(template);
 if(!rack.routes.some(r=>r.enabled))throw new Error('Add an active route before generating');
 const names=['performance-core.js','performance-controller.js','runtime-core.js','renderer.js'];
 for(const name of names)if(typeof sources[name]!=='string'||!sources[name].trim())throw new Error('Missing runtime source: '+name);
 const raw=JSON.stringify(rack,null,2)+'\n';parseRack(raw);
 return {'Wrapper.amxd':new Uint8Array(template),'controller.js':sources['performance-controller.js'],'performance-core.js':sources['performance-core.js'],'runtime-core.js':sources['runtime-core.js'],'renderer.js':sources['renderer.js'],'project.runtime.json':raw,'performance.rack.json':raw,
 'README.txt':'Experimental performance rack. Host verification pending.\n\nExtract all files together and drag Wrapper.amxd into Live. The original plugins remain in their tracks. Expose the requested parameters through Live Configure. Select the plugin instance for '+rack.targets[0].label+', then click bindselected on the rack. Read the status for the next target slot and repeat. Each slot must use a distinct plugin instance. This prototype binds PluginDevice parameters only.\n\nNothing is written during load or binding. Move a macro deliberately to control its destinations. Manual changes override destination automation; Re-Enable Automation in Live restores playback. Mixed means a destination differs from the macro mapping; observations never move other destinations. Disconnect stops pending writes. On Set reopen bind all slots again. Target IDs are never persisted or inferred from names.\n\nRoute input intervals hold their first/last output outside the interval. Curves, reversed output ranges, explicit detents and bounded smoothing are supported. Multiple active routes to the same destination are refused. Stepped routes write only declared stops and disable smoothing. This prototype does not expose macro automation lanes or group native undo. No DSP, Node for Max, automatic reconnect, XY or scenes.\n'};
}
