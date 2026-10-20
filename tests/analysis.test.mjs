import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compressorOutput,peakingCoefficients,responseDb} from '../packages/analysis/index.ts';
import {parseProject,serializeProject,validateProject} from '../packages/schema/index.ts';
const close=(actual,expected,epsilon=1e-7)=>assert.ok(Math.abs(actual-expected)<epsilon,`${actual} != ${expected}`);
test('hard-knee compressor is continuous and follows declared threshold/ratio without invented telemetry',()=>{
 assert.equal(compressorOutput(-30,-18,4),-30);assert.equal(compressorOutput(-6,-18,4),-15);assert.equal(compressorOutput(-18,-18,4),-18);close(compressorOutput(-18+1e-8,-18,4),-18,1e-8);assert.equal(compressorOutput(-6,-18,1),-6);assert.throws(()=>compressorOutput(-6,-18,0));
});
test('RBJ peaking filter has unity response at zero gain and requested gain at center',()=>{
 const unity=peakingCoefficients(1000,.707,0,48000);for(const f of [0,20,100,1000,10000,24000])close(responseDb(unity,f),0);
 for(const gain of [-18,-6,6,18])close(responseDb(peakingCoefficients(1000,.707,gain,48000),1000),gain);
});
test('matched boost/cut are inverse and higher Q narrows the response',()=>{
 const boost=peakingCoefficients(1000,.707,12,48000),cut=peakingCoefficients(1000,.707,-12,48000);
 for(const f of [20,100,500,1000,2000,10000,20000])close(responseDb(boost,f)+responseDb(cut,f),0);
 assert.ok(responseDb(peakingCoefficients(1000,10,6,48000),1500)<responseDb(peakingCoefficients(1000,.5,6,48000),1500));
});
test('declared EQ range keeps poles inside unit circle; invalid filters and host-semantic graphs fail',()=>{
 for(const f of [20,1000,20000])for(const q of [.1,.707,10])for(const gain of [-18,0,18]){const c=peakingCoefficients(f,q,gain,48000),disc=c.a1*c.a1-4*c.a2;if(disc>=0){assert.ok(Math.abs((-c.a1+Math.sqrt(disc))/2)<1);assert.ok(Math.abs((-c.a1-Math.sqrt(disc))/2)<1);}else assert.ok(Math.sqrt(c.a2)<1);}
 assert.throws(()=>peakingCoefficients(24000,1,6,48000));assert.throws(()=>peakingCoefficients(1000,0,6,48000));
 const p=parseProject(readFileSync(new URL('../fixtures/eq.project.json',import.meta.url),'utf8'));assert.equal(parseProject(serializeProject(p)).graphs.length,1);p.parameters[0].evidence='user-reported';assert.throws(()=>validateProject(p),/synthetic parameter/);
});
