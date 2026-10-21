function respond(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
function readJSON(req){return new Promise((resolve,reject)=>{
 let size=0,chunks=[],done=false;const timer=setTimeout(()=>finish(new Error('Request timed out'),408),5000);
 function finish(error,status){if(done)return;done=true;clearTimeout(timer);if(error){error.status=status;chunks=[];reject(error);}else{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{const e=new Error('Invalid JSON');e.status=400;reject(e);}}}
 req.on('data',chunk=>{if(done)return;size+=chunk.length;if(size>1_000_000)finish(new Error('Catalog exceeds 1 MB'),413);else chunks.push(chunk);});req.on('end',()=>finish());req.on('error',()=>finish(new Error('Request interrupted'),400));
});}
export async function handleLiveBridge(req,res,state){
 const path=req.url;if(!path.startsWith('/api/live/'))return false;
 try{
  const methods={'/api/live/config':'GET','/api/live/session':'GET','/api/live/poll':'GET','/api/live/refresh':'POST','/api/live/catalog':'POST'};
  if(!methods[path]){respond(res,404,{error:'Unknown Live endpoint'});return true;}
  if(req.method!==methods[path]){respond(res,405,{error:'Method not allowed'});return true;}
  if(path==='/api/live/config'){respond(res,200,state.config());return true;}
  if(path==='/api/live/session'){respond(res,200,state.session());return true;}
  if(!state.authorized(req.headers['x-studio-bridge'])){respond(res,401,{error:'Local bridge token required'});return true;}
  if(path==='/api/live/poll'){respond(res,200,state.poll());return true;}
  if((req.headers['content-type']||'').split(';')[0].trim()!=='application/json'){respond(res,415,{error:'JSON required'});return true;}
  const body=await readJSON(req);
  if(path==='/api/live/refresh'){if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).length)throw new Error('Refresh accepts an empty object only');respond(res,200,state.refresh());}
  else respond(res,200,state.accept(body));
 }catch(error){respond(res,error.status||400,{error:error.message});}
 return true;
}
