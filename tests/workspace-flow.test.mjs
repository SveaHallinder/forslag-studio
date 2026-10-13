import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkspaceFlow,isStarterDraft} from '../public/workspace-flow.mjs';
import {normalizeProject} from '../public/render.mjs';

const starter={name:'Nytt förslag',headline:'Här börjar nästa kunds hemsida.'};
test('only a genuinely untouched starter can bypass the discard confirmation',()=>{
  assert.equal(isStarterDraft(normalizeProject(starter)),true);
  for(const changed of [{name:'Mitt företag'},{description:'En egen text.'},{hero:'https://example.com/photo.jpg'},{accent:'#123456'},{templateId:'cafe'},{id:'saved'},{cards:[{title:'En tjänst'}]},{source:'https://example.com/'}])assert.equal(isStarterDraft({...starter,...changed}),false,JSON.stringify(changed));
});

function harness(){
  let fit=0,review=0,focused;
  const nodes=new Map(),listeners={};
  const node=id=>{const n={id,dataset:{},attributes:{},listeners:{},focus(){focused=id;},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},addEventListener(k,fn){this.listeners[k]=fn;}};nodes.set(id,n);return n;};
  for(const id of ['editorView','editorViewButton','previewViewButton','workflowHelp','importDisclosure','sourceUrl','name','sourceContinue','focusPreview'])node(id);
  const summary=node('summary');nodes.get('importDisclosure').querySelector=()=>summary;
  const steps=['source','design','review'].map(name=>{const n=node(name);n.dataset.workflowStep=name;return n;});
  const classes=new Set(),workspace={classList:{contains:name=>classes.has(name),remove:name=>classes.delete(name)}};
  const menus=['project','settings','design'].map(id=>{const menu=node(id);menu.open=false;menu.querySelector=()=>node(id+'Summary');return menu;});
  let dialogOpen=false;
  const root={getElementById:id=>nodes.get(id),querySelectorAll:selector=>selector==='[data-workflow-step]'?steps:menus,querySelector:selector=>selector==='.workspace'?workspace:selector==='dialog[open]'?(dialogOpen?{}:null):menus.find(menu=>menu.open),addEventListener:(k,fn)=>listeners[k]=fn};
  return {flow:createWorkspaceFlow({root,onFit:()=>fit++,onReview:()=>review++}),nodes,steps,menus,listeners,classes,set dialogOpen(value){dialogOpen=value;},get focused(){return focused;},get fit(){return fit;},get review(){return review;}};
}
test('workflow reveals one task and a single current step, then reviews without losing the active view',()=>{
  const h=harness();h.flow.select('source',true);
  assert.equal(h.focused,'sourceUrl');assert.equal(h.nodes.get('importDisclosure').open,true);
  h.nodes.get('sourceContinue').listeners.click();
  assert.equal(h.nodes.get('editorView').dataset.step,'design');assert.equal(h.focused,'name');assert.equal(h.nodes.get('importDisclosure').open,false);
  assert.deepEqual(h.steps.map(s=>s.attributes['aria-current']),[undefined,'step',undefined]);
  h.steps[2].listeners.click();assert.equal(h.review,1);assert.equal(h.nodes.get('editorView').dataset.step,'design');
  assert.equal(h.flow.select('missing'),false);
});
test('mobile view switches the same inspector and preview without changing the workflow or data',()=>{
  const h=harness();h.flow.select('design');h.nodes.get('previewViewButton').listeners.click();
  assert.equal(h.nodes.get('editorView').dataset.step,'design');assert.equal(h.nodes.get('editorView').dataset.view,'preview');
  assert.equal(h.nodes.get('previewViewButton').attributes['aria-pressed'],'true');assert.equal(h.nodes.get('editorViewButton').attributes['aria-pressed'],'false');
  h.nodes.get('editorViewButton').listeners.click();assert.equal(h.nodes.get('editorView').dataset.view,'edit');assert.equal(h.fit,3);
  assert.equal(h.flow.view('missing'),false);
});
test('leaving the expanded preview also restores the inspector and source form',()=>{
  const h=harness();h.classes.add('preview-focus');h.flow.select('source');
  assert.equal(h.classes.has('preview-focus'),false);assert.equal(h.nodes.get('focusPreview').attributes['aria-pressed'],'false');assert.equal(h.nodes.get('importDisclosure').open,true);
});
test('menus dismiss on outside clicks and actions, and opening one closes the others',()=>{
  const h=harness(),[project,settings,design]=h.menus;
  const click=(menu,part)=>h.listeners.click({target:{closest:selector=>selector.includes('.project-menu')?menu:selector===part?{}:null}});
  settings.open=true;click(project,'summary');assert.equal(settings.open,false);
  project.open=true;click(design,'summary');assert.equal(project.open,false);
  design.open=true;click(design,'input');assert.equal(design.open,true);
  click(design,'button');assert.equal(design.open,false);
  settings.open=true;click(null,null);assert.equal(settings.open,false);
});
test('Escape returns focus to settings without closing a dialog or the expanded preview',()=>{
  const h=harness(),settings=h.menus[1];let prevented=false;
  const event={key:'Escape',preventDefault(){prevented=true;}};
  h.classes.add('preview-focus');settings.open=true;h.listeners.keydown(event);
  assert.equal(settings.open,false);assert.equal(prevented,true);assert.equal(h.focused,'settingsSummary');assert.equal(h.classes.has('preview-focus'),true);
  settings.open=true;h.dialogOpen=true;prevented=false;h.listeners.keydown(event);
  assert.equal(settings.open,true);assert.equal(prevented,false);
});
