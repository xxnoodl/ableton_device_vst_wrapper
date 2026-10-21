import {createGraph} from '/apps/studio/graphs.js';
import {diagnoseProject} from '/packages/diagnostics/index.ts';
import {parseHostCapture,projectFromCapture} from '/packages/host-capture/index.ts';
import {saveFunctionalityPreset,saveLayoutPreset,applyFunctionalityPreset,applyLayoutPreset,exposeParameters} from '/packages/presets/index.ts';
import {selection,planMove,cableGeometry,assertLayoutChange,moveSelection,resizeWidget,alignWidgets,distributeWidgets,duplicateWidgets,groupWidgets,lockWidgets,reorderWidgets,deleteWidgets} from '/packages/layout-engine/index.ts';
import {validateInventory} from '/packages/inventory/index.ts';
import {validatePluginInspection,projectFromInspection,selectableParameter,verifiedLiveBinding} from '/packages/plugin-inspection/index.ts';
import {deviceFiles,exportFiles,zipFiles,runtimeFiles} from '/packages/export/index.ts';
import {createKnob,createDial,designs} from '/apps/studio/knob.js';
import {parseProject,serializeProject,validateProject} from '/packages/schema/index.ts';
import {saveProject,loadProject} from '/packages/project-store/index.ts';
import {targetFromProject} from '/packages/performance/index.ts';
import {validateLiveCatalog,projectFromLiveDevice,liveBridgeFiles} from '/packages/live-session/index.ts';
const $=id=>document.getElementById(id);
let graphViews=[],graphFrame=null;
let selectedIds=new Set(),zoom=1;
let project,selected=null,values=Object.create(null),past=[],future=[];
let activeInspection=null;
let activeLiveDevice=null,liveSession=null,sessionBusy=false;
const status=message=>{$('status').textContent=message;};
const run=fn=>{try{fn();}catch(error){status(error.message);}};
$('send-to-rack').onclick=()=>run(()=>{targetFromProject(project,'check');localStorage.setItem('interface-studio.performance.pending',serializeProject(project));window.location.href='/apps/studio/performance.html';});
function change(next){next=assertLayoutChange(project,validateProject(next));if(serializeProject(next)===serializeProject(project))return;past.push(serializeProject(project));if(past.length>100)past.shift();future=[];project=next;render();}
function activate(next){project=validateProject(next);activeInspection=null;activeLiveDevice=null;selected=null;selectedIds.clear();values=Object.create(null);past=[];future=[];render();}
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
 $('snap-grid').checked=project.canvas.snapToGrid;$('snap-controls').checked=project.canvas.snapToControls;$('allow-overlap').checked=project.canvas.allowOverlap;$('panel-seams').value=project.canvas.seams;$('add-cable').disabled=selectedIds.size!==2;
 $('parameters').replaceChildren();
 $('native-search-label').hidden=!activeInspection&&!activeLiveDevice;$('functions-all').disabled=!!activeInspection||!!(activeLiveDevice&&project.parameters.length>60);
 if(activeInspection)renderNativeControls();else renderExposedControls();
 renderWidgets();renderPanelArt(project);renderProperties();renderPresets();renderProjectSettings();renderDiagnostics();renderGraphs();
}
function renderExposedControls(){
 $('parameters').replaceChildren();const query=activeLiveDevice?$('native-search').value.toLowerCase():'';
 for(const p of project.parameters.filter(p=>p.name.toLowerCase().includes(query))){
  const label=document.createElement('label');label.className='function';
  const input=document.createElement('input');input.type='checkbox';input.checked=project.widgets.some(w=>w.parameterId===p.id);
  input.onchange=()=>{run(()=>{
   const ids=new Set(project.widgets.map(w=>w.parameterId));input.checked?ids.add(p.id):ids.delete(p.id);
   change(activeLiveDevice?projectFromLiveDevice(activeLiveDevice,[...ids]):exposeParameters(project,[...ids],()=>crypto.randomUUID()));
  });render();};
  label.append(input,document.createTextNode(p.name));$('parameters').append(label);
 }
}
function renderWidgets(){
 $('widgets').replaceChildren();
 const updates=new Map();
 for(const w of project.widgets){
  const p=project.parameters.find(p=>p.id===w.parameterId);
  if(values[p.id]===undefined)values[p.id]=p.defaultValue;
  const el=document.createElement('section');el.className='widget'+(selectedIds.has(w.id)?' selected':'');
  Object.assign(el.style,{left:w.x+'px',top:w.y+'px',width:w.width+'px',height:w.height+'px'});
  el.style.setProperty('--dial-size',Math.max(36,Math.min(160,w.width-12,w.height-72))+'px');
  const header=document.createElement('button');header.className='widget-header';header.textContent=w.label;header.title='Drag to move; arrow keys move by one grid step';
  const select=(extend=false)=>{selected=w.id;if(extend){const ids=selection(project,[w.id]).map(w=>w.id);const remove=ids.every(id=>selectedIds.has(id));for(const id of ids)remove?selectedIds.delete(id):selectedIds.add(id);}else if(!selectedIds.has(w.id))selectedIds=new Set(selection(project,[w.id]).map(w=>w.id));
   if(!selectedIds.has(selected))selected=[...selectedIds][0]||null;for(const child of $('widgets').children)child.classList.toggle('selected',selectedIds.has(child.dataset.id));$('add-cable').disabled=selectedIds.size!==2;renderProperties();};
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
   header.onpointermove=next=>{const plan=planMove(start,ids,(next.clientX-x)/zoom,(next.clientY-y)/zoom);pending=plan.project;for(const moved of pending.widgets){const node=[...$('widgets').children].find(el=>el.dataset.id===moved.id);if(node){node.style.left=moved.x+'px';node.style.top=moved.y+'px';}}renderPanelArt(pending,plan.guides);};
   const finish=()=>{header.onpointermove=null;header.onpointerup=null;header.onpointercancel=null;run(()=>change(pending));renderPanelArt(project);};
   header.onpointerup=finish;header.onpointercancel=()=>{header.onpointermove=null;renderWidgets();renderPanelArt(project);};
  };
  el.dataset.id=w.id;el.append(header);
  const control=createKnob({label:w.label,min:p.min,max:p.max,defaultValue:p.defaultValue,value:values[p.id],unit:p.unit,design:w.design,accent:w.accent,stepCount:w.stepCount,stepValues:w.stepValues,onSelect:()=>select(),onChange:value=>{
   values[p.id]=value;for(const update of updates.get(p.id)||[])update(value);scheduleGraphs();
  }});
  if(!updates.has(p.id))updates.set(p.id,[]);updates.get(p.id).push(control.update);
  el.append(control.element);
  if(w.locked)el.classList.add('locked');
  const resize=document.createElement('button');resize.className='resize-handle';resize.type='button';resize.setAttribute('aria-label','Resize '+w.label);resize.title='Drag to resize; arrow keys resize by grid';resize.disabled=w.locked;
  resize.onkeydown=event=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!delta)return;event.preventDefault();change(resizeWidget(project,w.id,w.width+delta[0]*project.panel.grid,w.height+delta[1]*project.panel.grid));};
  resize.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();select();resize.setPointerCapture(event.pointerId);const x=event.clientX,y=event.clientY,start=project;let pending=start;
   resize.onpointermove=move=>{pending=resizeWidget(start,w.id,w.width+(move.clientX-x)/zoom,w.height+(move.clientY-y)/zoom);const next=pending.widgets.find(i=>i.id===w.id);el.style.width=next.width+'px';el.style.height=next.height+'px';el.style.setProperty('--dial-size',Math.max(36,Math.min(160,next.width-12,next.height-72))+'px');renderPanelArt(pending);};
   resize.onpointerup=()=>{resize.onpointermove=null;change(pending);};resize.onpointercancel=()=>{resize.onpointermove=null;renderWidgets();renderPanelArt(project);};
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
 $('binding').textContent=p.name+' / '+p.min+' to '+p.max+' '+p.unit+' / '+p.evidence+' metadata. Reset source: '+p.resetSource+'. No SDK class ID or persistent runtime mapping. Preview values are simulated.';
}
function renderPanelArt(scene,guides=[]){
 const svg=$('panel-art');svg.replaceChildren();svg.setAttribute('viewBox','0 0 '+scene.panel.width+' '+scene.panel.height);svg.setAttribute('width',scene.panel.width);svg.setAttribute('height',scene.panel.height);
 const node=(tag,attrs)=>{const element=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))element.setAttribute(key,value);svg.append(element);return element;};
 const light=scene.theme==='light';
 if(scene.canvas.seams!=='none')for(const w of scene.widgets){
  node('rect',{x:Math.max(0,w.x-4),y:Math.max(0,w.y-4),width:w.width+8,height:w.height+8,rx:3,fill:'none',stroke:light?'#9ca69e':'#11171a','stroke-width':1});
  if(scene.canvas.seams==='groove')node('rect',{x:Math.max(0,w.x-3),y:Math.max(0,w.y-3),width:w.width+8,height:w.height+8,rx:3,fill:'none',stroke:light?'#edf1ec':'#44504a','stroke-opacity':.55,'stroke-width':1});
 }
 const colors={mint:'#a4c6b1',amber:'#dca659',cyan:'#6fb9ca',red:'#cf7470'};
 for(const c of scene.connections){const g=cableGeometry(scene,c),d='M '+g.start.x+' '+g.start.y+' C '+g.c1.x+' '+g.c1.y+', '+g.c2.x+' '+g.c2.y+', '+g.end.x+' '+g.end.y;
  node('path',{d,fill:'none',stroke:'#111519','stroke-width':5,'stroke-linecap':'round'});node('path',{d,fill:'none',stroke:colors[c.accent],'stroke-width':2,'stroke-linecap':'round','data-cable-id':c.id});
  for(const p of [g.start,g.end]){node('circle',{cx:p.x,cy:p.y,r:5,fill:'#111519',stroke:light?'#6f7b74':'#68756d','stroke-width':1});node('circle',{cx:p.x,cy:p.y,r:2,fill:colors[c.accent]});}
 }
 for(const guide of guides)node('line',{x1:guide.axis==='x'?guide.position:0,y1:guide.axis==='y'?guide.position:0,x2:guide.axis==='x'?guide.position:scene.panel.width,y2:guide.axis==='y'?guide.position:scene.panel.height,stroke:'#90bba4','stroke-width':1,'stroke-dasharray':'4 4','data-snap-guide':guide.axis});
 const list=$('cable-list');list.replaceChildren();
 for(const c of scene.connections){const row=document.createElement('div');row.className='cable-row';const label=document.createElement('span');label.textContent=scene.widgets.find(w=>w.id===c.fromWidgetId).label+' / '+scene.widgets.find(w=>w.id===c.toWidgetId).label;
  const slack=document.createElement('input');slack.type='number';slack.min=0;slack.max=120;slack.value=c.slack;slack.setAttribute('aria-label','Cable bend');slack.onchange=()=>run(()=>change({...project,connections:project.connections.map(item=>item.id===c.id?{...item,slack:Number(slack.value)}:item)}));
  const remove=document.createElement('button');remove.textContent='Remove';remove.onclick=()=>change({...project,connections:project.connections.filter(item=>item.id!==c.id)});row.append(label,slack,remove);list.append(row);
 }
}
for(const [id,key] of [['snap-grid','snapToGrid'],['snap-controls','snapToControls'],['allow-overlap','allowOverlap']])$(id).onchange=()=>{run(()=>change({...project,canvas:{...project.canvas,[key]:$(id).checked}}));render();};
$('panel-seams').onchange=()=>change({...project,canvas:{...project.canvas,seams:$('panel-seams').value}});
$('add-cable').onclick=()=>run(()=>{const ids=[...selectedIds];if(ids.length!==2)throw new Error('Select two controls to add a cable');change({...project,connections:[...project.connections,{id:crypto.randomUUID(),kind:'visual',fromWidgetId:ids[0],toWidgetId:ids[1],accent:'mint',slack:18}]});status('Decorative cable added. It does not change parameter mappings.');});
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
$('morph-motion').onclick=()=>{if(confirm('Open sample? Export or save any unsaved design first.'))fixture('morph-motion');};
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
 const response=await fetch('/api/device-template');if(!response.ok)throw new Error('Device generation is unavailable: no compatible device shell is configured.');
 const files=deviceFiles(project,sources,new Uint8Array(await response.arrayBuffer()));const archive=zipFiles(files);const url=URL.createObjectURL(new Blob([archive],{type:'application/zip'}));
 const a=document.createElement('a');a.href=url;a.download=project.id.replace(/[^a-zA-Z0-9_-]/g,'_')+'-wrapper.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 status('Device bundle generated. Extract the folder and drag Wrapper.amxd into Live after your plugin.');
 }catch(error){status('Max export failed: '+error.message);}finally{renderDiagnostics();}
};

