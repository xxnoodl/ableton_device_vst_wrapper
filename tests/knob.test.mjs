import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dragValue,keyValue,clamp,detentValues,snapValue,knobPosition,positionValue,steppedKey} from '../apps/studio/knob.js';
test('knob drag supports negative ranges, fine adjustment and clamping',()=>{
 assert.equal(dragValue(-30,-100,-60,0),0);assert.equal(dragValue(-30,100,-60,0),-60);
 assert.equal(dragValue(.5,-20,0,1),.6);assert.equal(dragValue(.5,-20,0,1,true),.51);
 assert.equal(dragValue(0,100,0,1),0);assert.throws(()=>clamp(NaN,0,1));
});
test('keyboard uses small, fine and page steps with explicit endpoints',()=>{
 assert.equal(keyValue(.5,'ArrowUp',0,1),.51);assert.equal(keyValue(.5,'ArrowDown',0,1,true),.499);
 assert.equal(keyValue(.5,'Home',0,1),0);assert.equal(keyValue(.5,'End',0,1),1);assert.equal(keyValue(.95,'PageUp',0,1),1);assert.equal(keyValue(.5,'Tab',0,1),null);
});

test('custom ratio detents never emit intermediate values and keyboard moves one stop',()=>{
 const stops=detentValues(1,20,0,[4,8,10]);
 assert.equal(snapValue(6.5,1,20,stops),8);
 assert.equal(steppedKey(4,'ArrowUp',1,20,stops,true),8);
 assert.equal(steppedKey(8,'ArrowUp',1,20,stops),10);
 assert.equal(steppedKey(10,'End',1,20,stops),10);
 assert.equal(steppedKey(4,'Home',1,20,stops),4);
 for(let i=0;i<=200;i++)assert.ok(stops.includes(positionValue(i/200,1,20,stops)));
 assert.equal(knobPosition(8,1,20,stops),.5);
});
test('even detents include endpoints and accumulating sub-step motion eventually advances',()=>{
 const stops=detentValues(0,1,5);assert.deepEqual(stops,[0,.25,.5,.75,1]);
 let raw=0;for(let i=0;i<30;i++)raw=dragValue(raw,-1,0,1);
 assert.equal(positionValue(raw,0,1,stops),.25);
 assert.equal(positionValue(1,0,1,stops),1);assert.equal(steppedKey(1,'ArrowUp',0,1,stops),1);
});
