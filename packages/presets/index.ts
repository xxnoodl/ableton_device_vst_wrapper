import {validateProject,type Project,type Widget} from '../schema/index.ts';
import {assertLayoutChange,rectanglesOverlap} from '../layout-engine/index.ts';
function presetName(name:string):string{if(!name.trim())throw new Error('Enter a preset name');return name.trim();}
export function saveFunctionalityPreset(project:Project,id:string,name:string):Project{
 name=presetName(name);if(project.functionalityPresets.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw new Error('A function preset with that name exists; choose another name');
 return validateProject({...project,functionalityPresets:[...project.functionalityPresets,{id,name,parameterIds:[...new Set(project.widgets.map(w=>w.parameterId))]}]});
}
export function saveLayoutPreset(project:Project,id:string,name:string):Project{
 name=presetName(name);if(project.layoutPresets.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw new Error('A layout preset with that name exists; choose another name');
 return validateProject({...project,layoutPresets:[...project.layoutPresets,{id,name,widgets:project.widgets,panel:project.panel,theme:project.theme,canvas:project.canvas,connections:project.connections}]});
}
function freeSlot(project:Project,widgets:Widget[],width:number,height:number):{x:number;y:number}{
 const grid=project.panel.grid;
 for(let y=48;y+height<=project.panel.height;y+=grid)for(let x=8;x+width<=project.panel.width;x+=grid)if(!widgets.some(w=>rectanglesOverlap({x,y,width,height},w,project.canvas.gap)))return {x,y};
 throw new Error('Not enough free panel space; resize the panel or remove controls first');
}
export function exposeParameters(project:Project,parameterIds:string[],makeId:()=>string):Project{
 const requested=new Set(parameterIds);if(requested.size!==parameterIds.length||parameterIds.some(id=>!project.parameters.some(p=>p.id===id)))throw new Error('Invalid function selection');
 if(project.widgets.some(w=>w.locked&&!requested.has(w.parameterId)))throw new Error('Unlock controls before hiding them');
 const widgets=project.widgets.filter(w=>requested.has(w.parameterId));
 for(const id of parameterIds){if(widgets.some(w=>w.parameterId===id))continue;const p=project.parameters.find(p=>p.id===id)!;const width=112,height=project.panel.height>=208?160:110;const position=freeSlot(project,widgets,width,height);
 widgets.push({id:makeId(),type:'knob',label:p.name,parameterId:id,...position,width,height,design:'monitor',accent:'mint',stepCount:p.quantized&&p.enumLabels.length>=2&&p.enumLabels.length<=128&&p.min===0&&p.max===p.enumLabels.length-1?p.enumLabels.length:0,stepValues:[],locked:false,groupId:null});}
 const ids=new Set(widgets.map(w=>w.id));return validateProject({...project,widgets,connections:project.connections.filter(c=>ids.has(c.fromWidgetId)&&ids.has(c.toWidgetId))});
}
export function applyFunctionalityPreset(project:Project,id:string,makeId:()=>string):Project{
 const preset=project.functionalityPresets.find(p=>p.id===id);if(!preset)throw new Error('Unknown function preset');return exposeParameters(project,preset.parameterIds,makeId);
}
export function applyLayoutPreset(project:Project,id:string):Project{
 const preset=project.layoutPresets.find(p=>p.id===id);if(!preset)throw new Error('Unknown layout preset');
 // Preserve the currently exposed functions. Only restyle/reposition corresponding controls.
 const widgets=project.widgets.map(w=>{if(w.locked)return w;const match=preset.widgets.find(p=>p.id===w.id)||preset.widgets.find(p=>p.parameterId===w.parameterId);return match?{...match,id:w.id,parameterId:w.parameterId,groupId:w.groupId,locked:w.locked}:w;});
 const mapping=new Map(preset.widgets.flatMap(saved=>{const match=widgets.find(w=>w.id===saved.id)||widgets.find(w=>w.parameterId===saved.parameterId);return match?[[saved.id,match.id]]:[];}));
 const connections=preset.connections.filter(c=>mapping.has(c.fromWidgetId)&&mapping.has(c.toWidgetId)).map(c=>({...c,fromWidgetId:mapping.get(c.fromWidgetId)!,toWidgetId:mapping.get(c.toWidgetId)!}));
 return assertLayoutChange(project,{...project,widgets,panel:preset.panel,theme:preset.theme,canvas:preset.canvas,connections});
}
