import test from 'node:test';
import assert from 'node:assert/strict';
import {detectSectionKind} from '../public/section-design.mjs';
import {renderDemo} from '../public/render.mjs';
for(const [title,description,kind] of [
 ['Våra tjänster','Installation och support','service'],['Our products','Explore the collection','product'],['Vårt team','Anna, arkitekt','team'],['Kundcase','Så hjälpte vi Acme','case'],['Priser','Klippning 450 kr\nFärgning 900 kr','pricing'],['Kundomdömen','Bra bemötande. — Anna','testimonial'],['Vanliga frågor','Hur bokar jag?\n\nRing oss.','faq'],['Välkommen','Vi har många års erfarenhet','generic']
])test('recognizes '+kind+' without rewriting content',()=>{assert.equal(detectSectionKind({title,description}),kind);});
test('incidental words in body do not fabricate a testimonial or team',()=>{
 assert.equal(detectSectionKind({title:'Vårt arbetssätt',description:'Vårt team läser kundomdömen för att förbättra våra tjänster.'}),'generic');
});
test('semantic render retains exact text and escapes untrusted content',()=>{
 const html=renderDemo({importedAt:'today',cards:[{title:'Kundomdömen',description:'Bra <script>bad</script> & ärligt.'},{title:'Priser',description:'Klippning 450 kr\nFärgning 900 kr'}]});
 assert.match(html,/section-testimonial/);assert.match(html,/<blockquote/);assert.match(html,/Bra &lt;script&gt;bad&lt;\/script&gt; &amp; ärligt\./);assert.match(html,/Klippning 450 kr\nFärgning 900 kr/);assert.doesNotMatch(html,/<script>bad/);
});
