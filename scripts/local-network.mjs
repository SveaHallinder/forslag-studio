import http from 'node:http';
import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {createGunzip,createInflate,createBrotliDecompress} from 'node:zlib';
import {publicURL} from '../worker.mjs';

const failure=(message,status=502)=>Object.assign(new Error(message),{status});
export function publicAddress(address) {
  if(isIP(address)===4){
    const [a,b,c]=address.split('.').map(Number);
    return !(a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||(b===0&&(c===0||c===2))||(b===88&&c===99)))||(a===198&&(b===18||b===19||(b===51&&c===100)))||(a===203&&b===0&&c===113));
  }
  if(isIP(address)!==6)return false;
  const [first,second]=address.toLowerCase().split(':').map(value=>parseInt(value||'0',16));
  // Only global unicast, excluding documentation and transition networks.
  return first>=0x2000&&first<=0x3fff&&first!==0x2002&&!(first===0x2001&&(second<0x200||second===0xdb8))&&!(first===0x3fff&&second<0x1000);
}

export function createPublicFetcher({resolve=lookup,request=(url,options,callback)=>(url.protocol==='https:'?https:http).request(url,options,callback)}={}) {
  return async function requestPublic(value,options={}) {
    const url=publicURL(value),signal=AbortSignal.any([AbortSignal.timeout(15000),...(options.signal?[options.signal]:[])]);
    const method=(options.method||'GET').toUpperCase(),body=options.body;
    if(!['GET','HEAD','POST','OPTIONS'].includes(method))throw failure('Importen stöder bara läsning av offentligt innehåll.',400);
    if(body&&Buffer.byteLength(body)>64_000)throw failure('Sidans nätverksanrop är för stort för import.',413);
    const aborted=new Promise((_,reject)=>{signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});
    signal.throwIfAborted();
    let addresses;try{addresses=await Promise.race([resolve(url.hostname,{all:true,verbatim:true}),aborted]);}catch(error){if(signal.aborted)throw signal.reason;throw failure('Företagets offentliga adress kunde inte hittas. Kontrollera adressen.');}
    if(!addresses.length||addresses.some(item=>!publicAddress(item.address)))throw failure('Importen får bara läsa offentliga adresser. Lokala eller privata nätverk är blockerade.',400);
    const selected=addresses.find(item=>item.family===4)||addresses[0];
    const headers=Object.fromEntries(Object.entries(options.headers||{}).filter(([key])=>!['host','connection','proxy-authorization','proxy-connection','upgrade','content-length','accept-encoding'].includes(key.toLowerCase())));
    headers['accept-encoding']='gzip, deflate, br';
    if(body)headers['content-length']=String(Buffer.byteLength(body));
    const maximum=Math.min(options.maximumBytes||5_000_000,5_000_000);
    return await new Promise((resolveResponse,reject)=>{
      let settled=false,req,stream;
      const fail=error=>{if(settled)return;settled=true;stream?.destroy();req?.destroy();reject(signal.aborted?signal.reason:error);};
      try{
        // The socket uses this already-validated IP. A second DNS lookup cannot rebind to localhost.
        req=request(url,{method,headers,signal,agent:false,lookup:(host,settings,done)=>done(null,settings.all?[selected]:selected.address,selected.family)},response=>{
          const status=response.statusCode||502,responseHeaders=new Headers();
          for(const [key,value] of Object.entries(response.headers))if(value!==undefined)responseHeaders.set(key,Array.isArray(value)?value.join(', '):String(value));
          if([301,302,303,307,308].includes(status)||method==='HEAD'||[204,205,304].includes(status)){
            response.destroy();settled=true;resolveResponse(new Response(null,{status,headers:responseHeaders}));return;
          }
          if(Number(responseHeaders.get('content-length'))>maximum){response.destroy();fail(failure('Sidans innehåll är för stort att importera.',413));return;}
          const encoding=responseHeaders.get('content-encoding')?.toLowerCase();
          if(encoding&&!['identity','gzip','deflate','br'].includes(encoding)){response.destroy();fail(failure('Sidans komprimering stöds inte av importen.'));return;}
          const decompress=encoding==='gzip'?createGunzip():encoding==='deflate'?createInflate():encoding==='br'?createBrotliDecompress():null;
          response.on('error',fail);response.on('aborted',()=>fail(failure('Hemsidan avbröt hämtningen. Försök igen.')));
          stream=decompress?response.pipe(decompress):response;
          const chunks=[];let size=0;
          stream.on('error',fail);
          stream.on('data',chunk=>{size+=chunk.length;if(size>maximum){response.destroy();fail(failure('Sidans innehåll är för stort att importera.',413));}else chunks.push(chunk);});
          stream.on('end',()=>{
            if(settled)return;settled=true;
            responseHeaders.delete('content-encoding');responseHeaders.delete('content-length');responseHeaders.delete('transfer-encoding');
            resolveResponse(new Response(Buffer.concat(chunks),{status,headers:responseHeaders}));
          });
        });
        req.on('error',error=>fail(signal.aborted?signal.reason:failure('Hemsidans offentliga anslutning misslyckades. Försök igen.')));
        req.end(body||undefined);
      }catch(error){fail(error);}
    });
  };
}
