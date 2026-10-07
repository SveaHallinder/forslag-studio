import http from 'node:http';

const publicDemo='https://forslag-studio.sveaha.chatgpt.site/demo.html';
export function createPreviewServer(worker,importer) {
  return http.createServer(async(req,res)=>{
    const port=req.socket.localPort,host=req.headers.host;
    if(!['localhost:'+port,'127.0.0.1:'+port].includes(host)||!req.url.startsWith('/')){res.writeHead(403);res.end('Open the editor on localhost.');return;}
    try{
      const parts=[];let size=0;
      for await(const part of req){size+=part.length;if(size>5000){res.writeHead(413);res.end('Import request is too large.');return;}parts.push(part);}
      const request=new Request('http://'+host+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})});
      const env={LOCAL_BROWSER:importer,PUBLIC_FETCH:importer.requestFetch,PUBLIC_DEMO_URL:publicDemo};
      const response=await worker.fetch(request,env);
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
    }catch(error){console.error('[local browser import] Preview request failed',error.name);res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Den lokala servern kunde inte läsa begäran. Ditt utkast är kvar.'}));}
  });
}
