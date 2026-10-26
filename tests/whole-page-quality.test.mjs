import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProject,renderDemo,escapeHTML} from '../public/render.mjs';
import {importLaunchChecks} from '../public/launch-checks.mjs';
import {assessProject} from '../public/project-tools.mjs';
import {templates} from '../public/templates.mjs';
import {paragraphContent} from '../public/composition.mjs';
import {customerJourney,renderMobileJourney} from '../public/customer-journey.mjs';
import {wholePageChecks,planImageRefinements,applyImageRefinements} from '../public/whole-page-quality.mjs';

const small='https://company.example/coffee-small.jpg',large='https://company.example/coffee-large.jpg',other='https://company.example/team.jpg';
const base={name:'Kundens café',headline:'Kaffe och samtal',description:'Företagets egen introduktion.',source:'https://company.example/',importedAt:'today',hero:small,heroGallery:[{url:small,caption:'Egen bildtext'},{url:large,caption:'Stor originalbild'}],email:'hej@company.example',address:'Torget 4',cards:[{title:'Vår meny',description:'Espresso 35 kr',image:other,anchor:'meny'}]};
const results=new Map([[small,{ok:true,width:320,height:240}],[large,{ok:true,width:1280,height:960}],[other,{ok:true,width:800,height:1200}]]);

test('larger image suggestions stay in their own authored group and preserve all source content',()=>{
  const input=normalizeProject({...base,original:base}),before=JSON.stringify(input),plan=planImageRefinements(input,results);
  assert.equal(plan.changes.length,1);assert.equal(plan.project.hero,large);
  assert.equal(plan.project.cards[0].image,other);assert.equal(JSON.stringify(input),before);
  assert.deepEqual(new Set(plan.project.heroGallery.map(i=>i.url)),new Set([small,large]));
  assert.deepEqual(plan.project.original,input.original);assert.equal(plan.project.heroGallery[0].caption,'Stor originalbild');
});
test('manual framing, incompatible aspect ratios, vector art and unprobed photos are never replaced',()=>{
  const manual={...base,heroGallery:[{url:small,presentation:{fit:'cover',x:12,y:74,ratio:'portrait'}},{url:large}]};
  assert.equal(planImageRefinements(manual,results).changes.length,0);
  assert.equal(planImageRefinements({...base,heroPosition:74},results).changes.length,0);
  assert.equal(planImageRefinements(base,new Map([[small,results.get(small)],[large,{ok:true,width:1200,height:2200}]] )).changes.length,0);
  assert.equal(planImageRefinements(base,new Map([[small,{ok:true,width:1,height:1,vector:true}],[large,results.get(large)]] )).changes.length,0);
  assert.equal(planImageRefinements(base,new Map()).changes.length,0);
});
test('broken images can be repaired only from a readable photo in the same group',()=>{
  const broken=new Map(results);broken.set(small,{ok:false,reason:'Not found'});
  assert.equal(planImageRefinements(base,broken).project.hero,large);
  assert.equal(planImageRefinements({...base,heroGallery:[{url:small}]},broken).changes.length,0);
});
test('applying preserves metadata and subpage copy while refusing a stale plan',()=>{
  const p={...normalizeProject({...base,pages:[{...base,name:'Om oss',source:'https://company.example/about'}]}),customMetadata:{keep:true}};
  p.pages[0].customMetadata='subpage';const plan=planImageRefinements(p,results),next=applyImageRefinements(p,plan);
  assert.deepEqual(next.customMetadata,p.customMetadata);assert.equal(next.pages[0].customMetadata,'subpage');
  assert.equal(next.pages[0].hero,large);assert.equal(next.pages[0].description,p.pages[0].description);
  assert.throws(()=>applyImageRefinements({...p,headline:'New edits'},plan),/ändrades efter kontrollen/);
});
test('content review targets the exact page and placeholder field',()=>{
  const checks=wholePageChecks({...base,pages:[{...base,name:'Undersidan',source:'https://company.example/about',cards:[{title:'TODO rubrik',description:'Godkänd beskrivning'}]}]});
  const placeholder=checks.find(c=>/Platshållartext/.test(c.label));
  assert.equal(placeholder.pageIndex,0);assert.equal(placeholder.field,'card-title-0');assert.equal(placeholder.blocking,false);
  assert.ok(wholePageChecks({name:'Empty'}).some(c=>c.field==='editCustomerFunctions'));
});
test('connected providers still require an actual checkout or booking review',()=>{
  const checks=wholePageChecks({...base,navigation:[{label:'Boka bord',href:'https://book.company.example/'},{label:'Till betalning',href:'https://pay.company.example/'}]});
  assert.ok(checks.some(c=>c.help.includes('reservationen kan slutföras')));
  assert.ok(checks.some(c=>c.help.includes('genomför inget köp')));
});
test('long prose gains paragraphs without losing a character or changing authored menus',()=>{
  const value=('Vi använder företagets egna ord och behåller alla fakta, priser och namn. ').repeat(15)+'<script>Test</script>';
  const html=paragraphContent(value,escapeHTML);
  assert.match(html,/copy-part/);assert.equal(html.replace(/<span class="copy-part">|<\/span>/g,''),escapeHTML(value));
  assert.doesNotMatch(html,/<script>/);
  for(const original of ['Espresso 35 kr\nLatte 45 kr\n'+value,'Kort originaltext.'])assert.equal(paragraphContent(original,escapeHTML),escapeHTML(original));
});
test('journeys use real menu, booking and contact routes, never ambiguous or unsafe destinations',()=>{
  assert.equal(customerJourney(normalizeProject({...base,templateId:'cafe',navigation:[{label:'Meny',href:'#meny'}]})).primary.href,'#meny');
  assert.equal(customerJourney(normalizeProject({...base,navigation:[{label:'Boka bord',href:'https://book.company.example/'}]})).primary.href,'https://book.company.example/');
  assert.equal(customerJourney(normalizeProject({...base,navigation:[{label:'Boka bord',href:'https://book.company.example/a'},{label:'Boka tid',href:'https://book.company.example/b'}]})).primary.href,'mailto:hej@company.example');
  assert.equal(customerJourney(normalizeProject({ctaHref:'javascript:alert(1)'})).primary,null);
  assert.equal(renderMobileJourney(normalizeProject({}),escapeHTML),'');
});
test('reservation and enquiry forms keep their different promises',()=>{
  const form='00000000-0000-0000-0000-000000000000';
  assert.equal(customerJourney(normalizeProject({requestForm:{kind:'booking',url:'https://studio.company.example/booking.html?form='+form}})).primary.label,'Boka besök');
  assert.equal(customerJourney(normalizeProject({requestForm:{kind:'booking',url:'https://studio.company.example/contact.html?form='+form}})).primary.label,'Skicka bokningsförfrågan');
  assert.equal(customerJourney(normalizeProject({...base,navigation:[{label:'Visit',href:'#kontakt'}]})).directions.label,'Get directions');
});
test('all templates and their subpages inherit supplied contact routes without mutating the project',()=>{
  for(const {id} of templates){
    const p=normalizeProject({...base,templateId:id,pages:[{source:'https://company.example/about',headline:'Om företaget',description:'Originaltext',cards:[]}]});
    const before=JSON.stringify(p),html=renderDemo(p);
    assert.equal(JSON.stringify(p),before);assert.match(html,/customer-mobile-actions/);
    assert.ok((html.match(/href="mailto:hej@company.example"/g)||[]).length>=3,id);
    assert.match(html,/maps\/search\/\?api=1&amp;query=Torget%204/);
    assert.match(html,/data-demo-page="1"/);
    assert.ok(!assessProject(p).some(c=>c.id==='contact'&&!c.ok),id);
  }
});

