/* Shared browser/Max ES5 routing contract. No expressions, DSP or host IDs. */
var PerformanceRouting = (function () {
 function fail(message){throw new Error(message);}
 function array(x){return Object.prototype.toString.call(x)==='[object Array]';}
 function finite(x){return typeof x==='number'&&isFinite(x);}
 function fields(x,names){if(!x||typeof x!=='object'||array(x))fail('Expected object');var k;for(k in x)if(Object.prototype.hasOwnProperty.call(x,k)&&names.indexOf(k)<0)fail('Unknown field: '+k);for(var i=0;i<names.length;i++)if(!Object.prototype.hasOwnProperty.call(x,names[i]))fail('Missing field: '+names[i]);}
 function text(x){if(typeof x!=='string'||!x.length||x.length>160||/[\x00-\x1f]/.test(x))fail('Invalid text');return x;}
 function number(x,lo,hi){if(!finite(x)||x<lo||x>hi)fail('Number out of range');return x;}
 function list(x,max){if(!array(x)||x.length>max)fail('Invalid list');return x;}
 function unique(items){var ids={};for(var i=0;i<items.length;i++){text(items[i].id);if(ids['$'+items[i].id])fail('Duplicate ID');ids['$'+items[i].id]=true;}}
 function find(items,id){for(var i=0;i<items.length;i++)if(items[i].id===id)return items[i];return null;}
 function validate(input){
  fields(input,['rackVersion','name','targets','macros','routes']);if(input.rackVersion!==1)fail('Unknown rack version');text(input.name);
  list(input.targets,16);unique(input.targets);list(input.macros,16);unique(input.macros);list(input.routes,128);unique(input.routes);if(!input.targets.length||!input.macros.length)fail('At least one target and macro required');
  for(var i=0;i<input.targets.length;i++){var t=input.targets[i];fields(t,['id','label','pluginName','parameters']);text(t.label);text(t.pluginName);list(t.parameters,64);unique(t.parameters);if(!t.parameters.length)fail('A target needs exposed controls');var identities={};
   for(var j=0;j<t.parameters.length;j++){var p=t.parameters[j];fields(p,['id','name','min','max','quantized']);text(p.name);number(p.min,-1e9,1e9);number(p.max,-1e9,1e9);if(p.max<=p.min||typeof p.quantized!=='boolean')fail('Invalid parameter range or quantization');var identity=JSON.stringify([p.name,p.min,p.max,p.quantized]);if(identities[identity])fail('Two parameter IDs cannot alias the same host control');identities[identity]=true;}
  }
  for(i=0;i<input.macros.length;i++){var m=input.macros[i];fields(m,['id','label','value']);text(m.label);number(m.value,0,1);}
  var destinations={};
  for(i=0;i<input.routes.length;i++){var r=input.routes[i];fields(r,['id','macroId','targetId','parameterId','inputMin','inputMax','outputMin','outputMax','curve','steps','smoothingMs','enabled']);
   t=find(input.targets,r.targetId);p=t&&find(t.parameters,r.parameterId);if(!p||!find(input.macros,r.macroId))fail('Route references a missing source or destination');
   number(r.inputMin,0,1);number(r.inputMax,0,1);if(r.inputMax<=r.inputMin)fail('Input interval must increase');number(r.outputMin,p.min,p.max);number(r.outputMax,p.min,p.max);number(r.curve,.1,8);number(r.smoothingMs,0,2000);if(typeof r.enabled!=='boolean')fail('Invalid route switch');
   list(r.steps,128);if(r.steps.length===1||(p.quantized&&r.steps.length<2))fail('Discrete destinations need at least two explicit stops');
   for(j=0;j<r.steps.length;j++){number(r.steps[j],p.min,p.max);if(j&&r.steps[j]<=r.steps[j-1])fail('Stops must increase');}
   if(r.steps.length&&(r.steps.indexOf(r.outputMin)<0||r.steps.indexOf(r.outputMax)<0))fail('Stepped route endpoints must be stops');
   var key=JSON.stringify([r.targetId,r.parameterId]);if(r.enabled&&destinations[key])fail('A destination can have only one active route');if(r.enabled)destinations[key]=true;
  }
  return JSON.parse(JSON.stringify(input));
 }
 function parse(raw){if(typeof raw!=='string'||raw.length>1000000)fail('Rack exceeds 1 MB');return validate(JSON.parse(raw));}
 function value(route,position){number(position,0,1);var x=Math.max(0,Math.min(1,(position-route.inputMin)/(route.inputMax-route.inputMin)));var v=route.outputMin+(route.outputMax-route.outputMin)*Math.pow(x,route.curve);
  if(route.steps.length){var best=route.steps[0];for(var i=1;i<route.steps.length;i++)if(Math.abs(route.steps[i]-v)<Math.abs(best-v))best=route.steps[i];v=best;}return v;
 }
 function evaluate(rack,macroId,position){number(position,0,1);if(!find(rack.macros,macroId))fail('Unknown macro');var writes=[];for(var i=0;i<rack.routes.length;i++){var r=rack.routes[i];if(r.enabled&&r.macroId===macroId)writes.push({routeId:r.id,targetId:r.targetId,parameterId:r.parameterId,value:value(r,position),smoothingMs:r.steps.length?0:r.smoothingMs});}return writes;}
 function display(rack){var columns=Math.min(8,rack.macros.length);return {runtimeVersion:1,autoBindPrevious:false,projectId:'performance-rack',name:rack.name,pluginName:'Performance rack',theme:'dark',panel:{width:Math.max(320,columns*128+16),height:Math.ceil(rack.macros.length/columns)*168+56},demoOnly:false,parameters:rack.macros.map(function(m){return {id:m.id,name:m.label,min:0,max:1,defaultValue:m.value,unit:'',evidence:'user-reported'};}),widgets:rack.macros.map(function(m,i){return {id:'macro-'+i,parameterId:m.id,label:m.label,x:8+(i%columns)*128,y:48+Math.floor(i/columns)*168,width:120,height:160,design:'monitor',accent:'mint',stepCount:0,stepValues:[]};})};}
 return {validate:validate,parse:parse,value:value,evaluate:evaluate,find:find,display:display};
}());
if(typeof globalThis!=='undefined')globalThis.PerformanceRouting=PerformanceRouting;
