import test from 'node:test';import assert from 'node:assert/strict';import {renderDemo} from '../public/render.mjs';
const base={name:'Original Företag',headline:'Original rubrik',importedAt:'today',navigation:[{label:'Om oss',href:'#about'},{label:'Kontakt',href:'#kontakt'}],cards:[{title:'Om oss',description:'Original text',anchor:'about'}]};
const header=input=>renderDemo(input).match(/<header class="nav"[\s\S]*?<\/header>/)[0];
test('headers preserve original destinations and add a native collapsed mobile menu',()=>{
 const html=header(base);assert.match(html,/<details class="mobile-menu">/);assert.match(html,/<summary[^>]*>.*Meny/);assert.match(html,/class="nav-action" href="#kontakt"/);assert.equal((html.match(/href="#about"/g)||[]).length,2);assert.ok(!html.includes('<details class="mobile-menu" open'));assert.match(html,/aria-expanded="false"/);assert.match(html,/class="menu-backdrop" type="button" tabindex="-1" aria-label="Stäng menyn"/);
});
test('empty source navigation creates no fake links or empty menu control',()=>{
 const html=header({...base,navigation:[]});assert.doesNotMatch(html,/<details class="mobile-menu">/);assert.doesNotMatch(html,/<a[^>]*class="nav-action"/);
});
test('many or long source labels get the overflow menu without dropping or reordering links',()=>{
 const navigation=Array.from({length:12},(_,i)=>({label:'Original sida '+i,href:'https://example.com/page-'+i}));const input={...base,navigation},before=JSON.stringify(input),html=header(input);
 assert.match(html,/data-menu-density="overflow"/);
 for(const cls of ['nav-links','mobile-links']){
  const nav=html.match(new RegExp('<nav class="'+cls+'"[\\s\\S]*?</nav>'))[0];
  assert.deepEqual([...nav.matchAll(/href="([^"]+)"/g)].map(match=>match[1]),navigation.map(link=>link.href));
 }
 assert.equal((html.match(/data-nav-priority="true"/g)||[]).length,2);
 assert.equal((html.match(/class="menu-index" aria-hidden="true"/g)||[]).length,12);
 assert.equal(JSON.stringify(input),before);
});
test('overflow previews respect a text budget and omit labels that cannot fit',()=>{
 const navigation=[{label:'En mycket lång navigationsrubrik som inte ryms',href:'#long'},{label:'Tjänster',href:'#services'},{label:'Om oss',href:'#about'},{label:'Kontakt',href:'#kontakt'},{label:'Referenser',href:'#references'},{label:'Karriär',href:'#jobs'}];
 const html=header({...base,navigation}),nav=html.match(/<nav class="nav-links"[\s\S]*?<\/nav>/)[0];
 assert.doesNotMatch(nav,/href="#long" data-nav-priority/);assert.match(nav,/href="#services" data-nav-priority/);assert.equal((nav.match(/data-nav-priority/g)||[]).length,3);
});
test('header variants differ by template and company text remains escaped',()=>{
 for(const [id,variant] of Object.entries({story:'floating',editorial:'editorial',atelier:'editorial',construction:'structured',cinema:'immersive',studio:'immersive',pop:'playful',precision:'technical'}))assert.match(header({...base,templateId:id}),new RegExp('data-header="'+variant+'"'));
 assert.ok(header({...base,name:'<script>bad</script>'}).includes('&lt;script&gt;bad&lt;/script&gt;'));
});
test('explicit brand backgrounds and original logo art remain authoritative',()=>{
 const html=header({...base,templateId:'cinema',logo:'https://example.com/brand.svg',branding:{headerBackground:'#fffaf1',headerText:'#172315'}});
 assert.match(html,/data-header-color="source" data-brand="image"/);assert.match(html,/src="https:\/\/example.com\/brand.svg"/);assert.doesNotMatch(html,/style="[^\"]*filter/);
});
