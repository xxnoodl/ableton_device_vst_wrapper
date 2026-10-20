import http from 'node:http';
import {readFile, realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {stripTypeScriptTypes} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const routes=['/apps/studio/','/packages/schema/','/packages/project-store/','/packages/export/','/max/runtime/','/fixtures/'];
const mime={'.html':'text/html','.js':'text/javascript','.ts':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try {
  if(req.method!=='GET') {res.writeHead(405);res.end();return;}
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
