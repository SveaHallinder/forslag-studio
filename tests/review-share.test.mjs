import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { normalizeProject } from '../public/render.mjs';
import { assessProject } from '../public/project-tools.mjs';
import {importQualityIssues} from '../public/import-quality.mjs';
const source=readFileSync(new URL('../public/studio.mjs',import.meta.url),'utf8');
const block=source.slice(source.indexOf('async function share('),source.indexOf("document.querySelectorAll('[data-field]')",source.indexOf('async function share(')));
function harness(){
 let release,encoded;
 const pending=new Promise(r=>release=r),elements=new Map();
 const context={project:normalizeProject({name:'Acme',headline:'Godkänd rubrik'}),config:{},normalizeProject,assessProject,importQualityIssues,requestImportQualityReview:()=>false,location:{origin:'http://localhost'},
  $:id=>{if(!elements.has(id))elements.set(id,{dataset:{},showModal(){}});return elements.get(id);},save:()=>pending,
  api:async()=>({json:async()=>({publicBase:'https://demo.example',hostingStatus:'public'})}),
  encodeProject:async p=>{encoded=p;return 'https://demo.example/#d=test';},toast(){}};
 vm.createContext(context);vm.runInContext(block,context);return {context,release,getEncoded:()=>encoded};
}
test('sharing uses the reviewed content even if the editor changes during saving',async()=>{
 const h=harness(),pending=h.context.share();
 h.context.project.headline='';h.context.project.name='Edited after review';h.release({});await pending;
 assert.equal(h.getEncoded().headline,'Godkänd rubrik');
 assert.equal(h.getEncoded().name,'Acme');
});
test('switching customers during saving cancels the share',async()=>{
 const h=harness(),pending=h.context.share();h.context.project=normalizeProject({name:'Other',headline:'Other'});h.release({});await pending;
 assert.equal(h.getEncoded(),undefined);
});
