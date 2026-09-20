import test from 'node:test';
import assert from 'node:assert/strict';
import {extractContent} from '../public/import-content.mjs';

test('a first photo without alt or site metadata remains a hero, not a logo',()=>{
  const previous=globalThis.DOMParser;
  const image={tagName:'IMG',textContent:'',className:'',getAttribute:name=>({src:'/photo.jpg',width:'1200',height:'800'}[name]||null)};
  globalThis.DOMParser=class {parseFromString(){return {title:'Företaget',querySelector:()=>null,querySelectorAll:selector=>selector.includes('img')?[image]:[]};}};
  try{const p=extractContent('', 'https://example.com');assert.equal(p.hero,'https://example.com/photo.jpg');assert.equal(p.logo,'');}
  finally{if(previous)globalThis.DOMParser=previous;else delete globalThis.DOMParser;}
});

test('empty JavaScript shells are errors instead of successful empty imports',()=>{
  const previous=globalThis.DOMParser;
  globalThis.DOMParser=class{parseFromString(){return {title:'',querySelector:()=>null,querySelectorAll:()=>[]};}};
  try{assert.throws(()=>extractContent('<script>loadApp()</script>','https://example.com'),/inget läsbart innehåll/i);}
  finally{if(previous)globalThis.DOMParser=previous;else delete globalThis.DOMParser;}
});

test('lazy background images and h4 service headings are included',()=>{
  const previous=globalThis.DOMParser;
  const node=(tag,text,attrs={})=>({tagName:tag,textContent:text,className:'',getAttribute:key=>attrs[key]||null});
  const nodes=[node('H2','Vi realiserar era digitala drömmar.'),node('DIV','',{'data-background':'url("/service.png")'}),node('H4','Interaktiva verktyg'),node('P','Skräddarsydda verktyg som hjälper era kunder varje dag.')];
  globalThis.DOMParser=class{parseFromString(){return {title:'HallInc - Innovation',querySelector:()=>null,querySelectorAll:selector=>selector.startsWith('script')?[]:nodes.filter(n=>selector.includes(n.tagName.toLowerCase())||n.tagName==='DIV'&&selector.includes('[data-background]'))};}};
  try{const p=extractContent('','https://hallinc.se/sv/');assert.equal(p.hero,'https://hallinc.se/service.png');assert.ok(p.cards.some(c=>c.title==='Interaktiva verktyg'));}
  finally{if(previous)globalThis.DOMParser=previous;else delete globalThis.DOMParser;}
});
