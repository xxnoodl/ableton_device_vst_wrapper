import {selection,moveSelection,resizeWidget,alignWidgets,distributeWidgets,duplicateWidgets,groupWidgets,lockWidgets,reorderWidgets,deleteWidgets} from '/packages/layout-engine/index.ts';
import {validateInventory} from '/packages/inventory/index.ts';
import {exportFiles,zipFiles,runtimeFiles} from '/packages/export/index.ts';
import {createKnob,createDial,designs} from '/apps/studio/knob.js';
import {parseProject,serializeProject,validateProject} from '/packages/schema/index.ts';
import {saveProject,loadProject} from '/packages/project-store/index.ts';
const $=id=>document.getElementById(id);
let selectedIds=new Set(),zoom=1;
let project,selected=null,values=Object.create(null),past=[],future=[];
const status=message=>{$('status').textContent=message;};
const run=fn=>{try{fn();}catch(error){status(error.message);}};
function change(next){next=validateProject(next);if(serializeProject(next)===serializeProject(project))return;past.push(serializeProject(project));if(past.length>100)past.shift();future=[];project=next;render();}
function activate(next){project=validateProject(next);selected=null;selectedIds.clear();values=Object.create(null);past=[];future=[];render();}
function render(){
 selectedIds=new Set([...selectedIds].filter(id=>project.widgets.some(w=>w.id===id)));
 if(!project.widgets.some(w=>w.id===selected))selected=[...selectedIds][0]||null;
 if(selected&&!selectedIds.size)selectedIds.add(selected);
 $('title').textContent=project.name;$('subtitle').textContent=project.plugin.vendor+' / '+project.plugin.name+' / local simulation';
 $('panel-title').textContent=project.name;$('panel').className=project.theme;
 $('panel-sizer').style.width=project.panel.width*zoom+'px';$('panel-sizer').style.height=project.panel.height*zoom+'px';$('panel').style.transform='scale('+zoom+')';
 $('panel').style.width=project.panel.width+'px';$('panel').style.height=project.panel.height+'px';
 $('dimensions').textContent=project.panel.width+' x '+project.panel.height+' / '+project.panel.grid+' px grid';
 $('undo').disabled=!past.length;$('redo').disabled=!future.length;
 $('parameters').replaceChildren();
 for(const p of project.parameters){
  const label=document.createElement('label');label.className='function';
  const input=document.createElement('input');input.type='checkbox';input.checked=project.widgets.some(w=>w.parameterId===p.id);
  input.onchange=()=>run(()=>{
   if(!input.checked){if(project.widgets.some(w=>w.id===selected&&w.parameterId===p.id))selected=null;change({...project,widgets:project.widgets.filter(w=>w.parameterId!==p.id)});}
   else{const id=crypto.randomUUID();selected=id;selectedIds=new Set([id]);change({...project,widgets:[...project.widgets,{id,type:'knob',label:p.name,parameterId:p.id,x:16,y:Math.min(80,project.panel.height-160),width:112,height:160}]});}
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
  const el=document.createElement('section');el.className='widget'+(selectedIds.has(w.id)?' selected':'');
  Object.assign(el.style,{left:w.x+'px',top:w.y+'px',width:w.width+'px',height:w.height+'px'});
  el.style.setProperty('--monitor-size',Math.max(48,Math.min(160,w.width-30,w.height-84))+'px');
  const header=document.createElement('button');header.className='widget-header';header.textContent=w.label;header.title='Drag to move; arrow keys move by one grid step';
  const select=(extend=false)=>{selected=w.id;if(extend){const ids=selection(project,[w.id]).map(w=>w.id);const remove=ids.every(id=>selectedIds.has(id));for(const id of ids)remove?selectedIds.delete(id):selectedIds.add(id);}else if(!selectedIds.has(w.id))selectedIds=new Set(selection(project,[w.id]).map(w=>w.id));
   if(!selectedIds.has(selected))selected=[...selectedIds][0]||null;for(const child of $('widgets').children)child.classList.toggle('selected',selectedIds.has(child.dataset.id));renderProperties();};
  header.onfocus=()=>{if(!selectedIds.has(w.id))select();};
  header.onkeydown=event=>{
   const deltas={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
   if(!deltas[event.key])return;event.preventDefault();const [x,y]=deltas[event.key];
   const current=project.widgets.find(i=>i.id===w.id);change(moveSelection(project,[...selectedIds],x*project.panel.grid,y*project.panel.grid));
   [...$('widgets').children].find(i=>i.dataset.id===w.id)?.querySelector('button').focus();
  };
  header.onpointerdown=event=>{
   if(event.button!==0)return;event.preventDefault();event.stopPropagation();select(event.shiftKey);if(!event.shiftKey||selectedIds.has(w.id))header.focus();if(w.locked||event.shiftKey)return;header.setPointerCapture(event.pointerId);
   const x=event.clientX,y=event.clientY,start=project,ids=[...selectedIds];let pending=start;
   header.onpointermove=next=>{pending=moveSelection(start,ids,(next.clientX-x)/zoom,(next.clientY-y)/zoom);for(const moved of pending.widgets){const node=[...$('widgets').children].find(el=>el.dataset.id===moved.id);if(node){node.style.left=moved.x+'px';node.style.top=moved.y+'px';}}};
   const finish=()=>{header.onpointermove=null;header.onpointerup=null;header.onpointercancel=null;run(()=>change(pending));};
   header.onpointerup=finish;header.onpointercancel=()=>{header.onpointermove=null;renderWidgets();};
  };
  el.dataset.id=w.id;el.append(header);
  const control=createKnob({label:w.label,min:p.min,max:p.max,defaultValue:p.defaultValue,value:values[p.id],unit:p.unit,design:w.design,accent:w.accent,stepCount:w.stepCount,stepValues:w.stepValues,onSelect:()=>select(),onChange:value=>{
   values[p.id]=value;for(const update of updates.get(p.id)||[])update(value);
  }});
  if(!updates.has(p.id))updates.set(p.id,[]);updates.get(p.id).push(control.update);
  el.append(control.element);
  if(w.locked)el.classList.add('locked');
  const resize=document.createElement('button');resize.className='resize-handle';resize.type='button';resize.setAttribute('aria-label','Resize '+w.label);resize.title='Drag to resize; arrow keys resize by grid';resize.disabled=w.locked;
  resize.onkeydown=event=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!delta)return;event.preventDefault();change(resizeWidget(project,w.id,w.width+delta[0]*project.panel.grid,w.height+delta[1]*project.panel.grid));};
  resize.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();select();resize.setPointerCapture(event.pointerId);const x=event.clientX,y=event.clientY,start=project;let pending=start;
   resize.onpointermove=move=>{pending=resizeWidget(start,w.id,w.width+(move.clientX-x)/zoom,w.height+(move.clientY-y)/zoom);const next=pending.widgets.find(i=>i.id===w.id);el.style.width=next.width+'px';el.style.height=next.height+'px';el.style.setProperty('--monitor-size',Math.max(48,Math.min(160,next.width-30,next.height-84))+'px');};
   resize.onpointerup=()=>{resize.onpointermove=null;change(pending);};resize.onpointercancel=()=>{resize.onpointermove=null;renderWidgets();};
  };
  el.append(resize);$('widgets').append(el);
 }
}
function renderProperties(){
 const w=project.widgets.find(w=>w.id===selected);$('properties').inert=!w||w.locked;
 $('selection').textContent=selectedIds.size>1?selectedIds.size+' controls selected':w?w.label:'Select a control';
 for(const key of ['label','x','y','width','height'])$(key).value=w?w[key]:'';
 $('step-mode').value=w?.stepValues.length?'custom':w?.stepCount?'equal':'continuous';$('step-count').value=w?.stepCount||8;$('step-values').value=w?.stepValues.join(', ')||'';updateStepFields();
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
 $('binding').textContent=p.name+' / '+p.min+' to '+p.max+' '+p.unit+' / '+p.evidence+' metadata. No SDK class ID or persistent runtime mapping. Preview values are simulated.';
}
$('accent').onchange=()=>run(()=>{change({...project,widgets:project.widgets.map(w=>w.id===selected?{...w,accent:$('accent').value}:w)});$('accent').focus();});
function updateStepFields(){const mode=$('step-mode').value;$('step-count-row').hidden=mode!=='equal';$('step-values-row').hidden=mode!=='custom';$('step-count').disabled=mode!=='equal';$('step-values').disabled=mode!=='custom';}
$('step-mode').onchange=updateStepFields;
$('properties').onsubmit=event=>{event.preventDefault();run(()=>{
 const active=project.widgets.find(w=>w.id===selected);if(active?.locked)throw new Error('Unlock this control before editing its properties');
 const mode=$('step-mode').value;const patch={label:$('label').value,type:'knob',stepCount:mode==='equal'?Number($('step-count').value):0,stepValues:mode==='custom'?$('step-values').value.split(',').map(s=>s.trim()?Number(s):NaN):[]};for(const key of ['x','y','width','height'])patch[key]=Number($(key).value);
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

$('export-max').onclick=async()=>{
 const button=$('export-max');button.disabled=true;
 try{const sources={};for(const file of runtimeFiles){const response=await fetch('/max/runtime/'+file);if(!response.ok)throw new Error('Cannot load runtime source '+file);sources[file]=await response.text();}
 const files=exportFiles(project,sources);const archive=zipFiles(files);const url=URL.createObjectURL(new Blob([archive],{type:'application/zip'}));
 const a=document.createElement('a');a.href=url;a.download=project.id.replace(/[^a-zA-Z0-9_-]/g,'_')+'-max-source.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 status('Exported Max patch source. Extract all files together. Save a real device in Max/Live; runtime integration is pending verification.');
 }catch(error){status('Max export failed: '+error.message);}finally{button.disabled=false;}
};

let inventory=null;
function renderInventory(){
 const container=$('inventory');container.replaceChildren();if(!inventory)return;
 const query=$('plugin-search').value.toLowerCase();const matches=inventory.plugins.filter(p=>(p.name+' '+p.architecture).toLowerCase().includes(query));
 for(const plugin of matches){const details=document.createElement('details');details.className='inventory-item';const summary=document.createElement('summary');summary.textContent=plugin.name+' / '+plugin.architecture;
 const info=document.createElement('p');info.className='muted small';info.textContent='Inventory only. Parameters not inspected. '+plugin.installedPath;details.append(summary,info);container.append(details);}
 $('inventory-note').textContent=matches.length+' of '+inventory.plugins.length+' plugins. '+inventory.diagnostics.length+' diagnostics. No code loaded, fingerprints computed or parameter access verified.';
}
$('plugin-search').oninput=renderInventory;
$('scan-plugins').onclick=async()=>{const button=$('scan-plugins');button.disabled=true;button.textContent='Reading folders...';try{const response=await fetch('/api/inventory');const result=await response.json();if(!response.ok)throw new Error(result.error||'Inventory failed');inventory=validateInventory(result);renderInventory();status('Read-only inventory complete. Plugin parameters are still uninspected.');}catch(error){status('Inventory failed: '+error.message);}finally{button.disabled=false;button.textContent='Read VST3 folders';}};

function applyLayout(action){run(()=>{change(action());status('Layout updated.');});}
$('select-all').onclick=()=>{selectedIds=new Set(project.widgets.map(w=>w.id));selected=project.widgets[0]?.id||null;render();};
$('duplicate').onclick=()=>applyLayout(()=>{const result=duplicateWidgets(project,[...selectedIds],()=>crypto.randomUUID());selectedIds=new Set(result.ids);selected=result.ids[0]||null;return result.project;});
$('delete').onclick=()=>applyLayout(()=>deleteWidgets(project,[...selectedIds]));
$('group').onclick=()=>applyLayout(()=>groupWidgets(project,[...selectedIds],crypto.randomUUID()));
$('ungroup').onclick=()=>applyLayout(()=>groupWidgets(project,[...selectedIds],null));
$('lock').onclick=()=>applyLayout(()=>lockWidgets(project,[...selectedIds],true));
$('unlock').onclick=()=>applyLayout(()=>lockWidgets(project,[...selectedIds],false));
$('front').onclick=()=>applyLayout(()=>reorderWidgets(project,[...selectedIds],true));
$('back').onclick=()=>applyLayout(()=>reorderWidgets(project,[...selectedIds],false));
$('align').onchange=()=>{if($('align').value)applyLayout(()=>alignWidgets(project,[...selectedIds],$('align').value));$('align').value='';};
$('distribute-x').onclick=()=>applyLayout(()=>distributeWidgets(project,[...selectedIds],'x'));
$('distribute-y').onclick=()=>applyLayout(()=>distributeWidgets(project,[...selectedIds],'y'));
$('zoom').onchange=()=>{zoom=Number($('zoom').value);render();};
$('panel').onpointerdown=event=>{
 if(event.button!==0||event.target.closest('.widget'))return;event.preventDefault();const panel=$('panel'),bounds=panel.getBoundingClientRect();const x=(event.clientX-bounds.left)/zoom,y=(event.clientY-bounds.top)/zoom;
 const area=document.createElement('div');area.className='marquee';panel.append(area);panel.setPointerCapture(event.pointerId);const initial=event.shiftKey?[...selectedIds]:[];
 const update=next=>{const endX=(next.clientX-bounds.left)/zoom,endY=(next.clientY-bounds.top)/zoom,left=Math.min(x,endX),top=Math.min(y,endY),width=Math.abs(endX-x),height=Math.abs(endY-y);Object.assign(area.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
  selectedIds=new Set([...initial,...selection(project,project.widgets.filter(w=>w.x<left+width&&w.x+w.width>left&&w.y<top+height&&w.y+w.height>top).map(w=>w.id)).map(w=>w.id)]);for(const child of $('widgets').children)child.classList.toggle('selected',selectedIds.has(child.dataset.id));};
 panel.onpointermove=update;panel.onpointerup=next=>{update(next);panel.onpointermove=null;panel.onpointerup=null;panel.onpointercancel=null;area.remove();selected=[...selectedIds][0]||null;renderProperties();};panel.onpointercancel=()=>{panel.onpointermove=null;area.remove();};
};
document.addEventListener('keydown',event=>{
 if(event.target.closest('input,select,textarea')||event.target.isContentEditable)return;
 const key=event.key.toLowerCase(),mod=event.ctrlKey||event.metaKey;let button;
 if(mod&&key==='z')button=event.shiftKey?'redo':'undo';else if(mod&&key==='y')button='redo';else if(mod&&key==='a')button='select-all';else if(mod&&key==='d')button='duplicate';else if(mod&&key==='g')button=event.shiftKey?'ungroup':'group';else if(mod&&key==='s')button='save';else if(key==='delete'||key==='backspace')button='delete';
 if(button){event.preventDefault();$(button).click();}
});

let spacePan=false;
const stage=$('panel').closest('.stage');
document.addEventListener('keydown',event=>{if(event.code==='Space'&&!event.target.closest('input,textarea,select,button')){event.preventDefault();spacePan=true;stage.classList.add('can-pan');}});
document.addEventListener('keyup',event=>{if(event.code==='Space'){spacePan=false;stage.classList.remove('can-pan');}});
window.addEventListener('blur',()=>{spacePan=false;stage.classList.remove('can-pan');});
stage.addEventListener('pointerdown',event=>{
 if(event.button!==1&&!(event.button===0&&spacePan))return;event.preventDefault();event.stopPropagation();stage.setPointerCapture(event.pointerId);stage.classList.add('panning');const x=event.clientX,y=event.clientY,left=stage.scrollLeft,top=stage.scrollTop;
 stage.onpointermove=move=>{stage.scrollLeft=left-(move.clientX-x);stage.scrollTop=top-(move.clientY-y);};
 const stop=()=>{stage.onpointermove=null;stage.onpointerup=null;stage.onpointercancel=null;stage.classList.remove('panning');};stage.onpointerup=stop;stage.onpointercancel=stop;
},true);
