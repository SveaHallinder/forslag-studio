import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createLocalDatabase} from '../scripts/local-database.mjs';
import {handleCloud} from '../cloud-worker.mjs';

const source=readFileSync(new URL('../public/cloud-api.mjs',import.meta.url),'utf8').replace(/^export /gm,'');
function fixture(t){
  const DB=createLocalDatabase(':memory:'),entries=new Map();t.after(()=>DB.close());
  const fetchAPI=(path,options={})=>handleCloud(new Request(new URL(path,'https://studio.example.com'),{...options,headers:{...options.headers,Origin:'https://studio.example.com','oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.com'}}),{DB});
  const tab=workspace=>{
    const context={URL,Response,AbortSignal,crypto,fetch:fetchAPI,location:{href:'https://studio.example.com/?workspace='+workspace},localStorage:{getItem:key=>entries.get(key)||null,setItem:(key,value)=>entries.set(key,value)}};
    vm.createContext(context);vm.runInContext(source,context);return context;
  };
  return {DB,tab,async workspace(){return(await(await fetchAPI('/api/cloud/workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"name":"QA"}'})).json()).id;}};
}
test('reloading a stale draft cannot borrow the revision saved by another tab',async t=>{
  const h=fixture(t),workspace=await h.workspace(),a=h.tab(workspace),b=h.tab(workspace);await a.initializeCloud();await b.initializeCloud();
  await a.cloudProjectAPI('/api/save',{id:'cafe',name:'QA',headline:'First'});
  await b.cloudProjectAPI('/api/projects/cafe');
  const base=a.cloudDraftRevision('cafe');await b.cloudProjectAPI('/api/save',{id:'cafe',name:'QA',headline:'Other tab'});
  const reloaded=h.tab(workspace);await reloaded.initializeCloud();reloaded.restoreCloudDraft('cafe',base);
  await assert.rejects(()=>reloaded.cloudProjectAPI('/api/save',{id:'cafe',name:'QA',headline:'Unsaved draft'}),error=>error.status===409);
  assert.equal((await(await b.cloudProjectAPI('/api/projects/cafe')).json()).headline,'Other tab');
});
test('project revisions are scoped to each workspace when switching libraries',async t=>{
  const h=fixture(t),one=await h.workspace(),two=await h.workspace(),tab=h.tab(one);await tab.initializeCloud();
  await tab.cloudProjectAPI('/api/save',{id:'cafe',name:'First workspace'});tab.selectCloudWorkspace(two);
  await tab.cloudProjectAPI('/api/save',{id:'cafe',name:'Second workspace'});tab.selectCloudWorkspace(one);
  assert.equal((await(await tab.cloudProjectAPI('/api/projects/cafe')).json()).name,'First workspace');
});
