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
 {id:'studio',name:'Studio',description:'Soft face and continuous ring'},
 {id:'graphite',name:'Graphite',description:'Dark hardware face and amber index'},
 {id:'silver',name:'Alloy',description:'Machined silver with a fine scale'},
 {id:'selector',name:'Selector',description:'Long hardware handle with scale marks'},
 {id:'halo',name:'Halo',description:'Recessed face and illuminated arc'},
 {id:'stepped',name:'LED scale',description:'Segmented light ring around a dark face'}
];
export function createDial(design='studio',accent='mint',normalized=.5){
 const dial=document.createElement('div');dial.className='knob design-'+design+' accent-'+accent;
 const scale=document.createElementNS('http://www.w3.org/2000/svg','svg');scale.classList.add('knob-scale');scale.setAttribute('viewBox','0 0 100 100');scale.setAttribute('aria-hidden','true');
 const ticks=[];
 for(let i=0;i<=24;i++){
  const angle=(-135+i*270/24)*Math.PI/180;
  const tick=document.createElementNS(scale.namespaceURI,'line');
  const inner=i%6===0?39:42;
  tick.setAttribute('x1',50+Math.sin(angle)*inner);tick.setAttribute('y1',50-Math.cos(angle)*inner);
  tick.setAttribute('x2',50+Math.sin(angle)*47);tick.setAttribute('y2',50-Math.cos(angle)*47);
  scale.append(tick);ticks.push(tick);
 }
 const face=document.createElement('span');face.className='knob-face';const indicator=document.createElement('i');face.append(indicator);dial.append(scale,face);
 let previous=-1;
 const update=position=>{
  dial.style.setProperty('--angle',position*270+'deg');indicator.style.transform='translateX(-50%) rotate('+(-135+position*270)+'deg)';
  const active=Math.floor(position*24);
  if(active!==previous){ticks.forEach((tick,i)=>tick.classList.toggle('lit',i<=active));previous=active;}
 };
 update(normalized);return {dial,update};
}
export function createKnob({label, min, max, defaultValue, value, unit, design='studio', accent='mint', onChange, onSelect}) {
 const root=document.createElement('div');root.className='knob-control';
 const appearance=createDial(design,accent);const dial=appearance.dial;dial.tabIndex=0;dial.setAttribute('role','slider');
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
  current=clamp(next,min,max);
  if(current===drawnValue)return;
  drawnValue=current;const normalized=(current-min)/(max-min);
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
  let previousY=event.clientY;const initial=current;dial.classList.add('adjusting');
  dial.onpointermove=move=>{if(move.pointerId!==event.pointerId)return;commit(dragValue(current,move.clientY-previousY,min,max,move.shiftKey));previousY=move.clientY;};
  const stop=()=>{dial.onpointermove=null;dial.onpointerup=null;dial.onpointercancel=null;dial.classList.remove('adjusting');};
  dial.onpointerup=stop;dial.onpointercancel=()=>{stop();commit(initial);};
  dial.onlostpointercapture=stop;
 };
 dial.onkeydown=event=>{const next=keyValue(current,event.key,min,max,event.shiftKey);if(next===null)return;event.preventDefault();commit(next);};
 dial.ondblclick=()=>commit(defaultValue);
 dial.addEventListener('wheel',event=>{if(document.activeElement!==dial)return;event.preventDefault();if(event.deltaY)commit(keyValue(current,event.deltaY<0?'ArrowUp':'ArrowDown',min,max,event.shiftKey));},{passive:false});
 field.onchange=()=>{if(field.value.trim()===''||!Number.isFinite(field.valueAsNumber)){field.value=format(current);return;}commit(field.valueAsNumber);field.value=format(current);};
 field.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();field.blur();}if(event.key==='Escape'){field.value=format(current);field.blur();}};
 update(value);root.append(dial,field,suffix);return {element:root,update};
}
