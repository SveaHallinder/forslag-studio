import test from 'node:test';
import assert from 'node:assert/strict';
import {createSocialFlow,socialIntakeIssue} from '../public/social-flow.mjs';

test('the guided intake validates real profiles before company details',()=>{
  for(const links of ['', 'https://example.com/', 'javascript:alert(1)', Array(4).fill('https://instagram.com/cafe/').join('\n')])assert.equal(socialIntakeIssue({links},'company').field,'socialLinks');
  assert.equal(socialIntakeIssue({links:'https://instagram.com/cafe/'},'company'),undefined);
  assert.equal(socialIntakeIssue({links:'https://instagram.com/cafe/'}).field,'socialName');
  assert.equal(socialIntakeIssue({links:'https://instagram.com/cafe/',name:'Café'}).field,'socialBio');
  assert.equal(socialIntakeIssue({links:'https://instagram.com/cafe/',name:'Café',bio:'Våra egna ord.'}),undefined);
});
function harness(){
  let data={},focused,changed=0;const nodes=new Map();
  const node=id=>{const n={id,dataset:{},attrs:{},listeners:{},classList:{add(){},remove(){}},focus(){focused=id;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,fn){this.listeners[k]=fn;}};nodes.set(id,n);return n;};
  for(const id of ['socialLinks','socialName','socialBio','socialAddPhotos','socialBack','socialNext','socialCreate','socialStatus'])node(id);
  const buttons=['profile','company','images'].map(name=>{const n=node(name);n.dataset.socialStep=name;return n;});
  const panels=buttons.map(button=>({dataset:{socialPanel:button.dataset.socialStep}}));
  const root={dataset:{},querySelector:id=>nodes.get(id.slice(1)),querySelectorAll:selector=>selector==='[data-social-step]'?buttons:panels};
  const flow=createSocialFlow({root,getData:()=>data,onChange:()=>changed++});
  return {flow,root,nodes,buttons,panels,set data(value){data=value;},get focused(){return focused;},get changed(){return changed;}};
}
test('stages reveal only the relevant fields and preserve data while moving back',()=>{
  const h=harness();h.flow.select('profile');h.nodes.get('socialNext').listeners.click();assert.equal(h.flow.current,'profile');assert.equal(h.focused,'socialLinks');
  h.data={links:'https://instagram.com/cafe/'};h.nodes.get('socialNext').listeners.click();assert.equal(h.flow.current,'company');assert.equal(h.focused,'socialName');
  h.nodes.get('socialNext').listeners.click();assert.equal(h.flow.current,'company');assert.equal(h.focused,'socialName');
  h.data={links:'https://instagram.com/cafe/',name:'Café',bio:'Våra egna ord.'};h.nodes.get('socialNext').listeners.click();assert.equal(h.flow.current,'images');assert.equal(h.nodes.get('socialCreate').hidden,false);assert.equal(h.nodes.get('socialNext').hidden,true);
  assert.deepEqual(h.panels.map(panel=>panel.hidden),[true,true,false]);assert.equal(h.buttons[2].attrs['aria-current'],'step');
  h.nodes.get('socialBack').listeners.click();assert.equal(h.flow.current,'company');assert.equal(h.flow.select('unknown'),false);
});
test('jumping to images still focuses the first missing field',()=>{
  const h=harness();h.flow.select('profile');h.buttons[2].listeners.click();assert.equal(h.flow.current,'profile');assert.equal(h.focused,'socialLinks');
  h.data={links:'https://instagram.com/cafe/',name:'Café'};h.buttons[2].listeners.click();assert.equal(h.flow.current,'company');assert.equal(h.focused,'socialBio');
});
