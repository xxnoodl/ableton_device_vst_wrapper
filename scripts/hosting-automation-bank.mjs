// Static parameter definitions. Never rename or change ranges in a running Live device.
export const hostingControls=['Threshold','Ratio','Attack','Release'];
export function hostingAutomationPatch(){
 const boxes=[],lines=[];
 const box=(id,maxclass,rect,text,extra={})=>boxes.push({box:{id,maxclass,patching_rect:rect,...(text?{text}:{}),...extra}});
 const line=(a,out,b,input)=>lines.push({patchline:{source:[a,out],destination:[b,input]}});
 box('input','newobj',[20,20,40,22],'inlet');box('commands','newobj',[20,60,130,22],'route sync gesture');
 box('sync','newobj',[20,100,130,22],'route 0 1 2 3');box('gesture','newobj',[220,100,130,22],'route 0 1 2 3');
 box('output','newobj',[20,320,50,22],'outlet');line('input',0,'commands',0);line('commands',0,'sync',0);line('commands',1,'gesture',0);
 const parameters={};
 hostingControls.forEach((name,i)=>{
  const id='parameter-'+i;
  box('silent-'+i,'newobj',[20+i*150,145,85,22],'prepend set');
  box(id,'live.dial',[20+i*150,185,64,48],undefined,{numinlets:1,numoutlets:2,outlettype:['','float'],parameter_enable:1,varname:'studio_'+name.toLowerCase(),saved_attribute_attributes:{valueof:{parameter_longname:name,parameter_shortname:name,parameter_type:0,parameter_mmin:0,parameter_mmax:1,parameter_unitstyle:0,parameter_initial_enable:0,parameter_invisible:0,parameter_modmode:0,parameter_defer:1,parameter_speedlim:10}}});
  box('return-'+i,'newobj',[20+i*150,260,145,22],'prepend automationvalue '+i);
  line('sync',i,'silent-'+i,0);line('silent-'+i,0,id,0);line('gesture',i,id,0);line(id,0,'return-'+i,0);line('return-'+i,0,'output',0);parameters[id]=[name,name,0];
 });
 return {patcher:{fileversion:1,rect:[0,0,650,370],boxes,lines,parameters}};
}
