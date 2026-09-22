import test from 'node:test';
import assert from 'node:assert/strict';
import {publicURL,readPublic,createWorker} from '../worker.mjs';

test('only public website hostnames and standard ports are accepted',()=>{
  for(const url of ['http://127.0.0.1','http://2130706433','http://[::1]','http://localhost.','http://site.local','http://site.internal','http://user:pass@example.com','https://example.com:3000','file:///tmp/x','http://metadata'])assert.throws(()=>publicURL(url));
  assert.equal(publicURL('vegavista.se').href,'https://vegavista.se/');
});
test('a redirect to a private address is rejected before the second fetch',async()=>{
  let calls=0;
  await assert.rejects(readPublic('https://example.com',false,async()=>{calls++;return new Response(null,{status:302,headers:{Location:'http://127.0.0.1/'}});}),/offentlig/);
  assert.equal(calls,1);
});
test('html content and final address are preserved while binary files are rejected',async()=>{
  const result=await readPublic('https://example.com',false,async()=>new Response('<h1>Hej</h1>',{headers:{'Content-Type':'text/html; charset=utf-8'}}));
  assert.equal(new TextDecoder().decode(result.body),'<h1>Hej</h1>');
  await assert.rejects(readPublic('https://example.com',false,async()=>new Response('x',{headers:{'Content-Type':'application/pdf'}})),/webbsida/);
});
test('oversized streamed content is rejected without trusting content length',async()=>{
  await assert.rejects(readPublic('https://example.com',false,async()=>new Response('x'.repeat(2_000_001),{headers:{'Content-Type':'text/html'}})),/stort/);
});
test('server does not expose project storage and rejects cross-origin requests',async()=>{
  const worker=createWorker({'/index.html':{body:'Studio',type:'text/html'}});
  assert.equal((await worker.fetch(new Request('https://studio.example/'))).status,200);
  assert.equal((await worker.fetch(new Request('https://studio.example/api/projects'))).status,404);
  assert.equal((await worker.fetch(new Request('https://studio.example/api/read',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{"url":"https://example.com"}'}))).status,403);
});
test('same-origin invalid input returns a useful error without a remote request',async()=>{
  const worker=createWorker({});
  const response=await worker.fetch(new Request('https://studio.example/api/read',{method:'POST',headers:{Origin:'https://studio.example','Content-Type':'application/json'},body:'{"url":"http://localhost"}'}));
  assert.equal(response.status,400);assert.match((await response.json()).error,/offentlig/);
});
test('follows Hallinc language redirect without executing downloaded JavaScript',async()=>{
  const calls=[];
  const html="<script>var a=['sv'];window.location.href='/'+(navigator.languages.find(l=>a.includes((l||'').toLowerCase().substring(0,2)))||a[0]).substring(0,2);</script>";
  const result=await readPublic('https://hallinc.se/',false,async url=>{
    calls.push(url);return new Response(calls.length===1?html:'<h1>HallInc</h1>',{headers:{'Content-Type':'text/html'}});
  });
  assert.deepEqual(calls,['https://hallinc.se/','https://hallinc.se/sv']);
  assert.match(new TextDecoder().decode(result.body),/<h1>HallInc/);
});
test('HTML redirect chains cannot loop or access private addresses',async()=>{
  await assert.rejects(readPublic('https://example.com',false,async()=>new Response('<script>window.location.href="http://127.0.0.1/";</script>',{headers:{'Content-Type':'text/html'}})),/offentlig/);
  await assert.rejects(readPublic('https://example.com',false,async()=>new Response('<script>location.replace("/again");</script>',{headers:{'Content-Type':'text/html'}})),/många gånger/);
});

test('a stalled root connection retries www without changing path or retrying HTTP errors',async()=>{
  const calls=[];
  const result=await readPublic('https://example.com/',false,async url=>{
    calls.push(url);if(calls.length===1)throw new DOMException('Timed out','TimeoutError');
    return new Response('<h1>Företaget</h1>',{headers:{'Content-Type':'text/html'}});
  });
  assert.deepEqual(calls,['https://example.com/','https://www.example.com/']);
  assert.equal(result.url,'https://www.example.com/');
  let count=0;
  await assert.rejects(readPublic('https://example.com/',false,async()=>{count++;return new Response('',{status:403});}),/403/);
  assert.equal(count,1);
});
test('network fallback does not rewrite image or deep-link hostnames',async()=>{
  for(const [url,image] of [['https://example.com/logo.png',true],['https://example.com/service',false]]){
    const calls=[];
    await assert.rejects(readPublic(url,image,async value=>{calls.push(value);throw new DOMException('Timed out','TimeoutError');}),/Timed out/);
    assert.deepEqual(calls,[url]);
  }
});

test('brand stylesheets use a separate bounded text-only route',async()=>{
  const result=await readPublic('https://example.com/site.css','style',async()=>new Response(':root{--brand-primary:#123456}',{headers:{'Content-Type':'text/css'}}));
  assert.equal(result.mime,'text/css');
  await assert.rejects(readPublic('https://example.com/site.css','style',async()=>new Response('<html>blocked</html>',{headers:{'Content-Type':'text/html'}})),/stilmall/);
});

test('SVG logo bytes can be fetched for rasterized HTML export while HTML remains rejected',async()=>{
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><rect width="100" height="40"/></svg>';
 const result=await readPublic('https://example.com/logo.svg',true,async()=>new Response(svg,{headers:{'Content-Type':'image/svg+xml'}}));
 assert.equal(result.mime,'image/svg+xml');assert.equal(new TextDecoder().decode(result.body),svg);
 await assert.rejects(readPublic('https://example.com/logo.svg',true,async()=>new Response('<html>error</html>',{headers:{'Content-Type':'text/html'}})),/Bilden/);
});

test('stylesheet response retains its redirected URL for relative background images',async()=>{
 const originalFetch=globalThis.fetch;
 try{
  globalThis.fetch=async url=>url.endsWith('/old.css')?new Response(null,{status:302,headers:{Location:'https://cdn.example/css/site.css'}}):new Response('.hero{background:url(../photo.jpg)}',{headers:{'Content-Type':'text/css'}});
  const response=await createWorker({}).fetch(new Request('https://studio.example/api/style',{method:'POST',headers:{Origin:'https://studio.example','Content-Type':'application/json'},body:JSON.stringify({url:'https://example.com/old.css'})}));
  assert.equal(response.status,200);assert.equal((await response.json()).url,'https://cdn.example/css/site.css');
 }finally{globalThis.fetch=originalFetch;}
});

test('AVIF images from public pages can be fetched for standalone export',async()=>{
 const bytes=new Uint8Array([0,0,0,32,102,116,121,112]);
 const result=await readPublic('https://example.com/hero.avif',true,async()=>new Response(bytes,{headers:{'Content-Type':'image/avif'}}));
 assert.equal(result.mime,'image/avif');assert.deepEqual(result.body,bytes);
});
