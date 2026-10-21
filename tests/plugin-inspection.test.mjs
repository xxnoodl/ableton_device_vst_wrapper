import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePluginInspection,selectableParameter,projectFromInspection,verifiedLiveBinding} from '../packages/plugin-inspection/index.ts';
import {diagnoseProject} from '../packages/diagnostics/index.ts';
import {runtimeManifest} from '../packages/export/index.ts';
const parameter=(id,name)=>({id,index:id-1,name,shortName:name,unit:'',stepCount:0,defaultNormalized:.5,reportedDefaultNormalized:.5,metadataValid:true,defaultDisplay:'0.5',plainMin:0,plainMax:1,unitId:0,flags:1,enumLabels:[]});
const inspection=()=>({inspectionVersion:1,status:'ok',vendor:'Test fixture',name:'Test effect',classId:'1'.repeat(32),inventoryId:'a'.repeat(24),fingerprint:'b'.repeat(64),format:'VST3',source:'vst3-controller',bindingStatus:'not-verified-in-live',parameters:[parameter(1,'Level'),parameter(2,'Mix')]});
test('inspection validation preserves stable SDK IDs, units, defaults and unknown Live routing',()=>{
 const raw=inspection(),r=validatePluginInspection(raw);assert.equal(r.parameters[1].id,2);assert.equal(r.bindingStatus,'not-verified-in-live');
 const p=projectFromInspection(r,[2]);assert.equal(p.parameters[0].id,'vst3-2');assert.equal(p.parameters[0].evidence,'native-inspected');assert.equal(p.plugin.classId,r.classId);assert.equal(p.widgets.length,1);
 assert.ok(diagnoseProject(p).some(d=>d.code==='native-binding-unverified'));assert.throws(()=>runtimeManifest(p),/routing is not verified/);
});
test('inspection refuses forged metadata validity, duplicate IDs, unknown fields and invalid selection',()=>{
 for(const mutate of [o=>o.parameters[0].defaultNormalized=2,o=>o.parameters[0].metadataValid=false,o=>o.parameters[1].id=1,o=>o.parameters[0].script='bad',o=>o.parameters[1].index=100,o=>o.fingerprint='not-a-hash']){
  const value=inspection();mutate(value);assert.throws(()=>validatePluginInspection(value));
 }
 assert.throws(()=>projectFromInspection(inspection(),[99]));assert.throws(()=>projectFromInspection(inspection(),[1,1]));
});
test('invalid defaults and read-only, hidden and program parameters remain metadata but cannot become controls',()=>{
 const r=inspection();r.parameters[0]={...r.parameters[0],defaultNormalized:null,reportedDefaultNormalized:-1,metadataValid:false};
 assert.equal(selectableParameter(validatePluginInspection(r).parameters[0]),false);assert.throws(()=>projectFromInspection(r,[1]));
 for(const flags of [0,2,17,32769])assert.equal(selectableParameter({...parameter(1,'Control'),flags}),false);
});
test('multi-component modules require an explicit choice',()=>{
 const raw=inspection();delete raw.name;delete raw.classId;delete raw.parameters;raw.status='choose-class';raw.classes=[{classId:'2'.repeat(32),name:'Component'}];
 assert.equal(validatePluginInspection(raw).classes.length,1);assert.throws(()=>projectFromInspection(raw,[]),/component first/);
});
test('measured adapter is limited to matching binary identity, SDK IDs and names',()=>{
 const r=inspection();r.classId='41727475415649534153747250726F63';r.fingerprint='132f6b1a0e290c43c48ddab7f01b816f09470952b8e5d4eb0127b7aeada42e21';r.vendor='Arturia';r.name='Augmented STRINGS';r.parameters=[parameter(1,'Morph'),{...parameter(4,'Motion'),index:1}];
 const p=projectFromInspection(r,[1,4]);assert.equal(p.widgets.length,2);assert.ok(p.parameters.every(p=>p.evidence==='user-reported'));assert.equal(runtimeManifest(p).demoOnly,false);
 assert.equal(verifiedLiveBinding(validatePluginInspection(r),{...r.parameters[0],plainMax:2}),null);
 r.fingerprint='c'.repeat(64);assert.equal(verifiedLiveBinding(validatePluginInspection(r),r.parameters[0]),null);assert.throws(()=>runtimeManifest(projectFromInspection(r,[1])),/routing is not verified/);
});
test('automatic native selection layout fits sixty controls and refuses overflow without dropping selections',()=>{
 const r=inspection();r.parameters=Array.from({length:61},(_,i)=>parameter(i+1,'Control '+i));
 const p=projectFromInspection(r,Array.from({length:60},(_,i)=>i+1));assert.equal(p.widgets.length,60);assert.ok(p.widgets.every(w=>w.x+w.width<=p.panel.width&&w.y+w.height<=p.panel.height));
 assert.throws(()=>projectFromInspection(r,r.parameters.map(p=>p.id)),/at most 60/);
});
