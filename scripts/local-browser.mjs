import {chromium} from 'playwright';
import http from 'node:http';
import {createPublicFetcher} from './local-network.mjs';
import {publicURL} from '../worker.mjs';

const failure=(message,status=502)=>Object.assign(new Error(message),{status});
export function createLocalBrowser({browserType=chromium,requestFetch=createPublicFetcher(),timeout=25000}={}) {
  let browser,guard,active=0,stopping=false;
  const api={
    ready:false,
    requestFetch,
    async start(){
      try{
        // Own the rejecting proxy: no unrelated localhost service can become a network escape.
        guard=http.createServer((request,response)=>{response.writeHead(403);response.end();});
        guard.on('connect',(request,socket)=>socket.destroy());
        await new Promise((resolve,reject)=>{guard.once('error',reject);guard.listen(0,'127.0.0.1',resolve);});
        browser=await browserType.launch({headless:true,chromiumSandbox:true,timeout:10000,proxy:{server:'http://127.0.0.1:'+guard.address().port},args:['--proxy-bypass-list=<-loopback>','--disable-quic','--force-webrtc-ip-handling-policy=disable_non_proxied_udp','--host-resolver-rules=MAP * ~NOTFOUND']});
        browser.on('disconnected',()=>{api.ready=false;});api.ready=true;
        console.info('[local browser import] Chromium ready');
      }catch{api.ready=false;guard?.close();console.error('[local browser import] Chromium unavailable. Run npm run browser:install, then restart npm start.');}
      return api.ready;
    },
    async render(value){
      const target=publicURL(value);
      if(!api.ready||stopping)throw failure('Den lokala webbläsaren är inte redo. Kör npm run browser:install och starta om npm start. Ditt förslag är kvar.',503);
      if(active>=2)throw failure('Två webbläsarimporter pågår. Vänta en stund och försök igen. Ditt förslag är kvar.',429);
      active++;
      const controller=new AbortController(),signal=controller.signal;
      let context,page,navigationError,requests=0,navigations=0,bytes=0;
      const timedOut=new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(failure('Sidan laddade för långsamt i den lokala webbläsaren. Försök igen eller importera sparat underlag. Ditt förslag är kvar.',504)),{once:true}));
      const timer=setTimeout(()=>controller.abort(),timeout);
      async function run(){
        context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',acceptDownloads:false,permissions:[]});
        if(signal.aborted){await context.close();throw failure('Webbläsarimporten avbröts.',504);}
        context.setDefaultTimeout(5000);
        await context.routeWebSocket('**/*',socket=>socket.close());
        await context.route('**/*',async route=>{
          const request=route.request(),type=request.resourceType();
          if(signal.aborted||['image','media','font'].includes(type)){await route.abort().catch(()=>{});return;}
          const main=request.isNavigationRequest()&&request.frame()===page?.mainFrame();
          try{
            if(++requests>100||bytes>=20_000_000)throw failure('Sidan kräver för många resurser. Importera sparat underlag i stället.',413);
            const validate=value=>{try{return publicURL(value);}catch(error){throw failure(error.message,400);}};
            validate(request.url());
            if(main&&++navigations>6)throw failure('Sidan omdirigerar för många gånger.');
            let destination=request.url(),method=request.method(),post=request.postDataBuffer(),requestHeaders=await request.allHeaders(),response;
            for(let redirects=0;redirects<6;redirects++){
              response=await requestFetch(destination,{method,headers:requestHeaders,body:post,redirect:'manual',signal,maximumBytes:2_000_000});
              if(![301,302,303,307,308].includes(response.status))break;
              const location=response.headers.get('location');await response.body?.cancel();
              if(!location)throw failure('Sidan omdirigerade utan en ny adress.');
              const next=validate(new URL(location,destination).href);
              if(request.isNavigationRequest()){
                // Chromium bypasses routing for fulfilled HTTP redirects. A refresh starts a new guarded navigation.
                const escaped=next.href.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
                await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head><meta http-equiv="refresh" content="0;url='+escaped+'"></head><body></body></html>'});return;
              }
              if(new URL(destination).origin!==next.origin)requestHeaders=Object.fromEntries(Object.entries(requestHeaders).filter(([key])=>!['cookie','authorization'].includes(key.toLowerCase())));
              if(response.status===303||([301,302].includes(response.status)&&method==='POST')){method='GET';post=null;}
              destination=next.href;
              if(redirects===5)throw failure('Sidans resurs omdirigerar för många gånger.');
            }
            if(main&&response.status>=400)throw failure('Företagets sida svarade med HTTP '+response.status+' även i webbläsaren. Kontrollera adressen.');
            const body=Buffer.from(await response.arrayBuffer());bytes+=body.length;
            if(body.length>2_000_000||bytes>20_000_000)throw failure('Sidans innehåll är för stort att importera.',413);
            const headers=Object.fromEntries(response.headers);delete headers['content-encoding'];delete headers['content-length'];delete headers['transfer-encoding'];
            await route.fulfill({status:response.status,headers,body});
          }catch(error){
            if(main)navigationError=error;
            console.warn('[local browser import] Resource rejected',type,error.status||502);
            await route.abort().catch(()=>{});
          }
        });
        page=await context.newPage();
        context.on('page',popup=>{if(popup!==page)popup.close().catch(()=>{});});
        page.on('dialog',dialog=>dialog.dismiss().catch(()=>{}));
        await page.goto(target.href,{waitUntil:'domcontentloaded',timeout:17000});
        await page.waitForLoadState('networkidle',{timeout:5000}).catch(()=>{});
        if(navigationError)throw navigationError;
        const url=publicURL(page.url()),html=await page.content();
        if(!html.trim()||Buffer.byteLength(html)>2_000_000)throw failure('Den renderade sidan är tom eller för stor att importera.');
        console.info('[local browser import] Completed',target.hostname,requests,bytes);
        return {html,url:url.href};
      }
      try{return await Promise.race([run(),timedOut]);}
      catch(error){
        console.warn('[local browser import] Failed',target.hostname,navigationError?.status||error.status||502);
        if(navigationError?.status)throw navigationError;
        if(error.status)throw error;
        throw failure('Webbläsarimporten kunde inte läsa sidan. Den kan blockera offentliga besök. Prova Importera underlag; ditt förslag är kvar.');
      }finally{clearTimeout(timer);controller.abort();await context?.close().catch(()=>{});active--;}
    },
    async close(){stopping=true;api.ready=false;await browser?.close().catch(()=>{});guard?.close();}
  };
  return api;
}
