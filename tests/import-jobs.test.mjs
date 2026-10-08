import test from 'node:test';
import assert from 'node:assert/strict';
import {completeBrowserImport} from '../public/import-jobs.mjs';

test('import polling preserves ordinary image and error responses without consuming their bodies',async()=>{
  for(const response of [new Response('image bytes',{headers:{'Content-Type':'image/png'}}),Response.json({error:'Offline'},{status:503})]){
    assert.equal(await completeBrowserImport(response,()=>assert.fail('An ordinary response must not poll')),response);
    assert.equal(response.bodyUsed,false);
  }
});
test('import polling returns the queued job result and preserves authorization failures',async()=>{
  const id=crypto.randomUUID();
  const result=await completeBrowserImport(Response.json({jobId:id},{status:202}),async path=>{assert.equal(path,'/api/browser-job/'+id);return Response.json({state:'complete',result:{html:'<h1>Rendered</h1>',runtimeBrand:true}});});
  assert.equal((await result.json()).runtimeBrand,true);
  const denied=Response.json({error:'Sign in'},{status:401});assert.equal(await completeBrowserImport(Response.json({jobId:id},{status:202}),async()=>denied),denied);
  await assert.rejects(completeBrowserImport(Response.json({jobId:'../other'},{status:202})),/giltigt jobb/);
});
