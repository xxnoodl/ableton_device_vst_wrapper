// Numeric visualization models only. These functions do not process audio or implement plugin DSP.
export function compressorOutput(inputDb:number,thresholdDb:number,ratio:number):number{
 if(![inputDb,thresholdDb,ratio].every(Number.isFinite)||ratio<1)throw new Error('Invalid compressor contract');
 return inputDb<=thresholdDb?inputDb:thresholdDb+(inputDb-thresholdDb)/ratio;
}
export type Biquad={b0:number;b1:number;b2:number;a1:number;a2:number;sampleRate:number};
export function peakingCoefficients(frequency:number,q:number,gainDb:number,sampleRate:number):Biquad{
 if(![frequency,q,gainDb,sampleRate].every(Number.isFinite)||sampleRate<8000||sampleRate>192000||frequency<=0||frequency>=sampleRate/2||q<=0||q>100||Math.abs(gainDb)>60)throw new Error('Invalid peaking EQ contract');
 const amplitude=10**(gainDb/40),w=2*Math.PI*frequency/sampleRate,alpha=Math.sin(w)/(2*q),cos=Math.cos(w),a0=1+alpha/amplitude;
 return {b0:(1+alpha*amplitude)/a0,b1:-2*cos/a0,b2:(1-alpha*amplitude)/a0,a1:-2*cos/a0,a2:(1-alpha/amplitude)/a0,sampleRate};
}
export function responseDb(filter:Biquad,frequency:number):number{
 if(!Number.isFinite(frequency)||frequency<0||frequency>filter.sampleRate/2||![filter.b0,filter.b1,filter.b2,filter.a1,filter.a2,filter.sampleRate].every(Number.isFinite))throw new Error('Invalid response input');
 const w=2*Math.PI*frequency/filter.sampleRate,c=Math.cos(w),s=Math.sin(w),c2=Math.cos(2*w),s2=Math.sin(2*w);
 const numerator=Math.hypot(filter.b0+filter.b1*c+filter.b2*c2,-filter.b1*s-filter.b2*s2),denominator=Math.hypot(1+filter.a1*c+filter.a2*c2,-filter.a1*s-filter.a2*s2);
 if(denominator<=0)throw new Error('Undefined filter response');return 20*Math.log10(Math.max(1e-12,numerator/denominator));
}
