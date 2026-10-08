import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createBrowserService} from '../scripts/browser-service.mjs';
const token='fixture-only-browser-token-32-characters';
async function server(t,render=async url=>({url,html:'<h1>Rendered</h1>',runtimeBrand:true})){
  const calls=[],service=createBrowserService({ready:true,render:async url=>{calls.push(url);return render(url);}},token);
  service.listen(0,'127.0.0.1');await once(service,'listening');
  t.after(()=>new Promise(resolve=>{service.close(resolve);service.closeAllConnections();}));
  return {calls,request:(path='/render',options={})=>fetch('http://127.0.0.1:'+service.address().port+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({url:'https://example.com/'}),...options})};
}
test('browser service rejects missing or malformed configuration before opening a browser',()=>{
  for(const value of [undefined,'short','x'.repeat(201),'x'.repeat(32)+'\n'])assert.throws(()=>createBrowserService({},value),/BROWSER_RENDER_TOKEN/);
});
test('browser service authenticates health and renders without exposing its token',async t=>{
  const h=await server(t);
  for(const authorization of ['', 'Bearer wrong','Basic '+token]){
    const response=await h.request('/render',{headers:{Authorization:authorization,'Content-Type':'application/json'}});assert.equal(response.status,401);assert.ok(!(await response.text()).includes(token));
  }
  assert.equal(h.calls.length,0);
  const health=await h.request('/health',{method:'GET',body:undefined});assert.deepEqual(await health.json(),{ready:true});
  const response=await h.request();assert.equal(response.status,200);assert.deepEqual(h.calls,['https://example.com/']);assert.equal((await response.json()).runtimeBrand,true);
});
test('browser service rejects wrong routes, malformed input and oversized bodies without rendering',async t=>{
  const h=await server(t);
  for(const [path,options,status] of [['/other',{},404],['/render',{body:'bad'},400],['/render',{body:JSON.stringify({url:42})},400],['/render',{headers:{Authorization:'Bearer '+token,'Content-Type':'text/plain'}},415],['/render',{body:JSON.stringify({url:'https://example.com/',extra:'x'.repeat(5000)})},413]])assert.equal((await h.request(path,options)).status,status);
  assert.equal(h.calls.length,0);
});
test('renderer limits stay clear and unknown internal failures never reveal implementation details',async t=>{
  const limited=await server(t,async()=>{throw Object.assign(new Error('Webbläsaren är upptagen.'),{status:429});});
  const response=await limited.request();assert.equal(response.status,429);assert.match((await response.json()).error,/upptagen/);
  const broken=await server(t,async()=>{throw new Error('secret renderer detail');});const failure=await broken.request();assert.equal(failure.status,502);assert.ok(!(await failure.text()).includes('secret renderer detail'));
});
