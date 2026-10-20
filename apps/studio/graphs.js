import {compressorOutput,peakingCoefficients,responseDb} from '/packages/analysis/index.ts';
const ns='http://www.w3.org/2000/svg';
function svgElement(type,attrs={}){const el=document.createElementNS(ns,type);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);return el;}
export function createGraph(graph,parameters){
 const root=document.createElement('section');root.className='graph-card';const heading=document.createElement('h3');heading.textContent=graph.type==='peaking-eq'?'Peaking EQ response':'Compressor transfer';
 const provenance=document.createElement('p');provenance.className='muted small';provenance.textContent=graph.type==='peaking-eq'?'Derived from the declared synthetic RBJ peaking-filter contract. Not plugin telemetry.':'Derived synthetic hard-knee model, before mix. No knee, makeup gain or measured gain reduction.';
 const svg=svgElement('svg',{viewBox:'0 0 640 220',role:'img','aria-label':heading.textContent+'; synthetic model, not measured audio'}),left=52,top=14,width=565,height=168;
 const isEq=graph.type==='peaking-eq',gain=parameters.find(p=>p.id===graph.parameters.gain),extent=isEq?Math.max(6,Math.ceil(Math.max(Math.abs(gain.min),Math.abs(gain.max))/6)*6):60,minY=isEq?-extent:Math.min(-60,parameters.find(p=>p.id===graph.parameters.threshold).min),maxY=isEq?extent:0,xMax=isEq?Math.min(20000,graph.sampleRate*.499):0;
 const px=x=>left+(isEq?Math.log(x/20)/Math.log(xMax/20):(x+60)/60)*width,py=y=>top+height-(y-minY)/(maxY-minY)*height;
 for(const y of Array.from({length:7},(_,i)=>minY+(maxY-minY)*i/6)){svg.append(svgElement('line',{x1:left,x2:left+width,y1:py(y),y2:py(y),class:'graph-grid'}));const label=svgElement('text',{x:left-9,y:py(y)+4,'text-anchor':'end'});label.textContent=Number(y.toFixed(1));svg.append(label);}
 for(const x of isEq?[20,50,100,200,500,1000,2000,5000,10000,20000].filter(f=>f<=xMax):[-60,-48,-36,-24,-12,0]){svg.append(svgElement('line',{x1:px(x),x2:px(x),y1:top,y2:top+height,class:'graph-grid'}));const label=svgElement('text',{x:px(x),y:top+height+18,'text-anchor':'middle'});label.textContent=x>=1000?x/1000+'k':x;svg.append(label);}
 const xLabel=svgElement('text',{x:left+width/2,y:215,'text-anchor':'middle'});xLabel.textContent=isEq?'Frequency (Hz, logarithmic)':'Input level (dB)';svg.append(xLabel);
 const yLabel=svgElement('text',{x:15,y:top+height/2,transform:'rotate(-90 15 '+(top+height/2)+')','text-anchor':'middle'});yLabel.textContent=isEq?'Gain (dB)':'Output level (dB)';svg.append(yLabel);
 const curve=svgElement('path',{class:'graph-curve',fill:'none','vector-effect':'non-scaling-stroke'});svg.append(curve);const error=document.createElement('p');error.className='graph-error';
 root.append(heading,provenance,svg,error);
 const parameter=name=>parameters.find(p=>p.id===graph.parameters[name]);
 function update(values){try{const value=name=>values[parameter(name).id]??parameter(name).defaultValue;
  const filter=isEq?peakingCoefficients(value('frequency'),value('q'),value('gain'),graph.sampleRate):null;
  let path='';const upper=isEq?Math.min(20000,graph.sampleRate*.499):0;
  for(let i=0;i<=240;i++){const x=isEq?20*(upper/20)**(i/240):-60+i/4;const y=isEq?responseDb(filter,x):compressorOutput(x,value('threshold'),value('ratio'));path+=(i?'L':'M')+px(x).toFixed(2)+' '+py(Math.max(minY,Math.min(maxY,y))).toFixed(2);}
  curve.setAttribute('d',path);curve.style.display='';error.textContent='';
 }catch(e){curve.style.display='none';error.textContent='Unavailable: '+e.message;}}
 return {element:root,update};
}
