/* Isolated vst~ hosting proof. No LiveAPI, Node, external target or state migration. */
autowatch=1;inlets=1;outlets=3;
var settings=null,host=null,left=null,right=null,phase='idle',count=0,names=[],scanning=false,controls=[],latency=null;
var work=null,generation=0,writeTask=null,pending={},polls=0,scanPolls=0;
var audioInput=null,audioOutput=null,audioReady=false;
var wanted=['Threshold','Ratio','Attack','Release'];
function report(text){outlet(0,'status',String(text));outlet(1,String(text));}
function view(){outlet(0,'hosting',JSON.stringify({phase:phase,controls:controls,latency:latency}));}
function stopWork(){generation++;if(work){work.cancel();work=null;}if(writeTask){writeTask.cancel();writeTask=null;}pending={};}
function later(fn,ms){var token=generation;work=new Task(function(){work=null;if(token===generation)fn();},this);work.schedule(ms);}
function find(name){for(var o=this.patcher.firstobject,n=0;o&&n<1024;o=o.nextobject,n++)if(o.varname===name)return o;return null;}
function typed(name){var found=null;for(var o=this.patcher.firstobject,n=0;o&&n<1024;o=o.nextobject,n++)if(o.maxclass===name){if(found)throw new Error('Expected one '+name);found=o;}if(!found)throw new Error('Missing '+name);return found;}
function object(name,type,args,x,y){var o=find(name);if(o){if(o.maxclass!==type)throw new Error('Unexpected saved object '+name);return o;}o=this.patcher.newdefault.apply(this.patcher,[x,y,type].concat(args));if(!o||o.maxclass!==type)throw new Error('Cannot create '+type);o.varname=name;return o;}
function link(a,out,b,input){this.patcher.disconnect(a,out,b,input);this.patcher.connect(a,out,b,input);}
function setup(){
 var input=typed('plugin~'),output=typed('plugout~');
 audioInput=input;audioOutput=output;audioReady=false;
 host=object('studio_probe_host','vst~',[2,2,'@valuemode',2,'@parameter_enable',1,'@floateditorwindow',1],20,170);
 left=object('studio_probe_left','selector~',[2],20,215);right=object('studio_probe_right','selector~',[2],180,215);
 left.message(1);right.message(1);
 var np=object('studio_probe_names','prepend',['hostname'],350,170),vp=object('studio_probe_values','prepend',['hostvalue'],500,170);
 link(host,2,np,0);link(np,0,this.box,0);link(host,3,vp,0);link(vp,0,this.box,0);
 link(input,0,host,0);link(input,1,host,1);
 link(input,0,left,1);link(input,1,right,1);link(host,0,left,2);link(host,1,right,2);
 this.patcher.disconnect(input,0,output,0);this.patcher.disconnect(input,1,output,1);
 link(left,0,output,0);link(right,0,output,1);audioReady=true;
}
function read(path){var f=null;try{
 f=new File(path,'read');if(!f.isopen||f.eof>4096)throw new Error('Missing or oversized hosting settings');var source='';while(f.position<f.eof)source+=f.readline()+'\n';f.close();f=null;
 var s=JSON.parse(source);if(!s||Object.keys(s).sort().join(',')!=='hostingProbeVersion,pluginName,pluginPath'||s.hostingProbeVersion!==1||typeof s.pluginName!=='string'||s.pluginName.length>160||typeof s.pluginPath!=='string'||s.pluginPath.length>2048||!(/^[A-Za-z]:[\\/].+\.vst3$/i.test(s.pluginPath))||/[\x00-\x1f]/.test(s.pluginPath+s.pluginName))throw new Error('Invalid hosting settings');
 stopWork();settings=s;phase='idle';controls=[];count=0;names=[];latency=null;setup();view();loadplugin();
 }catch(e){fail(e.message);}finally{if(f)f.close();}}
function fail(message){stopWork();scanning=false;phase='error';if(left)left.message(1);if(right)right.message(1);
 if(!audioReady&&audioInput&&audioOutput){try{if(left)this.patcher.disconnect(left,0,audioOutput,0);if(right)this.patcher.disconnect(right,0,audioOutput,1);link(audioInput,0,audioOutput,0);link(audioInput,1,audioOutput,1);}catch(e){report('Audio setup error: '+e.message);}}
 view();report('Hosting error: '+String(message)+'. Dry audio remains active.');}
