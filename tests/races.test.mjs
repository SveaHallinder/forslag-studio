import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { normalizeProject } from '../public/render.mjs';
import {importQualityIssues} from '../public/import-quality.mjs';

const source = readFileSync(new URL('../public/studio.mjs', import.meta.url), 'utf8');
const saveSource = source.slice(source.indexOf('async function save('), source.indexOf('async function downloadDemo('));
const importSource = source.slice(source.indexOf("$('importButton').addEventListener('click',"), source.indexOf("window.addEventListener('beforeunload'"));

function harness() {
  const elements = new Map();
  const drafts = new Map();
  let resolveRequest;
  const pending = new Promise(resolve => { resolveRequest = resolve; });
  const context = {
    project: normalizeProject({id:'company-a', name:'Company A'}),
    dirty: false, importBusy: false, draftKey: 'draft',
    $: id => {
      if (!elements.has(id)) elements.set(id, {
        value: id === 'sourceUrl' ? 'https://example.com' : '',
        addEventListener(type, callback) { this[type] = callback; },
        focus() {},
      });
      return elements.get(id);
    },
    api: () => pending,
    normalizeProject,
    importQualityIssues,importQualitySummary:()=>'',renderImportQuality(){},
    workbench:{captureOriginal(){}},
    confirmDraftChange: async () => true,
    refreshProjects: async () => {},
    fillEditor() {},
    toast() {},
    localStorage: {
      removeItem: key => drafts.delete(key),
      setItem: (key, value) => drafts.set(key, value),
    },
    markDirty() {
      context.dirty = true;
      drafts.set(context.draftKey, JSON.stringify(context.project));
    },
  };
  vm.createContext(context);
  vm.runInContext(saveSource + '\n' + importSource, context);
  return {
    context, drafts,
    startImport: () => elements.get('importButton').click(),
    complete: data => resolveRequest({json: async () => data}),
  };
}

test('a pending save cannot assign its project id to a newly selected project', async () => {
  const h = harness();
  const pendingSave = h.context.save(false);
  const selected = normalizeProject({id:'company-b', name:'Company B', headline:'Unsaved B edit'});
  h.context.project = selected;
  h.context.markDirty();
  const draft = h.drafts.get('draft');
  h.complete({id:'company-a', url:'/demo/company-a'});
  await pendingSave;
  assert.equal(h.context.project, selected);
  assert.equal(selected.id, 'company-b');
  assert.equal(h.context.dirty, true);
  assert.equal(h.drafts.get('draft'), draft);
});

test('a pending import preserves a subsequently selected project and its draft', async () => {
  const h = harness();
  const pendingImport = h.startImport();
  const selected = normalizeProject({id:'company-b', name:'Company B'});
  h.context.project = selected;
  h.context.markDirty();
  const draft = h.drafts.get('draft');
  h.complete({name:'Imported company', headline:'Imported headline'});
  await pendingImport;
  assert.equal(h.context.project, selected);
  assert.equal(h.drafts.get('draft'), draft);
  assert.equal(h.context.importBusy, false);
});

test('a pending import preserves edits made to the original project', async () => {
  const h = harness();
  const original = h.context.project;
  const pendingImport = h.startImport();
  original.headline = 'Headline edited while importing';
  h.context.markDirty();
  const draft = h.drafts.get('draft');
  h.complete({name:'Imported company', headline:'Imported headline'});
  await pendingImport;
  assert.equal(h.context.project, original);
  assert.equal(h.context.project.headline, 'Headline edited while importing');
  assert.equal(h.drafts.get('draft'), draft);
});

test('an import without intervening edits still replaces the project and saves its draft', async () => {
  const h = harness();
  const pendingImport = h.startImport();
  h.complete({name:'Imported company', headline:'Imported headline'});
  await pendingImport;
  assert.equal(h.context.project.name, 'Imported company');
  assert.equal(h.context.project.headline, 'Imported headline');
  assert.equal(h.context.dirty, true);
  assert.equal(JSON.parse(h.drafts.get('draft')).name, 'Imported company');
  assert.equal(h.context.importBusy, false);
});

