import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {importQualityIssues} from '../public/import-quality.mjs';

const broken={name:'Café Rosteriet',source:'https://www.cafe-rosteriet.se/',importedAt:'2026-09-29T12:00:00Z',description:'Meny och öppettider. '.repeat(300).trim(),cards:[],logo:''};

test('a malformed imported homepage reports its long introduction without changing source content',()=>{
 const before=JSON.stringify(broken),issues=importQualityIssues(broken);
 assert.equal(issues.length,1);assert.equal(issues[0].pageIndex,-1);
 assert.equal(issues[0].characters,broken.description.length);
 assert.equal(issues[0].source,broken.source);assert.equal(JSON.stringify(broken),before);
});
test('authored text-only drafts and short imported landing pages are not declared malformed',()=>{
 for(const project of [{...broken,importedAt:''},{...broken,source:''},{...broken,description:'En kort introduktion.'},{...broken,description:'x'.repeat(1799)}])assert.deepEqual(importQualityIssues(project),[]);
});
test('real content blocks clear the warning while empty placeholder cards do not',()=>{
 for(const card of [{title:'Meny'},{description:'Öppettider'},{image:'https://example.com/interior.jpg'}])assert.deepEqual(importQualityIssues({...broken,cards:[card]}),[]);
 assert.equal(importQualityIssues({...broken,cards:[{}]}).length,1);
});
test('malformed subpages identify their page without flagging a healthy homepage',()=>{
 const result=importQualityIssues({...broken,description:'Välkommen.',pages:[{...broken,name:'Meny',source:'https://www.cafe-rosteriet.se/meny'}]});
 assert.equal(result.length,1);assert.equal(result[0].pageIndex,0);assert.equal(result[0].name,'Meny');
});
test('absent or invalid project data is safe to inspect',()=>{
 for(const project of [undefined,null,{},[],{pages:[null,3]}])assert.deepEqual(importQualityIssues(project),[]);
});

const studioSource=readFileSync(new URL('../public/studio.mjs',import.meta.url),'utf8');
function exportHarness(project=broken){
 const elements=new Map(),downloads=[],notices=[];let requests=0;
 const context={project:structuredClone(project),pendingImportQualityAction:null,importQualityIssues,importBusy:false,
  $:id=>{if(!elements.has(id))elements.set(id,{open:false,listeners:{},addEventListener(type,callback){this.listeners[type]=callback;},showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();}});return elements.get(id);},
  toast:text=>notices.push(text),api:async()=>{requests++;return {blob:async()=>new Blob(['demo'])};},
  document:{createElement:()=>({click(){downloads.push(this.download);}})},URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout(){}};
 vm.createContext(context);
 vm.runInContext(studioSource.slice(studioSource.indexOf('function importQualitySummary('),studioSource.indexOf('function updateTitle('))+'\n'+studioSource.slice(studioSource.indexOf('async function downloadDemo('),studioSource.indexOf('async function share(')),context);
 return {context,elements,downloads,notices,requests:()=>requests};
}
test('downloading a malformed import opens review before any export request',async()=>{
 const h=exportHarness();await h.context.downloadDemo();
 assert.equal(h.requests(),0);assert.equal(h.downloads.length,0);assert.equal(h.elements.get('importQualityDialog').open,true);
 assert.match(h.elements.get('continueImportQuality').textContent,/ej färdiggranskad/);
 assert.equal(h.context.project.description,broken.description);
});
test('an explicit override downloads an unreviewed-labelled file and warns again next time',async()=>{
 const h=exportHarness();await h.context.downloadDemo();await h.context.pendingImportQualityAction();
 assert.equal(h.requests(),1);assert.match(h.downloads[0],/-ogranskad-designforslag\.html$/);assert.match(h.notices[0],/Ej färdiggranskad/);
 await h.context.downloadDemo();assert.equal(h.requests(),1);
});
test('changing the draft invalidates the pending export override',async()=>{
 const h=exportHarness();await h.context.downloadDemo();h.context.project.description+=' Authored edit';
 await h.context.pendingImportQualityAction();assert.equal(h.requests(),0);assert.match(h.notices[0],/ändrats/);
});
test('healthy or authored text-only pages still download normally',async()=>{
 const h=exportHarness({...broken,importedAt:''});await h.context.downloadDemo();
 assert.equal(h.requests(),1);assert.doesNotMatch(h.downloads[0],/-ogranskad-/);
});
test('closing the quality dialog cancels the pending action without changing the draft',async()=>{
 const h=exportHarness(),before=JSON.stringify(h.context.project);await h.context.downloadDemo();
 h.context.$('importQualityDialog').close();
 assert.equal(h.context.pendingImportQualityAction,null);assert.equal(h.requests(),0);assert.equal(JSON.stringify(h.context.project),before);
});
