import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProject,renderDemo} from '../public/render.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';
import {readFileSync} from 'node:fs';

test('original homepage navigation, CTA and section anchors survive a customer link',async()=>{
  const raw={name:'Företaget',headline:'Vi gör ert arbete enklare',cta:'Boka visning',ctaHref:'https://example.com/boka',navigation:[{label:'Lösningar',href:'#solutions'},{label:'Teamet',href:'https://example.com/team'}],cards:[{title:'Allt ni behöver',description:'Originalets copy. '.repeat(80),anchor:'solutions',image:'https://example.com/photo.jpg'}]};
  const p=await decodeProject(new URL(await encodeProject(raw,'https://studio.example/demo.html')).hash);
  assert.deepEqual(p.navigation,raw.navigation);assert.equal(p.cards[0].description,raw.cards[0].description.trim());
  const html=renderDemo(p);
  assert.match(html,/href="#solutions"[^>]*>Lösningar/);assert.match(html,/id="solutions"/);
  assert.match(html,/href="https:\/\/example.com\/boka"[^>]*>Boka visning/);
  assert.doesNotMatch(html,/Utforska vårt utbud/);
});
test('imported links and brand values cannot inject scripts or CSS',()=>{
  const p=normalizeProject({navigation:[{label:'Bad',href:'javascript:alert(1)'},{label:'Mail',href:'mailto:info@example.com'}],ctaHref:'data:text/html,evil',fontFamily:'evil; background:url(https://bad.example)',cards:[{title:'Titel',anchor:'"><script>'}]});
  assert.equal(p.navigation.length,1);assert.equal(p.ctaHref,'');assert.equal(p.cards[0].anchor,'');
  assert.doesNotMatch(renderDemo(p),/<script>|background:url/);
});

test('plain contact details and small section images survive a customer link',async()=>{
  const raw={name:'Café',headline:'Välkommen',phone:'033-41 31 86',address:'Österlånggatan 51, 503 37 Borås',cards:[{title:'Sortiment',image:'https://example.com/lemon.png',anchor:'section-1'}]};
  const p=await decodeProject(new URL(await encodeProject(raw,'https://studio.example/demo.html')).hash);
  assert.equal(p.phone,raw.phone);assert.equal(p.address,raw.address);assert.equal(p.cards[0].image,raw.cards[0].image);
  const html=renderDemo(p);assert.match(html,/href="tel:033413186"/);assert.match(html,/Österlånggatan 51, 503 37 Borås/);assert.match(html,/https:\/\/example.com\/lemon.png/);
});

test('an imported page without a menu or CTA gets no invented marketing copy',()=>{
  const html=renderDemo({name:'Original',headline:'Enda rubriken',cards:[{title:'Information',description:'Riktig text',anchor:'section-1'}]});
  assert.match(html,/<body data-imported="true"/);
  const hero=html.match(/<section class="hero-copy"[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.doesNotMatch(hero,/<a|Utforska/);
});

test('adding a menu to an existing project preserves its introduction and hero action',()=>{
  const seed=JSON.parse(readFileSync(new URL('../seed.json',import.meta.url),'utf8'));
  const before=renderDemo(seed),after=renderDemo({...seed,navigation:[{label:'Egen meny',href:'#kontakt'}]});
  assert.match(after,/<body data-imported="false"/);
  assert.equal(after.match(/<section class="hero-copy"[^>]*>([\s\S]*?)<\/section>/)[1],before.match(/<section class="hero-copy"[^>]*>([\s\S]*?)<\/section>/)[1]);
  assert.ok(after.includes(seed.sectionIntro));assert.match(after,/>Egen meny<\/a>/);
});
test('removing the final menu link from a text-only import does not invent navigation or actions in a shared demo',async()=>{
  const p={name:'Original',headline:'Välkommen',importedAt:'2026-09-21T00:00:00Z',navigation:[],cards:[]};
  const shared=await decodeProject(new URL(await encodeProject(p,'https://studio.example/demo.html')).hash);
  const html=renderDemo(shared);
  assert.equal(html,renderDemo(p));
  assert.match(html,/<body data-imported="true"/);
  assert.doesNotMatch(html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)[1],/<a/);
  assert.doesNotMatch(html.match(/<section class="hero-copy"[^>]*>([\s\S]*?)<\/section>/)[1],/<a/);
});
test('previously issued text-only customer links without import dates retain their original menu and no hero action',async()=>{
  // Older encoders cleared importedAt before issuing customer links.
  const old={name:'Original',headline:'Välkommen',importedAt:'',navigation:[{label:'Om företaget',href:'https://example.com/om'}],cards:[]};
  const shared=await decodeProject(new URL(await encodeProject(old,'https://studio.example/demo.html')).hash);
  const html=renderDemo(shared);
  assert.match(html,/<body data-imported="true"/);
  assert.match(html,/>Om företaget<\/a>/);
  assert.doesNotMatch(html.match(/<section class="hero-copy"[^>]*>([\s\S]*?)<\/section>/)[1],/<a/);
});
