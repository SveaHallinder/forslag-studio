import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

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
