import test from 'node:test';
import assert from 'node:assert/strict';
import {industryChecks,planCopyRefinements,applyCopyRefinements} from '../public/proposal-refinements.mjs';
const intro='Vi serverar kaffe och nybakat bröd i vårt café, med utrymme för både snabba besök och långa samtal. ';
const text=intro+'Espresso kostar 35 kr. Vi håller öppet måndag–fredag 08–17. '+('Alla detaljer kommer från företagets egen text och ska finnas kvar i förslaget. ').repeat(8);
const base={name:'Nord Café',headline:'Kaffe och nybakat',description:text,email:'hej@example.com',hero:'https://example.com/photo.jpg',cards:[],original:{headline:'Original',description:text},metadata:{keep:true}};
test('long introductions are shortened by moving exact original copy, never rewriting facts',()=>{
 const before=JSON.stringify(base),plan=planCopyRefinements(base);assert.equal(plan.changes.length,1);
 const next=applyCopyRefinements(base,plan);assert.ok(next.description.length<=320);assert.ok(next.cards[0].description.includes('35 kr'));assert.ok(next.cards[0].description.includes('08–17'));
 assert.equal((next.description+' '+next.cards[0].description).replace(/\s+/g,' ').trim(),text.replace(/\s+/g,' ').trim());assert.equal(JSON.stringify(base),before);assert.deepEqual(next.original,base.original);assert.deepEqual(next.metadata,base.metadata);
});
test('short copy, menus, incomplete prose and full card lists receive no automatic text edit',()=>{
 for(const description of ['Kort introduktion.',('Espresso 35 kr\nLatte 45 kr\n').repeat(30),'inga meningsgränser '.repeat(50)])assert.equal(planCopyRefinements({...base,description}).changes.length,0);
 assert.equal(planCopyRefinements({...base,cards:Array.from({length:40},()=>({title:'Befintligt'}))}).changes.length,0);
});
test('copy plans reject stale edits and unknown added fields',()=>{
 const plan=planCopyRefinements(base);assert.throws(()=>applyCopyRefinements({...base,headline:'Senaste ändring'},plan),/ändrades/);assert.throws(()=>applyCopyRefinements({...base,metadata:{keep:false}},plan),/ändrades/);
});
test('subpage copy uses its own destination and avoids anchor collisions',()=>{
 const input={...base,cards:[{title:'Befintlig',anchor:'fordjupning'}],pages:[{...base,name:'About',source:'https://example.com/about',navigation:[{label:'Reserved',href:'#fordjupning'}]}]};const next=applyCopyRefinements(input,planCopyRefinements(input));assert.notEqual(next.cards[0].anchor,'fordjupning');assert.notEqual(next.pages[0].cards[0].anchor,'fordjupning');assert.equal(next.pages[0].source,input.pages[0].source);
});
test('industry review gives cafe menu and visit guidance without adding fictional sections',()=>{
 const before=JSON.stringify(base),checks=industryChecks(base);assert.ok(checks.some(c=>c.help.includes('meny')));assert.ok(checks.some(c=>c.help.includes('adress')));assert.ok(!checks.some(c=>c.help.includes('öppettider')));assert.equal(JSON.stringify(base),before);
 const supplied={...base,address:'Torget 4',cards:[{title:'Meny',description:'Espresso 35 kr'}]};assert.equal(industryChecks(supplied).length,0);
});
test('consultants get services and evidence guidance without invented testimonials',()=>{
 const checks=industryChecks({name:'Klar Advokatbyrå',headline:'Juridisk rådgivning',description:'Vi hjälper restauranger och caféer med avtal.'});assert.ok(checks.some(c=>c.help.includes('tjänster')));assert.ok(checks.some(c=>c.help.includes('kundcase')));assert.ok(!checks.some(c=>c.help.includes('meny')));
});
test('unknown businesses get no guessed sector; supplied content and links satisfy sector checks',()=>{
 assert.deepEqual(industryChecks({name:'Acme',headline:'Välkommen'}),[]);
 assert.equal(industryChecks({name:'Nord Café',address:'Torget',navigation:[{label:'Menu',href:'https://example.com/menu'},{label:'Opening hours',href:'https://example.com/hours'}]}).length,0);
});

test('secondary mentions alone never classify a company as a customer industry',()=>{
 assert.deepEqual(industryChecks({name:'Acme',headline:'Välkommen',description:'Vi hjälper caféer och butiker med deras verksamhet.'}),[]);
});
test('generated section headings follow the source language while English and Romanian copy is preserved',()=>{
 for(const [name,description,heading]of [['North','We welcome you to our space for coffee and conversation, with our freshly baked bread every morning. '+'Our espresso costs 35 lei and we keep every original word. '.repeat(12),'About North'],['Nord','Noi vă invităm la cafea și conversații, pentru dimineți frumoase cu prieteni și familia noastră. '+'Noi păstrăm fiecare cuvânt din textul nostru pentru voi și pentru prietenii noștri. '.repeat(12),'Despre Nord']]){
  const next=applyCopyRefinements({name,description},planCopyRefinements({name,description}));assert.equal(next.cards[0].title,heading);assert.equal((next.description+' '+next.cards[0].description).replace(/\s+/g,' ').trim(),description.trim());
 }
});
