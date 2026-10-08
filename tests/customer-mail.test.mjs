import test from 'node:test';
import assert from 'node:assert/strict';
import {customerMailConfigured,bookingMail,sendCustomerMail} from '../customer-mail.mjs';
import {createWorker} from '../worker.mjs';
const env={RESEND_PLAN:'free',RESEND_API_KEY:'re_'+'a'.repeat(32),RESEND_FROM:'booking@company.example.com'};
const payload=bookingMail({title:'QA Café',name:'QA Guest',email:'guest@example.com',reference:'booking-123',startsAt:'2027-10-10T08:00:00.000Z',timeZone:'Europe/Stockholm',duration:60,teamEmail:'cafe@example.com'});
test('missing sender, invalid free configuration and malformed payload never trigger delivery',async()=>{
  let calls=0;const fetcher=async()=>{calls++;throw new Error();};
  assert.equal(customerMailConfigured({}),false);
  for(const values of [{}, {...env,RESEND_PLAN:'paid'},{...env,RESEND_FROM:'bad'},{...env,RESEND_API_KEY:'bad'}])assert.equal((await sendCustomerMail(payload.customer,'qa-mail',values,fetcher)).state,'unconnected');
  assert.equal((await sendCustomerMail({...payload.customer,subject:'Header\ninjection'},'qa-mail',env,fetcher)).state,'failed');
  assert.equal(calls,0);
});
test('booking emails use company time and preserve a separate company notification',()=>{
  assert.equal(payload.customer.to,'guest@example.com');assert.equal(payload.team.to,'cafe@example.com');
  assert.match(payload.customer.text,/10:00/);assert.match(payload.customer.text,/Europe\/Stockholm/);
  assert.match(payload.team.text,/guest@example.com/);assert.equal(payload.customer.reply_to,'cafe@example.com');
});
test('public connection status reveals configuration without leaking provider credentials',async()=>{
  const body=await(await createWorker({}).fetch(new Request('https://studio.example.com/api/status'),env)).json();
  assert.equal(body.email,'configured');assert.equal(body.reservations,'unconnected');
  assert.ok(!JSON.stringify(body).includes(env.RESEND_API_KEY));assert.ok(!JSON.stringify(body).includes(env.RESEND_FROM));
});
test('delivery uses Resend idempotency and only returns sent after provider acknowledgement',async()=>{
  let body;
  const fetcher=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');assert.equal(options.headers['Idempotency-Key'],'qa-mail');body=JSON.parse(options.body);return new Response('{"id":"provider-123"}',{status:200});};
  assert.deepEqual(await sendCustomerMail(payload.customer,'qa-mail',env,fetcher),{state:'sent',providerId:'provider-123'});
  assert.equal(body.from,env.RESEND_FROM);assert.deepEqual(body.to,['guest@example.com']);
  for(const [status,state] of [[401,'failed'],[403,'failed'],[422,'failed'],[429,'retry'],[503,'retry']])assert.equal((await sendCustomerMail(payload.customer,'qa-mail',env,async()=>new Response('{}',{status}))).state,state);
  assert.equal((await sendCustomerMail(payload.customer,'qa-mail',env,async()=>new Response('{}'))).state,'unknown');
  assert.equal((await sendCustomerMail(payload.customer,'qa-mail',env,async()=>{throw new TypeError();})).state,'retry');
});
