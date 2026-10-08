import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalDatabase} from '../scripts/local-database.mjs';
import {handleCloud} from '../cloud-worker.mjs';
import {createPreviewServer} from '../scripts/preview-server.mjs';
import {normalizeProject,renderDemo} from '../public/render.mjs';

function fixture(t){
  const DB=createLocalDatabase(':memory:');t.after(()=>DB.close());
  const call=async(path,body,user='owner',extra={})=>{
    const headers={...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.com'}:{}),...extra};
    if(body!==undefined){headers.Origin='https://studio.example.com';headers['Content-Type']='application/json';}
    const response=await handleCloud(new Request('https://studio.example.com'+path,{method:body===undefined?'GET':'POST',headers,...(body===undefined?{}:{body:JSON.stringify(body)})}),{DB});
    return {status:response.status,data:await response.json()};
  };
  return {DB,call,async workspace(){return (await call('/api/cloud/workspace',{name:'QA Studio'})).data.id;}};
}
test('cloud sessions are private and anonymous users cannot read project data',async t=>{
  const h=fixture(t),workspace=await h.workspace();assert.equal((await h.call('/api/cloud/session',undefined,null)).data.workspaces.length,0);
  assert.equal((await h.call('/api/cloud/projects?workspace='+workspace,undefined,null)).status,401);
  assert.equal((await h.call('/api/cloud/projects?workspace='+workspace,undefined,'stranger')).status,403);
  assert.equal((await h.call('/api/cloud/projects?workspace='+workspace)).status,200);
});
test('optimistic saving prevents stale writes, duplicate ids and archive overwrites',async t=>{
  const h=fixture(t),workspace=await h.workspace(),body={workspace,id:'customer',revision:0,project:{name:'Kund',headline:'Version one'}};
  assert.equal((await h.call('/api/cloud/save',body)).data.revision,1);
  assert.equal((await h.call('/api/cloud/save',{...body,project:{name:'Different'}})).status,409);
  assert.equal((await h.call('/api/cloud/save',{...body,revision:1,project:{name:'Kund',headline:'Version two'}})).data.revision,2);
  assert.equal((await h.call('/api/cloud/save',{...body,revision:1})).status,409);
  const row=await h.call('/api/cloud/project?workspace='+workspace+'&id=customer');assert.equal(row.data.project.headline,'Version two');
  assert.equal((await h.call('/api/cloud/move',{workspace,id:'customer',revision:2,archived:true})).status,200);
  assert.equal((await h.call('/api/cloud/save',{...body,revision:3})).status,409);
  assert.equal((await h.call('/api/cloud/move',{workspace,id:'customer',revision:3,archived:false})).status,200);
});
test('invites are bound to email, expire, are single use and cannot grant ownership',async t=>{
  const h=fixture(t),workspace=await h.workspace();
  const invite=await h.call('/api/cloud/invite',{workspace,email:'colleague@example.com'}),token=new URL(invite.data.url).searchParams.get('invite');
  assert.equal((await h.call('/api/cloud/join',{token},'stranger')).status,403);
  assert.equal((await h.call('/api/cloud/join',{token},'colleague')).status,200);
  assert.equal((await h.call('/api/cloud/join',{token},'colleague')).status,403);
  assert.equal((await h.call('/api/cloud/invite',{workspace,email:'next@example.com'},'colleague')).status,403);
  assert.equal((await h.call('/api/cloud/projects?workspace='+workspace,undefined,'colleague')).status,200);
  await h.call('/api/cloud/remove-member',{workspace,userId:'colleague'});
  assert.equal((await h.call('/api/cloud/projects?workspace='+workspace,undefined,'colleague')).status,403);
  const late=await h.call('/api/cloud/invite',{workspace,email:'colleague@example.com'});await h.DB.prepare('UPDATE studio_invites SET expires_at=?').bind('2000-01-01').run();
  assert.equal((await h.call('/api/cloud/join',{token:new URL(late.data.url).searchParams.get('invite')},'colleague')).status,403);
});
test('public forms persist a request once and keep the inbox private',async t=>{
  const h=fixture(t),workspace=await h.workspace();await h.call('/api/cloud/save',{workspace,id:'cafe',revision:0,project:{name:'QA Café',accent:'#cdeb60'}});
  const form=(await h.call('/api/cloud/form',{workspace,projectId:'cafe',kind:'booking',active:true})).data,id=new URL(form.url).searchParams.get('form'),path='/api/request/'+id;
  const body={nonce:crypto.randomUUID(),name:'QA visitor',email:'qa@example.com',message:'A test request',visitAt:'2026-10-12T12:00'};
  assert.equal((await h.call(path,undefined,null)).data.title,'QA Café');assert.equal((await h.call(path,body,null)).status,201);assert.equal((await h.call(path,body,null)).status,200);
  const inbox=await h.call('/api/cloud/inbox?workspace='+workspace);assert.equal(inbox.data.length,1);assert.equal(inbox.data[0].visit_at,body.visitAt);
  assert.equal((await h.call('/api/cloud/inbox?workspace='+workspace,undefined,'stranger')).status,403);
  await h.call('/api/cloud/message-state',{workspace,id:inbox.data[0].id,state:'read'});assert.equal((await h.call('/api/cloud/inbox?workspace='+workspace)).data[0].state,'read');
  await h.call('/api/cloud/form',{workspace,projectId:'cafe',active:false});assert.equal((await h.call(path,{...body,nonce:crypto.randomUUID()},null)).status,404);
});
test('form rate limits, honeypot, validation and CSRF checks fail without accepting data',async t=>{
  const h=fixture(t),workspace=await h.workspace();await h.call('/api/cloud/save',{workspace,id:'cafe',revision:0,project:{name:'QA'}});
  const form=(await h.call('/api/cloud/form',{workspace,projectId:'cafe',kind:'contact',active:true})).data,path='/api/request/'+new URL(form.url).searchParams.get('form');
  const body={nonce:crypto.randomUUID(),name:'QA',email:'qa@example.com',message:'Test'};
  assert.equal((await h.call(path,{...body,website:'spam'},null)).status,400);assert.equal((await h.call(path,{...body,email:'wrong'},null)).status,400);
  for(let i=0;i<5;i++)assert.equal((await h.call(path,{...body,nonce:crypto.randomUUID()},null)).status,201);
  assert.equal((await h.call(path,{...body,nonce:crypto.randomUUID()},null)).status,429);
  const response=await handleCloud(new Request('https://studio.example.com/api/cloud/workspace',{method:'POST',headers:{Origin:'https://foreign.example.com','Content-Type':'application/json','oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.com'},body:'{"name":"CSRF"}'}),{DB:h.DB});assert.equal(response.status,403);
});
test('preview server strips forged identity and IP headers',async t=>{
  const worker={fetch:async request=>new Response(JSON.stringify({id:request.headers.get('oai-authenticated-user-id'),ip:request.headers.get('cf-connecting-ip')}))};
  const server=createPreviewServer(worker,{requestFetch:fetch},{LOCAL_IDENTITY:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const url='http://127.0.0.1:'+server.address().port+'/api/cloud/session',forged=await fetch(url,{headers:{'oai-authenticated-user-id':'spoof','cf-connecting-ip':'spoof'}});
  assert.deepEqual(await forged.json(),{id:null,ip:null});
  const local=await fetch(url,{headers:{cookie:'forslag-local-user=1','oai-authenticated-user-id':'spoof'}});assert.equal((await local.json()).id,'local-preview-owner');
});
test('localhost login uses a distinct route and cannot redirect the test session to another origin',async t=>{
  const server=createPreviewServer({fetch:async()=>new Response('Local test')},{requestFetch:fetch},{LOCAL_IDENTITY:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const origin='http://127.0.0.1:'+server.address().port;
  const signed=await fetch(origin+'/local-signin?return_to='+encodeURIComponent('//other.example.com/'),{redirect:'manual'});assert.equal(signed.status,303);assert.equal(signed.headers.get('Location'),'/');assert.match(signed.headers.get('Set-Cookie'),/forslag-local-user=1;.*HttpOnly; SameSite=Lax/);
  const out=await fetch(origin+'/local-signout',{redirect:'manual'});assert.match(out.headers.get('Set-Cookie'),/Max-Age=0/);
});
test('the form link survives normalization, multipage previews and HTML exports',()=>{
  const url='https://studio.example.com/contact.html?form='+crypto.randomUUID(),p=normalizeProject({name:'QA',source:'https://cafe.example.com/',requestForm:{url,kind:'contact'},pages:[{source:'https://cafe.example.com/about',headline:'Om'}]});
  assert.equal(p.requestForm.url,url);assert.ok(renderDemo(p).includes(url));assert.equal(normalizeProject({requestForm:{url:'javascript:alert(1)',kind:'contact'}}).requestForm,undefined);
});
test('simultaneous retries of one request both succeed and create one inbox item',async t=>{
  const h=fixture(t),workspace=await h.workspace();await h.call('/api/cloud/save',{workspace,id:'cafe',revision:0,project:{name:'QA'}});
  const form=(await h.call('/api/cloud/form',{workspace,projectId:'cafe',kind:'contact',active:true})).data,path='/api/request/'+new URL(form.url).searchParams.get('form');
  const body={nonce:crypto.randomUUID(),name:'QA',email:'qa@example.com',message:'Test'};
  const responses=await Promise.all([h.call(path,body,null),h.call(path,body,null)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,201]);assert.equal((await h.call('/api/cloud/inbox?workspace='+workspace)).data.length,1);
});
test('oversized cloud saves explain the storage limit and preserve the previous project',async t=>{
  const h=fixture(t),workspace=await h.workspace(),body={workspace,id:'cafe',revision:0,project:{name:'QA',headline:'Saved'}};await h.call('/api/cloud/save',body);
  const result=await h.call('/api/cloud/save',{...body,revision:1,project:{name:'QA',headline:'🟢'.repeat(450_000)}});assert.equal(result.status,413);assert.match(result.data.error,/1,8 MB/);
  assert.equal((await h.call('/api/cloud/project?workspace='+workspace+'&id=cafe')).data.project.headline,'Saved');
});
