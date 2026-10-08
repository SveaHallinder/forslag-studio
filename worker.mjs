import {socialProfileURL,extractSocialProfile} from './public/social-content.mjs';
import {handleCloud} from './cloud-worker.mjs';
import {customerMailConfigured} from './customer-mail.mjs';
import {handleCustomerFlows,pilotStatus,browserAgentConfigured,queueBrowserPage} from './customer-flows.mjs';
const MAX_HTML = 2_000_000, MAX_IMAGE = 5_000_000;
function scriptRedirect(html, source) {
  // Recognize simple redirect shells; never execute third-party JavaScript.
  if(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<!--[\s\S]*?-->|<[^>]*>/g,'').trim())return '';
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    const script=match[1];
    const literal=script.match(/(?:window\.)?location(?:\.href)?\s*=\s*(['"])([^'"\r\n]+)\1\s*(?:;|$)/)||script.match(/(?:window\.)?location\.(?:replace|assign)\(\s*(['"])([^'"\r\n]+)\1\s*\)/);
    if(literal)return new URL(literal[2],source).href;
    const languages=script.match(/\b(?:var|let|const)\s+([\w$]+)\s*=\s*\[((?:\s*['"][a-z]{2}['"]\s*,?)+)\]/i);
    if(languages&&/navigator\.languages\.find\(/.test(script)&&/(?:window\.)?location\.href\s*=\s*['"]\/['"]\s*\+/.test(script)&&script.includes(languages[1]+'[0]')) {
      const first=languages[2].match(/['"]([a-z]{2})['"]/i)[1];
      return new URL('/'+first,source).href;
    }
  }
  return '';
}
export function publicURL(value) {
  let url;
  try { url = new URL(String(value).includes('://') ? value : 'https://' + value); } catch { throw new Error('Ange en giltig företagsadress.'); }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.port || !host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') || /(^|\.)(localhost|local|internal|test|invalid|onion)$/.test(host)) throw new Error('Använd en offentlig företagsadress utan inloggning eller särskild port.');
  url.hash = '';
  return url;
}
export async function readPublic(value, image = false, requestFetch = fetch) {
  const style=image==='style',font=image==='font';
  const signal = AbortSignal.timeout(style?6000:22000);
  for (let redirects = 0; redirects < 5; redirects++) {
    const url = publicURL(value);
    // Cloudflare's unbound public fetch has no access to a private network.
    const started=Date.now();
    console.info('[mockup online fetch] Request',url.hostname,redirects);
    const fallback=!image&&redirects===0&&!url.hostname.startsWith('www.')&&url.pathname==='/'&&!url.search;
    let response;
    try { response=await requestFetch(url.href,{redirect:'manual',signal:fallback?AbortSignal.any([signal,AbortSignal.timeout(7000)]):signal,headers:{Accept:font?'font/woff2,font/woff,font/ttf,font/otf,application/octet-stream':style?'text/css':image?'image/*':'text/html,application/xhtml+xml','User-Agent':'ForslagStudio/1.0'}}); }
    catch(error) {
      if(!fallback||signal.aborted||!['TimeoutError','TypeError'].includes(error.name))throw error;
      const alternate=new URL(url);alternate.hostname='www.'+url.hostname;
      console.warn('[mockup online fetch] Root connection failed; trying www',url.hostname,error.name);
      value=alternate.href;continue;
    }
    console.info('[mockup online fetch] Headers',url.hostname,response.status,Date.now()-started);
    if ([301,302,303,307,308].includes(response.status)) {
      const next=response.headers.get('Location'); await response.body?.cancel();
      if (!next) throw new Error('Hemsidan skickade en omdirigering utan adress.');
      console.info('[mockup online fetch] Redirect body released',url.hostname,Date.now()-started);
      value=new URL(next,url).href; continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Hemsidan svarade med HTTP ${response.status}. Prova en annan adress eller fyll i manuellt.`); }
    let mime=(response.headers.get('Content-Type')||'').split(';')[0].toLowerCase();
    const maximum=font?2_000_000:image&&!style?MAX_IMAGE:MAX_HTML;
    if (!(font?['font/woff2','font/woff','font/ttf','font/otf','application/font-woff','application/x-font-ttf','application/x-font-opentype','application/octet-stream']:style?['text/css']:image?['image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml']:['text/html','application/xhtml+xml']).includes(mime)) { await response.body?.cancel(); throw new Error(font?'Adressen måste peka på en fontfil (WOFF, WOFF2, TTF eller OTF).':style?'Adressen måste peka på en CSS-stilmall.':image?'Bilden måste vara JPG, PNG, WebP, GIF, AVIF eller SVG.':'Adressen måste peka på en webbsida.'); }
    if (Number(response.headers.get('Content-Length'))>maximum) { await response.body?.cancel(); throw new Error('Innehållet är för stort. Välj en mindre bild eller en annan sida.'); }
    const reader=response.body.getReader(), chunks=[];let size=0;
    try { while(true) { const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>maximum)throw new Error('Innehållet är för stort för att importera.');chunks.push(value); } }
    finally { await reader.cancel(); }
    console.info('[mockup online fetch] Body',url.hostname,size,Date.now()-started);
    const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
    if(font){const signature=Array.from(body.slice(0,4)).join(',');mime=({'119,79,70,50':'font/woff2','119,79,70,70':'font/woff','79,84,84,79':'font/otf','0,1,0,0':'font/ttf'})[signature];if(!mime||body.length<12)throw new Error('Svaret innehåller ingen giltig fontfil. Välj ett annat typsnitt.');}
    if(!image){const next=scriptRedirect(new TextDecoder().decode(body),url);if(next){console.info('[mockup online fetch] Following document redirect');value=next;continue;}}
    return {body,mime,url:url.href};
  }
  throw new Error('Hemsidan omdirigerar för många gånger.');
}
const renderError=(message,status=502)=>Object.assign(new Error(message),{status});
function renderServiceURL(env){try{const url=publicURL(env.BROWSER_RENDER_ENDPOINT);return url.protocol==='https:'&&typeof env.BROWSER_RENDER_TOKEN==='string'&&env.BROWSER_RENDER_TOKEN.length>=32&&env.BROWSER_RENDER_TOKEN.length<=200&&!/[\r\n]/.test(env.BROWSER_RENDER_TOKEN)?url.href:'';}catch{return '';}}
export function browserConfigured(env={}) {return env.LOCAL_BROWSER?.ready===true||browserAgentConfigured(env)||!!renderServiceURL(env)||(env.CLOUDFLARE_BROWSER_PLAN==='free'&&/^[a-f\d]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID||'')&&!!env.CLOUDFLARE_BROWSER_TOKEN);}
let rendering=0;
export async function renderPublic(value,env={},requestFetch=fetch) {
  const url=publicURL(value),account=env.CLOUDFLARE_ACCOUNT_ID,token=env.CLOUDFLARE_BROWSER_TOKEN;
  if(env.LOCAL_BROWSER)return await env.LOCAL_BROWSER.render(url.href);
  if(browserAgentConfigured(env)&&env.BROWSER_REQUEST)return await queueBrowserPage(env.BROWSER_REQUEST,url.href,env,env.BROWSER_JOB_KIND||'page');
  const service=renderServiceURL(env);
  // Set only after verifying Workers Free in the provider account. Never upgrade billing here.
  if(!browserConfigured(env))throw renderError('Sidan behöver en webbläsare för att kunna läsas. Reservhämtningen är ännu inte ansluten. Använd Importera underlag för en sparad HTML-sida. Ditt öppna förslag är kvar.',503);
  if(rendering>=3)throw renderError('Webbläsarhämtningen är upptagen. Vänta en stund och försök igen.',429);
  rendering++;
  try {
    const response=await requestFetch(service||'https://api.cloudflare.com/client/v4/accounts/'+account+'/browser-run/content?cacheTTL=300',{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(25000),
      headers:{Authorization:'Bearer '+(service?env.BROWSER_RENDER_TOKEN:token),'Content-Type':'application/json'},
      body:JSON.stringify(service?{url:url.href}:{url:url.href,gotoOptions:{waitUntil:'networkidle2',timeout:18000},actionTimeout:5000,viewport:{width:1440,height:1000},rejectResourceTypes:['media','font']})
    });
    console.info('[mockup browser render] Response',url.hostname,response.status);
    if(!response.ok){
      await response.body?.cancel();
      if(response.status===429)throw renderError(service?'Webbläsartjänsten är upptagen. Vänta en stund och försök igen. Ditt förslag är kvar.':'Webbläsarhämtningens gräns har nåtts. Vänta och försök igen; om dagens gratiskvot är slut behöver du vänta till nästa dag. Ditt förslag är kvar.',429);
      if([401,403].includes(response.status))throw renderError('Webbläsarhämtningens anslutning behöver kontrolleras av verktygets ägare. Ditt förslag är kvar.',503);
      throw renderError('Webbläsarhämtningen är tillfälligt otillgänglig. Försök igen senare.');
    }
    const reader=response.body?.getReader();if(!reader)throw renderError('Webbläsaren gav inget läsbart svar.');
    let size=0,text='';const decoder=new TextDecoder();
    try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>MAX_HTML*2)throw renderError('Den renderade sidan är för stor att importera.');text+=decoder.decode(part.value,{stream:true});}}finally{await reader.cancel();}
    let data;try{data=JSON.parse(text+decoder.decode());}catch{throw renderError('Webbläsaren gav ett oläsbart svar. Försök igen senare.');}
    const html=service?data.html:data.result;
    if((!service&&!data.success)||typeof html!=='string'||!html.trim())throw renderError('Webbläsaren hittade inget läsbart innehåll. Sidan kan blockera hämtning.');
    if(new TextEncoder().encode(html).length>MAX_HTML)throw renderError('Den renderade sidan är för stor att importera.');
    if(data.meta?.status>=400)throw renderError('Företagets sida svarade med HTTP '+Number(data.meta.status)+' även i webbläsaren. Kontrollera adressen.');
    const finalURL=publicURL((service?data.url:data.meta?.finalUrl)||url.href);
    return {html,url:finalURL.href,...(service&&data.runtimeBrand===true?{runtimeBrand:true}:{})};
  }catch(error){
    console.warn('[mockup browser render] Failed',url.hostname,error.name,error.status||502);
    if(error.status)throw error;
    throw renderError(error.name==='TimeoutError'?'Sidan laddade för långsamt även i webbläsaren. Försök igen senare. Ditt förslag är kvar.':'Webbläsarhämtningen misslyckades. Kontrollera att adressen är offentlig och försök igen.');
  }finally{rendering--;}
}
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
export async function readSocialProfile(value,requestFetch=fetch,env={}) {
  const profile=socialProfileURL(value);
  let first;
  try{
    const data=await readPublic(profile.url,false,requestFetch);
    let destination;try{destination=socialProfileURL(data.url);}catch{}
    if(!destination||destination.url!==profile.url)throw new Error('Plattformen omdirigerade till en annan profil eller en inloggningssida.');
    const result=extractSocialProfile(new TextDecoder().decode(data.body),profile.url);
    console.info('[social import] Profile',profile.platform,result.status,result.photos.length);
    if(result.status==='read'||!browserConfigured(env))return result;
    first=result;
  }catch(error){
    console.warn('[social import] Public profile unavailable',profile.platform,error.name);
    first={...profile,status:'limited',name:'',bio:'',avatar:'',photos:[],warning:'Profilen kunde inte läsas offentligt. '+(error.name==='TimeoutError'?'Plattformen svarade för långsamt. ':'')+'Klistra in profiltexten och lägg till företagets bilder. Ingen inloggning behövs och ditt utkast finns kvar.'};
  }
  if(!browserConfigured(env))return first;
  try{
    const page=await renderPublic(profile.url,{...env,BROWSER_JOB_KIND:'social'},requestFetch);if(page.jobId)return page;
    const destination=socialProfileURL(page.url);
    if(destination.url!==profile.url)throw new Error('Webbläsaren nådde inte den angivna företagsprofilen.');
    const result=extractSocialProfile(page.html,profile.url);
    if(result.status==='read')return {...result,warning:'Profilen lästes efter att JavaScript laddats. '+result.warning};
  }catch(error){console.warn('[social import] Browser fallback unavailable',profile.platform,error.status||502);if(error.status===429)first.warning='Webbläsarhämtningens kvot är slut. '+first.warning;}
  return first;
}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
let inFlight=0;
export function createWorker(assets) {
  return {async fetch(request,env={},ctx) {
    const url=new URL(request.url), path=url.pathname;
    const requestFetch=env.PUBLIC_FETCH||fetch;
    const customerResponse=await handleCustomerFlows(request,env,ctx);if(customerResponse)return customerResponse;
    const cloudResponse=await handleCloud(request,env);if(cloudResponse)return cloudResponse;
    if(request.method==='GET'&&path==='/api/status')return json({browser:env.LOCAL_BROWSER?(env.LOCAL_BROWSER.ready?'local':'unavailable'):browserConfigured(env)?'configured':'unconnected',browserProvider:env.LOCAL_BROWSER?'local':browserAgentConfigured(env)?'mac':renderServiceURL(env)?'own':browserConfigured(env)?'cloudflare':'none',cloud:env.DB?'workspaces':'local',contact:env.DB?'requests':'links',booking:env.DB?'reservations':'links',payments:'links',...await pilotStatus(env),...(env.PUBLIC_DEMO_URL?{publicBase:env.PUBLIC_DEMO_URL}:{})});
    if(request.method==='GET'&&path==='/api/font'){
      if(inFlight>=6)return json({error:'Typsnittshämtningen är upptagen. Försök igen.'},429);
      inFlight++;try{const target=url.searchParams.get('url');if(!target||target.length>2000)throw new Error('Fontadressen är ogiltig.');const data=await readPublic(target,'font',requestFetch);return new Response(data.body,{headers:{...headers,'Content-Type':data.mime,'Cache-Control':'public, max-age=86400'}});}
      catch(error){console.warn('[mockup fonts]',error.name);return json({error:error.message||'Typsnittet kunde inte hämtas.'},400);}finally{inFlight--;}
    }
    if(request.method==='GET'||request.method==='HEAD') {
      const asset=assets[path==='/'?'/index.html':path];
      if(!asset)return json({error:'Sidan hittades inte.'},404);
      return new Response(request.method==='HEAD'?null:asset.body,{headers:{...headers,'Content-Type':asset.type,'X-Frame-Options':'SAMEORIGIN'}});
    }
    if(request.method!=='POST'||!['/api/read','/api/image','/api/style','/api/render','/api/font','/api/social'].includes(path))return json({error:'Funktionen hittades inte.'},404);
    if(request.headers.get('Origin')!==url.origin||request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return json({error:'Öppna verktyget och försök igen.'},403);
    if(Number(request.headers.get('Content-Length'))>4096)return json({error:'Adressen är för lång.'},413);
    if(inFlight>=6)return json({error:'Flera hämtningar pågår. Vänta en stund och försök igen.'},429);
    inFlight++;
    try {
      const reader=request.body.getReader();let text='',size=0;const decoder=new TextDecoder();
      try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>4096)return json({error:'Adressen är för lång.'},413);text+=decoder.decode(part.value,{stream:true});}}finally{await reader.cancel();}
      const payload=JSON.parse(text+decoder.decode());
      if(typeof payload?.url!=='string'||payload.url.length>2000)throw new Error('Ange en giltig företagsadress.');
      if(path==='/api/social'){const result=await readSocialProfile(payload.url,requestFetch,{...env,BROWSER_REQUEST:request});return json(result,result.jobId?202:200);}
      if(path==='/api/render'){const result=await renderPublic(payload.url,{...env,BROWSER_REQUEST:request});return json(result,result.jobId?202:200);}
      const data=await readPublic(payload.url,path==='/api/font'?'font':path==='/api/style'?'style':path==='/api/image',requestFetch);
      console.info('[mockup online fetch] Completed',path);
      return path==='/api/style'?json({css:new TextDecoder().decode(data.body),url:data.url}):(path==='/api/image'||path==='/api/font')?new Response(data.body,{headers:{...headers,'Content-Type':data.mime}}):json({html:new TextDecoder().decode(data.body),url:data.url});
    } catch(error) {
      console.warn(path==='/api/social'?'[social import]':'[mockup online fetch]',error.name);
      return json({error:error.name==='TimeoutError'?'Hemsidan svarade för långsamt. Försök igen eller fyll i manuellt.':error.message||'Hemsidan kunde inte hämtas. Fyll i innehållet manuellt.'},error.status||400);
    } finally {inFlight--;}
  }};
}
