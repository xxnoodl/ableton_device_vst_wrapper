import {validateProject,type Project,type Widget} from '../schema/index.ts';
export function selection(project:Project,ids:string[]):Widget[]{const set=new Set(ids);const groups=new Set(project.widgets.filter(w=>set.has(w.id)&&w.groupId).map(w=>w.groupId));return project.widgets.filter(w=>set.has(w.id)||(w.groupId&&groups.has(w.groupId)));}
function editable(project:Project,ids:string[]):Widget[]{const blocked=new Set(project.widgets.filter(w=>w.locked&&w.groupId).map(w=>w.groupId));return selection(project,ids).filter(w=>!w.locked&&(!w.groupId||!blocked.has(w.groupId)));}
export function moveSelection(project:Project,ids:string[],dx:number,dy:number):Project{
 if(![dx,dy].every(Number.isFinite))throw new Error('Invalid movement');const widgets=editable(project,ids);if(!widgets.length)return project;
 const grid=project.panel.grid;dx=Math.round(dx/grid)*grid;dy=Math.round(dy/grid)*grid;
 dx=Math.max(-Math.min(...widgets.map(w=>w.x)),Math.min(project.panel.width-Math.max(...widgets.map(w=>w.x+w.width)),dx));
 dy=Math.max(-Math.min(...widgets.map(w=>w.y)),Math.min(project.panel.height-Math.max(...widgets.map(w=>w.y+w.height)),dy));
 const set=new Set(widgets.map(w=>w.id));return validateProject({...project,widgets:project.widgets.map(w=>set.has(w.id)?{...w,x:w.x+dx,y:w.y+dy}:w)});
}
export function resizeWidget(project:Project,id:string,width:number,height:number):Project{
 if(![width,height].every(Number.isFinite))throw new Error('Invalid size');const grid=project.panel.grid;
 return validateProject({...project,widgets:project.widgets.map(w=>w.id!==id||w.locked?w:{...w,width:Math.max(96,Math.min(project.panel.width-w.x,Math.round(width/grid)*grid)),height:Math.max(110,Math.min(project.panel.height-w.y,Math.round(height/grid)*grid))})});
}
export function alignWidgets(project:Project,ids:string[],mode:'left'|'center'|'right'|'top'|'middle'|'bottom'):Project{
 if(!['left','center','right','top','middle','bottom'].includes(mode))throw new Error('Unknown alignment');
 const widgets=editable(project,ids);if(widgets.length<2)return project;
 const left=Math.min(...widgets.map(w=>w.x)),right=Math.max(...widgets.map(w=>w.x+w.width)),top=Math.min(...widgets.map(w=>w.y)),bottom=Math.max(...widgets.map(w=>w.y+w.height));
 const selected=new Set(widgets.map(w=>w.id));
 return validateProject({...project,widgets:project.widgets.map(w=>{if(!selected.has(w.id))return w;const next={...w};if(mode==='left')next.x=left;if(mode==='right')next.x=right-w.width;if(mode==='center')next.x=(left+right-w.width)/2;if(mode==='top')next.y=top;if(mode==='bottom')next.y=bottom-w.height;if(mode==='middle')next.y=(top+bottom-w.height)/2;return next;})});
}
export function distributeWidgets(project:Project,ids:string[],axis:'x'|'y'):Project{
 if(!['x','y'].includes(axis))throw new Error('Unknown distribution axis');const widgets=editable(project,ids).sort((a,b)=>a[axis]-b[axis]);if(widgets.length<3)return project;
 const size=axis==='x'?'width':'height',start=widgets[0][axis],end=widgets.at(-1)![axis]+widgets.at(-1)![size];
 const gap=(end-start-widgets.reduce((n,w)=>n+w[size],0))/(widgets.length-1);if(gap<0)throw new Error('Not enough space to distribute without overlap');
 const positions=new Map<string,number>();let cursor=start;for(const w of widgets){positions.set(w.id,cursor);cursor+=w[size]+gap;}
 return validateProject({...project,widgets:project.widgets.map(w=>positions.has(w.id)?{...w,[axis]:positions.get(w.id)}:w)});
}
export function duplicateWidgets(project:Project,ids:string[],makeId:()=>string):{project:Project;ids:string[]}{
 const widgets=selection(project,ids),newIds:string[]=[],groups=new Map<string,string>();
 const right=Math.max(0,...widgets.map(w=>w.x+w.width)),bottom=Math.max(0,...widgets.map(w=>w.y+w.height));const dx=Math.min(project.panel.grid*2,project.panel.width-right),dy=Math.min(project.panel.grid*2,project.panel.height-bottom);
 const copies=widgets.map(w=>{const id=makeId();newIds.push(id);if(w.groupId&&!groups.has(w.groupId))groups.set(w.groupId,makeId());return {...w,id,x:w.x+dx,y:w.y+dy,locked:false,groupId:w.groupId?groups.get(w.groupId)!:null};});
 return {project:validateProject({...project,widgets:[...project.widgets,...copies]}),ids:newIds};
}
export function groupWidgets(project:Project,ids:string[],groupId:string|null):Project{
 const set=new Set(editable(project,ids).map(w=>w.id));return validateProject({...project,widgets:project.widgets.map(w=>set.has(w.id)?{...w,groupId}:w)});
}
export function lockWidgets(project:Project,ids:string[],locked:boolean):Project{const set=new Set(selection(project,ids).map(w=>w.id));return validateProject({...project,widgets:project.widgets.map(w=>set.has(w.id)?{...w,locked}:w)});}
export function reorderWidgets(project:Project,ids:string[],front:boolean):Project{const set=new Set(selection(project,ids).filter(w=>!w.locked).map(w=>w.id));const picked=project.widgets.filter(w=>set.has(w.id)),other=project.widgets.filter(w=>!set.has(w.id));return validateProject({...project,widgets:front?[...other,...picked]:[...picked,...other]});}
export function deleteWidgets(project:Project,ids:string[]):Project{const set=new Set(editable(project,ids).map(w=>w.id));return validateProject({...project,widgets:project.widgets.filter(w=>!set.has(w.id))});}
