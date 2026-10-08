import test from 'node:test';
import assert from 'node:assert/strict';
import * as projectTools from '../public/project-tools.mjs';
const { assessProject, searchProjects, restoreProject } = projectTools;

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

test('project copies preserve all forty supported homepage blocks',()=>{
 const raw={name:'Acme',headline:'Hej',cards:Array.from({length:40},(_,i)=>({title:'Block '+i,anchor:'section-'+i})),navigation:[{label:'Sista',href:'#section-39'}]};
 const p=restoreProject(JSON.stringify(raw));assert.equal(p.cards.length,40);assert.deepEqual(p.navigation,raw.navigation);
 assert.throws(()=>restoreProject(JSON.stringify({...raw,cards:[...raw.cards,{title:'Too much'}]})),/bildkort/i);
});
test('menu edits trim values and preserve safe destinations without changing their input',()=>{
 assert.equal(typeof projectTools.prepareNavigation,'function');
 const items=[{label:' Kontakt ',href:' https://example.com/contact '},{label:'Tjänster',href:'#section-1'}],original=JSON.stringify(items);
 assert.deepEqual(projectTools.prepareNavigation(items),[{label:'Kontakt',href:'https://example.com/contact'},{label:'Tjänster',href:'#section-1'}]);
 assert.equal(JSON.stringify(items),original);assert.deepEqual(projectTools.prepareNavigation([]),[]);
});
test('invalid menu edits identify the row instead of silently dropping its link',()=>{
 assert.equal(typeof projectTools.prepareNavigation,'function');
 for(const href of ['javascript:alert(1)','data:text/html,hi','https://user:secret@example.com','/contact',''])assert.throws(()=>projectTools.prepareNavigation([{label:'Kontakt',href}]),/Menylänk 1/);
 assert.throws(()=>projectTools.prepareNavigation([{label:'',href:'https://example.com'}]),/Menylänk 1/);
 assert.throws(()=>projectTools.prepareNavigation(Array.from({length:13},()=>({label:'Hem',href:'#start'}))),/12/);
});

test('sharing catches links to removed blocks and unsafe CTA destinations',()=>{
 const raw={name:'Acme',headline:'Hej',navigation:[{label:'Borta',href:'#section-1'}],ctaHref:'javascript:alert(1)',cards:[{title:'Kvar',anchor:'section-2',href:'#missing'}]};
 const failed=assessProject(raw).filter(c=>c.blocking&&!c.ok);
 assert.ok(failed.some(c=>c.id==='navigation'));assert.ok(failed.some(c=>c.id==='cta'));assert.ok(failed.some(c=>c.id==='card-links'));assert.equal(failed.find(c=>c.id==='card-links').field,'card-href-0');
});
test('valid internal and original-site destinations pass review',()=>{
 const raw={name:'Acme',headline:'Hej',navigation:[{label:'Här',href:'#section-2'},{label:'Original',href:'https://example.com/about'}],ctaHref:'#start',cards:[{title:'Kvar',anchor:'section-2',href:'https://example.com/services'}]};
 assert.equal(assessProject(raw).some(c=>c.blocking&&!c.ok),false);
});
test('menu editor validates internal destinations against the current proposal',()=>{
 assert.throws(()=>projectTools.prepareNavigation([{label:'Borta',href:'#section-1'}],{cards:[]}),/Menylänk 1/);
 assert.deepEqual(projectTools.prepareNavigation([{label:'Kvar',href:'#section-2'}],{cards:[{title:'Kvar',anchor:'section-2'}]}),[{label:'Kvar',href:'#section-2'}]);
});

test('review points to the subpage containing an invalid headline or link',()=>{
 const raw={name:'Acme',headline:'Start',source:'https://example.com',pages:[{name:'Team',source:'https://example.com/team',headline:'',ctaHref:'#missing'}]};
 const failed=assessProject(raw).filter(c=>c.blocking&&!c.ok);
 assert.ok(failed.some(c=>c.id==='headline'&&c.pageIndex===0));assert.ok(failed.some(c=>c.id==='cta'&&c.pageIndex===0));assert.ok(failed.every(c=>c.label.startsWith('Team:')));
});
test('project backup rejects malformed subpages instead of silently losing them',()=>{
 const root={name:'Acme',headline:'Start'};
 for(const pages of [{},[null],[{name:'About',headline:'About',source:'javascript:alert(1)'}],Array.from({length:6},(_,i)=>({name:'Page',headline:'Page',source:'https://example.com/'+i}))])assert.throws(()=>restoreProject(JSON.stringify({...root,pages})),/undersid/i);
 const p=restoreProject(JSON.stringify({...root,pages:[{name:'About',headline:'About',source:'https://example.com/about',cards:[{title:'Team'}]}]}));assert.equal(p.pages[0].cards[0].title,'Team');
});
test('customer review rejects local forms and recognises an online form as a contact route',()=>{
 const base={name:'Café QA',headline:'Kaffe hela dagen.',requestForm:{kind:'contact',url:'http://localhost:4183/contact.html?form='+crypto.randomUUID()}};
 assert.ok(assessProject(base).some(c=>c.id==='form'&&c.blocking&&!c.ok));
 const online={...base,requestForm:{...base.requestForm,url:'https://studio.example.com/contact.html?form='+crypto.randomUUID()}};
 assert.equal(assessProject(online).some(c=>c.blocking&&!c.ok),false);assert.equal(assessProject(online).find(c=>c.id==='contact').ok,true);
});
test('restored project copies cannot send requests into the original project inbox',()=>{
 const url='https://studio.example.com/contact.html?form='+crypto.randomUUID(),raw={name:'QA',headline:'Start',requestForm:{url,kind:'contact'},ctaHref:url,navigation:[{label:'Kontakt',href:url},{label:'Hem',href:'#start'}],pages:[{name:'Om',headline:'Om oss',source:'https://cafe.example.com/about',ctaHref:url}]};
 const copy=restoreProject(JSON.stringify(raw));assert.equal(copy.requestForm,undefined);assert.equal(copy.ctaHref,'#kontakt');assert.equal(copy.pages[0].ctaHref,'#kontakt');assert.equal(copy.navigation.length,1);assert.equal(raw.requestForm.url,url);
});
