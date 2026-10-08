import http from 'node:http';
import {timingSafeEqual,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createLocalBrowser} from './local-browser.mjs';

// This is the same guarded Chromium importer as the Mac preview, exposed to
// the hosted Worker through an operator-managed HTTPS reverse proxy.
export function createBrowserService(importer,token) {
  if(typeof token!=='string'||token.length<32||token.length>200||/[\r\n]/.test(token))throw new Error('[browser service] Set BROWSER_RENDER_TOKEN to a secret of 32–200 characters.');
  const digest=value=>createHash('sha256').update(value).digest(),expected=digest(token);
  return http.createServer(async(request,response)=>{
    const reply=(data,status=200)=>{if(status>=400)console.warn('[browser service] Request failed',status);response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(JSON.stringify(data));};
    const provided=(request.headers.authorization||'').replace(/^Bearer /,'');
    if(provided.length>200||!request.headers.authorization?.startsWith('Bearer ')||!timingSafeEqual(digest(provided),expected)){request.resume();reply({error:'Webbläsartjänstens nyckel saknas eller är ogiltig.'},401);return;}
    if(request.url==='/health'&&request.method==='GET'){reply({ready:importer.ready},importer.ready?200:503);return;}
    if(request.url!=='/render'||request.method!=='POST'){request.resume();reply({error:'Använd POST /render.'},404);return;}
    if(request.headers['content-type']?.split(';')[0]!=='application/json'){request.resume();reply({error:'Använd JSON för företagsadressen.'},415);return;}
    try{
      const chunks=[];let size=0;
      for await(const chunk of request){size+=chunk.length;if(size>4096){reply({error:'Företagsadressen är för lång.'},413);request.resume();return;}chunks.push(chunk);}
      let data;try{data=JSON.parse(Buffer.concat(chunks).toString());}catch{reply({error:'Begäran innehåller ogiltig JSON.'},400);return;}
      if(typeof data?.url!=='string'||data.url.length>2000){reply({error:'Ange företagets offentliga webbadress.'},400);return;}
      const result=await importer.render(data.url);reply(result);
    }catch(error){console.warn('[browser service] Render failed',error.status||502,error.name);reply({error:error.status?error.message:'Webbläsartjänsten kunde inte läsa sidan.'},error.status||502);}
  });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const importer=createLocalBrowser();
  try{
    const server=createBrowserService(importer,process.env.BROWSER_RENDER_TOKEN),port=Number(process.env.BROWSER_SERVICE_PORT||4190),host=process.env.BROWSER_SERVICE_HOST||'127.0.0.1';
    if(!Number.isInteger(port)||port<1||port>65535)throw new Error('[browser service] BROWSER_SERVICE_PORT must be between 1 and 65535.');
    server.requestTimeout=15000;server.headersTimeout=10000;
    if(!await importer.start())process.exitCode=1;
    else{
      server.listen(port,host,()=>console.info('[browser service] Ready on '+host+':'+port+'. Public access requires your HTTPS reverse proxy.'));
      server.on('error',async error=>{console.error('[browser service] Server failed',error.code);await importer.close();process.exitCode=1;});
      for(const name of ['SIGINT','SIGTERM'])process.once(name,async()=>{server.close();server.closeAllConnections();await importer.close();});
    }
  }catch(error){console.error('[browser service] Startup failed',error.message);await importer.close();process.exitCode=1;}
}
