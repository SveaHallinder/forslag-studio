import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProject,renderDemo} from '../public/render.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';
const branding={background:'#f7f2eb',surface:'#ffffff',text:'#252c38',mutedText:'#566172',secondary:'#47316b',headerBackground:'#161020',headerText:'#ffffff',logoLight:'https://example.com/logo-white.svg',logoDark:'https://example.com/logo-dark.svg'};
test('brand roles survive normalize and share without altering legacy projects',async()=>{
 assert.equal(normalizeProject({}).branding,undefined);
 assert.deepEqual(normalizeProject({branding}).branding,branding);
 const link=await encodeProject({branding},'https://demo.example/');
 assert.deepEqual((await decodeProject(new URL(link).hash)).branding,branding);
});
test('unsafe and empty brand data is dropped',()=>{
 assert.equal(normalizeProject({branding:{text:'red;}</style><script>',logoLight:'javascript:alert(1)',logoDark:'https://secret@example.com/a'}}).branding,undefined);
 assert.deepEqual(normalizeProject({branding:{text:'#ABCDEF',unknown:'anything'}}).branding,{text:'#abcdef'});
});
test('brand colors override all templates and the selected logo matches header contrast',()=>{
 const html=renderDemo({name:'Original',logo:'https://example.com/legacy.svg',branding,templateId:'studio'});
 assert.match(html,/--brand-background:#f7f2eb/);
 assert.match(html,/<a class="brand"[^>]*><span class="brand-mark"><img src="https:\/\/example.com\/logo-white.svg"/);
 const light=renderDemo({branding:{...branding,headerBackground:'#ffffff'}});
 assert.match(light,/<a class="brand"[^>]*><span class="brand-mark"><img src="https:\/\/example.com\/logo-dark.svg"/);
 assert.doesNotMatch(html,/brand-caption/);
});
test('root branding applies to subpages and local logo URLs are made absolute',async()=>{
 const html=renderDemo({branding,pages:[{source:'https://example.com/about',branding:{headerBackground:'#ffffff'},headline:'About'}]});
 const headers=[...html.matchAll(/<header\b[\s\S]*?<\/header>/g)].map(match=>match[0]);
 const footers=[...html.matchAll(/<footer\b[\s\S]*?<\/footer>/g)].map(match=>match[0]);
 assert.equal(headers.length,3);
 assert.equal(footers.length,3);
 for(const region of [...headers,...footers])assert.equal((region.match(/<img src="https:\/\/example.com\/logo-white.svg"/g)||[]).length,1);
 const link=await encodeProject({branding:{logoDark:'/assets/logo.png'}},'https://demo.example/');
 assert.equal((await decodeProject(new URL(link).hash)).branding.logoDark,'https://demo.example/assets/logo.png');
});

test('logo tone requires transparent pixels and strong evidence',async()=>{
 const {logoTone}=await import('../public/branding.mjs');
 const pixels=(r,g,b,a=255)=>new Uint8ClampedArray([...Array(30).fill([0,0,0,0]).flat(),...Array(70).fill([r,g,b,a]).flat()]);
 assert.equal(logoTone(pixels(255,255,255)),'light');
 assert.equal(logoTone(pixels(20,20,20)),'dark');
 assert.equal(logoTone(pixels(120,100,160)),'');
 assert.equal(logoTone(new Uint8ClampedArray(Array(100).fill([255,255,255,255]).flat())),'');
});
