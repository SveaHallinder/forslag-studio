import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalDatabase} from '../scripts/local-database.mjs';
import {createWorker} from '../worker.mjs';
import {processCustomerMail} from '../customer-flows.mjs';

const origin='https://studio.example.com',agentToken='a'.repeat(48),mailEnv={RESEND_PLAN:'free',RESEND_API_KEY:'re_'+'b'.repeat(32),RESEND_FROM:'booking@example.com'};
function fixture(t){
  const DB=createLocalDatabase(':memory:'),env={DB,BROWSER_AGENT_TOKEN:agentToken},worker=createWorker({});t.after(()=>DB.close());
  const call=async(path,body,user='owner',headers={})=>{
    const response=await worker.fetch(new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.com'}:{}),...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
    return {status:response.status,data:await response.json()};
  };
  const agent=(path,body)=>call('/api/agent/'+path,body,null,{Authorization:'Bearer '+agentToken});
  const book=(form,extra={})=>call('/api/booking/'+form,{nonce:crypto.randomUUID(),startsAt:setup.slots[0],name:'QA visitor',email:'delivered@example.com',...extra},null,{'CF-Connecting-IP':crypto.randomUUID()});
  const setup={timeZone:'Europe/Stockholm',duration:60,capacity:1,slots:[new Date(Math.ceil((Date.now()+86400000)/3600000)*3600000).toISOString()],notifyTeam:false};
  return {DB,env,call,agent,book,setup,async activate(next=setup){const workspace=(await call('/api/cloud/workspace',{name:'Test workspace'})).data.id;await call('/api/cloud/save',{workspace,id:'cafe',revision:0,project:{name:'Test Café',email:'team@example.com'}});const result=await call('/api/cloud/booking-config',{workspace,projectId:'cafe',setup:next});assert.equal(result.status,200,JSON.stringify(result.data));return {workspace,form:new URL(result.data.url).searchParams.get('form'),revision:result.data.revision};}};
}
test('native activation is authenticated and public booking does not expose workspace data',async t=>{
  const h=fixture(t),{workspace,form}=await h.activate();
  assert.equal((await h.call('/api/cloud/booking-config',{workspace,projectId:'cafe',setup:h.setup},null)).status,401);
  assert.equal((await h.call('/api/cloud/booking-config',{workspace,projectId:'cafe',setup:h.setup},'stranger')).status,403);
  const page=await h.call('/api/booking/'+form,undefined,null);assert.equal(page.data.slots.length,1);assert.equal(page.data.slots[0].remaining,1);assert.equal(page.data.kind,'booking');assert.ok(!JSON.stringify(page.data).includes(workspace));assert.ok(!JSON.stringify(page.data).includes('team@example.com'));
  const wrongOrigin=await h.call('/api/booking/'+form,{nonce:crypto.randomUUID(),startsAt:h.setup.slots[0],name:'QA',email:'qa@example.com'},null,{Origin:'https://other.example.com'});assert.equal(wrongOrigin.status,403);
  assert.equal((await h.book(form,{website:'spam'})).status,400);
});
test('simultaneous attempts cannot oversell the last seat and cancellation releases it',async t=>{
  const h=fixture(t),{workspace,form}=await h.activate();const nonce=crypto.randomUUID();
  const responses=await Promise.all([h.book(form,{nonce}),h.book(form,{nonce}),...Array.from({length:8},()=>h.book(form))]);
  assert.equal(responses.filter(r=>r.status===201).length,1);assert.equal((await h.DB.prepare('SELECT COUNT(*) AS count FROM studio_reservations').first()).count,1);
  const receipt=responses.find(r=>r.status===201).data;assert.equal(receipt.confirmed,true);assert.equal(receipt.email,'unconnected');assert.equal((await h.call('/api/booking/'+form,undefined,null)).data.slots.length,0);
  assert.equal((await h.book(form,{nonce,email:'different@example.com'})).status,409);
  const inbox=(await h.call('/api/cloud/inbox?workspace='+workspace)).data;assert.equal(inbox.length,1);assert.equal(inbox[0].reservation_id,receipt.reference);
  assert.equal((await h.call('/api/cloud/reservation-state',{workspace,id:receipt.reference,state:'cancelled'},'stranger')).status,403);
  assert.equal((await h.call('/api/cloud/reservation-state',{workspace,id:receipt.reference,state:'cancelled'})).status,200);
  assert.equal((await h.call('/api/booking/'+form,undefined,null)).data.slots[0].remaining,1);assert.equal((await h.book(form,{nonce})).status,409);assert.equal((await h.book(form)).status,201);
});
test('reservation, inbox request and email job roll back together if queue storage fails',async t=>{
  const h=fixture(t),{form}=await h.activate(),original=h.DB.batch.bind(h.DB);
  h.DB.batch=statements=>original([...statements,h.DB.prepare('INSERT INTO missing_table VALUES(1)')]);
  assert.equal((await h.book(form)).status,500);
  for(const table of ['studio_requests','studio_reservations','studio_email_jobs'])assert.equal((await h.DB.prepare('SELECT COUNT(*) AS count FROM '+table).first()).count,0);
  h.DB.batch=original;assert.equal((await h.book(form)).status,201);
});
test('live configuration survives ordinary saves and cannot alter confirmed reservations',async t=>{
  const h=fixture(t),{workspace,form,revision}=await h.activate();assert.equal((await h.book(form)).status,201);
  await h.call('/api/cloud/save',{workspace,id:'cafe',revision,project:{name:'Changed draft',bookingConfig:{setup:{capacity:100}}}});
  assert.equal((await h.call('/api/booking/'+form,undefined,null)).data.slots.length,0);
  assert.equal((await h.call('/api/cloud/booking-config',{workspace,projectId:'cafe',setup:{...h.setup,duration:90}})).status,409);
  const config=(await h.call('/api/cloud/project?workspace='+workspace+'&id=cafe')).data.project.bookingConfig;assert.equal(config.setup.duration,60);
});
test('activation rechecks reservations arriving between initial read and its atomic batch',async t=>{
  const h=fixture(t),{workspace,form}=await h.activate(),original=h.DB.batch.bind(h.DB);let intercepted=false;
  h.DB.batch=async statements=>{if(!intercepted){intercepted=true;h.DB.batch=original;assert.equal((await h.book(form)).status,201);}return original(statements);};
  const result=await h.call('/api/cloud/booking-config',{workspace,projectId:'cafe',setup:{...h.setup,duration:90}});assert.equal(result.status,409);
  assert.equal((await h.call('/api/cloud/project?workspace='+workspace+'&id=cafe')).data.project.bookingConfig.setup.duration,60);
});
test('mail leases serialize competing processors and retries preserve sender, body and key',async t=>{
  const h=fixture(t),{form}=await h.activate();await h.book(form);const calls=[],now=Date.now()+1000;
  const fetcher=async(url,options)=>{calls.push({key:options.headers['Idempotency-Key'],body:options.body});return new Response('',{status:503});};
  const env={...h.env,...mailEnv};await Promise.all([processCustomerMail(env,{now,limit:1,requestFetch:fetcher}),processCustomerMail(env,{now,limit:1,requestFetch:fetcher})]);assert.equal(calls.length,1);
  await processCustomerMail({...env,RESEND_FROM:'changed@example.com'},{now:now+121000,limit:1,requestFetch:async(url,options)=>{calls.push({key:options.headers['Idempotency-Key'],body:options.body});return Response.json({id:'provider-accepted'});}});
  assert.deepEqual(calls[0],calls[1]);const row=await h.DB.prepare('SELECT * FROM studio_email_jobs').first();assert.equal(row.state,'sent');assert.equal(row.attempts,2);
  assert.equal((await processCustomerMail(env,{now:now+500000,requestFetch:()=>assert.fail('Already accepted')})).processed,0);
});
test('free daily and monthly budgets persist and uncertain old sends are never retried',async t=>{
  const h=fixture(t),{form}=await h.activate();await h.book(form);const now=Date.now()+1000,stamp=new Date(now).toISOString(),env={...h.env,...mailEnv},never=()=>assert.fail('Quota or idempotency window must prevent sending');
  await h.DB.prepare('UPDATE studio_email_jobs SET attempt_log=?').bind(JSON.stringify(Array(100).fill(stamp))).run();assert.equal((await processCustomerMail(env,{now,requestFetch:never})).processed,0);
  const previousDay=new Date(now-86400000).toISOString();await h.DB.prepare('UPDATE studio_email_jobs SET attempt_log=?').bind(JSON.stringify(Array(3000).fill(previousDay))).run();if(previousDay.slice(0,7)===stamp.slice(0,7))assert.equal((await processCustomerMail(env,{now,requestFetch:never})).processed,0);
  await h.DB.prepare("UPDATE studio_email_jobs SET attempt_log='[]',state='retry',first_attempt_at=?,attempts=1").bind(new Date(now-24*3600000).toISOString()).run();await processCustomerMail(env,{now,requestFetch:never});assert.equal((await h.DB.prepare('SELECT state FROM studio_email_jobs').first()).state,'unknown');
});
test('Mac queue keeps results private, rejects private URLs and fences expired leases',async t=>{
  const h=fixture(t);assert.equal((await h.call('/api/agent/poll',{ready:true},null)).status,401);await h.agent('poll',{ready:true});
  assert.equal((await h.call('/api/render',{url:'http://127.0.0.1'},'owner')).status,400);assert.equal((await h.call('/api/render',{url:'https://example.com/'},null)).status,401);
  const queued=await h.call('/api/render',{url:'https://example.com/'});assert.equal(queued.status,202);
  const id=queued.data.jobId;assert.equal((await h.call('/api/browser-job/'+id,undefined,'stranger')).status,404);assert.equal((await h.call('/api/browser-job/'+id,undefined,null)).status,401);
  const claim=(await h.agent('poll',{ready:true})).data.job;assert.equal(claim.id,id);
  await h.DB.prepare('UPDATE studio_browser_jobs SET lease_until=? WHERE id=?').bind('2000-01-01T00:00:00.000Z',id).run();const next=(await h.agent('poll',{ready:true})).data.job;
  assert.equal((await h.agent('result',{id,lease:claim.lease,result:{html:'<h1>Old</h1>',url:'https://example.com/'}})).status,409);
  assert.equal((await h.agent('result',{id,lease:next.lease,result:{html:'<h1>Rendered</h1>',url:'https://example.com/',runtimeBrand:true}})).status,200);
  assert.equal((await h.call('/api/browser-job/'+id)).data.result.runtimeBrand,true);
  const status=(await h.call('/api/status')).data;assert.equal(status.agent,'ready');assert.equal(status.browserProvider,'mac');assert.ok(!JSON.stringify(status).includes(agentToken));
  await h.DB.prepare('UPDATE studio_browser_jobs SET expires_at=? WHERE id=?').bind('2000-01-01T00:00:00.000Z',id).run();assert.equal((await h.call('/api/browser-job/'+id)).status,410);
});
test('blocked social pages use the same Mac queue without importing a different profile',async t=>{
  const h=fixture(t);h.env.PUBLIC_FETCH=async()=>new Response('Blocked',{status:403});await h.agent('poll',{ready:true});
  const queued=await h.call('/api/social',{url:'https://www.instagram.com/acme/'});assert.equal(queued.status,202);const claim=(await h.agent('poll',{ready:true})).data.job;
  await h.agent('result',{id:claim.id,lease:claim.lease,result:{html:'<h1>Other</h1>',url:'https://www.instagram.com/other/'}});assert.equal((await h.call('/api/browser-job/'+queued.data.jobId)).status,502);
});
