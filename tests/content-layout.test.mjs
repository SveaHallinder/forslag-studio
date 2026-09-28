import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDemo} from '../public/render.mjs';
const imported=cards=>({name:'Original',headline:'Välkommen',importedAt:'2026-09-22',cards});
test('FAQ pairs become accessible disclosures without losing answers or section anchors',()=>{
 const html=renderDemo(imported([{title:'Vanliga frågor',anchor:'faq',description:'Var finns ni?\n\nVi finns i Borås.\n\nNär öppnar ni?\n\nKlockan nio.'}]));
 assert.match(html,/<summary>Var finns ni\?<\/summary>/);assert.match(html,/<summary>När öppnar ni\?<\/summary>/);
 assert.equal((html.match(/Vi finns i Borås\./g)||[]).length,1);assert.match(html,/id="faq"/);
});
test('uncertain question sequences keep the complete original text',()=>{
 const description='En introduktion.\n\nVar finns ni?\n\nI Borås.\n\nMer information.';
 const html=renderDemo(imported([{title:'Information',description}]));assert.ok(html.replace(/<[^>]+>/g,'').includes(description));assert.doesNotMatch(html,/<details class="faq-item"/);
});
test('long copy gets a reading section while short image blocks retain gallery treatment',()=>{
 const html=renderDemo({...imported([{title:'Produkt',description:'Kort originaltext.',image:'https://example.com/product.webp',anchor:'product'},{title:'Vår berättelse',description:'Lång originaltext. '.repeat(70),image:'https://example.com/team.jpg',anchor:'story'}]),templateId:'retail'});
 assert.match(html,/class="card content-gallery" id="product"/);assert.match(html,/class="card content-editorial" id="story"/);
 assert.ok(html.indexOf('id="product"')<html.indexOf('id="story"'));
});
test('imported section titles use h2 rather than skipping directly from h1 to h3',()=>{
 const html=renderDemo(imported([{title:'Vår tjänst',description:'Originaltext',anchor:'service'}]));assert.match(html,/<h2>Vår tjänst<\/h2>/);
});
test('standalone questions retain links and unsafe text is escaped',()=>{
 const html=renderDemo(imported([{title:'Var finns ni?',description:'<script>Hej</script>',href:'https://example.com/contact',anchor:'q'}]));assert.doesNotMatch(html,/<script>Hej/);assert.match(html,/https:\/\/example.com\/contact/);assert.match(html,/&lt;script&gt;/);
});
