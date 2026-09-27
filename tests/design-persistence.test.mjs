import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeProject,renderDemo} from '../public/render.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';
const url='https://example.com/image.png';
const presentation={fit:'cover',x:24,y:78,ratio:'square'};
test('optional presentation, section override and original survive normalization without changing old projects',()=>{
 const original={headline:'Original only',description:'Original text',cards:[{title:'Original card',description:'Before'}]};
 const p=normalizeProject({headline:'Edited',hero:url,heroGallery:[{url,presentation}],cards:[{title:'Person',kind:'team',image:url,gallery:[{url,presentation}]}],original});
 assert.deepEqual(p.heroGallery[0].presentation,presentation);assert.equal(p.cards[0].kind,'team');assert.equal(p.original.headline,'Original only');assert.equal(normalizeProject({}).original,undefined);assert.equal(normalizeProject({cards:[{title:'Old'}]}).cards[0].kind,undefined);
 assert.deepEqual(normalizeProject(p),p);
});
test('hostile presentation and recursive originals are discarded or bounded',()=>{
 const p=normalizeProject({heroGallery:[{url,presentation:{fit:'cover',ratio:'evil;}',x:-900,y:Infinity}}],cards:[{title:'Bad',kind:'__proto__'}],original:{headline:'One',original:{headline:'Nested'},pages:[{source:'https://evil.test'}],script:'bad'}});
 assert.deepEqual(p.heroGallery[0].presentation,{fit:'cover',ratio:'template',x:0,y:50});assert.equal(p.cards[0].kind,undefined);assert.equal(p.original.original,undefined);assert.equal(p.original.pages,undefined);assert.equal(p.original.script,undefined);
});
test('manual generic override disables automatic semantic styling',()=>{
 const html=renderDemo({importedAt:'today',cards:[{title:'Kundomdömen',kind:'generic',description:'Original copy'}]});assert.doesNotMatch(html,/class="card[^\"]*section-testimonial/);
});
test('image framing is included on hero, card and subpage output',()=>{
 const html=renderDemo({hero:url,heroGallery:[{url,presentation}],cards:[{title:'Person',kind:'team',gallery:[{url,presentation}]}],pages:[{source:'https://example.com/team',hero:url,heroGallery:[{url,presentation}]}]});
 assert.match(html,/object-position:24% 78%!important/);assert.match(html,/object-fit:cover!important/);assert.match(html,/aspect-ratio:1\/1!important/);assert.ok((html.match(/object-position:24% 78%!important/g)||[]).length>=3);
});
test('customer links keep display choices but exclude original snapshots on every page',async()=>{
 const p={headline:'Edited',original:{headline:'Private original'},hero:url,heroGallery:[{url,presentation}],cards:[{title:'Person',kind:'team'}],pages:[{source:'https://example.com/a',headline:'Page',original:{headline:'Private subpage'},cards:[{title:'Item',kind:'product'}]}]};
 const link=await encodeProject(p,'https://example.com/viewer'),out=await decodeProject(new URL(link).hash);
 assert.equal(out.original,undefined);assert.equal(out.pages[0].original,undefined);assert.equal(out.cards[0].kind,'team');assert.equal(out.pages[0].cards[0].kind,'product');assert.deepEqual(out.heroGallery[0].presentation,presentation);assert.doesNotMatch(renderDemo(p),/Private original|Private subpage/);
});
test('manual section choice does not hide authored legacy overview or change its CTA',()=>{
 const html=renderDemo({headline:'Legacy',sectionTitle:'Keep overview',sectionIntro:'Keep introduction',cards:[{title:'Person',kind:'team',description:'Keep person'}]});
 assert.ok(!html.includes('<div class="section-top" hidden'));assert.ok(html.includes('Keep introduction'));assert.ok(html.includes('Utforska vårt utbud'));assert.ok(html.includes('section-team'));
});


test('explicit section type overrides automatic FAQ structure',()=>{
 for(const kind of ['generic','service','testimonial']){
  const html=renderDemo({headline:'Page',cards:[{kind,title:'Hur bokar jag?',description:'Ring oss.'}]});
  assert.ok(!html.includes('<details class="faq-item"'));
  if(kind==='testimonial')assert.ok(html.includes('<blockquote>Ring oss.</blockquote>'));
 }
});


test('malformed optional original cannot prevent restoring a valid project',()=>{
 for(const original of [{headline:'Original',cards:[null]},{headline:'Original',navigation:[null]},{headline:'Original',cards:'invalid'}]){
  const result=normalizeProject({headline:'Keep proposal',original});assert.equal(result.headline,'Keep proposal');
 }
});
