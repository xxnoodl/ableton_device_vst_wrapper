/* Native Max JSUI prototype; shape parity, not browser pixel parity. */
autowatch=1;inlets=1;outlets=1;
include('runtime-core.js');
mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
var project=null,values={},message='Load a layout. No target connected.',drag=null,selected=-1;
function status(text){message=String(text);if(message.indexOf('Disconnected')===0||message.indexOf('error:')>=0||message.indexOf('Error:')>=0){drag=null;}mgraphics.redraw();}
function manifest(source){try{project=RuntimeCore.parse(source);values={};drag=null;selected=-1;for(var i=0;i<project.parameters.length;i++)values['$'+project.parameters[i].id]=project.parameters[i].defaultValue;message=project.demoOnly?'Demo only. Synthetic data.':'Disconnected. Bind explicitly.';mgraphics.redraw();}catch(e){status('Load error: '+e.message);}}
function value(id,next){if(!project||!isFinite(Number(next)))return;var p;try{p=RuntimeCore.parameter(project,id);}catch(e){return;}values['$'+id]=RuntimeCore.clamp(Number(next),p.min,p.max);mgraphics.redraw();}
function color(r,g,b,a){mgraphics.set_source_rgba(r,g,b,typeof a==='number'?a:1);}
function circle(x,y,r){mgraphics.ellipse(x-r,y-r,r*2,r*2);mgraphics.fill();}
function line(x1,y1,x2,y2,width){mgraphics.set_line_width(width);mgraphics.move_to(x1,y1);mgraphics.line_to(x2,y2);mgraphics.stroke();}
function centered(text,x,y){var width=mgraphics.text_measure(String(text))[0];mgraphics.move_to(x-width/2,y);mgraphics.show_text(String(text));}
function frame(){
 if(!project||!project.widgets.length)return {scale:1,x:0,y:0};
 var left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
 for(var i=0;i<project.widgets.length;i++){var w=project.widgets[i];left=Math.min(left,w.x);top=Math.min(top,w.y);right=Math.max(right,w.x+w.width);bottom=Math.max(bottom,w.y+w.height);}
 var scale=Math.min(Math.max(1,mgraphics.size[0]-16)/(right-left),Math.max(1,mgraphics.size[1]-28)/(bottom-top));
 return {scale:scale,x:(mgraphics.size[0]-(right-left)*scale)/2-left*scale,y:3-top*scale};
}
function paint(){
 var light=project&&project.theme==='light';color(light ? 0.81 : 0.10,light ? 0.85 : 0.12,light ? 0.82 : 0.14);mgraphics.paint();
 mgraphics.select_font_face('Arial');mgraphics.set_font_size(11);
 if(project){
  var view=frame();mgraphics.save();mgraphics.translate(view.x,view.y);mgraphics.scale(view.scale,view.scale);
  for(var i=0;i<project.widgets.length;i++)drawWidget(project.widgets[i],i===selected,light);
  mgraphics.restore();
 }
 color(.08,.10,.11);mgraphics.rectangle(0,mgraphics.size[1]-22,mgraphics.size[0],22);mgraphics.fill();
 color(.75,.83,.77);mgraphics.set_font_size(10);mgraphics.move_to(6,mgraphics.size[1]-7);var display=message.indexOf('Bound ')===0?'Connected':message.indexOf('Disconnected')===0?'Disconnected':message;while(display.length>1&&mgraphics.text_measure(display)[0]>mgraphics.size[0]-12)display=display.substring(0,display.length-2);mgraphics.show_text(display);
}
function drawWidget(w,active,light){
 var p=RuntimeCore.parameter(project,w.parameterId),current=values['$'+p.id],pos=RuntimeCore.position(current,p,w),angle=(-135+pos*270)*Math.PI/180;
 var x=w.x+w.width/2,y=w.y+56,r=Math.max(18,Math.min(w.width*.29,(w.height-70)/2,55));
 var accents={mint:[.64,.78,.69],amber:[.95,.67,.26],cyan:[.30,.80,.92],red:[.92,.39,.37]},accent=accents[w.accent];
 if(active){color(.64,.78,.69,.3);mgraphics.rectangle(w.x,w.y,w.width,w.height);mgraphics.set_line_width(1);mgraphics.stroke();}
 color(light ? 0.10 : 0.86,light ? 0.17 : 0.89,light ? 0.13 : 0.87);mgraphics.set_font_size(11);centered(w.label,w.x+w.width/2,w.y+16);
 if(w.design==='monitor'){
  color(.55,.62,.57,.12);circle(x-1,y-2,r+9);color(.02,.03,.03,.5);circle(x+2,y+6,r+3);color(.14,.18,.16);circle(x,y+3,r);color(.025,.035,.03);circle(x,y,r);
 }else{
  color(.015,.02,.02);circle(x+1,y+3,r+3);color(w.design==='silver' ? 0.66 : 0.10,w.design==='silver' ? 0.71 : 0.13,w.design==='silver' ? 0.71 : 0.14);circle(x,y,r);
 }
 var stopList=RuntimeCore.stops(w,p),ticks=stopList.length>1&&stopList.length<=64?stopList.length:25;
 if(w.design!=='monitor')for(var j=0;j<ticks;j++){
  var a=(-135+j*270/(ticks-1))*Math.PI/180;var lit=w.design==='stepped'&&j/(ticks-1)<=pos;
  if(lit)color(accent[0],accent[1],accent[2]);else color(.43,.49,.46);
  line(x+Math.sin(a)*(r+5),y-Math.cos(a)*(r+5),x+Math.sin(a)*(r+9),y-Math.cos(a)*(r+9),lit?2:1);
 }
 if(w.design==='selector'){
  mgraphics.save();mgraphics.translate(x,y);mgraphics.rotate(angle);color(.015,.02,.02);mgraphics.move_to(-r*.15,-r*1.33);mgraphics.line_to(r*.15,-r*1.33);mgraphics.line_to(r*.30,r*1.33);mgraphics.line_to(-r*.30,r*1.33);mgraphics.close_path();mgraphics.fill();color(accent[0],accent[1],accent[2]);mgraphics.rectangle(-2,-r*1.18,4,r*.35);mgraphics.fill();mgraphics.restore();
 }else{
  color(accent[0],accent[1],accent[2],w.design==='monitor' ? 0.65:1);
  line(x+Math.sin(angle)*r*.52,y-Math.cos(angle)*r*.52,x+Math.sin(angle)*r*.86,y-Math.cos(angle)*r*.86,w.design==='monitor'?1:2);
 }
 var decimals=Math.max(0,Math.min(8,3-Math.floor(Math.log(p.max-p.min)/Math.LN10)));
 color(light ? 0.15 : 0.78,light ? 0.22 : 0.83,light ? 0.18 : 0.80);mgraphics.select_font_face('Courier New');mgraphics.set_font_size(11);centered(current.toFixed(decimals)+' '+p.unit,x,w.y+w.height-17);mgraphics.select_font_face('Arial');
}
function hit(x,y){if(!project||y>=mgraphics.size[1]-22)return -1;var view=frame();x=(x-view.x)/view.scale;y=(y-view.y)/view.scale;for(var i=project.widgets.length-1;i>=0;i--){var w=project.widgets[i];if(x>=w.x&&x<=w.x+w.width&&y>=w.y&&y<=w.y+w.height)return i;}return -1;}
function emit(w,next){var p=RuntimeCore.parameter(project,w.parameterId);next=RuntimeCore.snap(next,p,w);if(project.demoOnly){values['$'+p.id]=next;mgraphics.redraw();}else outlet(0,'queuewrite',p.id,next);}
function onclick(x,y,but,cmd,shift){selected=hit(x,y);if(selected<0)return;var w=project.widgets[selected],p=RuntimeCore.parameter(project,w.parameterId);drag={index:selected,lastY:y,position:RuntimeCore.position(values['$'+p.id],p,w)};mgraphics.redraw();}
function ondrag(x,y,but,cmd,shift){if(!drag||!project)return;if(!but){drag=null;return;}var w=project.widgets[drag.index],p=RuntimeCore.parameter(project,w.parameterId);drag.position=RuntimeCore.clamp(drag.position-(y-drag.lastY)/(shift?2000:200),0,1);drag.lastY=y;emit(w,RuntimeCore.at(drag.position,p,w));}
function ondblclick(x,y){var i=hit(x,y);if(i>=0){var w=project.widgets[i];emit(w,RuntimeCore.parameter(project,w.parameterId).defaultValue);}}
function setvalue(widgetId,next){if(!project)return;for(var i=0;i<project.widgets.length;i++)if(project.widgets[i].id===widgetId){emit(project.widgets[i],next);return;}}
function onresize(){mgraphics.redraw();}onresize.local=1;
