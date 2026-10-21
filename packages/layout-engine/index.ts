import {validateProject,type Project,type Widget} from '../schema/index.ts';
export function rectanglesOverlap(a:Pick<Widget,'x'|'y'|'width'|'height'>,b:Pick<Widget,'x'|'y'|'width'|'height'>,gap=0){return a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;}
export function cableGeometry(project:Pick<Project,'widgets'|'panel'>,c:Project['connections'][number]){
 const a=project.widgets.find(w=>w.id===c.fromWidgetId)!,b=project.widgets.find(w=>w.id===c.toWidgetId)!;
 const dx=b.x+b.width/2-a.x-a.width/2,dy=b.y+b.height/2-a.y-a.height/2,horizontal=Math.abs(dx)>=Math.abs(dy),direction=(horizontal?dx:dy)>=0?1:-1;
 const start=horizontal?{x:a.x+(direction>0?a.width:0),y:a.y+a.height/2}:{x:a.x+a.width/2,y:a.y+(direction>0?a.height:0)};
 const end=horizontal?{x:b.x+(direction>0?0:b.width),y:b.y+b.height/2}:{x:b.x+b.width/2,y:b.y+(direction>0?0:b.height)};
 const reach=Math.max(4,Math.abs(horizontal?end.x-start.x:end.y-start.y)*.4),clamp=(p:{x:number;y:number})=>({x:Math.max(0,Math.min(project.panel.width,p.x)),y:Math.max(0,Math.min(project.panel.height,p.y))});
 const c1=clamp(horizontal?{x:start.x+direction*reach,y:start.y+c.slack}:{x:start.x+c.slack,y:start.y+direction*reach});
 const c2=clamp(horizontal?{x:end.x-direction*reach,y:end.y+c.slack}:{x:end.x+c.slack,y:end.y-direction*reach});
 return {start,end,c1,c2};
}
export function assertLayoutChange(before:Project,next:Project):Project{
 next=validateProject(next);if(next.canvas.allowOverlap)return next;
 const old=new Map(before.widgets.map(w=>[w.id,w]));
 const changed=(w:Widget)=>{const p=old.get(w.id);return !p||p.x!==w.x||p.y!==w.y||p.width!==w.width||p.height!==w.height;};
 for(let i=0;i<next.widgets.length;i++)for(let j=i+1;j<next.widgets.length;j++){const a=next.widgets[i],b=next.widgets[j];if((changed(a)||changed(b)||before.canvas.allowOverlap)&&rectanglesOverlap(a,b,next.canvas.gap))throw new Error('Controls need space between them. Move them apart or enable Allow overlap.');}
 return next;
}
function translation(project:Project,widgets:Widget[],others:Widget[],dx:number,dy:number):[number,number]|null{
 const left=Math.min(...widgets.map(w=>w.x)),right=Math.max(...widgets.map(w=>w.x+w.width)),top=Math.min(...widgets.map(w=>w.y)),bottom=Math.max(...widgets.map(w=>w.y+w.height));
 const minX=-left,maxX=project.panel.width-right,minY=-top,maxY=project.panel.height-bottom,gap=project.canvas.gap,grid=project.panel.grid;
 const valid=(x:number,y:number)=>x>=minX&&x<=maxX&&y>=minY&&y<=maxY&&(project.canvas.allowOverlap||!widgets.some(w=>others.some(o=>rectanglesOverlap({...w,x:w.x+x,y:w.y+y},o,gap))));
 if(valid(dx,dy))return [dx,dy];
 const xs=[dx,minX,maxX,0],ys=[dy,minY,maxY,0];
 for(const o of others){xs.push(o.x-gap-right,o.x+o.width+gap-left);ys.push(o.y-gap-bottom,o.y+o.height+gap-top);}
 const candidates=(values:number[],wanted:number,anchor:number,lo:number,hi:number)=>[...new Set(values.flatMap(v=>project.canvas.snapToGrid?[Math.floor((anchor+v)/grid)*grid-anchor,Math.ceil((anchor+v)/grid)*grid-anchor]:[v]))].filter(v=>v>=lo&&v<=hi).sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted)).slice(0,14);
 const pairs=candidates(xs,dx,left,minX,maxX).flatMap(x=>candidates(ys,dy,top,minY,maxY).map(y=>({x,y,cost:(x-dx)**2+(y-dy)**2}))).sort((a,b)=>a.cost-b.cost);
 for(const p of pairs)if(valid(p.x,p.y))return [p.x,p.y];return null;
}
export function planMove(project:Project,ids:string[],dx:number,dy:number,smart=true):{project:Project;guides:{axis:'x'|'y';position:number}[]}{
 if(![dx,dy].every(Number.isFinite))throw new Error('Invalid movement');const widgets=editable(project,ids);if(!widgets.length)return {project,guides:[]};
 const left=Math.min(...widgets.map(w=>w.x)),top=Math.min(...widgets.map(w=>w.y)),right=Math.max(...widgets.map(w=>w.x+w.width)),bottom=Math.max(...widgets.map(w=>w.y+w.height)),grid=project.panel.grid;
 if(project.canvas.snapToGrid){dx=Math.round((left+dx)/grid)*grid-left;dy=Math.round((top+dy)/grid)*grid-top;}
 dx=Math.max(-left,Math.min(project.panel.width-right,dx));dy=Math.max(-top,Math.min(project.panel.height-bottom,dy));
 const set=new Set(widgets.map(w=>w.id)),others=project.widgets.filter(w=>!set.has(w.id)),guides:{axis:'x'|'y';position:number}[]=[];
 if(smart&&project.canvas.snapToControls){
  const snapAxis=(axis:'x'|'y',delta:number,a:number,b:number)=>{let best=delta,distance=6,position:number|undefined;for(const o of others){const start=axis==='x'?o.x:o.y,end=start+(axis==='x'?o.width:o.height);for(const anchor of [a,(a+b)/2,b])for(const line of [start,(start+end)/2,end]){const proposed=line-anchor,diff=Math.abs(proposed-delta);if(diff<distance){distance=diff;best=proposed;position=line;}}}if(position!==undefined)guides.push({axis,position});return best;};
  dx=snapAxis('x',dx,left,right);dy=snapAxis('y',dy,top,bottom);
 }
 const resolved=translation(project,widgets,others,dx,dy);if(!resolved)return {project,guides:[]};
 const [x,y]=resolved;return {project:validateProject({...project,widgets:project.widgets.map(w=>set.has(w.id)?{...w,x:w.x+x,y:w.y+y}:w)}),guides:guides.filter(g=>g.axis==='x'?x===dx:y===dy)};
}
export function selection(project:Project,ids:string[]):Widget[]{const set=new Set(ids);const groups=new Set(project.widgets.filter(w=>set.has(w.id)&&w.groupId).map(w=>w.groupId));return project.widgets.filter(w=>set.has(w.id)||(w.groupId&&groups.has(w.groupId)));}
function editable(project:Project,ids:string[]):Widget[]{const blocked=new Set(project.widgets.filter(w=>w.locked&&w.groupId).map(w=>w.groupId));return selection(project,ids).filter(w=>!w.locked&&(!w.groupId||!blocked.has(w.groupId)));}
export function moveSelection(project:Project,ids:string[],dx:number,dy:number):Project{
 return planMove(project,ids,dx,dy,false).project;
}
export function resizeWidget(project:Project,id:string,width:number,height:number):Project{
 if(![width,height].every(Number.isFinite))throw new Error('Invalid size');const grid=project.panel.grid;
 const active=editable(project,[id]).find(w=>w.id===id);if(!active)return project;
 const snap=(n:number)=>project.canvas.snapToGrid?Math.round(n/grid)*grid:n;
 width=Math.max(96,Math.min(project.panel.width-active.x,snap(width)));height=Math.max(110,Math.min(project.panel.height-active.y,snap(height)));
 const others=project.widgets.filter(w=>w.id!==id),gap=project.canvas.gap;
 const valid=(width:number,height:number)=>project.canvas.allowOverlap||!others.some(w=>rectanglesOverlap({...active,width,height},w,gap));
 if(!valid(width,height)){const sizes=[{width:active.width,height:active.height},...others.flatMap(w=>[{width:Math.min(width,w.x-gap-active.x),height},{width,height:Math.min(height,w.y-gap-active.y)}])].filter(s=>s.width>=96&&s.height>=110&&valid(s.width,s.height)).sort((a,b)=>(a.width-width)**2+(a.height-height)**2-((b.width-width)**2+(b.height-height)**2));if(!sizes.length)return project;width=sizes[0].width;height=sizes[0].height;}
 return validateProject({...project,widgets:project.widgets.map(w=>w.id===id?{...w,width,height}:w)});
}
export function alignWidgets(project:Project,ids:string[],mode:'left'|'center'|'right'|'top'|'middle'|'bottom'):Project{
 if(!['left','center','right','top','middle','bottom'].includes(mode))throw new Error('Unknown alignment');
 const widgets=editable(project,ids);if(widgets.length<2)return project;
 const left=Math.min(...widgets.map(w=>w.x)),right=Math.max(...widgets.map(w=>w.x+w.width)),top=Math.min(...widgets.map(w=>w.y)),bottom=Math.max(...widgets.map(w=>w.y+w.height));
 const selected=new Set(widgets.map(w=>w.id));
 return assertLayoutChange(project,{...project,widgets:project.widgets.map(w=>{if(!selected.has(w.id))return w;const next={...w};if(mode==='left')next.x=left;if(mode==='right')next.x=right-w.width;if(mode==='center')next.x=(left+right-w.width)/2;if(mode==='top')next.y=top;if(mode==='bottom')next.y=bottom-w.height;if(mode==='middle')next.y=(top+bottom-w.height)/2;return next;})});
}
export function distributeWidgets(project:Project,ids:string[],axis:'x'|'y'):Project{
 if(!['x','y'].includes(axis))throw new Error('Unknown distribution axis');const widgets=editable(project,ids).sort((a,b)=>a[axis]-b[axis]);if(widgets.length<3)return project;
 const size=axis==='x'?'width':'height',start=widgets[0][axis],end=widgets.at(-1)![axis]+widgets.at(-1)![size];
 const gap=(end-start-widgets.reduce((n,w)=>n+w[size],0))/(widgets.length-1);if(gap<0)throw new Error('Not enough space to distribute without overlap');
 const positions=new Map<string,number>();let cursor=start;for(const w of widgets){positions.set(w.id,cursor);cursor+=w[size]+gap;}
 return assertLayoutChange(project,{...project,widgets:project.widgets.map(w=>positions.has(w.id)?{...w,[axis]:positions.get(w.id)}:w)});
}
export function duplicateWidgets(project:Project,ids:string[],makeId:()=>string):{project:Project;ids:string[]}{
 const widgets=selection(project,ids),newIds:string[]=[],groups=new Map<string,string>(),mapping=new Map<string,string>();if(!widgets.length)return {project,ids:[]};
 const right=Math.max(0,...widgets.map(w=>w.x+w.width)),bottom=Math.max(0,...widgets.map(w=>w.y+w.height));const dx=Math.min(project.panel.grid*2,project.panel.width-right),dy=Math.min(project.panel.grid*2,project.panel.height-bottom);
 const offset=translation(project,widgets,project.widgets,dx,dy);if(!offset)throw new Error('No free space for a duplicate. Enlarge the panel or enable Allow overlap.');
 const copies=widgets.map(w=>{const id=makeId();mapping.set(w.id,id);newIds.push(id);if(w.groupId&&!groups.has(w.groupId))groups.set(w.groupId,makeId());return {...w,id,x:w.x+offset[0],y:w.y+offset[1],locked:false,groupId:w.groupId?groups.get(w.groupId)!:null};});
 const connections=project.connections.filter(c=>mapping.has(c.fromWidgetId)&&mapping.has(c.toWidgetId)).map(c=>({...c,id:makeId(),fromWidgetId:mapping.get(c.fromWidgetId)!,toWidgetId:mapping.get(c.toWidgetId)!}));
 return {project:assertLayoutChange(project,{...project,widgets:[...project.widgets,...copies],connections:[...project.connections,...connections]}),ids:newIds};
}
export function groupWidgets(project:Project,ids:string[],groupId:string|null):Project{
 const set=new Set(editable(project,ids).map(w=>w.id));return validateProject({...project,widgets:project.widgets.map(w=>set.has(w.id)?{...w,groupId}:w)});
}
export function lockWidgets(project:Project,ids:string[],locked:boolean):Project{const set=new Set(selection(project,ids).map(w=>w.id));return validateProject({...project,widgets:project.widgets.map(w=>set.has(w.id)?{...w,locked}:w)});}
export function reorderWidgets(project:Project,ids:string[],front:boolean):Project{const set=new Set(selection(project,ids).filter(w=>!w.locked).map(w=>w.id));const picked=project.widgets.filter(w=>set.has(w.id)),other=project.widgets.filter(w=>!set.has(w.id));return validateProject({...project,widgets:front?[...other,...picked]:[...picked,...other]});}
export function deleteWidgets(project:Project,ids:string[]):Project{const set=new Set(editable(project,ids).map(w=>w.id));return validateProject({...project,widgets:project.widgets.filter(w=>!set.has(w.id)),connections:project.connections.filter(c=>!set.has(c.fromWidgetId)&&!set.has(c.toWidgetId))});}
