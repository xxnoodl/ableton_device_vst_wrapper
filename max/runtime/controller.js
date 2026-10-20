/* Prototype: isolated from JSUI drawing; all incoming messages go through deferlow. */
autowatch=1;inlets=1;outlets=2;
include('runtime-core.js');
var manifest=null,bindings={},epoch=0,currentDevice=null,pendingWrites={},writeTask=null;
function report(message){outlet(0,'status',message);outlet(1,message);}
function scalar(api,key){var v=api.get(key);if(v===null||typeof v==='undefined'||(Object.prototype.toString.call(v)==='[object Array]'&&!v.length))throw new Error('Target unavailable');return Object.prototype.toString.call(v)==='[object Array]'?v[0]:v;}
function valid(api,type){return api&&Number(api.id)&&api.type===type;}
function disconnect(){epoch++;if(writeTask){writeTask.cancel();writeTask=null;}pendingWrites={};for(var k in bindings)if(Object.prototype.hasOwnProperty.call(bindings,k)){try{bindings[k].api.property='';}catch(e){}}bindings={};currentDevice=null;report('Disconnected. Select the intended plugin and bind.');}
function read(path){var file=null;try{file=new File(path,'read');if(!file.isopen)throw new Error('Cannot open manifest');if(file.eof>1000000)throw new Error('Manifest exceeds 1 MB');var source='';while(file.position<file.eof){var line=file.readline();source+=line+'\n';if(source.length>1000000)throw new Error('Manifest exceeds 1 MB');}file.close();file=null;loadmanifest(source);}catch(e){report('Load error: '+e.message);}finally{if(file)file.close();}}
function loadmanifest(source){try{var next=RuntimeCore.parse(source);disconnect();manifest=next;outlet(0,'manifest',JSON.stringify(manifest));report(manifest.demoOnly?'Demo only. Synthetic parameters cannot bind.':'Loaded. Select '+manifest.pluginName+' in Live and bind explicitly.');}catch(e){report('Load error: '+e.message);}}
function availableParameters(device){var ids=device.get('parameters'),items=[];if(Object.prototype.toString.call(ids)!=='[object Array]')throw new Error('No exposed parameter list');for(var i=0;i<ids.length;i++)if(ids[i]==='id'&&Number(ids[i+1])){var api=new LiveAPI(null,'id '+ids[++i]);if(!valid(api,'DeviceParameter'))continue;items.push({id:Number(api.id),name:String(scalar(api,'name')),min:Number(scalar(api,'min')),max:Number(scalar(api,'max'))});}return items;}
function bindselected(){
 disconnect();
 try{
  if(!manifest)throw new Error('Load a manifest first');if(manifest.demoOnly)throw new Error('Demo-only manifest cannot bind');
  var device=new LiveAPI(null,'live_set view selected_track view selected_device');
  if(!valid(device,'PluginDevice'))throw new Error('Select a plugin device in Live');
  var name=String(scalar(device,'name'));
  if(RuntimeCore.normalizedName(name)!==RuntimeCore.normalizedName(manifest.pluginName))throw new Error('Selected device name does not match '+manifest.pluginName);
  var available=availableParameters(device),pending=[],token=epoch;
  for(var i=0;i<manifest.parameters.length;i++){
   var p=manifest.parameters[i],matches=[];
   for(var j=0;j<available.length;j++)if(RuntimeCore.matches(p,available[j]))matches.push(available[j]);
   if(matches.length!==1)throw new Error(p.name+': expected one exact name/range match, found '+matches.length);
   pending.push({parameter:p,host:matches[0]});
  }
  for(var n=0;n<pending.length;n++)subscribe(pending[n],token);
  currentDevice=device;report('Bound '+pending.length+' parameters on '+name+'. Manual writes override automation.');
 }catch(e){disconnect();report('Binding error: '+e.message);}
}
function subscribe(item,token){
 var key='$'+item.parameter.id;
 var api=new LiveAPI(function(args){if(token!==epoch||!bindings[key])return;if(args[0]==='value'&&typeof args[1]!=='undefined'&&isFinite(Number(args[1])))outlet(0,'value',item.parameter.id,Number(args[1]));},'id '+item.host.id);
 if(!valid(api,'DeviceParameter'))throw new Error('Target disappeared during binding');
 bindings[key]={api:api,parameter:item.parameter};api.property='value';
 outlet(0,'value',item.parameter.id,Number(scalar(api,'value')));
}
function queuewrite(id,value){
 if(typeof value!=='number'||!isFinite(value)){report('Write error: Value must be finite');return;}
 pendingWrites['$'+id]={id:id,value:value};
 if(!writeTask){var token=epoch;writeTask=new Task(function(){writeTask=null;if(token!==epoch)return;var pending=pendingWrites;pendingWrites={};for(var key in pending)if(Object.prototype.hasOwnProperty.call(pending,key)){if(token!==epoch)break;write(pending[key].id,pending[key].value);}},this);writeTask.schedule(33);}
}
function write(id,value){
 try{
  var binding=bindings['$'+id];if(!binding||!valid(binding.api,'DeviceParameter'))throw new Error('Target unavailable; bind explicitly');
  if(typeof value!=='number'||!isFinite(value))throw new Error('Value must be finite');
  if(!Number(scalar(binding.api,'is_enabled')))throw new Error('Parameter disabled');
  var p=binding.parameter;
  if(!RuntimeCore.matches(p,{name:String(scalar(binding.api,'name')),min:Number(scalar(binding.api,'min')),max:Number(scalar(binding.api,'max'))}))throw new Error('Target metadata changed; rebind');
  value=RuntimeCore.clamp(value,p.min,p.max);
  if(Number(scalar(binding.api,'is_quantized')))value=Math.round(value);
  if(Math.abs(Number(scalar(binding.api,'value'))-value)>1e-9)binding.api.set('value',value);
 }catch(e){disconnect();report('Write error: '+e.message);}
}
function diagnostics(){report('Runtime prototype; explicit target only; no saved IDs; '+Object.keys(bindings).length+' bindings.');}
function notifydeleted(){disconnect();}
