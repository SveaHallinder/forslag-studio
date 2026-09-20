import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { normalizeProject } from '../public/render.mjs';
const source=readFileSync(new URL('../public/studio.mjs',import.meta.url),'utf8');

function harness() {
  let resolveRequest;
  const pending=new Promise(resolve=>resolveRequest=resolve);
  const entries=new Map([['forslag-studio-selected-project','customer']]);
  const elements=new Map();
  const context={project:normalizeProject({id:'customer',name:'Kund AB',templateId:'studio'}),dirty:false,archiveBusy:false,projectLoadSequence:0,draftKey:'draft',normalizeProject,
    api:async()=>pending,refreshProjects:async()=>{},renderProjectCards(){},fillEditor(){},toast(){},
    markDirty(){context.dirty=true;entries.set('draft',JSON.stringify(context.project));},
    localStorage:{getItem:key=>entries.get(key),removeItem:key=>entries.delete(key),setItem:(key,value)=>entries.set(key,value)},
    $:id=>{if(!elements.has(id))elements.set(id,{disabled:false,close(){}});return elements.get(id);},
  };
  vm.createContext(context);
  const start=source.indexOf('async function changeArchive(');
  if(start>=0)vm.runInContext(source.slice(start,source.indexOf('function requestArchive(',start)),context);
  return {context,entries,complete:()=>resolveRequest({})};
}

test('archiving the open saved project leaves a usable blank editor',async()=>{
  const h=harness();assert.equal(typeof h.context.changeArchive,'function');
  const task=h.context.changeArchive('customer');h.complete();await task;
  assert.equal(h.context.project.id,'');assert.equal(h.context.project.name,'Nytt förslag');
  assert.equal(h.entries.has('forslag-studio-selected-project'),false);
});
test('edits made while archive is pending survive as an unsaved copy',async()=>{
  const h=harness();assert.equal(typeof h.context.changeArchive,'function');
  const task=h.context.changeArchive('customer');h.context.project.headline='Ny text under arkivering';h.context.markDirty();h.complete();await task;
  assert.equal(h.context.project.id,'');assert.equal(h.context.project.headline,'Ny text under arkivering');
  assert.equal(h.context.project.templateId,'studio');assert.equal(h.context.dirty,true);
  assert.equal(JSON.parse(h.entries.get('draft')).headline,'Ny text under arkivering');
});
test('archiving another project never replaces the newly selected customer',async()=>{
  const h=harness();assert.equal(typeof h.context.changeArchive,'function');
  const task=h.context.changeArchive('customer');
  const selected=normalizeProject({id:'other',name:'Annan kund'});h.context.project=selected;h.context.markDirty();h.complete();await task;
  assert.equal(h.context.project,selected);assert.equal(h.context.dirty,true);
});
test('an unsaved open project cannot be archived',async()=>{
  const h=harness();assert.equal(typeof h.context.changeArchive,'function');
  h.context.dirty=true;let called=false;h.context.api=async()=>{called=true;};
  await h.context.changeArchive('customer');assert.equal(called,false);assert.equal(h.context.project.id,'customer');
});
test('a delayed save response cannot reattach an archived id to the preserved draft',async()=>{
  const h=harness();
  const saveStart=source.indexOf('async function save(');
  vm.runInContext(source.slice(saveStart,source.indexOf('async function downloadDemo(',saveStart)),h.context);
  const archive=h.context.changeArchive('customer');
  h.context.project.headline='Senaste texten';h.context.markDirty();
  let finishSave;
  h.context.api=async()=>new Promise(resolve=>finishSave=resolve);
  const save=h.context.save(false);
  h.complete();await archive;
  finishSave({json:async()=>({id:'customer'})});await save;
  assert.equal(h.context.project.id,'');
  assert.equal(h.context.project.headline,'Senaste texten');
  assert.equal(h.context.dirty,true);
  assert.equal(h.entries.has('forslag-studio-selected-project'),false);
  assert.equal(JSON.parse(h.entries.get('draft')).id,'');
});
