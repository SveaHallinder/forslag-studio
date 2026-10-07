import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/studio.mjs',import.meta.url),'utf8');
const block=source.slice(source.indexOf('const importStudio=createImportStudio('),source.indexOf('const connectionsStudio='));
function harness(){
 let options,resolveSave;const saved=new Promise(resolve=>{resolveSave=resolve;});
 const original={id:'old',name:'Old business',headline:'Unsaved copy'},next={name:'New business',headline:'New copy'};
 const context={project:original,dirty:true,importBusy:false,projectLoadSequence:0,createImportStudio:opts=>{options=opts;return {};},$:()=>({value:'https://example.com/'}),toast(){},save:async()=>{await saved;context.dirty=false;},workbench:{captureOriginal(){}},fillEditor(){},markDirty(){context.dirty=true;},showEditor(){},refreshProjects:async()=>{}};
 vm.createContext(context);vm.runInContext(block,context);
 return {context,original,next,create:(current=()=>true)=>options.onCreate(next,original,JSON.stringify(original),current),resolveSave};
}
test('HTML reserve import saves the current draft before opening a new project',async()=>{const h=harness(),pending=h.create();assert.equal(h.context.project,h.original);h.resolveSave();await pending;assert.equal(h.context.project,h.next);assert.equal(h.context.dirty,true);});
test('an edited unnamed project is preserved even when it has no saved id',async()=>{const h=harness();h.original.id='';h.original.name='Nytt förslag';const pending=h.create();assert.equal(h.context.project,h.original);h.resolveSave();await pending;assert.equal(h.context.project,h.next);});
test('closing HTML import during a pending save keeps the current company',async()=>{const h=harness();let current=true;const pending=h.create(()=>current);current=false;h.resolveSave();await assert.rejects(pending,/Importen stängdes/);assert.equal(h.context.project,h.original);});
test('switching company while the HTML import saves never overwrites the new selection',async()=>{const h=harness(),pending=h.create(),selected={id:'selected',name:'Selected'};h.context.project=selected;h.resolveSave();await assert.rejects(pending,/ändrades under sparningen/);assert.equal(h.context.project,selected);});
test('an active website import prevents a second HTML import from replacing it',async()=>{const h=harness();h.context.importBusy=true;await assert.rejects(h.create(),/import pågår/);assert.equal(h.context.project,h.original);});