test('missing hero warnings open the image editor rather than the color field',()=>{
  const [check]=importLaunchChecks({...base,warnings:['Ingen säker huvudbild hittades vid huvudrubriken. Välj huvudbild under Bilder.']});
  assert.equal(check.field,'imageUpload');assert.equal(check.tab,'images');
});

test('empty projects never promise a contact action without a supplied destination',()=>{
  for(const {id} of templates){
    const html=renderDemo({name:'Saknar kontakt',templateId:id});
    assert.doesNotMatch(html,/class="(?:button|cafe-button)" href="#kontakt"/,id);
    assert.doesNotMatch(html,/<nav class="customer-mobile-actions"/,id);
  }
  const cafe=renderDemo({name:'Besök oss',templateId:'cafe',address:'Torget 4'});
  assert.match(cafe,/class="cafe-button" href="https:\/\/www.google.com\/maps\/search/);
  assert.match(cafe,/Hitta hit/);
});
test('soft candidates are not proposed as better photos and equal-sized clearer originals may be suggested',()=>{
 const soft=new Map(results);soft.set(large,{...results.get(large),soft:true});assert.equal(planImageRefinements(base,soft).changes.length,0);
 const sameSize=new Map([[small,{ok:true,width:1280,height:960,soft:true}],[large,{ok:true,width:1280,height:960}]]);assert.equal(planImageRefinements(base,sameSize).project.hero,large);
});
