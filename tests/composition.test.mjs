import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDemo} from '../public/render.mjs';
const base={name:'Company',headline:'Original heading',importedAt:'today',ctaHref:'#services',navigation:[{label:'Services',href:'#services'}]};
test('source paragraphs preserve their text and editable paragraph wrapper',()=>{
 const html=renderDemo({...base,description:'First paragraph.\n\nSecond <script>paragraph</script>.',cards:[{anchor:'services',title:'Our work',description:'One.\n\nTwo.'}]});
 assert.ok(html.includes('<span class="copy-part">First paragraph.</span>\n\n<span class="copy-part">Second &lt;script&gt;paragraph&lt;/script&gt;.</span>'));
 assert.ok(html.includes('<p class="section-copy"><span class="copy-part">One.</span>\n\n<span class="copy-part">Two.</span></p>'));
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
