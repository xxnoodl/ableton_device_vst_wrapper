import {createKnob,createDial,designs} from '/apps/studio/knob.js';
import {parseProject,serializeProject,validateProject,moveWidget,normalize} from '/packages/schema/index.ts';
import {saveProject,loadProject} from '/packages/project-store/index.ts';
const $=id=>document.getElementById(id);
let project,selected=null,values={},past=[],future=[];
const status=message=>{$('status').textContent=message;};
const run=fn=>{try{fn();}catch(error){status(error.message);}};
function change(next){next=validateProject(next);if(serializeProject(next)===serializeProject(project))return;past.push(serializeProject(project));if(past.length>100)past.shift();future=[];project=next;render();}
function activate(next){project=validateProject(next);selected=null;values={};past=[];future=[];render();}
function render(){
 $('title').textContent=project.name;$('subtitle').textContent=project.plugin.vendor+' / '+project.plugin.name+' / local simulation';
 $('panel-title').textContent=project.name;$('panel').className=project.theme;
 $('panel').style.width=project.panel.width+'px';$('panel').style.height=project.panel.height+'px';
 $('dimensions').textContent=project.panel.width+' ? '+project.panel.height+' ? '+project.panel.grid+' px grid';
 $('undo').disabled=!past.length;$('redo').disabled=!future.length;
 $('parameters').replaceChildren();
 for(const p of project.parameters){
  const label=document.createElement('label');label.className='function';
  const input=document.createElement('input');input.type='checkbox';input.checked=project.widgets.some(w=>w.parameterId===p.id);
  input.onchange=()=>run(()=>{
   if(!input.checked){if(project.widgets.some(w=>w.id===selected&&w.parameterId===p.id))selected=null;change({...project,widgets:project.widgets.filter(w=>w.parameterId!==p.id)});}
   else{const id=crypto.randomUUID();selected=id;change({...project,widgets:[...project.widgets,{id,type:'knob',label:p.name,parameterId:p.id,x:16,y:Math.min(80,project.panel.height-160),width:112,height:160}]});}
  });
  label.append(input,document.createTextNode(p.name));$('parameters').append(label);
 }
 renderWidgets();renderProperties();
}
function renderWidgets(){
 $('widgets').replaceChildren();
 const updates=new Map();
 for(const w of project.widgets){
  const p=project.parameters.find(p=>p.id===w.parameterId);
  if(values[p.id]===undefined)values[p.id]=p.defaultValue;
  const el=document.createElement('section');el.className='widget'+(selected===w.id?' selected':'');
  Object.assign(el.style,{left:w.x+'px',top:w.y+'px',width:w.width+'px',height:w.height+'px'});
  el.style.setProperty('--monitor-size',Math.max(48,Math.min(160,w.width-30,w.height-84))+'px');
  const header=document.createElement('button');header.className='widget-header';header.textContent=w.label;header.title='Drag to move; arrow keys move by one grid step';
  const select=()=>{selected=w.id;for(const child of $('widgets').children)child.classList.toggle('selected',child===el);renderProperties();};
  header.onfocus=select;
  header.onkeydown=event=>{
   const deltas={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
   if(!deltas[event.key])return;event.preventDefault();const [x,y]=deltas[event.key];
   const current=project.widgets.find(i=>i.id===w.id);change(moveWidget(project,w.id,current.x+x*project.panel.grid,current.y+y*project.panel.grid));
   [...$('widgets').children].find(i=>i.dataset.id===w.id)?.querySelector('button').focus();
  };
  header.onpointerdown=event=>{
   if(event.button!==0)return;select();header.setPointerCapture(event.pointerId);
   const x=event.clientX,y=event.clientY;let endX=w.x,endY=w.y;
   header.onpointermove=next=>{const moved=moveWidget(project,w.id,w.x+next.clientX-x,w.y+next.clientY-y).widgets.find(i=>i.id===w.id);endX=moved.x;endY=moved.y;el.style.left=endX+'px';el.style.top=endY+'px';};
   const finish=()=>{header.onpointermove=null;header.onpointerup=null;header.onpointercancel=null;run(()=>change(moveWidget(project,w.id,endX,endY)));};
   header.onpointerup=finish;header.onpointercancel=()=>{header.onpointermove=null;renderWidgets();};
  };
  el.dataset.id=w.id;el.append(header);
  const control=createKnob({label:w.label,min:p.min,max:p.max,defaultValue:p.defaultValue,value:values[p.id],unit:p.unit,design:w.design,accent:w.accent,onSelect:select,onChange:value=>{
   values[p.id]=value;for(const update of updates.get(p.id)||[])update(value);
  }});
  if(!updates.has(p.id))updates.set(p.id,[]);updates.get(p.id).push(control.update);
  el.append(control.element);$('widgets').append(el);
 }
}
function renderProperties(){
 const w=project.widgets.find(w=>w.id===selected);$('properties').inert=!w;
 $('selection').textContent=w?w.label:'Select a control';
 for(const key of ['label','x','y','width','height'])$(key).value=w?w[key]:'';
 $('designs').replaceChildren();$('accent').value=w?w.accent:'mint';
 if(!w){$('binding').textContent='Select a widget to inspect its parameter.';return;}
 for(const design of designs){
  const button=document.createElement('button');button.type='button';button.className='design-choice';button.setAttribute('aria-pressed',String(w.design===design.id));button.title=design.description;
  const preview=createDial(design.id,w.accent,.62).dial;preview.setAttribute('aria-hidden','true');
  const name=document.createElement('span');name.textContent=design.name;button.append(preview,name);
  button.onclick=()=>run(()=>{change({...project,widgets:project.widgets.map(item=>item.id===w.id?{...item,design:design.id}:item)});$('designs').querySelector('[aria-pressed="true"]')?.focus();});
  $('designs').append(button);
 }
 const p=project.parameters.find(p=>p.id===w.parameterId);
 $('binding').textContent=p.name+' ? '+p.min+' to '+p.max+' '+p.unit+' ? '+p.evidence+' metadata. No SDK class ID or persistent runtime mapping. Preview values are simulated.';
}
$('accent').onchange=()=>run(()=>{change({...project,widgets:project.widgets.map(w=>w.id===selected?{...w,accent:$('accent').value}:w)});$('accent').focus();});
$('properties').onsubmit=event=>{event.preventDefault();run(()=>{
 const patch={label:$('label').value,type:'knob'};for(const key of ['x','y','width','height'])patch[key]=Number($(key).value);
 change({...project,widgets:project.widgets.map(w=>w.id===selected?{...w,...patch}:w)});status('Control updated.');
});};
$('undo').onclick=()=>run(()=>{if(!past.length)return;future.push(serializeProject(project));project=parseProject(past.pop());render();});
$('redo').onclick=()=>run(()=>{if(!future.length)return;past.push(serializeProject(project));project=parseProject(future.pop());render();});
$('theme').onclick=()=>change({...project,theme:project.theme==='dark'?'light':'dark'});
async function fixture(name){try{const response=await fetch('/fixtures/'+name+'.project.json');if(!response.ok)throw new Error('Cannot load sample');activate(parseProject(await response.text()));status('Loaded '+project.name+'. Preview values are simulated.');}catch(error){status(error.message);}}
$('morph').onclick=()=>{if(confirm('Open sample? Export or save any unsaved design first.'))fixture('morph');};
$('compressor').onclick=()=>{if(confirm('Open sample? Export or save any unsaved design first.'))fixture('compressor');};
$('export').onclick=()=>run(()=>{const blob=new Blob([serializeProject(project)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=project.id.replace(/[^a-zA-Z0-9_-]/g,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Exported project JSON. This is not a Max device.');});
$('import').onclick=()=>{$('file').value='';$('file').click();};
$('file').onchange=async()=>{try{const file=$('file').files[0];if(!file)return;if(file.size>1_000_000)throw new Error('File exceeds 1 MB');const next=parseProject(await file.text());if(confirm('Replace the current design? Save or export it first if needed.')){activate(next);status('Project imported and validated.');}}catch(error){status('Import failed: '+error.message);}};
const prefix='interface-studio:project:';
function refreshSaves(){
 $('saved').replaceChildren();
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key.startsWith(prefix)||key.endsWith('.backup'))continue;const button=document.createElement('button');
  try{button.textContent=loadProject(localStorage,key).name;}catch{button.textContent='Corrupted save (backup may exist)';}
  button.onclick=()=>run(()=>{if(!confirm('Load this save? Save or export current changes first.'))return;try{activate(loadProject(localStorage,key));status('Local save loaded.');}catch(error){if(localStorage.getItem(key+'.backup')&&confirm(error.message+' Load backup instead?')){activate(loadProject(localStorage,key+'.backup'));status('Recovered backup; original save was left untouched.');}else throw error;}});
  $('saved').append(button);
 }}catch(error){status('Local storage unavailable: '+error.message);}
}
$('save').onclick=()=>run(()=>{const key=prefix+project.id;if(localStorage.getItem(key)&&!confirm('Update this local save? The previous contents will be backed up.'))return;saveProject(localStorage,key,project);refreshSaves();status('Saved in this browser. Export JSON for a portable backup.');});
fixture('morph').then(refreshSaves);
