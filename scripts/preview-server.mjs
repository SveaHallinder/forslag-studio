import http from 'node:http';

const publicDemo='https://forslag-studio.sveaha.chatgpt.site/demo.html';
export function createPreviewServer(worker,importer,options={}) {
  return http.createServer(async(req,res)=>{
    const port=req.socket.localPort,host=req.headers.host;
    if(!['localhost:'+port,'127.0.0.1:'+port].includes(host)||!req.url.startsWith('/')){res.writeHead(403);res.end('Open the editor on localhost.');return;}
    const url=new URL(req.url,'http://'+host);
    if(options.LOCAL_IDENTITY&&['/local-signin','/local-signout','/signin-with-chatgpt','/signout-with-chatgpt'].includes(url.pathname)&&req.method==='GET'){
      const target=url.searchParams.get('return_to')||'/',safe=target.startsWith('/')&&!target.startsWith('//')&&!/[\r\n\\]/.test(target)?target:'/';
      res.writeHead(303,{'Location':safe,'Set-Cookie':'forslag-local-user='+ (['/local-signin','/signin-with-chatgpt'].includes(url.pathname)?'1; Path=/; HttpOnly; SameSite=Lax':' ; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')});res.end();return;
    }
    try{
      const parts=[];let size=0;
      for await(const part of req){size+=part.length;if(size>(url.pathname.startsWith('/api/cloud/')?20_000_000:url.pathname==='/api/agent/result'?8_000_000:12_000)){res.writeHead(413);res.end('Request is too large.');return;}parts.push(part);}
      const headers={...req.headers};for(const name of Object.keys(headers))if(name.startsWith('oai-authenticated-user-')||name==='cf-connecting-ip')delete headers[name];
      if(options.LOCAL_IDENTITY&&/(?:^|;\s*)forslag-local-user=1(?:;|$)/.test(req.headers.cookie||'')){headers['oai-authenticated-user-id']='local-preview-owner';headers['oai-authenticated-user-email']='local-preview@example.com';}
      const request=new Request('http://'+host+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})});
      const env={...options,LOCAL_BROWSER:importer,PUBLIC_FETCH:importer.requestFetch,PUBLIC_DEMO_URL:publicDemo};
      const response=await worker.fetch(request,env);
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
    }catch(error){console.error('[local browser import] Preview request failed',error.name);res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Den lokala servern kunde inte läsa begäran. Ditt utkast är kvar.'}));}
  });
}
