import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createLocalBrowser} from './local-browser.mjs';
import {publicURL} from '../worker.mjs';

const agentRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function createBrowserAgent({origin,token,importer,requestFetch=fetch,allowLocal=false}) {
  const base=new URL(origin),local=allowLocal&&base.protocol==='http:'&&['127.0.0.1','localhost'].includes(base.hostname);
  if(!local)publicURL(base.href);
  if(base.pathname!=='/'||base.search||base.hash||base.username||base.password||(!local&&base.protocol!=='https:'))throw new Error('[browser agent] Use the Site HTTPS origin, without a path or credentials.');
  if(typeof token!=='string'||!/^[-A-Za-z0-9_]{32,200}$/.test(token))throw new Error('[browser agent] A valid server token is required in the private agent configuration.');
  async function call(route,body) {
    const response=await requestFetch(new URL('/api/agent/'+route,base),{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(35000)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Object.assign(new Error(data.error||'Agentens serverbegäran misslyckades.'),{status:response.status});return data;
  }
  return {async tick(){
    if(!importer.ready)throw new Error('[browser agent] Chromium is not ready.');
    const {job}=await call('poll',{ready:true});if(!job)return false;
    if(!/^[-a-z0-9]{36}$/.test(job.id||'')||!/^[-a-z0-9]{36}$/.test(job.lease||''))throw new Error('[browser agent] The server returned an invalid job or lease.');
    try{
      const result=await importer.render(publicURL(job.url).href);
      await call('result',{id:job.id,lease:job.lease,result});
      console.info('[browser agent] Import completed');
    }catch(error){
      // A lost acknowledgement may mean the server already stored the result.
      // Fenced leases keep a late failure from overwriting that successful job.
      await call('result',{id:job.id,lease:job.lease,error:error.status?String(error.message).slice(0,250):'Macen kunde inte läsa sidan. Försök igen eller importera sparat underlag.'}).catch(failure=>console.warn('[browser agent] Result acknowledgement',failure.status||'network'));
      console.warn('[browser agent] Import failed',error.status||'network');
    }
    return true;
  }};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  let importer,stopping=false;
  try{
    const config=JSON.parse(await readFile(process.argv[2]||path.join(agentRoot,'.sites-runtime/browser-agent.json'),'utf8'));
    importer=createLocalBrowser();const agent=createBrowserAgent({...config,importer});
    if(!await importer.start())throw new Error('[browser agent] Install Chromium with npm run browser:install.');
    for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{stopping=true;});
    console.info('[browser agent] Connected configuration loaded. The Mac must remain awake.');
    while(!stopping){try{const worked=await agent.tick();if(!worked)await new Promise(resolve=>setTimeout(resolve,5000));}catch(error){console.warn('[browser agent] Connection unavailable',error.status||error.name);await new Promise(resolve=>setTimeout(resolve,15000));}}
  }catch(error){console.error('[browser agent] Startup failed',error.code||error.name);process.exitCode=1;}
  finally{await importer?.close();}
}
