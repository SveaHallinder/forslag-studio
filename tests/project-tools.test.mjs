import test from 'node:test';
import assert from 'node:assert/strict';
import { assessProject, searchProjects, restoreProject } from '../public/project-tools.mjs';

test('empty starter cannot be mistaken for a customer-ready proposal',()=>{
 const checks=assessProject({name:'Nytt förslag',headline:'Här börjar nästa kunds hemsida.'});
 assert.equal(checks.filter(c=>c.blocking&&!c.ok).length,2);
});
test('a text-only proposal with a valid phone is allowed, with an image reminder',()=>{
 const checks=assessProject({name:'Acme',headline:'Kök som håller',phone:'+46 70 123 45 67'});
 assert.equal(checks.some(c=>c.blocking&&!c.ok),false);
 assert.equal(checks.find(c=>c.id==='contact').ok,true);
 assert.equal(checks.find(c=>c.id==='images').ok,false);
});
test('invalid email is flagged before normalization could hide it',()=>{
 const checks=assessProject({name:'Acme',headline:'Hej',email:'inte-en-mejladress'});
 assert.equal(checks.find(c=>c.id==='contact').ok,false);
});
test('project search is case-insensitive and does not mutate the source',()=>{
 const list=[{id:'1',name:'Åkers Bygg'},{id:'2',name:'VegaVista'}];
 assert.deepEqual(searchProjects(list,'  VEGA '),[list[1]]);
 assert.equal(list.length,2);
 assert.equal(searchProjects(list,'').length,2);
});
test('restoring a project copy never reuses its saved project id',()=>{
 const copy=restoreProject(JSON.stringify({id:'original',name:'Acme',headline:'Välkommen',cards:[{title:'Kök'}]}));
 assert.equal(copy.id,'');assert.equal(copy.name,'Acme');assert.equal(copy.cards.length,1);
});
test('restore rejects non-project JSON without making a fake empty proposal',()=>{
 for(const data of ['null','[]','{}','{"name":7}','not json'])assert.throws(()=>restoreProject(data),/projekt/i);
});
