import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProject,renderDemo} from '../public/render.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';

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

test('an imported page without a menu or CTA gets no invented marketing copy',()=>{
  const html=renderDemo({name:'Original',headline:'Enda rubriken',cards:[{title:'Information',description:'Riktig text',anchor:'section-1'}]});
  assert.match(html,/<body data-imported="true"/);
  const hero=html.match(/<section class="hero-copy">([\s\S]*?)<\/section>/)[1];
  assert.doesNotMatch(hero,/<a|Utforska/);
});
