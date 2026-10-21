/* Experimental multi-device controller. Explicit session-only slot bindings. */
autowatch=1;inlets=1;outlets=3;
include('performance-core.js');
var rack=null,slots={},pending={},task=null,serial=0,positions={},expected={},mixed={};
function report(message){outlet(0,'status',message);outlet(1,message);}
function scalar(api,key){var v=api.get(key);if(Object.prototype.toString.call(v)==='[object Array]')v=v[0];if(v===null||typeof v==='undefined')throw new Error('Target unavailable');return v;}
function valid(api,type){return api&&Number(api.id)&&api.type===type;}
function key(t,p){return '$'+JSON.stringify([t,p]);}
function cancel(){if(task)task.cancel();task=null;pending={};}
function release(id){var s=slots['$'+id];if(s){s.token=-1;for(var p in s.parameters)try{s.parameters[p].api.property='';}catch(e){}delete slots['$'+id];}cancel();}
function disconnect(){cancel();for(var id in slots)release(id.slice(1));slots={};expected={};report('Disconnected. Select the first target plugin, then bindselected.');}
function loadmanifest(raw){try{var next=PerformanceRouting.parse(raw);disconnect();rack=next;positions={};mixed={};for(var i=0;i<rack.macros.length;i++)positions['$'+rack.macros[i].id]=rack.macros[i].value;outlet(0,'manifest',JSON.stringify(PerformanceRouting.display(rack)));report('Loaded performance rack. Select '+rack.targets[0].label+' in Live, then bindselected. No automatic binding.');}catch(e){disconnect();rack=null;report('Load error: '+e.message);}}
function read(path){var f=null;try{f=new File(path,'read');if(!f.isopen||f.eof>1000000)throw new Error('Cannot read rack manifest');var raw='';while(f.position<f.eof)raw+=f.readline()+'\n';loadmanifest(raw);}catch(e){report('Load error: '+e.message);}finally{if(f)f.close();}}
function bindselected(){if(!rack)return report('Load a rack first');for(var i=0;i<rack.targets.length;i++)if(!slots['$'+rack.targets[i].id])return bindtarget(rack.targets[i].id);report('All targets bound. Use disconnect before assigning other instances.');}
function ids(device){var raw=device.get('parameters'),result=[];if(Object.prototype.toString.call(raw)!=='[object Array]'||raw.length>1024)throw new Error('Parameter list unavailable or too large');for(var i=0;i<raw.length;i++)if(raw[i]==='id'&&Number(raw[i+1]))result.push(Number(raw[++i]));return result;}
function match(api,p){return valid(api,'DeviceParameter')&&String(scalar(api,'name'))===p.name&&Number(scalar(api,'min'))===p.min&&Number(scalar(api,'max'))===p.max&&!!Number(scalar(api,'is_quantized'))===p.quantized;}
function bindtarget(id){
 if(!rack)return report('Load a rack first');var definition=PerformanceRouting.find(rack.targets,id);if(!definition)return report('Unknown target slot');release(id);
 try{var device=new LiveAPI(null,'live_set view selected_track view selected_device');if(!valid(device,'PluginDevice')||String(scalar(device,'name'))!==definition.pluginName)throw new Error('Select '+definition.pluginName+' for '+definition.label);
  for(var existing in slots)if(Number(slots[existing].device.id)===Number(device.id))throw new Error('This instance is already bound to another target slot');
  var available=ids(device),slot={device:device,deviceId:Number(device.id),parameters:{},token:++serial};slots['$'+id]=slot;
  for(var i=0;i<definition.parameters.length;i++){var p=definition.parameters[i],matches=[];for(var j=0;j<available.length;j++){var candidate=new LiveAPI(null,'id '+available[j]);if(match(candidate,p))matches.push(available[j]);}if(matches.length!==1)throw new Error(p.name+': expected one exact name/range/quantization match');subscribe(slot,definition,p,matches[0]);}
  var next=null;for(i=0;i<rack.targets.length;i++)if(!slots['$'+rack.targets[i].id]){next=rack.targets[i];break;}report('Bound '+definition.label+'. '+(next?'Select '+next.label+' next, then bindselected.':'All targets ready. Macro gestures override destination automation.'));
 }catch(e){release(id);report('Binding error: '+e.message);}
}
function subscribe(slot,target,p,id){var token=slot.token,api=new LiveAPI(function(args){if(slot.token!==token||slots['$'+target.id]!==slot||args[0]!=='value')return;var v=Number(args[1]);if(!isFinite(v))return;observed(target.id,p.id,v);},'id '+id);slot.parameters['$'+p.id]={api:api,id:id,definition:p};api.property='value';var value=Number(scalar(api,'value'));if(!isFinite(value)||value<p.min||value>p.max)throw new Error('Invalid current parameter value');observed(target.id,p.id,value);}
function observed(t,p,value){var s=slots['$'+t];if(!s||!s.parameters['$'+p])return;s.parameters['$'+p].value=value;var k=key(t,p),queued=pending[k];
 // Allow the first scheduled manual write to take over running automation.
 // After that first write, a differing observation interrupts the macro ramp.
 if(queued&&queued.elapsed===0){queued.start=value;return;}
 var e=expected[k];if(typeof e==='number'&&Math.abs(e-value)<=1e-7)return;
 for(var i=0;i<rack.routes.length;i++){var r=rack.routes[i];if(r.enabled&&r.targetId===t&&r.parameterId===p&&Math.abs(PerformanceRouting.value(r,positions['$'+r.macroId])-value)>1e-7){var wasMixed=mixed['$'+r.macroId];mixed['$'+r.macroId]=true;for(var j=0;j<rack.routes.length;j++)if(rack.routes[j].macroId===r.macroId)delete pending[key(rack.routes[j].targetId,rack.routes[j].parameterId)];if(!wasMixed)report('Mixed: '+PerformanceRouting.find(rack.macros,r.macroId).label+'. Destination changed directly; move the macro to take control again.');}}
}
function preflight(writes){var lists={};for(var i=0;i<writes.length;i++){
 var w=writes[i],s=slots['$'+w.targetId],p=s&&s.parameters['$'+w.parameterId];if(!s||!p)throw new Error('Bind every destination before moving this macro');
 try{
  if(!valid(s.device,'PluginDevice')||Number(s.device.id)!==s.deviceId)throw new Error('Device removed');
  if(!lists['$'+w.targetId])lists['$'+w.targetId]=ids(s.device);
  if(lists['$'+w.targetId].indexOf(p.id)<0||!match(p.api,p.definition)||!Number(scalar(p.api,'is_enabled')))throw new Error('Parameter removed, changed or disabled');
  var value=Number(scalar(p.api,'value'));if(!isFinite(value)||value<p.definition.min||value>p.definition.max)throw new Error('Invalid current parameter value');p.value=value;
 }catch(e){release(w.targetId);throw new Error('Target unavailable; bind explicitly. '+e.message);}
}}
function queuewrite(id,value){
 try{if(!rack)throw new Error('Load a rack first');var writes=PerformanceRouting.evaluate(rack,id,value);preflight(writes);positions['$'+id]=value;mixed['$'+id]=false;outlet(0,'value',id,value);
  for(var i=0;i<writes.length;i++){var w=writes[i],k=key(w.targetId,w.parameterId),p=slots['$'+w.targetId].parameters['$'+w.parameterId];pending[k]={targetId:w.targetId,parameterId:w.parameterId,value:w.value,start:p.value,elapsed:0,duration:w.smoothingMs};}schedule();
 }catch(e){report('Write error: '+e.message);if(typeof positions['$'+id]==='number')outlet(0,'value',id,positions['$'+id]);}
}
function write(id,value){queuewrite(id,value);}
function schedule(){if(!task&&Object.keys(pending).length){task=new Task(flush,this);task.schedule(33);}}
function flush(){task=null;var writes=[],k;for(k in pending)writes.push(pending[k]);try{preflight(writes);for(k in pending){var w=pending[k],s=slots['$'+w.targetId],p=s.parameters['$'+w.parameterId];if(w.elapsed===0)w.start=p.value;w.elapsed+=33;var fraction=w.duration?Math.min(1,w.elapsed/w.duration):1,v=w.start+(w.value-w.start)*fraction;expected[k]=v;p.value=v;p.api.set('value',v);if(fraction===1)delete pending[k];}schedule();}catch(e){cancel();report('Write error: '+e.message+'. Pending writes cancelled.');}}
function captureselected(){report('Capture is not available in the performance rack. Use the normal wrapper capture.');}
function notifydeleted(){disconnect();}
