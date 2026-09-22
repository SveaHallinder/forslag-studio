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
  const style=image==='style';
  const signal = AbortSignal.timeout(style?6000:22000);
  for (let redirects = 0; redirects < 5; redirects++) {
    const url = publicURL(value);
    // Cloudflare's unbound public fetch has no access to a private network.
    const started=Date.now();
    console.info('[mockup online fetch] Request',url.hostname,redirects);
    const fallback=!image&&redirects===0&&!url.hostname.startsWith('www.')&&url.pathname==='/'&&!url.search;
    let response;
    try { response=await requestFetch(url.href,{redirect:'manual',signal:fallback?AbortSignal.any([signal,AbortSignal.timeout(7000)]):signal,headers:{Accept:style?'text/css':image?'image/*':'text/html,application/xhtml+xml','User-Agent':'ForslagStudio/1.0'}}); }
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
    const mime=(response.headers.get('Content-Type')||'').split(';')[0].toLowerCase();
    const maximum=image&&!style?MAX_IMAGE:MAX_HTML;
    if (!(style?['text/css']:image?['image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml']:['text/html','application/xhtml+xml']).includes(mime)) { await response.body?.cancel(); throw new Error(style?'Adressen måste peka på en CSS-stilmall.':image?'Bilden måste vara JPG, PNG, WebP, GIF, AVIF eller SVG.':'Adressen måste peka på en webbsida.'); }
    if (Number(response.headers.get('Content-Length'))>maximum) { await response.body?.cancel(); throw new Error('Innehållet är för stort. Välj en mindre bild eller en annan sida.'); }
    const reader=response.body.getReader(), chunks=[];let size=0;
    try { while(true) { const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>maximum)throw new Error('Innehållet är för stort för att importera.');chunks.push(value); } }
    finally { await reader.cancel(); }
    console.info('[mockup online fetch] Body',url.hostname,size,Date.now()-started);
    const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
    if(!image){const next=scriptRedirect(new TextDecoder().decode(body),url);if(next){console.info('[mockup online fetch] Following document redirect');value=next;continue;}}
    return {body,mime,url:url.href};
  }
  throw new Error('Hemsidan omdirigerar för många gånger.');
}
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
let inFlight=0;
export function createWorker(assets) {
  return {async fetch(request) {
    const url=new URL(request.url), path=url.pathname;
    if(request.method==='GET'||request.method==='HEAD') {
      const asset=assets[path==='/'?'/index.html':path];
      if(!asset)return json({error:'Sidan hittades inte.'},404);
      return new Response(request.method==='HEAD'?null:asset.body,{headers:{...headers,'Content-Type':asset.type,'X-Frame-Options':'SAMEORIGIN'}});
    }
    if(request.method!=='POST'||!['/api/read','/api/image','/api/style'].includes(path))return json({error:'Funktionen hittades inte.'},404);
    if(request.headers.get('Origin')!==url.origin||request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return json({error:'Öppna verktyget och försök igen.'},403);
    if(Number(request.headers.get('Content-Length'))>4096)return json({error:'Adressen är för lång.'},413);
    if(inFlight>=6)return json({error:'Flera hämtningar pågår. Vänta en stund och försök igen.'},429);
    inFlight++;
    try {
      const reader=request.body.getReader();let text='',size=0;const decoder=new TextDecoder();
      try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>4096)return json({error:'Adressen är för lång.'},413);text+=decoder.decode(part.value,{stream:true});}}finally{await reader.cancel();}
      const payload=JSON.parse(text+decoder.decode());
      if(typeof payload?.url!=='string'||payload.url.length>2000)throw new Error('Ange en giltig företagsadress.');
      const data=await readPublic(payload.url,path==='/api/style'?'style':path==='/api/image');
      console.info('[mockup online fetch] Completed',path);
      return path==='/api/style'?json({css:new TextDecoder().decode(data.body),url:data.url}):path==='/api/image'?new Response(data.body,{headers:{...headers,'Content-Type':data.mime}}):json({html:new TextDecoder().decode(data.body),url:data.url});
    } catch(error) {
      console.warn('[mockup online fetch]',error.name);
      return json({error:error.name==='TimeoutError'?'Hemsidan svarade för långsamt. Försök igen eller fyll i manuellt.':error.message||'Hemsidan kunde inte hämtas. Fyll i innehållet manuellt.'},400);
    } finally {inFlight--;}
  }};
}
