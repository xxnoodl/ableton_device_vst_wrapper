import {parseProject, serializeProject, type Project} from '../schema/index.ts';
export type Storage = {getItem(key:string):string|null;setItem(key:string,value:string):void};
export function saveProject(storage:Storage, key:string, project:Project):void {
  const source=serializeProject(project);
  const previous=storage.getItem(key);
  if(previous !== null) storage.setItem(key+'.backup',previous);
  storage.setItem(key,source);
}
export function loadProject(storage:Storage,key:string):Project {
  const source=storage.getItem(key);
  if(source === null) throw new Error('No saved project');
  return parseProject(source);
}
