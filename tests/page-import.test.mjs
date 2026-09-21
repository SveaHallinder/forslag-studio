import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/browser-api.mjs',import.meta.url),'utf8');
const block=source.slice(source.indexOf('async function importCompany('),source.indexOf('function dataURL('));
function harness(navigation,fail=[]){
  const calls=[],root={source:'https://example.com/',navigation,warnings:[]};
  const context={URL,console:{warn(){}},readCompany:async url=>{calls.push(url);if(calls.length===1)return structuredClone(root);if(fail.includes(url))throw new Error('Unavailable');return {source:url,headline:'Original '+url};}};
  vm.createContext(context);vm.runInContext(block,context);return {context,calls};
}
test('imports at most five unique menu pages from the same site',async()=>{
 const nav=[{label:'Start',href:'#start'},{label:'External',href:'https://other.com/a'},{label:'PDF',href:'/menu.pdf'},...Array.from({length:7},(_,i)=>({label:'Page '+i,href:'/page-'+i})),{label:'Duplicate',href:'/page-0/#text'}];
 const h=harness(nav),p=await h.context.importCompany('https://example.com/');
 assert.equal(p.pages.length,5);assert.equal(h.calls.length,6);assert.equal(p.pages[0].name,'Page 0');assert.match(p.warnings.join(' '),/fem/i);
});
test('failed subpages keep homepage and original menu destinations',async()=>{
 const nav=[{label:'About',href:'https://example.com/about'},{label:'Contact',href:'https://example.com/contact'}],h=harness(nav,['https://example.com/about']);
 const p=await h.context.importCompany('https://example.com/');assert.equal(p.pages.length,1);assert.equal(p.pages[0].name,'Contact');assert.equal(p.navigation[0].href,nav[0].href);assert.match(p.warnings.join(' '),/About/);
});
test('homepage-only selection never requests subpages',async()=>{
 const h=harness([{label:'About',href:'/about'}]),p=await h.context.importCompany('https://example.com/',false);assert.equal(p.pages.length,0);assert.equal(h.calls.length,1);
});

test('redirected pages and original section fragments link to the imported content',async()=>{
 const context={URL,console:{warn(){}},readCompany:async url=>url==='https://example.com/'?{source:url,warnings:[],sourceAnchors:{intro:'section-1'},navigation:[{label:'Team',href:'https://example.com/about#people'}]}:{source:'https://example.com/team',sourceAnchors:{people:'section-2'},cards:[{title:'Home',href:'https://example.com/#intro'}],warnings:[]}};
 vm.createContext(context);vm.runInContext(block,context);
 const p=await context.importCompany('https://example.com/');assert.equal(p.navigation[0].href,'https://example.com/team#section-2');assert.equal(p.pages[0].cards[0].href,'https://example.com/#section-1');assert.equal(p.sourceAnchors,undefined);assert.equal(p.pages[0].sourceAnchors,undefined);
});
