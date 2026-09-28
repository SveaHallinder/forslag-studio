import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDemo} from '../public/render.mjs';
import {compactCardIndices} from '../public/composition.mjs';
const base={name:'Company',headline:'Original heading',importedAt:'today',ctaHref:'#services',navigation:[{label:'Services',href:'#services'}]};
test('source paragraphs preserve their text and editable paragraph wrapper',()=>{
 const html=renderDemo({...base,description:'First paragraph.\n\nSecond <script>paragraph</script>.',cards:[{anchor:'services',title:'Our work',description:'One.\n\nTwo.'}]});
 assert.ok(html.includes('<span class="copy-part">First paragraph.</span>\n\n<span class="copy-part">Second &lt;script&gt;paragraph&lt;/script&gt;.</span>'));
 assert.ok(html.includes('<p class="section-copy"><span class="copy-part">One.</span>\n\n<span class="copy-part">Two.</span></p>'));
});
test('consecutive short image cards form a portfolio without absorbing complex sections',()=>{
 const image='https://example.com/place.jpg',short={title:'Place',description:'Size: 5 sqm',image};
 const cards=[{title:'Intro',description:'Introduction'},short,{...short,title:'Other place'},
  {...short,title:'Long feature',description:'Long '.repeat(80)},short,
  {...short,title:'Team',kind:'team'},short,{...short,gallery:[{url:image},{url:'https://example.com/other.jpg'}]},
  {...short,kind:'testimonial'}, {...short,title:'Product A',kind:'product'},{...short,title:'Product B',kind:'product'}];
 assert.deepEqual([...compactCardIndices(cards)],[1,2,9,10]);
});
test('portfolio rendering preserves anchors, text, source order and explicit image presentation',()=>{
 const input={...base,cards:[{title:'Place A',description:'5 sqm',image:'https://example.com/a.jpg',anchor:'a',gallery:[{url:'https://example.com/a.jpg',presentation:{fit:'contain',ratio:'original',x:0,y:100}}]},
  {title:'Place B',description:'8 sqm',image:'https://example.com/b.jpg',anchor:'b'}]};
 const before=JSON.stringify(input),html=renderDemo(input);
 assert.equal((html.match(/<article[^>]*data-density="compact"/g)||[]).length,2);
 assert.ok(html.indexOf('id="a"')<html.indexOf('id="b"'));
 assert.ok(html.includes('5 sqm')&&html.includes('8 sqm')&&html.includes('object-fit:contain!important'));
 assert.equal(JSON.stringify(input),before);
 assert.ok(!renderDemo({...input,importedAt:'',navigation:[],ctaHref:'',cards:input.cards.map(({anchor,...card})=>card)}).match(/<article[^>]*data-density="compact"/));
});
test('compact source link blocks remain ordered, linked and individually editable',()=>{
 const html=renderDemo({...base,cards:[{title:'Intro',description:'Source introduction',anchor:'intro'},{title:'Service A',href:'#a',anchor:'link-a'},{title:'Service B',href:'#b',anchor:'link-b'},{title:'Details',description:'Source details',image:'https://example.com/photo.jpg',anchor:'a'}]});
 assert.equal((html.match(/<article data-composition="link"/g)||[]).length,2);
 assert.ok(html.indexOf('id="intro"')<html.indexOf('id="link-a"')&&html.indexOf('id="link-b"')<html.indexOf('id="a"'));
 assert.ok(html.includes('href="#a"'));assert.ok(html.includes('data-composition="feature"'));
});
test('gallery count and hero content shape guide presentation without modifying source',()=>{
 const input={...base,hero:'https://example.com/hero.jpg',cards:[{title:'Team',kind:'team',gallery:[{url:'https://example.com/a.jpg',caption:'Anna'},{url:'https://example.com/b.jpg',caption:'Bea'}]}]};
 const before=JSON.stringify(input),html=renderDemo(input);
 assert.ok(html.includes('data-image-count="2"'));assert.ok(html.includes('data-hero="image"'));assert.ok(html.includes('Anna')&&html.includes('Bea'));assert.equal(JSON.stringify(input),before);
});
test('explicit partner galleries use a compact logo band and retain captions',()=>{
 const html=renderDemo({...base,cards:[{title:'Ett urval av våra partners',gallery:[{url:'https://example.com/a.png',caption:'Partner A'},{url:'https://example.com/b.png',caption:'Partner B'}]}]});
 assert.ok(html.includes('<article data-composition="logos"'));
 assert.ok(html.includes('Partner A')&&html.includes('Partner B'));
 const ordinary=renderDemo({...base,cards:[{title:'Våra platser',gallery:[{url:'https://example.com/a.jpg'},{url:'https://example.com/b.jpg'}]}]});
 assert.ok(ordinary.includes('<article data-composition="collection"'));
});
