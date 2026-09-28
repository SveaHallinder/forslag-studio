import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDemo} from '../public/render.mjs';
const image='https://example.com/portrait.jpg';
const base={templateId:'atelier',name:'Alexandra Pascalidou',headline:'Journalist och författare',description:'Alexandra skriver.\n\nOriginalets andra stycke.',hero:image,importedAt:'today',navigation:[{label:'Böcker',href:'#bocker'}],cards:[{title:'Boken',description:'Text som hör till boken.',image:'https://example.com/book.jpg',anchor:'bocker'}]};
test('Atelier renders a composed cover while preserving editable fields and image associations',()=>{
 const html=renderDemo(base);
 assert.match(html,/<section class="hero-copy"[^>]*>[\s\S]*?class="profile-name">Alexandra Pascalidou<\/p>[\s\S]*?<h1[^>]*>Journalist och författare<\/h1>[\s\S]*?<div class="visual/);
 assert.match(html,/<div class="visual [^"]*"><img src="https:\/\/example.com\/portrait.jpg"/);
 assert.match(html,/<p><span class="copy-part">Alexandra skriver\.<\/span>[\s\S]*?Originalets andra stycke\.<\/span><\/p>/);
 assert.match(html,/<article[^>]*id="bocker"[^>]*><img src="https:\/\/example.com\/book.jpg"[\s\S]*?Text som hör till boken\./);
 assert.match(html,/href="#bocker"[^>]*>Böcker/);
 assert.equal((html.match(/Art direction: atelier/g)||[]).length,1);
});
test('Atelier preserves escaped source text, galleries, captions and chosen framing',()=>{
 const html=renderDemo({...base,headline:'Ord <script> & bilder',heroGallery:[{url:image,caption:'Porträtt & intervju',presentation:{fit:'contain',x:12,y:34,ratio:'original'}},{url:'https://example.com/second.jpg',caption:'Andra bilden'}]});
 assert.match(html,/Ord &lt;script&gt; &amp; bilder/);
 assert.match(html,/object-fit:contain/);
 assert.match(html,/Porträtt &amp; intervju/);assert.match(html,/Andra bilden/);
});
test('Atelier supports a text-only company without a portrait name or invented photography',()=>{
 const html=renderDemo({...base,name:'Byggbolaget AB',headline:'Vi bygger hållbara hem.',description:'Företagets egen text.',hero:'',cards:[]});
 assert.match(html,/data-hero="text"/);assert.doesNotMatch(html,/<p class="profile-name">/);assert.doesNotMatch(html,/<img/);
});
