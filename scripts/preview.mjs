import http from 'node:http';
import worker from '../dist/server/index.js';
const server=http.createServer(async(req,res)=>{
  try{
    const parts=[];let size=0;for await(const part of req){size+=part.length;if(size>5000){res.writeHead(413);res.end();return;}parts.push(part);}
    const request=new Request('http://localhost:4174'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})});
    const response=await worker.fetch(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){console.error('[mockup preview]',error.message);res.writeHead(500);res.end('Preview request failed');}
});
server.listen(4174,'127.0.0.1',()=>console.log('Online editor preview: http://localhost:4174'));