function pluginKey(text){return String(text).replace(/\\/g,'/').split('/').pop().replace(/\.vst3$/i,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function loadedPlugin(){
 var value=host.getattr('currentplug');if(Object.prototype.toString.call(value)==='[object Array]')value=value.length===1?value[0]:value.join(' ');
 if(value===null||typeof value==='undefined'||value===0||value==='0'||value==='')return '';
 if(typeof value!=='string')throw new Error('Cannot identify the loaded plugin');return value;
}
function loadplugin(){
 if(!settings||!host){report('Hosting settings are not loaded.');return;}
 if(phase==='loading'||phase==='ready'){report(phase==='ready'?'Internal plugin already loaded.':'Internal plugin is loading.');return;}
 try{stopWork();phase='loading';count=0;names=[];controls=[];latency=null;scanning=false;polls=0;view();report('Loading internal '+settings.pluginName+'...');
 var current=loadedPlugin();host.message('valuemode',2);host.message('floateditorwindow',1);
 if(current){var key=pluginKey(current);if(key!==pluginKey(settings.pluginPath)&&key!==pluginKey(settings.pluginName))throw new Error('Saved host contains another plugin: '+current);report('Reusing internal '+settings.pluginName+' without reloading its sound.');}
 else host.message('plug',settings.pluginPath);
 checkLoad();}catch(e){fail(e.message);}
}
function checkLoad(){
 if(phase!=='loading'||scanning)return;
 try{host.message('get',-4);if(scanning||phase!=='loading')return;if(++polls>=20){fail('Plugin did not report its parameters within 10 seconds');return;}later(checkLoad,500);}catch(e){fail(e.message);}
}
function hostname(){
 if(!scanning||names.length>=count)return;
 var a=arrayfromargs(arguments),text=a.join(' ');if(text.length>256){fail('Parameter name exceeds probe limit');return;}names.push(text);
}
function finishScan(){
 if(!scanning)return;
 if(names.length!==count){if(++scanPolls<30){later(finishScan,100);return;}fail('Incomplete parameter-name stream ('+names.length+' of '+count+')');return;}
 try{var next=[];for(var i=0;i<wanted.length;i++){
  var matches=[];for(var j=0;j<names.length;j++)if(names[j].toLowerCase().replace(/^\s+|\s+$/g,'')===wanted[i].toLowerCase())matches.push(j+1);
  if(matches.length!==1)throw new Error(wanted[i]+': expected one parameter name, found '+matches.length);
  next.push({name:wanted[i],index:matches[0],value:null,text:'Waiting for plugin'});
 }
 controls=next;scanning=false;phase='ready';left.message(2);right.message(2);view();report('Internal '+settings.pluginName+' loaded. '+count+' parameters; four test controls. State/automation/latency compensation not verified.');readvalues();
 }catch(e){fail(e.message);}
}
function hostvalue(){
 var a=arrayfromargs(arguments),index=Number(a[0]);
 if(index===-4){
  if(phase!=='loading'||scanning)return;var total=Number(a[1]);if(!isFinite(total)||Math.floor(total)!==total||total<=0)return;if(total>4096){fail('Plugin exceeds 4096-parameter probe limit');return;}
  count=total;names=[];scanning=true;scanPolls=0;if(work){work.cancel();work=null;}later(finishScan,100);
  try{host.message('params');}catch(e){fail(e.message);}return;
 }
 if(phase!=='ready')return;
 if(index===-10){var samples=Number(a[1]);if(isFinite(samples)&&samples>=0&&Math.floor(samples)===samples){latency=samples;view();report('Hosted plugin reports '+samples+' latency samples. This probe does not forward compensation.');}return;}
 var value=Number(a[1]);if(!isFinite(value)||value<0||value>1)return;
 for(var i=0;i<controls.length;i++)if(controls[i].index===index){controls[i].value=value;controls[i].text=a.length>2?a.slice(2).join(' ').substring(0,256):'Unformatted '+value.toFixed(3);view();return;}
}
function readvalues(){if(phase!=='ready')return;try{for(var i=0;i<controls.length;i++)host.message('get',controls[i].index);host.message('get',-10);}catch(e){fail(e.message);}}
function openplugin(){if(phase!=='ready'){report('Wait for the internal plugin to load.');return;}try{host.message('floateditorwindow',1);host.message('open');}catch(e){fail(e.message);}}
function setcontrol(slot,value){
 if(phase!=='ready'||typeof slot!=='number'||slot<0||slot>=controls.length||Math.floor(slot)!==slot||typeof value!=='number'||!isFinite(value)||controls[slot].value===null)return;
 pending['$'+slot]={index:controls[slot].index,value:Math.max(0,Math.min(1,value))};
 if(!writeTask){var token=generation;writeTask=new Task(function(){writeTask=null;if(token!==generation||phase!=='ready')return;var batch=pending;pending={};try{for(var key in batch)if(Object.prototype.hasOwnProperty.call(batch,key)){host.message('list',batch[key].index,batch[key].value);host.message('get',batch[key].index);}}catch(e){fail(e.message);}},this);writeTask.schedule(33);}
}
function disconnect(){stopWork();phase='idle';scanning=false;controls=[];if(left)left.message(1);if(right)right.message(1);view();report('Hosting test stopped. Dry audio active. The internal plugin stays loaded until this device is removed.');}
function bindselected(){report('This device hosts its own plugin. No binding is needed.');}
function captureselected(){readvalues();}
function notifydeleted(){stopWork();}
