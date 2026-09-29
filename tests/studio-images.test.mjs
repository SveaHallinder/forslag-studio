import test from 'node:test';
import assert from 'node:assert/strict';
import {createStudioImageOptions} from '../public/studio-images.mjs';
import {escapeHTML} from '../public/render.mjs';

const values=html=>[...html.matchAll(/<option value="([^"]+)"( selected)?>(.*?)<\/option>/g)].map(([,value,selected,label])=>({value,selected:!!selected,label}));

test('large embedded images use short options and round-trip to their exact original URLs',()=>{
  const choices=createStudioImageOptions(escapeHTML),images=[{url:'data:image/png;base64,'+'A'.repeat(2_000_000),label:''},{url:'https://example.com/photo.jpg',label:'Företagets foto'}];
  const html=choices.options(images,images[0].url),options=values(html);
  assert.ok(html.length<250,'image bytes must not be copied into option values or labels');
  assert.equal(options[0].label,'Bild 1');
  assert.equal(options[0].selected,true);
  assert.equal(options[1].selected,false);
  for(let i=0;i<images.length;i++)assert.equal(choices.resolve(options[i].value),images[i].url);
  assert.equal(choices.resolve(''),'');
});

test('selected images outside the image library remain selected and can be selected again',()=>{
  const choices=createStudioImageOptions(escapeHTML),library=[{url:'https://example.com/photo.jpg',label:'Foto'}],selected='data:image/webp;base64,AAAA';
  const options=values(choices.options(library,selected));
  assert.equal(options[0].label,'Vald bild');
  assert.equal(options[0].selected,true);
  assert.equal(choices.resolve(options[0].value),selected);
  const rerendered=values(choices.options(library,choices.resolve(options[1].value)));
  assert.equal(rerendered[0].selected,true);
  assert.equal(choices.resolve(rerendered[0].value),library[0].url);
  assert.equal(choices.resolve(options[0].value),selected);
});

test('gallery filtering and reordered options keep stable references without mutating project images',()=>{
  const choices=createStudioImageOptions(escapeHTML),images=[{url:'https://example.com/a.png',label:'A'},{url:'https://example.com/b.png',label:'B'}],snapshot=JSON.stringify(images);
  const options=values(choices.options(images));
  const gallery=values(choices.options(images.slice(1))),reordered=values(choices.options([...images].reverse()));
  assert.equal(gallery[0].value,options[1].value);
  assert.equal(reordered[0].value,options[1].value);
  assert.equal(choices.resolve(gallery[0].value),images[1].url);
  assert.equal(JSON.stringify(images),snapshot);
});

test('references from another project cannot select a new image and labels stay escaped',()=>{
  const choices=createStudioImageOptions(escapeHTML),old=values(choices.options([{url:'https://example.com/old.png',label:'Old'}]))[0].value;
  choices.clear();
  const fresh=values(choices.options([{url:'https://example.com/new.png',label:'<img onerror="bad"> & Test'}]))[0];
  assert.equal(choices.resolve(old),null);
  assert.notEqual(fresh.value,old);
  assert.equal(fresh.label,'&lt;img onerror=&quot;bad&quot;&gt; &amp; Test');
  assert.equal(choices.resolve(fresh.value),'https://example.com/new.png');
  assert.equal(choices.resolve('https://example.com/arbitrary.png'),null);
});