let inventory=null;
function renderNativeControls(){
 const container=$('parameters');container.replaceChildren();if(!activeInspection)return;
 const query=$('native-search').value.toLowerCase(),matches=activeInspection.parameters.filter(p=>(p.name+' '+p.unit).toLowerCase().includes(query));
 const eligible=matches.filter(selectableParameter),visible=eligible.slice(0,100),checked=new Set(project.widgets.map(w=>w.parameterId));
 const note=document.createElement('p');note.className='muted small';note.textContent=checked.size+' selected. Showing '+visible.length+' of '+eligible.length+' matching editable controls. Search to narrow the list.';container.append(note);
 for(const p of visible){
  const label=document.createElement('label');label.className='function';const input=document.createElement('input');input.type='checkbox';input.checked=checked.has('vst3-'+p.id);
  input.onchange=()=>{run(()=>{const ids=new Set(activeInspection.parameters.filter(item=>checked.has('vst3-'+item.id)).map(item=>item.id));input.checked?ids.add(p.id):ids.delete(p.id);change(projectFromInspection(activeInspection,[...ids]));status(project.parameters.some(p=>p.evidence==='native-inspected')?'Layout created. Live routing is not supported for this selection yet.':'Layout created. Generate your device, or customize it first.');});render();};
  const name=document.createElement('span');name.textContent=p.name||'Parameter '+p.id;
  label.title=(p.defaultDisplay===null?'Default unavailable':'Default: '+p.defaultDisplay)+(p.unit?' '+p.unit:'')+' / '+(p.stepCount?'Stepped':'Continuous')+' / '+(verifiedLiveBinding(activeInspection,p)?'Live mapping checked':'Live mapping not yet checked');
  label.append(input,name);if(!verifiedLiveBinding(activeInspection,p)){const hint=document.createElement('small');hint.textContent='Preview only';label.append(hint);}container.append(label);
 }
}

