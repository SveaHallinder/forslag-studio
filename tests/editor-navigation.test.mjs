import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditorNavigation} from '../public/editor-navigation.mjs';
import {importLaunchChecks} from '../public/launch-checks.mjs';

function harness() {
  let focused;
  const nodes=new Map(),tabs=[];
  const node=(id,properties={})=>{
    const item={id,attributes:{},listeners:{},focus(){focused=this.id;},scrollIntoView(){this.scrolled=true;},setAttribute(key,value){this.attributes[key]=value;},getAttribute(key){return this.attributes[key];},addEventListener(type,listener){this.listeners[type]=listener;},...properties};
    nodes.set(id,item);return item;
  };
  for(const name of ['content','images','brand','details']){
    node(name+'Tab',{hidden:name!=='content'});
    const tab=node(name+'Button',{dataset:{tab:name}});tab.attributes['aria-controls']=name+'Tab';tabs.push(tab);
  }
  const root={querySelectorAll:()=>tabs,getElementById:id=>nodes.get(id),querySelector:selector=>nodes.get(selector)};
  return {navigation:createEditorNavigation(root),nodes,tabs,node,get focused(){return focused;}};
}

test('tabs support wrapping arrow keys and Home/End with one keyboard stop',()=>{
  const h=harness(),press=(index,key)=>h.tabs[index].listeners.keydown({key,preventDefault(){}});
  press(0,'ArrowLeft');assert.equal(h.focused,'detailsButton');
  press(3,'ArrowRight');assert.equal(h.focused,'contentButton');
  press(0,'End');assert.equal(h.focused,'detailsButton');
  press(3,'Home');assert.equal(h.focused,'contentButton');
  assert.deepEqual(h.tabs.map(tab=>tab.tabIndex),[0,-1,-1,-1]);
  assert.equal(h.nodes.get('contentTab').hidden,false);
  for(const name of ['images','brand','details'])assert.equal(h.nodes.get(name+'Tab').hidden,true);
  assert.equal(h.navigation.select('missing'),false);
  assert.equal(h.tabs[0].getAttribute('aria-selected'),'true');
});

test('a review link reveals the actual relocated field and any collapsed parent',()=>{
  const h=harness(),disclosure={tagName:'DETAILS',open:false,parentElement:null};
  const field=h.node('accent',{closest:()=>h.nodes.get('brandTab'),parentElement:disclosure});
  assert.equal(h.navigation.reveal('content','accent'),true);
  assert.equal(h.nodes.get('brandTab').hidden,false);
  assert.equal(h.nodes.get('contentTab').hidden,true);
  assert.equal(disclosure.open,true);assert.equal(h.focused,'accent');assert.equal(field.scrolled,true);
  assert.equal(h.navigation.reveal('content','missing'),false);
});

test('hidden upload inputs route to their visible label, and font warnings use a real field',()=>{
  const h=harness();
  h.node('logoUpload',{hidden:true,closest:()=>h.nodes.get('imagesTab')});
  const label=h.node('label[for="logoUpload"]');
  assert.equal(h.navigation.reveal('content','logoUpload'),true);
  assert.equal(h.nodes.get('imagesTab').hidden,false);
  assert.equal(h.focused,label.id);assert.equal(label.tabIndex,0);
  const warning=importLaunchChecks({warnings:['Typsnitt kunde inte bedömas säkert.']}).find(check=>check.id==='branding');
  assert.equal(warning.field,'headingFont');
});
