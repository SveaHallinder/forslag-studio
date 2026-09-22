import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as workerModule from '../worker.mjs';
const env={CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_BROWSER_TOKEN:'test-secret',CLOUDFLARE_BROWSER_PLAN:'free'};
const render=(url,settings,fetcher)=>workerModule.renderPublic(url,settings,fetcher);
const success=(extra={})=>Response.json({success:true,result:'<h1>Original text</h1>',meta:{finalUrl:'https://example.com/about/',status:200},...extra});

test('browser rendering is disabled until a free account and token are configured',async()=>{
 for(const settings of [{},{...env,CLOUDFLARE_BROWSER_PLAN:'paid'},{...env,CLOUDFLARE_BROWSER_TOKEN:''}]){
  await assert.rejects(async()=>render('https://example.com',settings,()=>assert.fail('must not call provider')),error=>error.status===503&&/ansluten/.test(error.message));
 }
});
test('browser rendering validates targets and uses a fixed authenticated provider endpoint',async()=>{
 await assert.rejects(async()=>render('http://localhost',env,()=>assert.fail('private target')),/offentlig/);
 const data=await render('https://example.com',env,async(url,options)=>{
  assert.equal(url,'https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/browser-rendering/content?cacheTTL=300');
  assert.equal(options.headers.Authorization,'Bearer test-secret');assert.equal(options.redirect,'error');
  const body=JSON.parse(options.body);assert.equal(body.url,'https://example.com/');assert.equal(body.gotoOptions.waitUntil,'networkidle2');assert.ok(body.gotoOptions.timeout<=20000);
  assert.equal(body.authenticate,undefined);assert.equal(body.cookies,undefined);return success();
 });
 assert.equal(data.url,'https://example.com/about/');assert.equal(data.html,'<h1>Original text</h1>');assert.equal(data.meta,undefined);
});
test('browser provider failures are clear without leaking provider details or retrying',async()=>{
 for(const [status,match] of [[429,/gräns/],[401,/anslutning/],[403,/anslutning/],[500,/tillfälligt/]]){
  let calls=0;await assert.rejects(async()=>render('https://example.com',env,async()=>{calls++;return new Response('test-secret',{status});}),error=>match.test(error.message)&&!error.message.includes('test-secret'));
  assert.equal(calls,1);
 }
});
test('browser output rejects failed origins, private redirects, empty and oversized content',async()=>{
 for(const response of [success({meta:{finalUrl:'http://127.0.0.1',status:200}}),success({meta:{status:403}}),success({result:''}),success({success:false}),success({result:'x'.repeat(2_000_001)})])await assert.rejects(async()=>render('https://example.com',env,async()=>response));
});
test('render route preserves same-origin restriction and useful disabled status',async()=>{
 const worker=workerModule.createWorker({});
 const request=origin=>new Request('https://studio.example/api/render',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({url:'https://example.com'})});
 assert.equal((await worker.fetch(request('https://other.example'))).status,403);
 const result=await worker.fetch(request('https://studio.example'));assert.equal(result.status,503);assert.match((await result.json()).error,/ansluten/);
});

const source=readFileSync(new URL('../public/browser-api.mjs',import.meta.url),'utf8');
const block=source.slice(source.indexOf('async function readCompany('),source.indexOf('async function importCompany('));
function client({empty=false,renderFailure=false,unexpected=false}={}){
 const calls=[];const context={URL,console:{warn(){}},remote:async path=>{calls.push(path);if(path==='/api/render'&&renderFailure)throw Object.assign(new Error('Gratisgräns nådd'),{status:429});return Response.json({html:path==='/api/render'?'rendered':'raw',url:'https://example.com/'});},extractContent:html=>{
  if(unexpected)throw new Error('Unexpected parser error');
  if(empty&&html==='raw')throw Object.assign(new Error('No readable content'),{code:'EMPTY_CONTENT'});
  return {headline:'Original',source:'https://example.com/',stylesheets:[],links:[],warnings:[]};
 }};vm.createContext(context);vm.runInContext(block,context);return {context,calls};
}
test('ordinary HTML does not consume browser time',async()=>{const h=client();await h.context.readCompany('https://example.com');assert.deepEqual(h.calls,['/api/read']);});
test('empty HTML retries once through browser and keeps original content',async()=>{const h=client({empty:true});const p=await h.context.readCompany('https://example.com');assert.equal(p.headline,'Original');assert.deepEqual(h.calls,['/api/read','/api/render']);assert.match(p.warnings.join(' '),/webbläsare/);});
test('failed browser fallback remains a failure with quota status',async()=>{const h=client({empty:true,renderFailure:true});await assert.rejects(h.context.readCompany('https://example.com'),e=>e.status===429);assert.deepEqual(h.calls,['/api/read','/api/render']);});
test('unrelated extraction errors do not trigger paid or repeated work',async()=>{const h=client({unexpected:true});await assert.rejects(h.context.readCompany('https://example.com'),/Unexpected/);assert.deepEqual(h.calls,['/api/read']);});
