export const knobDesigns = ['studio','graphite','silver','selector','halo','stepped','pointer','recessed','gloss','monitor'] as const;
export const knobAccents = ['mint','amber','cyan','red'] as const;
export type Parameter = { id: string; name: string; min: number; max: number; defaultValue: number; unit: string; evidence: 'synthetic' | 'user-reported' };
export type Widget = { id: string; type: 'knob' | 'slider'; label: string; parameterId: string; x: number; y: number; width: number; height: number; design: typeof knobDesigns[number]; accent: typeof knobAccents[number]; stepCount: number; stepValues: number[]; locked: boolean; groupId: string | null };
export type Project = { schemaVersion: 1; id: string; name: string; plugin: { vendor: string; name: string; format: 'VST3'; classId: string | null }; target: { kind: 'live-exposed'; liveVersion: string; maxVersion: string; reconnect: 'explicit' }; parameters: Parameter[]; widgets: Widget[]; panel: { width: number; height: number; grid: number }; theme: 'dark' | 'light'; dataSource: 'demo-only' };
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
function object(value: unknown, keys: string[], at: string, optional: string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${at}: expected object`);
  const o = value as Record<string, unknown>;
  for (const key of Object.keys(o)) if (!keys.includes(key)) throw new Error(`${at}: unknown field ${key}`);
  for (const key of keys) if (!own(o, key) && !optional.includes(key)) throw new Error(`${at}: missing ${key}`);
  return o;
}
function text(value: unknown, at: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 160 || /[\u0000-\u001f]/.test(value)) throw new Error(`${at}: expected text of 1?160 characters`);
  return value;
}
function number(value: unknown, low: number, high: number, at: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) throw new Error(`${at}: expected finite number from ${low} to ${high}`);
  return value;
}
function choice<T extends string>(value: unknown, options: readonly T[], at: string): T {
  if (!options.includes(value as T)) throw new Error(`${at}: expected ${options.join(' or ')}`);
  return value as T;
}
function list(value: unknown, at: string): unknown[] {
  if (!Array.isArray(value) || value.length > 256) throw new Error(`${at}: expected at most 256 entries`);
  return value;
}
export function validateProject(input: unknown): Project {
  const o = object(input, ['schemaVersion','id','name','plugin','target','parameters','widgets','panel','theme','dataSource'], 'project');
  if (o.schemaVersion !== 1) throw new Error('Unsupported schema version; no migration is available');
  const plugin = object(o.plugin, ['vendor','name','format','classId'], 'plugin');
  const target = object(o.target, ['kind','liveVersion','maxVersion','reconnect'], 'target');
  const panel = object(o.panel, ['width','height','grid'], 'panel');
  const parameters = list(o.parameters, 'parameters').map((value, i): Parameter => {
    const p = object(value, ['id','name','min','max','defaultValue','unit','evidence'], `parameters[${i}]`);
    const min = number(p.min,-1e9,1e9,'parameter.min');
    const max = number(p.max,min,1e9,'parameter.max');
    if (min === max) throw new Error('Parameter range must be nonzero');
    if (typeof p.unit !== 'string' || p.unit.length > 32) throw new Error('Invalid parameter unit');
    return {id:text(p.id,'parameter.id'),name:text(p.name,'parameter.name'),min,max,defaultValue:number(p.defaultValue,min,max,'parameter.defaultValue'),unit:p.unit,evidence:choice(p.evidence,['synthetic','user-reported'],'parameter.evidence')};
  });
  const width = number(panel.width,320,1600,'panel.width');
  const height = number(panel.height,160,900,'panel.height');
  const ids = new Set(parameters.map(p => p.id));
  if (ids.size !== parameters.length) throw new Error('Duplicate parameter IDs');
  const widgets = list(o.widgets,'widgets').map((value,i): Widget => {
    const w = object(value,['id','type','label','parameterId','x','y','width','height','design','accent','stepCount','stepValues','locked','groupId'],`widgets[${i}]`,['design','accent','stepCount','stepValues','locked','groupId']);
    const parameterId = text(w.parameterId,'widget.parameterId');
    if (!ids.has(parameterId)) throw new Error('Widget references an unknown parameter');
    const stepCount = w.stepCount === undefined ? 0 : number(w.stepCount,0,128,'widget.stepCount');
    if (!Number.isInteger(stepCount) || stepCount === 1) throw new Error('Step count must be 0 or an integer from 2 to 128');
    const parameter = parameters.find(p => p.id === parameterId)!;
    const stepValues = w.stepValues === undefined ? [] : list(w.stepValues,'widget.stepValues').map(v => number(v,parameter.min,parameter.max,'step value'));
    if (stepValues.length === 1 || stepValues.length > 128 || stepValues.some((v,i) => i > 0 && v <= stepValues[i-1])) throw new Error('Custom values must contain 2?128 increasing values');
    if (stepCount && stepValues.length) throw new Error('Choose equal steps or custom values, not both');
    const wWidth = number(w.width,96,width,'widget.width');
    const wHeight = number(w.height,110,height,'widget.height');
    return {id:text(w.id,'widget.id'),type:choice(w.type,['knob','slider'],'widget.type'),label:text(w.label,'widget.label'),parameterId,x:number(w.x,0,width-wWidth,'widget.x'),y:number(w.y,0,height-wHeight,'widget.y'),width:wWidth,height:wHeight,design:choice(w.design === undefined ? 'studio' : w.design,knobDesigns,'widget.design'),accent:choice(w.accent === undefined ? 'mint' : w.accent,knobAccents,'widget.accent'),stepCount,stepValues,locked:w.locked === undefined ? false : typeof w.locked === 'boolean' ? w.locked : (()=>{throw new Error('Invalid lock state');})(),groupId:w.groupId === undefined || w.groupId === null ? null : text(w.groupId,'widget.groupId')};
  });
  if (new Set(widgets.map(w => w.id)).size !== widgets.length) throw new Error('Duplicate widget IDs');
  return {schemaVersion:1,id:text(o.id,'id'),name:text(o.name,'name'),plugin:{vendor:text(plugin.vendor,'plugin.vendor'),name:text(plugin.name,'plugin.name'),format:choice(plugin.format,['VST3'],'plugin.format'),classId:plugin.classId === null ? null : text(plugin.classId,'plugin.classId')},target:{kind:choice(target.kind,['live-exposed'],'target.kind'),liveVersion:text(target.liveVersion,'target.liveVersion'),maxVersion:text(target.maxVersion,'target.maxVersion'),reconnect:choice(target.reconnect,['explicit'],'target.reconnect')},parameters,widgets,panel:{width,height,grid:number(panel.grid,1,32,'panel.grid')},theme:choice(o.theme,['dark','light'],'theme'),dataSource:choice(o.dataSource,['demo-only'],'dataSource')};
}
export function parseProject(source: string): Project {
  if (typeof source !== 'string' || source.length > 1_000_000) throw new Error('Project exceeds the 1 MB text limit');
  return validateProject(JSON.parse(source));
}
export function serializeProject(project: Project): string { return JSON.stringify(validateProject(project), null, 2) + '\n'; }
export function normalize(value: number, p: Parameter): number {
  if (![value,p.min,p.max].every(Number.isFinite) || p.max <= p.min) throw new Error('Invalid parameter range or value');
  return Math.max(0,Math.min(1,(value-p.min)/(p.max-p.min)));
}
export function denormalize(value: number, p: Parameter): number {
  if (!Number.isFinite(value)) throw new Error('Invalid normalized value');
  normalize(p.min,p);
  return p.min + Math.max(0,Math.min(1,value))*(p.max-p.min);
}
export function moveWidget(project: Project, id: string, x: number, y: number): Project {
  if (![x,y].every(Number.isFinite)) throw new Error('Invalid position');
  if (!project.widgets.some(w => w.id === id)) throw new Error('Unknown widget');
  const grid=project.panel.grid;
  return validateProject({...project,widgets:project.widgets.map(w => w.id !== id ? w : {...w,x:Math.max(0,Math.min(project.panel.width-w.width,Math.round(x/grid)*grid)),y:Math.max(0,Math.min(project.panel.height-w.height,Math.round(y/grid)*grid))})});
}
