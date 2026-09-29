import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {installDemoNavigation} from '../public/render.mjs';

const source=readFileSync(new URL('../public/demo.mjs',import.meta.url),'utf8').replace(/^import .*\n/gm,'');
function harness(){
 const listeners={},pending=[],installed=[],style={textContent:''};
 const location=new URL('https://demo.example/demo.html?demo-page=1#d=old');
 const body={dataset:{},childNodes:[],replaceChildren(...nodes){this.childNodes=nodes;},setAttribute(){}};
 const document={body,querySelector:()=>style};
 const context={document,location,URL,window:{addEventListener:(name,fn)=>listeners[name]=fn},history:{replaceState:(state,title,url)=>{location.href=url.href;}},
  decodeProject:hash=>new Promise((resolve,reject)=>pending.push({hash,resolve,reject})),renderDemo:p=>p,
  DOMParser:class{parseFromString(p){return {title:p.name,querySelector:()=>({textContent:'CSS'}),body:{childNodes:[p.name],dataset:{},getAttribute:()=>''}};}},
  installDemoNavigation:()=>installed.push({name:document.title,page:location.searchParams.get('demo-page')})};
 vm.createContext(context);const initial=vm.runInContext('(async()=>{'+source+'})()',context);
 const navigate=hash=>{location.hash=hash;assert.equal(typeof listeners.hashchange,'function');return listeners.hashchange();};
 return {context,location,document,pending,installed,initial,navigate};
}

test('new shared payload renders without reload and keeps Back routing',async()=>{
 const h=harness();h.pending[0].resolve({name:'Old'});await h.initial;
 assert.equal(h.installed[0].page,'1');
 const changed=h.navigate('d=new');h.pending[1].resolve({name:'New'});await changed;
 assert.equal(h.document.title,'New');assert.equal(h.location.hash,'#d=new');assert.equal(h.location.searchParams.has('demo-page'),false);
 h.location.searchParams.set('demo-page','1');const back=h.navigate('d=old');h.pending[2].resolve({name:'Old'});await back;
 assert.equal(h.document.title,'Old');assert.equal(h.installed.at(-1).page,'1');
});

test('late decode success or failure cannot replace the newest shared payload',async()=>{
 for(const staleFails of [false,true]){
  const h=harness(),changed=h.navigate('d=new');h.pending[1].resolve({name:'Newest'});await changed;
  if(staleFails)h.pending[0].reject(new Error('Old decode failed'));else h.pending[0].resolve({name:'Stale'});
  await h.initial;assert.equal(h.document.title,'Newest');assert.deepEqual(h.document.body.childNodes,['Newest']);assert.equal(h.document.body.textContent,undefined);
 }
});


// Minimal DOM surface for the standalone route installer; both pages deliberately
// share an anchor so routing to the wrong page cannot pass by matching an id.
function routeHarness(){
 const listeners=new Map(),location=new URL('https://viewer.example/demo.html?demo-page=1#d=payload'),scrolled=[];
 const pages=[{source:'https://company.example/',title:'Startsida',imported:true,heroPosition:50},{source:'https://company.example/about',title:'Om oss',imported:true,heroPosition:50}];
 const makeLink=(parent,href)=>({parent,href,dataset:{},attributes:{href},
  getAttribute(name){return name==='href'?this.href:this.attributes[name];},
  setAttribute(name,value){this.attributes[name]=value;},removeAttribute(name){delete this.attributes[name];},
  matches(){return false;},closest(selector){if(selector==='a[data-demo-target]')return this.dataset.demoTarget?this:null;return selector.split(',').map(s=>s.trim()).includes('.'+this.parent)?{}:null;}});
 const templates=pages.map((page,index)=>({dataset:{demoPage:String(index)},content:{
  querySelectorAll:()=>[{id:'kontakt'},{id:index===0?'services':'team'}],
  cloneNode:()=>({index,links:['nav-links','mobile-links','ending-links'].map(parent=>makeLink(parent,'#kontakt')).concat(makeLink('section-copy',index===0?'#services':'#team'))})
 }}));
 const stage={dataset:{demoInitial:'1'},index:1,links:[],replaceChildren(node){this.index=node.index;this.links=node.links;},contains(link){return this.links.includes(link);},
  querySelectorAll(selector){return selector==='a[href]'?this.links:[{id:'kontakt',scrollIntoView:()=>scrolled.push(this.index)}];}};
 const doc={__headerNavigation:true,body:{dataset:{},style:{setProperty(){}}},
  querySelector:selector=>selector==='[data-demo-stage]'?stage:selector==='script[data-demo-pages]'?{textContent:JSON.stringify(pages)}:null,
  querySelectorAll:selector=>selector==='template[data-demo-page]'?templates:[],
  addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);}};
 const win={location,history:{pushState(state,title,url){location.href=url.href;}},addEventListener(){},removeEventListener(){},scrollTo(){}};
 installDemoNavigation(doc,win);
 const click=link=>{const event={target:link,preventDefault(){this.defaultPrevented=true;}};listeners.get('click')(event);return event;};
 return {doc,stage,location,scrolled,click};
}

test('mobile and footer source navigation return to the root anchor from an imported subpage',()=>{
 for(const parent of ['nav-links','mobile-links','ending-links']){
  const h=routeHarness(),link=h.stage.links.find(item=>item.parent===parent);
  assert.equal(h.stage.index,1);assert.equal(h.doc.title,'Om oss');
  assert.equal(link.dataset.demoTarget,'0',parent+' must target the root page');
  assert.equal(link.dataset.demoAnchor,'kontakt');
  const url=new URL(link.href);assert.equal(url.searchParams.get('demo-page'),'0');assert.equal(url.searchParams.get('demo-anchor'),'kontakt');assert.equal(url.hash,'#d=payload');
  assert.equal(h.click(link).defaultPrevented,true);assert.equal(h.stage.index,0);assert.equal(h.doc.title,'Startsida');
  assert.equal(h.location.searchParams.get('demo-page'),'0');assert.deepEqual(h.scrolled,[0]);
 }
});

test('an in-content fragment keeps its active subpage while shared menus target the homepage',()=>{
 const h=routeHarness(),link=h.stage.links.find(item=>item.parent==='section-copy');
 assert.equal(link.dataset.demoTarget,'1');assert.equal(link.dataset.demoAnchor,'team');
 const url=new URL(link.href);assert.equal(url.searchParams.get('demo-page'),'1');assert.equal(url.searchParams.get('demo-anchor'),'team');
});