function renderLiveSession(){
 const list=$('live-devices');list.replaceChildren();if(!liveSession)return;
 const catalog=liveSession.catalog,ready=liveSession.connected&&!liveSession.pending;
 $('live-session-note').textContent=!liveSession.connected?'Session bridge not connected. Download it below and load it once in Live.':liveSession.pending?'Reading the Live session…':catalog.devices.length+' plugin instances. Choose one to see its exposed controls.';
 if(!catalog)return;
 for(const device of catalog.devices){const row=document.createElement('section');row.className='live-device';const choose=document.createElement('button');choose.textContent=device.label;choose.disabled=!ready||!device.capture;choose.onclick=()=>run(()=>{if(project&&!confirm('Choose this Live plugin? Save or export current changes first.'))return;activate(projectFromLiveDevice(device));activeLiveDevice=device;$('native-search').value='';render();status('Read '+device.capture.parameters.length+' exposed controls from '+device.label+'. Check the controls to generate. Preview values are local; reset uses captured current values.');});row.append(choose);
  if(device.diagnostic){const note=document.createElement('p');note.className='muted small';note.textContent=device.diagnostic;row.append(note);}list.append(row);
 }
 for(const diagnostic of catalog.diagnostics){const note=document.createElement('p');note.className='muted small';note.textContent=diagnostic;list.append(note);}
}
async function refreshLiveSession(requestScan=false){
 if(sessionBusy)return;sessionBusy=true;const button=$('refresh-live');button.disabled=true;
 try{if(requestScan){const config=await fetch('/api/live/config');if(!config.ok)throw new Error('Bridge handshake unavailable');const {token}=await config.json();const refresh=await fetch('/api/live/refresh',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Bridge':token},body:'{}'});if(!refresh.ok)throw new Error('Could not request a fresh Live scan');}
  const response=await fetch('/api/live/session');if(!response.ok)throw new Error('Live session API unavailable');const session=await response.json();
  if(typeof session.connected!=='boolean'||typeof session.pending!=='boolean')throw new Error('Invalid session status');if(session.catalog!==null)session.catalog=validateLiveCatalog(session.catalog);liveSession=session;renderLiveSession();
 }catch(error){$('live-session-note').textContent='Cannot read Live session: '+error.message;}finally{sessionBusy=false;button.disabled=false;}
}
$('refresh-live').onclick=()=>refreshLiveSession(true);
$('download-bridge').onclick=async()=>{const button=$('download-bridge');button.disabled=true;try{const names=['session-bridge.js','session-bridge-renderer.js'],sources={};for(const name of names){const response=await fetch('/max/runtime/'+name);if(!response.ok)throw new Error('Bridge source unavailable');sources[name]=await response.text();}const response=await fetch('/api/device-template');if(!response.ok)throw new Error('No compatible local device shell');const files=liveBridgeFiles(sources,new Uint8Array(await response.arrayBuffer())),url=URL.createObjectURL(new Blob([zipFiles(files)],{type:'application/zip'})),link=document.createElement('a');link.href=url;link.download='live-session-bridge.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Bridge downloaded. Extract all files together and load Live-Session-Bridge.amxd once in Live. Then choose a plugin under Live session.');}catch(error){status('Bridge generation failed: '+error.message);}finally{button.disabled=false;}};
refreshLiveSession();window.setInterval(()=>{if(document.visibilityState!=='hidden')refreshLiveSession();},2000);
$('native-search').oninput=()=>activeInspection?renderNativeControls():renderExposedControls();
async function chooseInstalledPlugin(plugin,container,button,classId){
 button.disabled=true;button.textContent='Reading controls...';status('Reading '+plugin.name+' controls...');
 try{const response=await fetch('/api/inspect-plugin?id='+encodeURIComponent(plugin.inventoryId)+(classId?'&classId='+encodeURIComponent(classId):'')),data=await response.json();if(!response.ok)throw new Error(data.error||'Cannot inspect plugin');
  const result=validatePluginInspection(data);
  if(result.status==='choose-class'){container.replaceChildren();for(const item of result.classes){const choice=document.createElement('button');choice.textContent=item.name;choice.onclick=()=>chooseInstalledPlugin(plugin,container,choice,item.classId);container.append(choice);}status('Choose the component you want to use.');return;}
  activate(projectFromInspection(result,[]));activeInspection=result;$('native-search').value='';render();
  status('Choose the controls to show. Their layout is created automatically; you can edit it afterward.');
 }catch(error){status('Cannot read plugin controls: '+error.message);}finally{button.disabled=false;button.textContent=classId?'Choose component':plugin.name;}
}
function renderInventory(){
 const container=$('inventory');container.replaceChildren();if(!inventory)return;
 const query=$('plugin-search').value.toLowerCase();const matches=inventory.plugins.filter(p=>(p.name+' '+p.architecture).toLowerCase().includes(query));
 for(const plugin of matches){const details=document.createElement('section');details.className='inventory-item';
 const info=document.createElement('p');info.className='muted small';info.textContent=plugin.architecture+' / VST3';
 const choose=document.createElement('button');choose.textContent=plugin.name;choose.title=plugin.installedPath;choose.disabled=plugin.architecture!=='x64';const components=document.createElement('div');choose.onclick=()=>chooseInstalledPlugin(plugin,components,choose);
 details.append(choose,info,components);container.append(details);}
 $('inventory-note').textContent=matches.length+' of '+inventory.plugins.length+' installed plugins. Choose one to see its controls.';
}
$('plugin-search').oninput=renderInventory;
$('scan-plugins').onclick=async()=>{const button=$('scan-plugins');button.disabled=true;button.textContent='Finding plugins...';try{const response=await fetch('/api/inventory');const result=await response.json();if(!response.ok)throw new Error(result.error||'Inventory failed');inventory=validateInventory(result);renderInventory();}catch(error){$('inventory-note').textContent='Could not find installed plugins: '+error.message;}finally{button.disabled=false;button.textContent='Refresh plugins';}};
$('scan-plugins').onclick();

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

function renderPresets(){
 for(const [id,presets]of [['function-preset',project.functionalityPresets],['layout-preset',project.layoutPresets]]){
  const element=$(id),value=element.value;element.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Choose preset';element.append(empty);
  for(const preset of presets){const option=document.createElement('option');option.value=preset.id;option.textContent=preset.name;element.append(option);}element.value=presets.some(p=>p.id===value)?value:'';
 }
}
$('functions-all').onclick=()=>applyLayout(()=>activeLiveDevice?projectFromLiveDevice(activeLiveDevice,project.parameters.map(p=>p.id)):exposeParameters(project,project.parameters.map(p=>p.id),()=>crypto.randomUUID()));
$('functions-none').onclick=()=>applyLayout(()=>activeLiveDevice?projectFromLiveDevice(activeLiveDevice,[]):exposeParameters(project,[],()=>crypto.randomUUID()));
$('save-functions').onclick=()=>run(()=>{change(saveFunctionalityPreset(project,crypto.randomUUID(),$('function-preset-name').value));$('function-preset-name').value='';status('Function preset saved in this project. Save locally or export JSON to keep it.');});
$('save-layout').onclick=()=>run(()=>{change(saveLayoutPreset(project,crypto.randomUUID(),$('layout-preset-name').value));$('layout-preset-name').value='';status('Layout preset saved in this project. Save locally or export JSON to keep it.');});
$('function-preset').onchange=()=>{if($('function-preset').value)applyLayout(()=>applyFunctionalityPreset(project,$('function-preset').value,()=>crypto.randomUUID()));};
$('layout-preset').onchange=()=>{if($('layout-preset').value)applyLayout(()=>applyLayoutPreset(project,$('layout-preset').value));};
$('delete-functions').onclick=()=>run(()=>{const id=$('function-preset').value;if(!id)throw new Error('Select a function preset first');if(confirm('Delete this function preset? Undo can restore it.'))change({...project,functionalityPresets:project.functionalityPresets.filter(p=>p.id!==id)});});
$('delete-layout').onclick=()=>run(()=>{const id=$('layout-preset').value;if(!id)throw new Error('Select a layout preset first');if(confirm('Delete this layout preset? Undo can restore it.'))change({...project,layoutPresets:project.layoutPresets.filter(p=>p.id!==id)});});

$('import-capture').onclick=()=>{$('capture-file').value='';$('capture-file').click();};
$('capture-file').onchange=async()=>{try{const file=$('capture-file').files[0];if(!file)return;if(file.size>1_000_000)throw new Error('Capture exceeds 1 MB');const next=projectFromCapture(parseHostCapture(await file.text()));if(confirm('Open this host capture as a new project? Save/export current changes first.')){activate(next);status('Loaded host-exposed metadata. Select functions to design. Preview stays disconnected; reset values are capture-time values, not factory defaults.');}}catch(error){status('Capture import failed: '+error.message);}};

function renderProjectSettings(){
 for(const [id,value]of Object.entries({'project-name':project.name,'plugin-name':project.plugin.name,'plugin-format':project.plugin.format,'panel-width':project.panel.width,'panel-height':project.panel.height,'panel-grid':project.panel.grid,'live-version':project.target.liveVersion,'max-version':project.target.maxVersion}))$(id).value=value;
}
$('project-settings').onsubmit=event=>{event.preventDefault();run(()=>{change({...project,name:$('project-name').value,plugin:{...project.plugin,name:$('plugin-name').value,format:$('plugin-format').value},panel:{width:Number($('panel-width').value),height:Number($('panel-height').value),grid:Number($('panel-grid').value)},target:{...project.target,liveVersion:$('live-version').value,maxVersion:$('max-version').value}});status('Project settings applied. Panel dimensions are design choices, not measured Live limits.');});};
function renderDiagnostics(){
 const items=diagnoseProject(project),errors=items.filter(d=>d.severity==='error').length;$('diagnostic-count').textContent=errors?errors+' blocking issues':'No schema mapping blockers';$('export-max').disabled=errors>0;$('export-max').title=items.find(d=>d.severity==='error')?.message||'Generate your wrapper';$('diagnostics').replaceChildren();
 for(const item of items){const row=document.createElement('p');row.className='diagnostic '+item.severity;row.textContent=item.severity.toUpperCase()+': '+item.message;$('diagnostics').append(row);}
}

function renderGraphs(){graphViews=[];$('graphs').replaceChildren();for(const graph of project.graphs){const view=createGraph(graph,project.parameters);graphViews.push(view);$('graphs').append(view.element);view.update(values);}}
function scheduleGraphs(){if(graphFrame!==null)return;graphFrame=requestAnimationFrame(()=>{graphFrame=null;for(const view of graphViews)view.update(values);});}
$('eq').onclick=()=>{if(confirm('Open sample? Save or export current changes first.'))fixture('eq');};
