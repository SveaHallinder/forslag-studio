import test from 'node:test';import assert from 'node:assert/strict';import {renderDemo} from '../public/render.mjs';
const base={name:'Original Företag',headline:'Original rubrik',importedAt:'today',navigation:[{label:'Om oss',href:'#about'},{label:'Kontakt',href:'#kontakt'}],cards:[{title:'Om oss',description:'Original text',anchor:'about'}]};
test('headers preserve original destinations and add a native collapsed mobile menu',()=>{
 const html=renderDemo(base);assert.match(html,/<details class="mobile-menu">/);assert.match(html,/<summary[^>]*>.*Meny/);assert.match(html,/class="nav-action" href="#kontakt"/);assert.equal((html.match(/href="#about"/g)||[]).length,2);assert.ok(!html.includes('<details class="mobile-menu" open'));
});
test('empty source navigation creates no fake links or empty menu control',()=>{
 const html=renderDemo({...base,navigation:[]});assert.doesNotMatch(html,/<details class="mobile-menu">/);assert.doesNotMatch(html,/<a[^>]*class="nav-action"/);
});
test('many or long source labels get the overflow menu without dropping links',()=>{
 const navigation=Array.from({length:12},(_,i)=>({label:'Original sida '+i,href:'https://example.com/page-'+i}));const input={...base,navigation},before=JSON.stringify(input),html=renderDemo(input);assert.match(html,/data-menu-density="overflow"/);for(const link of navigation)assert.ok(html.includes(link.href));assert.equal(JSON.stringify(input),before);
});
test('header variants differ by template and company text remains escaped',()=>{
 assert.match(renderDemo({...base,templateId:'story'}),/data-header="floating"/);assert.match(renderDemo({...base,templateId:'editorial'}),/data-header="editorial"/);assert.match(renderDemo({...base,templateId:'construction'}),/data-header="structured"/);assert.ok(renderDemo({...base,name:'<script>bad</script>'}).includes('&lt;script&gt;bad&lt;/script&gt;'));
});
