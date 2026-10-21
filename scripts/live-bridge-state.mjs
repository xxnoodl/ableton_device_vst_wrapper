import {randomBytes,timingSafeEqual} from 'node:crypto';
import {validateLiveCatalog} from '../packages/live-session/index.ts';
export function createLiveBridgeState({now=Date.now,token=randomBytes(32).toString('hex')}={}){
 let requestId=0,completedId=-1,catalog=null,updatedAt=null,lastSeen=null;
 return {
  config(){return {bridgeVersion:1,token};},
  authorized(value){return typeof value==='string'&&Buffer.byteLength(value)===Buffer.byteLength(token)&&timingSafeEqual(Buffer.from(value),Buffer.from(token));},
  refresh(){requestId++;return {requestId};},
  poll(){lastSeen=now();return {requestId};},
  accept(body){if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['requestId','catalog'].includes(k))||!Number.isSafeInteger(body.requestId)||body.requestId!==requestId){const error=new Error('Stale or invalid scan request');error.status=409;throw error;}const next=validateLiveCatalog(body.catalog);catalog=next;completedId=requestId;updatedAt=lastSeen=now();return {accepted:true,devices:next.devices.length};},
  session(){return {connected:lastSeen!==null&&now()-lastSeen<45000,updatedAt,pending:completedId!==requestId,requestId,catalog};}
 };
}
