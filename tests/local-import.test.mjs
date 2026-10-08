import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import http from 'node:http';
import {browserConfigured,createWorker,readSocialProfile} from '../worker.mjs';
import {createPreviewServer} from '../scripts/preview-server.mjs';
import {browserConnection} from '../public/connections-studio.mjs';

test('local render, social fallback and status work without provider credentials',async()=>{
  const calls=[],local={ready:true,render:async url=>{calls.push(url);return {url,html:'<meta property="og:title" content="Acme (@acme) • Instagram"><script type="application/json">'+JSON.stringify({username:'acme',full_name:'Acme',biography:'Our coffee shop.'})+'</script>'};}};
  const settings={LOCAL_BROWSER:local,PUBLIC_FETCH:async()=>new Response('blocked',{status:403})};
  assert.equal(browserConfigured(settings),true);
  const worker=createWorker({}),request=new Request('http://localhost:4183/api/render',{method:'POST',headers:{Origin:'http://localhost:4183','Content-Type':'application/json'},body:JSON.stringify({url:'https://example.com'})});
  const response=await worker.fetch(request,settings);assert.equal(response.status,200);assert.match((await response.json()).html,/Acme/);
  const status=await(await worker.fetch(new Request('http://localhost:4183/api/status'),settings)).json();assert.equal(status.browser,'local');assert.ok(!JSON.stringify(status).includes('LOCAL_BROWSER'));
  const social=await readSocialProfile('https://instagram.com/acme/',settings.PUBLIC_FETCH,settings);assert.equal(social.status,'read');assert.equal(social.name,'Acme');assert.deepEqual(calls,['https://example.com/','https://www.instagram.com/acme/']);
});
test('same-origin checks still apply to the local browser adapter',async()=>{
  const worker=createWorker({});
  const response=await worker.fetch(new Request('http://localhost:4183/api/render',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{"url":"https://example.com"}'}),{LOCAL_BROWSER:{ready:true,render:()=>assert.fail('must not render')}});
  assert.equal(response.status,403);
});
test('local server rejects rebinding Host headers and supplies a public customer viewer',async t=>{
  const server=createPreviewServer(createWorker({}),{ready:true,render:()=>assert.fail('must not render'),requestFetch:()=>assert.fail('must not fetch')});
  server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
  const root='http://127.0.0.1:'+server.address().port;
  const rejected=await new Promise(resolve=>{http.get(root+'/api/status',{headers:{Host:'evil.example:'+server.address().port}},response=>{response.resume();resolve(response.statusCode);});});assert.equal(rejected,403);
  const status=await(await fetch(root+'/api/status')).json();assert.equal(status.browser,'local');assert.equal(status.publicBase,'https://forslag-studio.sveaha.chatgpt.site/demo.html');
  const response=await fetch(root+'/api/render',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{}'});assert.equal(response.status,403);
});
test('status copy distinguishes local availability, failed startup and online-only import',()=>{
  assert.match(browserConnection('local').copy,/Ingen Browser Run/);
  assert.match(browserConnection('unavailable').copy,/npm run browser:install/);
  assert.match(browserConnection('unconnected').copy,/lokalappen/);
  assert.equal(browserConnection('unknown').state,'Status okänd');
});
const source=readFileSync(new URL('../public/browser-api.mjs',import.meta.url),'utf8');
test('browser import selection follows the homepage and imported subpages',async()=>{
  const block=source.slice(source.indexOf('async function importCompany('),source.indexOf('function dataURL('));
  for(const renderFirst of [true,false]){
    const calls=[],root='https://example.com/';
    const context={URL,console,finishImportedImages:async p=>p,readCompany:async(url,extraContact,browser)=>{calls.push([url,extraContact,browser]);return {source:url,navigation:url===root?[{label:'Meny',href:root+'menu'},{label:'Om oss',href:root+'about'}]:[],cards:[],warnings:[]};}};
    vm.createContext(context);vm.runInContext(block,context);
    const project=await context.importCompany(root,true,renderFirst);
    assert.equal(project.pages.length,2);
    assert.deepEqual(calls,[[root,true,renderFirst],[root+'menu',false,renderFirst],[root+'about',false,renderFirst]]);
  }
});
test('local sharing uses the public viewer and fails closed when its configuration is missing',async()=>{
  const block=source.slice(source.indexOf('export async function browserAPI(')).replace('export async','async');
  for(const base of ['https://forslag-studio.sveaha.chatgpt.site/demo.html',undefined,'http://localhost:4183/demo.html']){
    const context={initializeCloud:async()=>{},URL,location:{hostname:'localhost',href:'http://localhost:4183/'},AbortSignal,Response,reply:(value,status)=>Response.json(value,{status}),problem:(message)=>new Error(message),console:{warn(){}},fetch:async()=>Response.json({publicBase:base})};vm.createContext(context);vm.runInContext(block,context);
    const response=await context.browserAPI('/api/config');
    if(base?.startsWith('https:'))assert.equal((await response.json()).publicBase,base);
    else{assert.equal(response.status,400);assert.match((await response.json()).error,/demovisaren/);}
  }
});
