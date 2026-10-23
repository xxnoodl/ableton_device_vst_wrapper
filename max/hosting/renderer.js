/* Four-control hosting proof. Formatted text comes only from vst~. */
autowatch=1;inlets=1;outlets=1;
mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
var state={phase:'idle',controls:[],latency:null},message='Starting internal plugin...',drag=null;
var panelSized=false;
function status(text){text=String(text);if(text===message)return;message=text;mgraphics.redraw();}
function manifest(){}
function hosting(source){try{state=JSON.parse(source);if(state.phase!=='ready')drag=null;sizePanel();mgraphics.redraw();}catch(e){status('Display error: '+e.message);}}
function sizePanel(){if(panelSized||!this.box||!this.patcher)return;this.box.message('presentation_rect',0,0,580,169);this.box.message('size',580,169);for(var o=this.patcher.firstobject,n=0;o&&n<1024;o=o.nextobject,n++){
 if(o.maxclass==='live.thisdevice')o.message('setwidth',580);
 // The unchanged development shell carries two legacy message buttons.
 if(o.maxclass==='message')o.message('presentation',0);
}panelSized=true;}
function color(r,g,b){mgraphics.set_source_rgba(r,g,b,1);}
function label(text,x,y,width){var t=String(text);while(t.length>1&&mgraphics.text_measure(t)[0]>width)t=t.substring(0,t.length-2);mgraphics.move_to(x,y);mgraphics.show_text(t);}
function center(text,x,y,width){var t=String(text);while(t.length>1&&mgraphics.text_measure(t)[0]>width)t=t.substring(0,t.length-2);mgraphics.move_to(x-mgraphics.text_measure(t)[0]/2,y);mgraphics.show_text(t);}
function paint(){
 color(.10,.12,.14);mgraphics.paint();mgraphics.select_font_face('Arial');mgraphics.set_font_size(12);color(.83,.87,.84);label('Pro-C 3 Studio | hosting test',12,20,280);
 color(.19,.23,.22);mgraphics.rectangle(305,5,100,23);mgraphics.fill();mgraphics.rectangle(413,5,77,23);mgraphics.fill();mgraphics.rectangle(498,5,70,23);mgraphics.fill();color(.83,.87,.84);mgraphics.set_font_size(11);center('Open plugin',355,21,94);center('Read values',451,21,72);center('Retry',533,21,64);
 for(var i=0;i<4;i++){
  var c=state.controls[i],x=76+i*142,y=83; color(.82,.86,.83);mgraphics.set_font_size(12);center(c?c.name:['Threshold','Ratio','Attack','Release'][i],x,48,130);
  color(.035,.045,.04);mgraphics.ellipse(x-27,y-27,54,54);mgraphics.fill();color(.24,.29,.26);mgraphics.ellipse(x-26,y-26,52,52);mgraphics.set_line_width(1);mgraphics.stroke();
  var v=c&&c.value!==null?c.value:0,a=(-135+v*270)*Math.PI/180;color(.65,.78,.69);mgraphics.move_to(x+Math.sin(a)*17,y-Math.cos(a)*17);mgraphics.line_to(x+Math.sin(a)*24,y-Math.cos(a)*24);mgraphics.set_line_width(2);mgraphics.stroke();
  mgraphics.select_font_face('Courier New');mgraphics.set_font_size(12);color(.72,.81,.75);center(c?c.text:'Waiting',x,133,132);mgraphics.select_font_face('Arial');
 }
 color(.07,.09,.10);mgraphics.rectangle(0,145,580,24);mgraphics.fill();color(.71,.78,.73);mgraphics.set_font_size(10);label(message,10,161,560);
}
function onclick(x,y){if(y>=5&&y<=29){if(x>=305&&x<=405)outlet(0,'openplugin');else if(x>=413&&x<=490)outlet(0,'readvalues');else if(x>=498&&x<=568)outlet(0,'loadplugin');return;}
 if(state.phase!=='ready'||y<51||y>118)return;for(var i=0;i<state.controls.length;i++)if(Math.abs(x-(76+i*142))<=35&&state.controls[i].value!==null){drag={slot:i,y:y,value:state.controls[i].value};return;}}
function ondrag(x,y,but,cmd,shift){if(!but){drag=null;return;}if(!drag||state.phase!=='ready')return;outlet(0,'setcontrol',drag.slot,Math.max(0,Math.min(1,drag.value+(drag.y-y)/(shift?1200:240))));}
