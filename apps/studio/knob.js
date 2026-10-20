export function clamp(value, min, max) {
 if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) throw new Error('Invalid knob value or range');
 return Math.max(min, Math.min(max, value));
}
export function dragValue(value, deltaY, min, max, fine = false) {
 return clamp(value - deltaY * (max - min) / (fine ? 2000 : 200), min, max);
}
export function keyValue(value, key, min, max, fine = false) {
 const step = (max - min) * (fine ? 0.001 : 0.01);
 const deltas = {ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: (max-min)*0.1, PageDown: -(max-min)*0.1};
 if (key === 'Home') return min;
 if (key === 'End') return max;
 return key in deltas ? clamp(value + deltas[key], min, max) : null;
}
export const designs=[
 {id:'selector',name:'Chickenhead',description:'Matte chickenhead grip with a fine index'},
 {id:'monitor',name:'Raised black',description:'Flat charcoal cap with a shallow mounting rim'},
 {id:'studio',name:'Studio',description:'Soft face and continuous ring'},
 {id:'graphite',name:'Graphite',description:'Dark hardware face and fine scale'},
 {id:'silver',name:'Alloy',description:'Satin alloy face with a fine scale'},
 {id:'halo',name:'Halo',description:'Illuminated arc'},
 {id:'stepped',name:'LED scale',description:'Segmented light ring'}
];
export function detentValues(min,max,stepCount=0,stepValues=[]) {
 return stepValues.length ? stepValues : stepCount ? Array.from({length:stepCount},(_,i)=>min+(max-min)*i/(stepCount-1)) : [];
}
export function snapValue(value,min,max,stops=[]) {
 value=clamp(value,min,max);
 return stops.length ? stops.reduce((best,v)=>Math.abs(v-value)<Math.abs(best-value)?v:best,stops[0]) : value;
}
export function knobPosition(value,min,max,stops=[]) {
 return stops.length ? stops.indexOf(snapValue(value,min,max,stops))/(stops.length-1) : (value-min)/(max-min);
}
export function positionValue(position,min,max,stops=[]) {
 position=clamp(position,0,1);
 return stops.length ? stops[Math.round(position*(stops.length-1))] : min+position*(max-min);
}
export function steppedKey(value,key,min,max,stops=[],fine=false){
 if(!stops.length)return keyValue(value,key,min,max,fine);
 const i=stops.indexOf(snapValue(value,min,max,stops));
 const delta={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:Math.max(1,Math.round(stops.length/10)),PageDown:-Math.max(1,Math.round(stops.length/10))};
 if(key==='Home')return stops[0];if(key==='End')return stops.at(-1);
 return key in delta ? stops[Math.max(0,Math.min(stops.length-1,i+delta[key]))] : null;
}
// One vector geometry for both canvas controls and picker thumbnails.
// Shapes use flat finishes and a single shallow base edge, not simulated chrome.
export function createDial(design='studio',accent='mint',normalized=.5,stopCount=0){
 const dial=document.createElement('div');dial.className='knob design-'+design+' accent-'+accent;
 const ns='http://www.w3.org/2000/svg';
 const element=(type,attrs={})=>{const node=document.createElementNS(ns,type);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);return node;};
 const art=element('svg',{viewBox:'0 0 100 100',class:'knob-art','aria-hidden':'true',focusable:'false'});
 const colors={mint:'#bcc9bd',amber:'#c5a16c',cyan:'#7faeb9',red:'#b87870'};
 const color=colors[accent]||colors.mint;
 const mode=['pointer','recessed','gloss'].includes(design)?'graphite':design;
 const point=(angle,r)=>{const a=angle*Math.PI/180;return [50+Math.sin(a)*r,50-Math.cos(a)*r];};
 const circle=(parent,x,y,r,fill,stroke='none',width=1)=>parent.append(element('circle',{cx:x,cy:y,r,fill,stroke,'stroke-width':width}));
 const line=(parent,x1,y1,x2,y2,stroke,width=1)=>parent.append(element('line',{x1,y1,x2,y2,stroke,'stroke-width':width,'stroke-linecap':'round'}));
 const arc=(position,r)=>{if(position<=0)return '';const start=point(-135,r),end=point(-135+270*position,r);return 'M '+start.join(' ')+' A '+r+' '+r+' 0 '+(position>2/3?1:0)+' 1 '+end.join(' ');};
 const ticks=[];const divisions=stopCount>=2&&stopCount<=64?stopCount-1:24;
 if(['selector','graphite','silver','stepped'].includes(mode)){
  const scale=element('g',{class:'knob-scale'});
  for(let i=0;i<=divisions;i++){
   const major=stopCount>=2||i%6===0,start=point(-135+i*270/divisions,major?41:43),end=point(-135+i*270/divisions,46);
   const tick=element('line',{x1:start[0],y1:start[1],x2:end[0],y2:end[1],stroke:'#677277','stroke-width':mode==='stepped'?2:major?1.2:.85,'stroke-linecap':'round'});
   scale.append(tick);ticks.push(tick);
  }
  art.append(scale);
 }
 let progress=null;
 if(mode==='studio'||mode==='halo'){
  art.append(element('path',{d:arc(1,38),fill:'none',stroke:'#3a4448','stroke-width':mode==='halo'?2:1.5,'stroke-linecap':'round'}));
  progress=element('path',{fill:'none',stroke:color,'stroke-width':mode==='halo'?2:1.5,'stroke-linecap':'round'});art.append(progress);
 }
 const rotor=element('g',{class:'knob-rotor'});
 if(mode==='selector'){
  // Top view: pointed nose, narrow waist, broad rounded rear grip.
  circle(art,50,52,29,'#000000', 'none');
  circle(art,50,50,28,'#1b2022','#0b0e0f',1);
  circle(art,50,50,24.5,'#24292b','#343b3e',.6);
  rotor.append(element('path',{d:'M50 9 C53 9 56 15 57 21 L59 30 L69 75 Q72 87 64 88 L36 88 Q28 87 31 75 L41 30 L43 21 C44 15 47 9 50 9Z',fill:'#252a2c',stroke:'#0d1112','stroke-width':1.2}));
  rotor.append(element('path',{d:'M50 11 C47 14 46 19 45 24 L35 76 Q33 83 36 85',fill:'none',stroke:'#4a5255','stroke-width':.8,'stroke-linecap':'round'}));
  line(rotor,50,16,50,35,color,1.6);
  line(rotor,37,84,63,84,'#171c1e',1);
 }else if(mode==='monitor'){
  // A small base rim and offset contact shadow suggest elevation, without a glossy dome.
  circle(art,50,53,32,'#000000');
  circle(art,50,51.5,32,'#292f31','#161c1e',.8);
  circle(art,50,49.5,30.5,'#151a1c','#515a5e',.65);
  art.append(element('path',{d:'M24 34 A30.5 30.5 0 0 1 71 27',fill:'none',stroke:'#788184','stroke-width':.5,opacity:.45}));
  line(rotor,50,23,50,37,color,.9);
 }else if(mode==='silver'){
  circle(art,50,52,29,'#101516');circle(art,50,50,29,'#666f72','#a5adae',.6);circle(art,50,49,26.5,'#b7bdbb','#c8cecb',.6);
  line(rotor,50,27,50,40,'#303a3c',1.6);
 }else{
  circle(art,50,52,29,'#101516');circle(art,50,50,29,mode==='graphite'?'#242b2e':'#1e2528','#4b565b',.7);
  if(mode==='halo')circle(rotor,50,27,1.7,color);
  else line(rotor,50,27,50,39,color,mode==='graphite'?1.5:1.2);
 }
 art.append(rotor);dial.append(art);
 let previous=-1;
 const update=position=>{
  position=Math.max(0,Math.min(1,position));rotor.setAttribute('transform','rotate('+(-135+position*270)+' 50 50)');
  if(progress)progress.setAttribute('d',arc(position,38));
  const active=Math.round(position*divisions);
  if(mode==='stepped'&&active!==previous){ticks.forEach((tick,i)=>tick.setAttribute('stroke',i<=active?color:'#414d52'));previous=active;}
 };
 update(normalized);return {dial,update};
}
export function createKnob({label, min, max, defaultValue, value, unit, design='studio', accent='mint', stepCount=0, stepValues=[], onChange, onSelect}) {
 const root=document.createElement('div');root.className='knob-control';
 const stops=detentValues(min,max,stepCount,stepValues);
 const appearance=createDial(design,accent,.5,stops.length);const dial=appearance.dial;dial.tabIndex=0;dial.setAttribute('role','slider');
 dial.setAttribute('aria-label',label+' demo value');dial.setAttribute('aria-valuemin',min);dial.setAttribute('aria-valuemax',max);dial.setAttribute('aria-orientation','vertical');
 dial.title='Drag up/down. Shift for fine adjustment. Arrow keys to adjust. Double-click to reset.';
 const field=document.createElement('input');field.className='knob-value';field.type='number';field.min=min;field.max=max;field.step='any';field.setAttribute('aria-label',label+' precise demo value');
 const suffix=document.createElement('span');suffix.className='knob-unit';suffix.textContent=unit||'VALUE';
 const decimals=Math.max(0,Math.min(8,3-Math.floor(Math.log10(max-min))));
 const format=next=>Number(next.toFixed(decimals)).toFixed(decimals);
 let current=value;
 let drawnValue;
 const showValue=()=>{const display=format(current);if(field.value!==display)field.value=display;};
 const update=next=>{
  current=snapValue(next,min,max,stops);
  if(current===drawnValue)return;
  drawnValue=current;const normalized=knobPosition(current,min,max,stops);
  appearance.update(normalized);
  dial.setAttribute('aria-valuenow',current);
  const spoken=format(current)+' '+unit;if(dial.getAttribute('aria-valuetext')!==spoken)dial.setAttribute('aria-valuetext',spoken);
  if(document.activeElement!==field)showValue();
 };
 const commit=next=>{update(next);onChange(current);};
 dial.onfocus=onSelect;
 field.onfocus=()=>{onSelect();field.value=Number(current.toPrecision(12));};
 field.onblur=showValue;
 dial.onpointerdown=event=>{
  if(event.button!==0)return;event.preventDefault();onSelect();dial.focus();dial.setPointerCapture(event.pointerId);
  let previousY=event.clientY;let position=knobPosition(current,min,max,stops);const initial=current;dial.classList.add('adjusting');
  dial.onpointermove=move=>{if(move.pointerId!==event.pointerId)return;position=dragValue(position,move.clientY-previousY,0,1,move.shiftKey);commit(positionValue(position,min,max,stops));previousY=move.clientY;};
  const stop=()=>{dial.onpointermove=null;dial.onpointerup=null;dial.onpointercancel=null;dial.classList.remove('adjusting');};
  dial.onpointerup=stop;dial.onpointercancel=()=>{stop();commit(initial);};
  dial.onlostpointercapture=stop;
 };
 dial.onkeydown=event=>{const next=steppedKey(current,event.key,min,max,stops,event.shiftKey);if(next===null)return;event.preventDefault();commit(next);};
 dial.ondblclick=()=>commit(defaultValue);
 dial.addEventListener('wheel',event=>{if(document.activeElement!==dial)return;event.preventDefault();if(event.deltaY)commit(steppedKey(current,event.deltaY<0?'ArrowUp':'ArrowDown',min,max,stops,event.shiftKey));},{passive:false});
 field.onchange=()=>{if(field.value.trim()===''||!Number.isFinite(field.valueAsNumber)){field.value=format(current);return;}commit(field.valueAsNumber);field.value=format(current);};
 field.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();field.blur();}if(event.key==='Escape'){field.value=format(current);field.blur();}};
 update(value);root.append(dial,field,suffix);return {element:root,update};
}
