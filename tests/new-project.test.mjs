import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {normalizeProject} from '../public/render.mjs';
import {isStarterDraft} from '../public/workspace-flow.mjs';

const source=readFileSync(new URL('../public/studio.mjs',import.meta.url),'utf8');

function harness(dirty=false) {
  const elements=new Map(),drafts=new Map(),notices=[];
  const context={project:normalizeProject({id:'customer',name:'Kund AB',headline:'Min senaste rubrik'}),dirty,projectLoadSequence:0,normalizeProject,isStarterDraft,importBusy:false,archiveBusy:false,
    confirm(){throw new Error('Native confirmation is unavailable in the embedded browser.');},
    $:id=>{
      if(!elements.has(id))elements.set(id,{value:id==='sourceUrl'?'https://customer.example/':'',open:false,returnValue:'',focused:false,listeners:{},
        addEventListener(type,callback){this.listeners[type]=callback;},click(){return this.listeners.click?.();},focus(){this.focused=true;},
        showModal(){this.open=true;},close(value){if(value!==undefined)this.returnValue=value;this.open=false;this.listeners.close?.();},
      });
      return elements.get(id);
    },
    showEditor(){context.editorVisible=true;},fillEditor(){},refreshProjects:async()=>{},
    markDirty(){context.dirty=true;drafts.set('draft',JSON.stringify(context.project));},
    toast:message=>notices.push(message),
    workspaceFlow:{select(mode,focus){context.step=mode;if(focus)context.$(mode==='source'?'sourceUrl':'name').focus();}},socialStudio:{open(){context.socialOpen=true;}},
  };
  vm.createContext(context);
  const guardStart=source.indexOf('let pendingDraftConfirmation;');
  const guardEnd=source.indexOf('function importQualitySummary(',guardStart);
  vm.runInContext(source.slice(guardStart,guardEnd),context);
  const newStart=source.indexOf('async function startProject(');
  vm.runInContext(source.slice(newStart,source.indexOf("$('showProjects').addEventListener",newStart)),context);
  const dashboardStart=source.indexOf("$('dashboardNew').addEventListener");
  vm.runInContext(source.slice(dashboardStart,source.indexOf('\n',dashboardStart)),context);
  if(dirty)context.markDirty();
  return {context,drafts,notices,click:id=>context.$(id).click(),dialog:context.$('draftChangeDialog')};
}

test('New proposal immediately opens a blank editor from a saved project',async()=>{
  const h=harness();await h.click('newProject');
  assert.equal(h.context.project.id,'');assert.equal(h.context.project.name,'Nytt förslag');
  assert.equal(h.context.editorVisible,true);assert.equal(h.context.$('sourceUrl').value,'');assert.equal(h.context.$('sourceUrl').focused,true);
  assert.equal(JSON.parse(h.drafts.get('draft')).name,'Nytt förslag');assert.equal(h.dialog.open,false);
});

test('New proposal works without native confirm and waits before replacing an unsaved draft',async()=>{
  const h=harness(true),original=h.context.project,draft=h.drafts.get('draft');
  const action=h.click('newProject');
  assert.equal(h.dialog.open,true);assert.equal(h.context.project,original);assert.equal(h.drafts.get('draft'),draft);
  h.click('confirmDraftChange');await action;
  assert.equal(h.context.project.id,'');assert.equal(h.context.project.name,'Nytt förslag');assert.equal(h.dialog.open,false);
});

test('cancelling or pressing Escape preserves all unsaved content',async()=>{
  const h=harness(true),original=h.context.project,draft=h.drafts.get('draft');
  const action=h.click('newProject');h.dialog.close();await action;
  assert.equal(h.context.project,original);assert.equal(h.drafts.get('draft'),draft);assert.equal(h.context.dirty,true);
  const next=h.click('newProject');h.click('confirmDraftChange');await next;
  assert.equal(h.context.project.name,'Nytt förslag');
});

test('the project overview New proposal button uses the same working draft guard',async()=>{
  const h=harness(true),action=h.click('dashboardNew');
  assert.equal(h.dialog.open,true);h.click('confirmDraftChange');await action;
  assert.equal(h.context.project.name,'Nytt förslag');assert.equal(h.context.editorVisible,true);
});

test('a delayed confirmation cannot discard content changed while the dialog was open',async()=>{
  const h=harness(true),original=h.context.project;
  const action=h.click('newProject');original.headline='Ny rubrik under väntan';h.context.markDirty();
  const draft=h.drafts.get('draft');h.click('confirmDraftChange');await action;
  assert.equal(h.context.project,original);assert.equal(h.drafts.get('draft'),draft);assert.match(h.notices[0],/ändrats/);
});

test('a click during startup cannot replace the loading project',async()=>{
  const h=harness();h.context.project=undefined;await h.click('newProject');
  assert.equal(h.context.project,undefined);assert.equal(h.dialog.open,false);assert.match(h.notices[0],/öppnas/);
});

test('home creation cards share the same draft guard and open the intended task',async()=>{
  for(const [id,step,social]of [['startWebsite','source',false],['startSocial','source',true],['startBlank','design',false]]){
    const h=harness(true),original=h.context.project,action=h.click(id);assert.equal(h.dialog.open,true);assert.equal(h.context.project,original);
    h.click('confirmDraftChange');await action;assert.equal(h.context.step,step);assert.equal(!!h.context.socialOpen,social);
  }
});
test('an untouched starter does not prompt again, while an active import prevents creating another draft',async()=>{
  const h=harness(true);h.context.project=normalizeProject({name:'Nytt förslag',headline:'Här börjar nästa kunds hemsida.'});await h.click('startWebsite');assert.equal(h.dialog.open,false);
  const original=h.context.project;h.context.importBusy=true;await h.click('startBlank');assert.equal(h.context.project,original);assert.match(h.notices.at(-1),/Vänta/);
});
