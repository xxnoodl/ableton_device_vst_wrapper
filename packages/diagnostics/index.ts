import {validateProject,type Project} from '../schema/index.ts';
export type Diagnostic={severity:'error'|'warning'|'info';code:string;message:string};
export function diagnoseProject(input:Project):Diagnostic[]{
 const p=validateProject(input),items:Diagnostic[]=[];
 if(!p.widgets.length)items.push({severity:'error',code:'no-controls',message:'Select at least one control before Max export.'});
 const selected=new Set(p.widgets.map(w=>w.parameterId));const parameters=p.parameters.filter(v=>selected.has(v.id));
 if(parameters.some(p=>p.evidence==='native-inspected'))items.push({severity:'error',code:'native-binding-unverified',message:'These controls were discovered in the plugin, but their Live routing is not verified yet. Device generation is unavailable for this selection.'});
 for(const param of parameters){const matches=p.parameters.filter(other=>other.name.trim().toLowerCase()===param.name.trim().toLowerCase()&&Math.abs(other.min-param.min)<1e-7&&Math.abs(other.max-param.max)<1e-7);if(matches.length>1)items.push({severity:'error',code:'ambiguous-parameter',message:param.name+': repeated name and raw range; generic Live matching cannot distinguish it.'});}
 if(parameters.some(p=>p.evidence==='synthetic'))items.push({severity:'info',code:'synthetic-demo',message:'Synthetic controls export in demo-only mode and cannot bind to a real plugin.'});
 if(p.plugin.format==='unknown')items.push({severity:'warning',code:'unknown-format',message:'Plugin format is unverified. Live capture alone does not identify VST3.'});
 if(parameters.some(p=>p.resetSource==='captured-current'))items.push({severity:'info',code:'capture-reset',message:'Double-click reset uses capture-time values, not factory defaults.'});
 if(p.graphs.length)items.push({severity:'warning',code:'graphs-preview-only',message:'Derived graphs are synthetic editor previews and are omitted from Max runtime export.'});
 items.push({severity:'info',code:'editor-disconnected',message:'Preview values are simulated and never write to Live. The optional session bridge reads metadata only.'});
 items.push({severity:'warning',code:'runtime-unverified',message:'Host compatibility remains plugin-specific. Passing schema checks does not verify every plugin or control.'});
 items.push({severity:'info',code:'native-parity',message:'Max uses native drawing approximations in its fixed-height panel. Browser pixel parity is not established.'});
 return items;
}
