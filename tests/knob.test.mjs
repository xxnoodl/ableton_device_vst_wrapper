import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dragValue,keyValue,clamp} from '../apps/studio/knob.js';
test('knob drag supports negative ranges, fine adjustment and clamping',()=>{
 assert.equal(dragValue(-30,-100,-60,0),0);assert.equal(dragValue(-30,100,-60,0),-60);
 assert.equal(dragValue(.5,-20,0,1),.6);assert.equal(dragValue(.5,-20,0,1,true),.51);
 assert.equal(dragValue(0,100,0,1),0);assert.throws(()=>clamp(NaN,0,1));
});
test('keyboard uses small, fine and page steps with explicit endpoints',()=>{
 assert.equal(keyValue(.5,'ArrowUp',0,1),.51);assert.equal(keyValue(.5,'ArrowDown',0,1,true),.499);
 assert.equal(keyValue(.5,'Home',0,1),0);assert.equal(keyValue(.5,'End',0,1),1);assert.equal(keyValue(.95,'PageUp',0,1),1);assert.equal(keyValue(.5,'Tab',0,1),null);
});
