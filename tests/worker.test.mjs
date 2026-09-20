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
