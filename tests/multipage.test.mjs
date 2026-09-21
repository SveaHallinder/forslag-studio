import test from 'node:test';
import assert from 'node:assert/strict';
import * as renderer from '../public/render.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';

const root={name:'Acme',source:'https://acme.example/',headline:'Startsida',templateId:'studio',accent:'#123456',logo:'https://acme.example/logo.png',navigation:[{label:'Om oss',href:'https://acme.example/about'},{label:'Boka',href:'https://acme.example/booking'}],pages:[{name:'Other brand',source:'https://acme.example/about',headline:'Om företaget',templateId:'story',accent:'#ffffff',logo:'https://other.example/logo.png',description:'Original copy',cards:[{title:'Team',anchor:'team',image:'https://acme.example/team.jpg'}],pages:[{headline:'Nested'}]}]};

test('normalization keeps five flat pages, discards invalid sources and never nests pages',()=>{
 const p=renderer.normalizeProject({...root,pages:[null,{source:'javascript:alert(1)'},...Array.from({length:7},(_,i)=>({...root.pages[0],source:'https://acme.example/page-'+i}))]});
 assert.equal(p.pages?.length,5);
 assert.equal(p.pages[0].source,'https://acme.example/page-0');
 assert.equal(p.pages[0].pages,undefined);
 assert.equal(renderer.normalizeProject({name:'Old'}).pages,undefined);
});

test('customer links preserve subpage content and strip private page bookkeeping',async()=>{
 const input={...root,pages:[{...root.pages[0],id:'draft',images:[{url:'https://acme.example/unused.jpg'}],warnings:['Private note']}]};
 const decoded=await decodeProject(new URL(await encodeProject(input,'https://studio.example/demo.html')).hash);
 assert.equal(decoded.pages?.[0].description,'Original copy');
 assert.equal(decoded.pages[0].id,'');assert.deepEqual(decoded.pages[0].images,[]);assert.deepEqual(decoded.pages[0].warnings,[]);
});

test('multipage HTML contains safe page templates and a trusted standalone installer',()=>{
 const html=renderer.renderDemo({...root,pages:[{...root.pages[0],headline:'</template><script>attack()</script>'}]});
 assert.match(html,/data-demo-pages/);assert.match(html,/data-demo-page="1"/);assert.match(html,/installDemoNavigation/);
 assert.doesNotMatch(html,/<script>attack\(\)<\/script>/);
 assert.doesNotMatch(html,/other\.example\/logo\.png/);
 assert.equal(typeof renderer.installDemoNavigation,'function');
});

test('page links resolve only known imported routes, including relative source links',()=>{
 assert.equal(typeof renderer.resolveDemoRoute,'function');
 const pages=[root,...root.pages];
 assert.deepEqual(renderer.resolveDemoRoute('/about#team',root.source,pages),{page:1,anchor:'team'});
 assert.deepEqual(renderer.resolveDemoRoute('../',root.pages[0].source,pages),{page:0,anchor:''});
 assert.deepEqual(renderer.resolveDemoRoute('#team',root.pages[0].source,pages),{page:1,anchor:'team'});
 assert.equal(renderer.resolveDemoRoute('https://acme.example/booking',root.source,pages),null);
 assert.equal(renderer.resolveDemoRoute('https://elsewhere.example/about',root.source,pages),null);
 assert.equal(renderer.resolveDemoRoute('javascript:alert(1)',root.source,pages),null);
});

test('editor can request a subpage without changing the source project',()=>{
 const original=JSON.stringify(root),html=renderer.renderDemo(root,{pageSource:root.pages[0].source});
 assert.match(html,/data-demo-initial="1"/);
 assert.equal(JSON.stringify(root),original);
 const visible=html.split('<template')[0].split('<div data-demo-stage')[1];
 assert.match(visible,/Om företaget/);assert.doesNotMatch(visible,/<h1>Startsida<\/h1>/);
});

test('navigation leaves an unknown destination fragment on the original site',()=>{
 const link=href=>({href,dataset:{},attributes:{target:'_blank',title:'Original'},getAttribute(){return href;},closest(){return null;},matches(){return false;},removeAttribute(name){delete this.attributes[name];},setAttribute(name,value){this.attributes[name]=value;}});
 const links=[link('https://acme.example/about#join-form'),link('https://acme.example/about#team'),link('https://acme.example/about')];
 const templates=[['join-form'],['team']].map((ids,index)=>({dataset:{demoPage:String(index)},content:{querySelectorAll:()=>ids.map(id=>({id})),cloneNode:()=>({})}}));
 const stage={dataset:{demoInitial:'0'},replaceChildren(){},querySelectorAll:()=>links};
 const doc={querySelector:selector=>selector==='[data-demo-stage]'?stage:{textContent:JSON.stringify([root,...root.pages])},querySelectorAll:()=>templates,body:{dataset:{},style:{setProperty(){}}},addEventListener(){},removeEventListener(){}};
 renderer.installDemoNavigation(doc,{location:{href:'https://viewer.example/demo.html#d=payload'},addEventListener(){},removeEventListener(){}});
 assert.equal(links[0].href,'https://acme.example/about#join-form');
 assert.equal(links[0].attributes.target,'_blank');
 assert.equal(links[0].dataset.demoTarget,undefined);
 assert.equal(links[1].dataset.demoTarget,'1');
 assert.equal(links[1].dataset.demoAnchor,'team');
 assert.equal(links[1].attributes.target,undefined);
 assert.equal(links[2].dataset.demoTarget,'1');
 assert.equal(new URL(links[2].href).hash,'#d=payload');
});
