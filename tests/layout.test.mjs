import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseProject,validateProject} from '../packages/schema/index.ts';
import {selection,moveSelection,resizeWidget,alignWidgets,distributeWidgets,duplicateWidgets,groupWidgets,lockWidgets,reorderWidgets,deleteWidgets,assertLayoutChange,rectanglesOverlap,cableGeometry,planMove} from '../packages/layout-engine/index.ts';
const sample=()=>parseProject(readFileSync(new URL('../fixtures/compressor.project.json',import.meta.url),'utf8'));

test('default placement avoids neighbours and direct edits require explicit overlap',()=>{
 const p=sample(),id=p.widgets[0].id,moved=moveSelection(p,[id],120,0),a=moved.widgets[0];
 for(const b of moved.widgets.slice(1))assert.equal(rectanglesOverlap(a,b,p.canvas.gap),false);
 const next=structuredClone(p);next.widgets[0].x=next.widgets[1].x;
 assert.throws(()=>assertLayoutChange(p,next),/Allow overlap/);
 next.canvas.allowOverlap=true;assert.doesNotThrow(()=>assertLayoutChange(p,next));
 assert.throws(()=>assertLayoutChange(next,{...next,canvas:{...next.canvas,allowOverlap:false}}),/Allow overlap/);
});

test('absolute grid snapping corrects an off-grid origin and can be disabled',()=>{
 const p=sample();p.widgets=p.widgets.slice(0,1);p.widgets[0].x=19;
 assert.equal(moveSelection(p,[p.widgets[0].id],8,0).widgets[0].x,24);
 p.canvas.snapToGrid=false;assert.equal(moveSelection(p,[p.widgets[0].id],8,0).widgets[0].x,27);
 assert.deepEqual(planMove(p,[],8,0).guides,[]);
});

test('visual cables survive validation, track controls and disappear with deleted endpoints',()=>{
 const p=sample(),[a,b]=p.widgets;p.connections=[{id:'wire',kind:'visual',fromWidgetId:a.id,toWidgetId:b.id,accent:'mint',slack:18}];
 const validated=validateProject(p),g=cableGeometry(validated,p.connections[0]);
 assert.equal(g.start.x,a.x+a.width);assert.equal(g.end.x,b.x);
 assert.equal(deleteWidgets(validated,[a.id]).connections.length,0);
 assert.throws(()=>validateProject({...p,connections:[{...p.connections[0],toWidgetId:'missing'}]}));
 assert.throws(()=>validateProject({...p,connections:[{...p.connections[0],kind:'macro'}]}));
 assert.throws(()=>validateProject({...p,canvas:{...p.canvas,gap:-1}}));
});
test('group move preserves spacing, snaps as a unit and clamps at panel edges',()=>{
 const p=sample();p.canvas.allowOverlap=true;const ids=p.widgets.slice(0,2).map(w=>w.id);const grouped=groupWidgets(p,ids,'pair');assert.equal(selection(grouped,[ids[0]]).length,2);
 const moved=moveSelection(grouped,[ids[0]],1000,-1000);assert.equal(moved.widgets[1].x-moved.widgets[0].x,120);assert.equal(moved.widgets[1].x+moved.widgets[1].width,640);assert.equal(moved.widgets[0].y,0);assert.equal(p.widgets[0].x,16);
});
test('locked groups resist movement, deletion and alignment while allowing explicit unlock',()=>{
 const p=sample(),ids=p.widgets.slice(0,2).map(w=>w.id);const locked=lockWidgets(groupWidgets(p,ids,'pair'),[ids[0]],true);
 assert.equal(locked.widgets[1].locked,true);assert.deepEqual(moveSelection(locked,ids,10,10),locked);assert.deepEqual(deleteWidgets(locked,ids),locked);
 const unlocked=lockWidgets(locked,[ids[0]],false);assert.equal(deleteWidgets(unlocked,[ids[0]]).widgets.length,3);
});
test('alignment and equal-gap distribution handle different sizes without mutating input',()=>{
 const p=sample(),ids=p.widgets.slice(0,3).map(w=>w.id);const aligned=alignWidgets(p,ids,'bottom');assert.equal(new Set(aligned.widgets.slice(0,3).map(w=>w.y+w.height)).size,1);
 const irregular=structuredClone(p);irregular.widgets[1].x=170;const distributed=distributeWidgets(irregular,ids,'x');assert.equal(distributed.widgets[1].x,136);assert.equal(irregular.widgets[1].x,170);
 assert.throws(()=>distributeWidgets({...p,widgets:p.widgets.map(w=>({...w,x:0}))},ids,'x'),/space/);
});
test('resize stays within bounds and enforces minimums',()=>{
 const p=sample();p.canvas.allowOverlap=true;const id=p.widgets[0].id;const large=resizeWidget(p,id,9999,9999);assert.equal(large.widgets[0].width,624);assert.equal(large.widgets[0].height,220);
 const small=resizeWidget(p,id,0,0);assert.equal(small.widgets[0].width,96);assert.equal(small.widgets[0].height,110);assert.throws(()=>resizeWidget(p,id,NaN,100));
});
test('duplicate creates fresh group and widget IDs and layering is stable',()=>{
 const p=sample();p.panel.height=600;const ids=p.widgets.slice(0,2).map(w=>w.id);let n=0;const grouped=groupWidgets(p,ids,'original');const result=duplicateWidgets(grouped,[ids[0]],()=>`copy-${++n}`);
 assert.equal(result.ids.length,2);assert.equal(result.project.widgets.length,7);assert.notEqual(result.project.widgets[5].groupId,'original');assert.equal(result.project.widgets[5].groupId,result.project.widgets[6].groupId);
 const front=reorderWidgets(p,[ids[0]],true);assert.equal(front.widgets.at(-1).id,ids[0]);assert.equal(reorderWidgets(front,[ids[0]],false).widgets[0].id,ids[0]);assert.equal(p.widgets.length,5);
});
test('legacy widgets default to unlocked and ungrouped; invalid lock metadata is rejected',()=>{
 const p=sample();assert.equal(p.widgets[0].locked,false);assert.equal(p.widgets[0].groupId,null);p.widgets[0].locked='yes';assert.throws(()=>validateProject(p));
});
