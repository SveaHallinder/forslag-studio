import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeProject,renderDemo} from '../public/render.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';
const a='https://example.com/a.jpg',b='https://example.com/b.jpg';
const gallery=[{url:a,label:'Bild A',caption:'Första bildtext'},{url:b,label:'Bild B',caption:'Andra bildtext'}];
const raw={name:'Galleri',headline:'Hej',importedAt:'today',hero:a,heroGallery:gallery,cards:[{title:'Team',image:a,gallery,anchor:'team'}]};
test('galleries preserve image order and captions through normalized customer links',async()=>{
 const p=normalizeProject(raw);assert.deepEqual(p.cards[0].gallery,gallery);assert.deepEqual(p.heroGallery,gallery);
 const copy=await decodeProject(new URL(await encodeProject(raw,'https://studio.example/demo.html')).hash);assert.deepEqual(copy.cards[0].gallery,gallery);assert.deepEqual(copy.heroGallery,gallery);
 assert.equal(normalizeProject({cards:[{title:'Old',image:a}]}).cards[0].gallery,undefined);
});
test('multi-image sections render each picture with its caption without duplicates',()=>{
 const html=renderDemo({...raw,hero:'',heroGallery:undefined});
 assert.equal((html.match(/src="https:\/\/example.com\/a.jpg"/g)||[]).length,1);assert.equal((html.match(/src="https:\/\/example.com\/b.jpg"/g)||[]).length,1);
 assert.ok(html.includes('<figcaption>Andra bildtext</figcaption>'));assert.ok(html.includes('content-multi'));assert.ok(html.indexOf(a)<html.indexOf(b));
});
test('unsafe gallery images are discarded, captions escaped and collections bounded',()=>{
 const p=normalizeProject({cards:[{title:'Test',gallery:[{url:'javascript:alert(1)'},...Array.from({length:20},(_,i)=>({url:`https://example.com/${i}.jpg`,caption:'<img onerror=alert(1)>'}))]}]});
 assert.equal(p.cards[0].gallery.length,12);assert.equal(p.cards[0].image,'https://example.com/0.jpg');assert.ok(!renderDemo(p).includes('<img onerror'));
});
