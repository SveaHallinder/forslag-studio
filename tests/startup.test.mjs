import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { normalizeProject } from '../public/render.mjs';
const source = readFileSync(new URL('../public/studio.mjs', import.meta.url), 'utf8');
function startup(entries, missing = false) {
  const calls = [];
  const context = {normalizeProject, restoreCloudDraft(id,revision){calls.push({id,revision});}, dirty:false, draftKey:'draft', selectionKey:'forslag-studio-selected-project', localStorage:{getItem:key=>entries[key]??null}, toast(){}, api:async path=>{
    calls.push(path);
    if(path==='/api/projects')return {json:async()=>missing==='all'?[]:[{id:'vegavista',name:'Company'}]};
    if(missing && (path.endsWith('/customer-b') || missing==='all'))throw Object.assign(new Error('Missing project'),{status:404});
    return {json:async()=>({id:path.split('/').pop(),name:'Company'})};
  }};
  vm.createContext(context);
  const start = source.indexOf('async function loadInitialProject(');
  if(start >= 0)vm.runInContext(source.slice(start,source.indexOf('function toast(',start)),context);
  return {context,calls};
}
test('reloading opens the last saved customer instead of the pilot',async()=>{
  const h=startup({'forslag-studio-selected-project':'customer-b'});
  assert.equal(typeof h.context.loadInitialProject,'function');
  assert.equal((await h.context.loadInitialProject()).id,'customer-b');
});
test('an unsaved draft takes priority over the selected saved project',async()=>{
  const h=startup({draft:JSON.stringify({name:'Unsaved customer'}),'forslag-studio-selected-project':'customer-b'});
  assert.equal(typeof h.context.loadInitialProject,'function');
  assert.equal((await h.context.loadInitialProject()).name,'Unsaved customer');
  assert.equal(h.context.dirty,true);
  assert.equal(h.calls.length,0);
});
test('a missing selected project falls back to the pilot',async()=>{
  const h=startup({'forslag-studio-selected-project':'customer-b'},true);
  assert.equal(typeof h.context.loadInitialProject,'function');
  assert.equal((await h.context.loadInitialProject()).id,'vegavista');
});

test('an empty active library still opens a new editable proposal',async()=>{
  const h=startup({},'all');
  const p=await h.context.loadInitialProject();
  assert.equal(p.id,'');
  assert.equal(p.name,'Nytt förslag');
});

test('a damaged draft does not prevent loading the selected saved project',async()=>{
  const h=startup({draft:'not-json','forslag-studio-selected-project':'customer-b'});
  assert.equal((await h.context.loadInitialProject()).id,'customer-b');
});

test('connection failures are not silently replaced with an empty proposal',async()=>{
  const h=startup({});
  h.context.api=async()=>{throw new Error('Connection unavailable');};
  await assert.rejects(()=>h.context.loadInitialProject(),/Connection unavailable/);
});
test('reloading an unsaved cloud draft keeps its original saved revision',async()=>{
  const h=startup({draft:JSON.stringify({id:'customer',name:'Unsaved customer',_baseRevision:1})});
  assert.equal((await h.context.loadInitialProject()).name,'Unsaved customer');assert.deepEqual(h.calls,[{id:'customer',revision:1}]);
});