test('importing a company keeps the chosen template', async () => {
  const h = harness();
  h.context.project.templateId = 'studio';
  const pendingImport = h.startImport();
  h.complete({name:'Imported company', headline:'Imported headline'});
  await pendingImport;
  assert.equal(h.context.project.templateId, 'studio');
  assert.equal(JSON.parse(h.drafts.get('draft')).templateId, 'studio');
});

test('a rejected empty import preserves the current project and its draft',async()=>{
  const h=harness();const original=h.context.project;h.context.markDirty();
  const draft=h.drafts.get('draft');
  h.context.api=async()=>{throw new Error('Hemsidan gav inget läsbart innehåll.');};
  await h.startImport();
  assert.equal(h.context.project,original);assert.equal(h.drafts.get('draft'),draft);
  assert.equal(h.context.dirty,true);assert.equal(h.context.importBusy,false);
  assert.match(h.context.$('importStatus').textContent,/inget läsbart/);
});

test('import cannot start before the initial project has loaded',async()=>{
  const h=harness();let calls=0;h.context.project=undefined;
  h.context.api=async()=>{calls++;return {json:async()=>({name:'Too early'})};};
  await h.startImport();
  assert.equal(calls,0);
  assert.equal(h.context.project,undefined);
});

test('recovery saves authored content before importing a separate project with the chosen design',async()=>{
  const h=harness(),calls=[];h.context.project.source='https://example.com';h.context.project.templateId='studio';h.context.project.headline='My authored headline';h.context.markDirty();
  const original=h.context.project,before=JSON.stringify(original);let saved;
  h.context.api=async(path,body)=>{calls.push(path);if(path==='/api/save'){saved=JSON.stringify(body);return {json:async()=>({id:'company-a'})};}return {json:async()=>({id:'must-not-reuse',name:'Fresh company',headline:'Fresh source',cards:[{title:'Section'}]})};};
  await h.context.importCompany({recover:true});
  assert.deepEqual(calls,['/api/save','/api/import']);assert.equal(saved,before);assert.equal(original.headline,'My authored headline');
  assert.equal(h.context.project.id,'');assert.equal(h.context.project.templateId,'studio');assert.equal(h.context.project.headline,'Fresh source');
  assert.equal(JSON.parse(h.drafts.get('draft')).headline,'Fresh source');
});
test('recovery does not request an import when the current draft cannot be saved',async()=>{
  const h=harness(),calls=[];h.context.project.source='https://example.com';h.context.markDirty();
  const original=h.context.project,draft=h.drafts.get('draft');
  h.context.api=async path=>{calls.push(path);throw new Error('Webbläsarens lagring är full.');};
  await h.context.importCompany({recover:true});
  assert.deepEqual(calls,['/api/save']);assert.equal(h.context.project,original);assert.equal(h.drafts.get('draft'),draft);assert.equal(h.context.dirty,true);
});
test('recovery keeps new edits made while the backup save is pending',async()=>{
  const h=harness();h.context.project.source='https://example.com';let calls=0;
  const api=h.context.api;h.context.api=(...args)=>{calls++;return api(...args);};
  const pending=h.context.importCompany({recover:true});h.context.project.headline='Latest edit';h.context.markDirty();
  const draft=h.drafts.get('draft');h.complete({id:'company-a'});await pending;
  assert.equal(calls,1);assert.equal(h.context.project.headline,'Latest edit');assert.equal(h.drafts.get('draft'),draft);assert.equal(h.context.dirty,true);
});
test('a failed recovery fetch leaves the authored version open and saved',async()=>{
  const h=harness();h.context.project.source='https://example.com';h.context.project.headline='My saved edits';h.context.markDirty();
  const original=h.context.project;let saved;
  h.context.api=async(path,body)=>{if(path==='/api/save'){saved=JSON.parse(JSON.stringify(body));return {json:async()=>({id:'company-a'})};}throw new Error('Hemsidan kunde inte hämtas.');};
  await h.context.importCompany({recover:true});
  assert.equal(h.context.project,original);assert.equal(saved.headline,'My saved edits');assert.equal(h.context.project.headline,'My saved edits');assert.equal(h.context.project.id,saved.id);
  assert.equal(h.context.importBusy,false);assert.match(h.context.$('importStatus').textContent,/kunde inte hämtas/);
});
