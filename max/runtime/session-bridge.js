/* Read-only Live catalog bridge. Legacy js + maxurl-backed XMLHttpRequest. */
autowatch=1;inlets=1;outlets=3;
var endpoint='http://127.0.0.1:5173',token=null,epoch=0,http=null,networkTimer=null,pollTimer=null,scanTimer=null,scan=null,lastRequest=-1,active=false;
function report(message){outlet(0,'status',message);outlet(1,message);}
function scalar(api,key){var v=api.get(key);return Object.prototype.toString.call(v)==='[object Array]'?v[0]:v;}
function valid(api){return api&&Number(api.id)&&!!api.type;}
function text(value,max){if(value===null||typeof value==='undefined')throw new Error('Missing metadata text');value=String(value);if(!value.replace(/^\s+|\s+$/g,'').length||value.length>max||/[\x00-\x1f]/.test(value))throw new Error('Unsupported metadata text');return value;}
function ids(raw,max){if(Object.prototype.toString.call(raw)!=='[object Array]')throw new Error('Missing object list');var result=[];for(var i=0;i<raw.length;i++)if(raw[i]==='id'&&Number(raw[i+1])){if(result.length>=max)throw new Error('Object list exceeds scan limit');result.push(Number(raw[++i]));}return result;}
function stop(){active=false;epoch++;if(pollTimer)pollTimer.cancel();if(scanTimer)scanTimer.cancel();if(networkTimer)networkTimer.cancel();pollTimer=scanTimer=networkTimer=null;scan=null;var old=http;http=null;if(old)try{old.abort();}catch(e){}}
function disconnect(){stop();report('Disconnected. Click the panel to reconnect the read-only session bridge.');}
function read(){start();}
function loadmanifest(){start();}
function start(){stop();active=true;token=null;lastRequest=-1;report('Connecting to local studio. No plugin values are written.');connect();}
function connect(){request('GET','/api/live/config',null,function(error,body){if(error){report('Bridge error: '+error);later(connect);return;}if(!body||body.bridgeVersion!==1||typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token)){report('Bridge error: Invalid server handshake');later(connect);return;}token=body.token;poll();});}
function later(fn){if(!active)return;var generation=epoch;pollTimer=new Task(function(){if(!active||generation!==epoch)return;pollTimer=null;fn();},this);pollTimer.schedule(2000);}
function request(method,path,body,done){
 if(!active||http)return;var generation=epoch,req=new XMLHttpRequest(),finished=false;http=req;
 function finish(error,result){if(finished||generation!==epoch)return;finished=true;if(networkTimer)networkTimer.cancel();networkTimer=null;http=null;done(error,result);}
 try{req.open(method,endpoint+path);if(token)req.setRequestHeader('X-Studio-Bridge',token);if(body!==null)req.setRequestHeader('Content-Type','application/json');
  req.onreadystatechange=function(){if(generation!==epoch||req.readyState!==4)return;try{if(req.status===401){token=null;lastRequest=-1;finish('Server restarted; reconnecting',null);return;}if(req.status!==200){finish('HTTP '+req.status,null);return;}if(typeof req.responseText!=='string'||req.responseText.length>1000000)throw new Error('Invalid response');finish(null,JSON.parse(req.responseText));}catch(e){finish(e.message,null);}};
  networkTimer=new Task(function(){if(generation!==epoch||finished)return;finish('Studio request timed out',null);try{req.abort();}catch(e){}},this);networkTimer.schedule(10000);if(body===null)req.send();else req.send(JSON.stringify(body));
 }catch(e){finish(e.message,null);}
}
function poll(){if(!active)return;if(!token)return connect();request('GET','/api/live/poll',null,function(error,body){if(error){report('Bridge error: '+error);later(poll);return;}if(!body||typeof body.requestId!=='number'||body.requestId<0||body.requestId%1){report('Bridge error: Invalid scan request');later(poll);return;}if(lastRequest!==body.requestId){var generation=epoch;scanTimer=new Task(function(){if(!active||generation!==epoch)return;scanTimer=null;beginScan(body.requestId);},this);scanTimer.schedule(10);}else later(poll);});}
function scanselected(){if(!active)return start();if(http||scan||scanTimer)return report('Session scan already in progress.');request('POST','/api/live/refresh',{},function(error){if(error){report('Bridge error: '+error);later(poll);return;}if(pollTimer)pollTimer.cancel();pollTimer=null;poll();});}
function bindselected(){scanselected();}
function captureselected(){scanselected();}
function rescan(){scanselected();}
function diag(s,message){if(s.catalog.diagnostics.length<32)s.catalog.diagnostics.push(String(message).substring(0,256));}
function enqueue(s,job){if(s.totalJobs++>=8192){diag(s,'Scan work limit reached; some devices are omitted.');return;}s.jobs.push(job);}
function beginScan(requestId){
 var s={requestId:requestId,generation:epoch,started:Date.now(),jobs:[],cursor:0,totalJobs:0,totalParameters:0,payloadChars:0,containers:{},devices:{},catalog:{catalogVersion:1,source:'live-session-exposed',devices:[],diagnostics:[]}};scan=s;
 try{var song=new LiveAPI(null,'live_set');if(!valid(song))throw new Error('Live session not initialized');var tracks=ids(song.get('tracks'),128),returns=ids(song.get('return_tracks'),32),master=new LiveAPI(null,'live_set master_track');
  for(var i=0;i<tracks.length;i++)enqueue(s,{kind:'container',id:tracks[i],trail:'',depth:0});for(i=0;i<returns.length;i++)enqueue(s,{kind:'container',id:returns[i],trail:'',depth:0});if(valid(master))enqueue(s,{kind:'container',id:Number(master.id),trail:'',depth:0});
  report('Reading Live plugin controls. No parameter writes.');advance();
 }catch(e){scan=null;report('Scan error: '+e.message);later(poll);}
}
function job(s,j){
 var api=new LiveAPI(null,'id '+j.id);if(!valid(api))throw new Error('An object disappeared during scanning');
 if(j.kind==='container'){
  if(s.containers['$'+j.id])return;s.containers['$'+j.id]=true;var name=String(scalar(api,'name')||'Unnamed').replace(/[\x00-\x1f]/g,' '),trail=(j.trail?j.trail+' / ':'')+name;trail=trail.substring(0,400);
  var devices=ids(api.get('devices'),128);for(var i=0;i<devices.length;i++)enqueue(s,{kind:'device',id:devices[i],trail:trail,depth:j.depth});return;
 }
 if(j.kind==='device'){
  if(s.devices['$'+j.id])return;s.devices['$'+j.id]=true;
  if(api.type==='PluginDevice'){
   if(s.catalog.devices.length>=128){diag(s,'Plugin limit reached; remaining plugins omitted.');return;}
   var pluginName=text(scalar(api,'name'),160),entry={id:'device-'+j.id,label:(j.trail+' / '+pluginName).substring(0,512),pluginName:pluginName,capture:{captureVersion:1,source:'live-exposed-parameters',pluginName:pluginName,parameters:[]},diagnostic:null};var entrySize=JSON.stringify(entry).length+512;if(s.payloadChars+entrySize>200000){diag(s,'Catalog transfer limit reached; some plugins omitted.');return;}s.payloadChars+=entrySize;s.catalog.devices.push(entry);
   var parameters;try{parameters=ids(api.get('parameters'),256);}catch(e){entry.diagnostic=e.message;return;}for(i=0;i<parameters.length;i++){if(s.totalParameters>=4096){entry.diagnostic='Session control limit reached. Some controls omitted.';break;}s.totalParameters++;enqueue(s,{kind:'parameter',id:parameters[i],index:i,entry:entry});}return;
  }
  if(Number(scalar(api,'can_have_chains'))){if(j.depth>=8){diag(s,'Rack nesting limit reached.');return;}var chains=ids(api.get('chains'),128);for(i=0;i<chains.length;i++)enqueue(s,{kind:'container',id:chains[i],trail:j.trail+' / '+String(scalar(api,'name')).replace(/[\x00-\x1f]/g,' '),depth:j.depth+1});}return;
 }
 if(api.type!=='DeviceParameter')throw new Error('Parameter type changed during scanning');var min=Number(scalar(api,'min')),max=Number(scalar(api,'max')),current=Number(scalar(api,'value'));if(!isFinite(min)||!isFinite(max)||!isFinite(current)||min>=max||current<min||current>max||Math.abs(min)>1e9||Math.abs(max)>1e9){j.entry.diagnostic='Some controls have unavailable or unsupported metadata.';return;}
 var quantized=!!Number(scalar(api,'is_quantized')),labels=quantized?api.get('value_items'):[];
 if(Object.prototype.toString.call(labels)!=='[object Array]'||labels.length>256)labels=[];
 try{labels=labels.map(function(label){return text(label,160);});}catch(e){labels=[];}
 var parameter={index:j.index,name:text(scalar(api,'name'),160),min:min,max:max,currentValue:current,quantized:quantized,enumLabels:labels},size=JSON.stringify(parameter).length+64;if(s.payloadChars+size>200000){j.entry.diagnostic='Catalog transfer limit reached; some controls omitted.';return;}s.payloadChars+=size;j.entry.capture.parameters.push(parameter);
}
function advance(){
 var s=scan;if(!active||!s||s.generation!==epoch)return;scanTimer=null;
 if(Date.now()-s.started>20000){diag(s,'Scan timed out; results may be incomplete.');s.cursor=s.jobs.length;}
 for(var count=0;count<8&&s.cursor<s.jobs.length;count++){try{job(s,s.jobs[s.cursor++]);}catch(e){diag(s,'Skipped object: '+e.message);}}
 if(s.cursor<s.jobs.length){scanTimer=new Task(function(){if(scan===s&&s.generation===epoch&&active)advance();},this);scanTimer.schedule(10);return;}
 for(var i=0;i<s.catalog.devices.length;i++){var entry=s.catalog.devices[i];if(!entry.capture.parameters.length){entry.capture=null;entry.diagnostic=entry.diagnostic||'No exposed controls available. Configure in Live, then refresh.';}}
 scan=null;var raw=JSON.stringify(s.catalog);if(raw.length>240000){report('Scan error: Catalog too large to transfer safely');later(poll);return;}
 request('POST','/api/live/catalog',{requestId:s.requestId,catalog:s.catalog},function(error,body){if(error||!body||body.accepted!==true||typeof body.devices!=='number'){report('Transfer error: '+(error||'Invalid catalog acknowledgement'));later(poll);return;}lastRequest=s.requestId;report('Live session ready: '+body.devices+' plugins. Choose controls in the studio.');later(poll);});
}
function notifydeleted(){disconnect();}
