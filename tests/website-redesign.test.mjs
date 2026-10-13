import test from 'node:test';
import assert from 'node:assert/strict';
import {copyLead,websiteSectionRole,websiteContactDetails} from '../public/website-redesign.mjs';
import {renderDemo,normalizeProject,escapeHTML} from '../public/render.mjs';

test('a short lead stops at a real sentence while the complete source remains available',()=>{
  const copy='Vi skapar hemsidor för ditt företag. '+ 'Nästa mening beskriver hela erbjudandet och alla villkor. '.repeat(12);
  assert.ok(copy.startsWith(copyLead(copy)));
  assert.ok(copyLead(copy).length<=240);
  assert.match(copyLead(copy),/\.$/);
  assert.equal(copyLead('En kort beskrivning.'),'En kort beskrivning.');
  const html=renderDemo({name:'Test',templateId:'story',description:copy,importedAt:'today'});
  assert.match(html,/class="rd-more"/);
  const full=html.match(/<details class="rd-more"><summary>[\s\S]*?<\/summary><p>([\s\S]*?)<\/p><\/details>/)[1].replace(/<\/?span[^>]*>/g,'');
  assert.equal(full,copy.trim());
});

test('source contact dumps, real references, and compact service indexes have different roles',()=>{
  assert.equal(websiteSectionRole({title:'Hur kan vi hjälpa till?',description:'Ring oss.\n\nPrivacy Policy\n\nLegal\n\nAll rights reserved'}),'source-contact');
  assert.equal(websiteSectionRole({title:'Vallentuna Kommun',description:'"Den nya tjänsten gör det enkelt för våra kunder."'}),'reference');
  assert.equal(websiteSectionRole({title:'Interaktiva verktyg',href:'https://example.com/tools',description:''}),'index');
  assert.equal(websiteSectionRole({title:'Tjänster',description:'',image:'https://example.com/photo.jpg'}),'project');
  assert.equal(websiteSectionRole({title:'Privacy i våra produkter',description:'Så bygger vi trygga produkter.'}),'text');
});

test('plain contact lines are usable without mistaking prose or prices for contact details',()=>{
  const card={title:'Kontakt',description:'Priser från 1000 kr.\n\n+46 72 509 99 79\n\nhej@example.com\n\nPrivacy Policy'};
  assert.deepEqual(websiteContactDetails({cards:[card]}),{phone:'+46 72 509 99 79',email:'hej@example.com'});
  assert.deepEqual(websiteContactDetails({cards:[card],phone:'+46 8 123 456',email:'vald@example.com'}),{phone:'+46 8 123 456',email:'vald@example.com'});
  assert.deepEqual(websiteContactDetails({cards:[{title:'Prislista',description:'+46 72 509 99 79\nhej@example.com'}]}),{phone:'',email:''});
});

test('new full-page composition preserves saved projects and every source article, anchor and destination',()=>{
  const p=normalizeProject({name:'Nord',source:'https://example.com',templateId:'story',importedAt:'today',headline:'Utveckling med omtanke.',description:'Vi gör det enkelt.',cards:[{title:'Tjänster',href:'#projekt'},{title:'Vårt projekt',anchor:'projekt',description:'Projektets fullständiga underlag. '.repeat(25),image:'https://example.com/screen.jpg'},{title:'Kontakta oss',anchor:'kontakt-original',description:'Kontaktuppgifter\n\nPrivacy Policy\n\nLegal\n\nAll rights reserved'}],email:'hej@example.com'});
  const original=JSON.stringify(p),html=renderDemo(p),articles=[...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
  assert.match(html,/data-website-design="story"/);
  assert.equal(articles.length,p.cards.length);
  for(const [index,card] of p.cards.entries()){
    assert.ok(articles[index].includes(escapeHTML(card.title)));
    if(card.anchor)assert.ok(articles[index].includes('id="'+card.anchor+'"'));
    if(card.href)assert.ok(articles[index].includes('href="'+card.href+'"'));
  }
  assert.match(html,/href="mailto:hej@example.com"/);
  assert.equal(JSON.stringify(p),original);
  assert.doesNotMatch(html,/50 kunder|award-winning/);
});

test('new designs have bounded image frames, responsive rules and keep standalone exports self-contained',()=>{
  const html=renderDemo({name:'Test',templateId:'precision',importedAt:'today',hero:'https://example.com/art.jpg'});
  assert.match(html,/class="rd-image-frame"/);
  assert.match(html,/max-inline-size:min\(100%,var\(--rd-image-width,100%\)\)/);
  assert.match(html,/@media\(max-width:760px\)/);
  assert.doesNotMatch(html,/<script[^>]+src=/);
});

test('explicit heading and body font choices override the new design defaults',()=>{
  const html=renderDemo({name:'Nord',templateId:'story',typography:{heading:'Georgia',body:'Verdana'}});
  assert.ok(html.includes('--rd-heading:"Georgia",serif'));
  assert.ok(html.includes('font-family:"Verdana",sans-serif'));
});

test('a cleared phone field is never silently restored by the renderer',()=>{
  const html=renderDemo({name:'Nord',templateId:'story',phone:'',cards:[{title:'Kontakt',description:'+46 72 509 99 79\n\nPrivacy Policy'}]});
  assert.doesNotMatch(html,/href="tel:/);
});

test('generic secondary menu items stay reachable without competing with main navigation',()=>{
  const html=renderDemo({name:'Nord',templateId:'story',navigation:[{label:'Tjänster',href:'#services'},{label:'Kontakt',href:'#kontakt'},{label:'Annat',href:'https://example.com/other'}]});
  assert.match(html,/data-menu-density="overflow"/);
  assert.match(html,/href="https:\/\/example.com\/other"/);
  assert.doesNotMatch(html,/href="https:\/\/example.com\/other" data-nav-priority/);
});
