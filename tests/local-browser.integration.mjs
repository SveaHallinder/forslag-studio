import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalBrowser} from '../scripts/local-browser.mjs';
import {publicURL} from '../worker.mjs';
test('real Chromium records computed branding and strips forged capture metadata',async t=>{
  const html='<style>body{background:#faf8f2;font-family:Arial}.cta{background:#226633}h1{font-family:Georgia}span.hidden{display:none}@media(max-width:700px){.cta{background:red}h1{font-family:Courier}}</style><main><h1 data-import-rendered-font-family="Forged"><span>Real title</span></h1><a class="cta" href="/contact">Boka bord</a><span class="hidden">Hidden copy</span></main>';
  const importer=createLocalBrowser({requestFetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})});t.after(()=>importer.close());assert.equal(await importer.start(),true);
  const page=await importer.render('https://example.com/');assert.equal(page.runtimeBrand,true);assert.match(page.html,/data-import-rendered-background-color="rgb\(34, 102, 51\)"/);assert.match(page.html,/data-import-rendered-font-family="Georgia"/);assert.match(page.html,/class="hidden"[^>]+data-import-rendered-hidden="true"/);assert.ok(!page.html.includes('Forged'));
});

test('real Chromium renders JS and intercepts redirects, frames and background requests',async t=>{
  const calls=[],fetcher=async value=>{
    const url=publicURL(value);calls.push(url.href);
    if(url.hostname==='private.example')throw Object.assign(new Error('private DNS blocked'),{status:400});
    if(url.pathname==='/private-redirect')return new Response(null,{status:302,headers:{location:'http://127.0.0.1/'}});
    if(url.pathname==='/dns-redirect')return new Response(null,{status:302,headers:{location:'https://private.example/'}});
    if(url.pathname==='/redirect')return new Response(null,{status:302,headers:{location:'/rendered'}});
    if(url.pathname==='/app.js')return new Response(`document.querySelector('main').innerHTML='<h1>Rendered café</h1><p>Fresh coffee, every day.</p>';fetch('http://127.0.0.1:4174/').catch(()=>{});fetch('https://private.example/').catch(()=>{});localStorage.setItem('private-draft','first context');`,{headers:{'content-type':'text/javascript; charset=utf-8'}});
    if(url.pathname==='/isolation')return new Response(`<main><h1>New session</h1><p id="result"></p></main><script>document.querySelector('#result').textContent=localStorage.getItem('private-draft')||'No previous data';</script>`,{headers:{'content-type':'text/html'}});
    if(url.pathname==='/too-large')return new Response('x'.repeat(2_000_001),{headers:{'content-type':'text/html'}});
    if(url.pathname==='/forbidden')return new Response('Login required',{status:403});
    if(url.pathname==='/infinite-script')return new Response('<script>while(true){}</script>',{headers:{'content-type':'text/html'}});
    return new Response('<meta charset="utf-8"><main></main><iframe src="http://localhost:4174/"></iframe><script src="/app.js"></script>',{headers:{'content-type':'text/html; charset=utf-8'}});
  };
  const importer=createLocalBrowser({requestFetch:fetcher});t.after(()=>importer.close());assert.equal(await importer.start(),true);
  const page=await importer.render('https://example.com/redirect');assert.match(page.html,/Rendered café/);assert.equal(page.url,'https://example.com/rendered');
  assert.ok(!calls.some(url=>/127\.0\.0\.1|localhost/.test(url)));
  await assert.rejects(importer.render('https://example.com/private-redirect'),/offentlig/);
  await assert.rejects(importer.render('https://example.com/dns-redirect'),/private DNS/);
  await assert.rejects(importer.render('https://example.com/too-large'),error=>error.status===413);
  await assert.rejects(importer.render('https://example.com/forbidden'),/HTTP 403/);
  const next=await importer.render('https://example.com/isolation');assert.match(next.html,/No previous data/);
});
test('deadline closes a stuck renderer and permits a later import',async t=>{
  const importer=createLocalBrowser({timeout:700,requestFetch:async url=>new Response(new URL(url).pathname==='/stuck'?'<script>while(true){}</script>':'<h1>Recovered</h1>',{headers:{'content-type':'text/html'}})});
  t.after(()=>importer.close());assert.equal(await importer.start(),true);
  await assert.rejects(importer.render('https://example.com/stuck'),error=>error.status===504);
  const page=await importer.render('https://example.com/ok');assert.match(page.html,/Recovered/);
});
test('only two renders run together and missing Chromium has a useful error',async t=>{
  let entered=0,release;const gate=new Promise(resolve=>{release=resolve;});
  const importer=createLocalBrowser({requestFetch:async()=>{entered++;await gate;return new Response('<h1>Ready</h1>',{headers:{'content-type':'text/html'}});}});
  t.after(()=>importer.close());assert.equal(await importer.start(),true);
  const first=importer.render('https://example.com/first'),second=importer.render('https://example.com/second');
  await assert.rejects(importer.render('https://example.com/third'),error=>error.status===429);release();
  await Promise.all([first,second]);assert.equal(entered,2);
  const unavailable=createLocalBrowser({browserType:{launch:async()=>{throw new Error('missing executable');}}});assert.equal(await unavailable.start(),false);assert.equal(unavailable.ready,false);
  await assert.rejects(unavailable.render('https://example.com/'),error=>error.status===503&&/browser:install/.test(error.message));
});
