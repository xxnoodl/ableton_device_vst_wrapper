import {scanPluginDirectories} from '../native/plugin-inspector/supervisor.mjs';
import {validateInventory} from '../packages/inventory/index.ts';
import {validateDeviceTemplate} from '../packages/export/index.ts';
import {inspectPlugin} from '../native/plugin-inspector/native-supervisor.mjs';
import {validatePluginInspection} from '../packages/plugin-inspection/index.ts';
import http from 'node:http';
import {readFile, realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {stripTypeScriptTypes} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const routes=['/apps/studio/','/packages/schema/','/packages/project-store/','/packages/export/','/packages/diagnostics/','/packages/analysis/','/packages/layout-engine/','/packages/presets/','/packages/host-capture/','/packages/inventory/','/packages/plugin-inspection/','/max/runtime/','/fixtures/'];
const mime={'.html':'text/html','.js':'text/javascript','.cjs':'text/javascript','.ts':'text/javascript','.css':'text/css','.json':'application/json'};
let inventoryPromise=null;let inventoryTime=0;
let inspectionBusy=false;
function getInventory(){if(!inventoryPromise||Date.now()-inventoryTime>30000){inventoryTime=Date.now();inventoryPromise=scanPluginDirectories(['C:\\Program Files\\Common Files\\VST3']).then(validateInventory).catch(error=>{inventoryPromise=null;throw error;});}return inventoryPromise;}
const server=http.createServer(async(req,res)=>{
 try {
  if(req.method!=='GET') {res.writeHead(405);res.end();return;}
  if(!['127.0.0.1:5173','localhost:5173'].includes(req.headers.host)||req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&!['http://127.0.0.1:5173','http://localhost:5173'].includes(req.headers.origin))){res.writeHead(403);res.end('Local requests only');return;}
  if(req.url==='/api/device-template'){
   try{const bytes=await readFile(resolve(root,'max/templates/wrapper.amxd'));validateDeviceTemplate(bytes);res.writeHead(200,{'Content-Type':'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);}
   catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'A compatible Max-saved device shell has not been configured for this installation.'}));}return;
  }
  if(req.url.startsWith('/api/inspect-plugin?')){
   const query=new URL(req.url,'http://localhost').searchParams,id=query.get('id'),classId=query.get('classId');
   if(!id||!/^[a-f0-9]{24}$/.test(id)||[...query.keys()].some(k=>!['id','classId'].includes(k))||(classId&&!/^[A-Fa-f0-9]{32}$/.test(classId))){res.writeHead(400);res.end('Invalid plugin identity');return;}
   if(inspectionBusy){res.writeHead(429,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Another plugin is being inspected. Try again when it finishes.'}));return;}
   inspectionBusy=true;
   try{const inventory=await getInventory(),plugin=inventory.plugins.find(p=>p.inventoryId===id);if(!plugin){res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Plugin is not in the installed inventory'}));return;}
    const result=validatePluginInspection(await inspectPlugin(plugin,{...(classId?{classId}:{})}));res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(result));
   }catch(error){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}finally{inspectionBusy=false;}return;
  }
  if(req.url==='/api/inventory'){
   if(process.platform!=='win32'){res.writeHead(501,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Default inventory is Windows-only; use the CLI with explicit roots.'}));return;}
   try{const result=await getInventory();res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(result));}
   catch(error){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}return;
  }
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/')path='/apps/studio/index.html';
  if(!routes.some(prefix=>path.startsWith(prefix)) || !mime[extname(path)]) {res.writeHead(404);res.end();return;}
  const file=await realpath(resolve(root,'.'+path));
  if(!routes.some(prefix=>file.startsWith(resolve(root,'.'+prefix)+sep))) {res.writeHead(403);res.end();return;}
  let body=await readFile(file,'utf8');
  if(extname(file)==='.ts')body=stripTypeScriptTypes(body);
  res.writeHead(200,{'Content-Type':mime[extname(file)]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(body);
 }catch {res.writeHead(404);res.end('Not found');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(5173,'127.0.0.1',()=>console.log('Studio: http://127.0.0.1:5173'));
