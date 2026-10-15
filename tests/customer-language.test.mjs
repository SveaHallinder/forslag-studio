import test from 'node:test';
import assert from 'node:assert/strict';
import {customerLanguage,customerText,sourceLabel} from '../public/customer-language.mjs';
import {renderDemo,normalizeProject} from '../public/render.mjs';
import {templates} from '../public/templates.mjs';
import {createSocialProject} from '../public/social-project.mjs';
import {customerJourney} from '../public/customer-journey.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';

const bios={sv:'Välkommen till vår plats. Vi skapar med omsorg för dig och dina vänner.',en:'Welcome to our place. We create with care for you and your friends.',ro:'Bun venit în locul nostru. Cafea pentru noi și pentru prieteni.'};
const draft={name:'Testföretag',links:'https://www.instagram.com/test.company/',industry:'cafe',offer:'Filter coffee 25\nEspresso 20',about:'Original & unchanged.',address:'10 Test Street',email:'hello@example.com',photos:[]};
const project=lang=>createSocialProject({...draft,language:lang,bio:bios[lang]});

test('language follows company copy or clear navigation, never brand, domain or image labels',()=>{
 for(const lang of Object.keys(bios))assert.equal(customerLanguage({description:bios[lang]}),lang);
 assert.equal(customerLanguage({name:'Welcome to our coffee',source:'https://english.example/',heroGallery:[{label:bios.en}],headline:'XYZ'}),'sv');
 assert.equal(customerLanguage({description:bios.sv,navigation:[{label:'Home'},{label:'About us'},{label:'Contact us'}]}),'sv');
 assert.equal(customerLanguage({headline:'XYZ',navigation:[{label:'Find us'}]}),'en');
 assert.equal(customerLanguage({headline:'XYZ',navigation:[{label:'Unde suntem'}]}),'ro');
 assert.equal(customerLanguage({headline:'XYZ'}),'sv');
 assert.equal(customerLanguage({headline:'Din nästa favoritplats.',navigation:[{label:'Hitta hit'}]}),'sv');
});

test('all 17 designs localize generated copy while preserving business content and destinations',()=>{
 for(const lang of Object.keys(bios))for(const {id}of templates){
  const p={...project(lang),templateId:id,description:(bios[lang]+' ').repeat(10),cards:[{title:'Original offer',description:'Original description & details.',anchor:'offer',image:'https://example.com/photo.jpg'}]};
  const before=JSON.stringify(p),t=customerText(p),html=renderDemo(p);
  assert.match(html,new RegExp('<html lang="'+lang+'">'),id+'/'+lang);
  assert.ok(html.includes('aria-label="'+t.mainMenu+'"'),id+'/'+lang+' menu');
  assert.ok(html.includes('aria-label="'+t.toggleMenu+'"'),id+'/'+lang+' menu toggle');
  assert.ok(html.includes('aria-label="'+t.footer+'"'),id+'/'+lang+' footer');
  assert.ok(html.includes('aria-label="'+t.journey.next+'"'),id+'/'+lang+' mobile actions');
  assert.ok(html.includes(t.proposal),id+'/'+lang+' disclosure');
  assert.ok(html.includes(t.top),id+'/'+lang+' back to top');
  assert.ok(html.includes('Original description &amp; details.'),id+'/'+lang+' original copy');
  assert.ok(html.includes('mailto:hello@example.com'),id+'/'+lang+' real route');
  assert.ok(html.includes('title="'+t.original+'"'),id+'/'+lang+' external link title');
  assert.doesNotMatch(html,/\$\{e\(t\./,id+'/'+lang+' no literal template interpolation');
  for(const n of p.navigation)assert.ok(html.includes('href="'+n.href+'"'),id+'/'+lang+' source link');
  if(id!=='cafe')assert.ok(html.includes(t.sourceIntro+' <a href="https://www.instagram.com/test.company/" target="_blank" rel="noopener noreferrer">'+t.social),id+'/'+lang+' social attribution');
  if(!['cafe','atelier','dining'].includes(id))assert.ok(html.includes('<summary>'+t.more+'<span'),id+'/'+lang+' disclosure action');
  assert.equal(JSON.stringify(p),before,id+'/'+lang+' no source mutation');
 }
});

test('booking requests stay requests in every language and keep the actual configured route',()=>{
 for(const lang of Object.keys(bios)){
  const p=project(lang),t=customerText(p);delete p.ctaHref;
  for(const [kind,url,label]of [['booking','https://studio.example/booking.html?id=qa',t.journey.booking],['booking','https://studio.example/request.html?id=qa',t.journey.request],['contact','https://studio.example/request.html?id=qa',t.journey.enquiry]]){
   const request={...p,requestForm:{kind,url}},journey=customerJourney(request);
   assert.equal(journey.contact.label,label);assert.equal(journey.contact.href,url);
  }
 }
});

test('source attribution recognizes real social hosts without trusting lookalike domains',()=>{
 const t=customerText({description:bios.en});
 for(const source of ['https://instagram.com/a/','https://www.instagram.com/a/','https://m.facebook.com/a/','https://www.tiktok.com/@a'])assert.equal(sourceLabel(source,t),t.social);
 for(const source of ['https://notinstagram.com/','https://instagram.com.evil.example/','https://company.example/','invalid'])assert.equal(sourceLabel(source,t),t.website);
});

test('language survives old-format customer links without any new project field',async()=>{
 for(const lang of Object.keys(bios)){
  const p=project(lang),url=await encodeProject(p,'https://studio.example/demo.html'),restored=await decodeProject(new URL(url).hash);
  assert.equal(customerLanguage(restored),lang);assert.equal(Object.hasOwn(restored,'language'),false);assert.deepEqual(restored.navigation,p.navigation);
 }
});

test('each imported subpage carries the language actually rendered with its inherited navigation',()=>{
 const root={...project('en'),source:'https://company.example/',templateId:'editorial',pages:[{source:'https://company.example/despre',headline:'Locul nostru',description:bios.ro}]};
 const html=renderDemo(root),metadata=JSON.parse(html.match(/<script type="application\/json" data-demo-pages>(.*?)<\/script>/)[1]);
 assert.deepEqual(metadata.map(p=>p.lang),['en','ro']);
 assert.match(renderDemo(root,{pageSource:'https://company.example/despre'}),/<html lang="ro">/);
});

test('generated contact defaults follow the copy without changing an authored action',()=>{
 for(const lang of Object.keys(bios)){
  const raw={description:bios[lang],navigation:null},t=customerText(raw);
  assert.equal(normalizeProject(raw).cta,t.contactAction);assert.equal(normalizeProject({...raw,cta:'Original action'}).cta,'Original action');
 }
});
