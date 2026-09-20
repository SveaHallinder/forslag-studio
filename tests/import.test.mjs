import test from 'node:test';
import assert from 'node:assert/strict';
import {extractContent} from '../public/import-content.mjs';

test('a first photo without alt or site metadata remains a hero, not a logo',()=>{
  const previous=globalThis.DOMParser;
  const image={tagName:'IMG',textContent:'',className:'',getAttribute:name=>({src:'/photo.jpg',width:'1200',height:'800'}[name]||null)};
  globalThis.DOMParser=class {parseFromString(){return {title:'Företaget',querySelector:()=>null,querySelectorAll:selector=>selector.startsWith('script')?[]:[image]};}};
  try{const p=extractContent('', 'https://example.com');assert.equal(p.hero,'https://example.com/photo.jpg');assert.equal(p.logo,'');}
  finally{if(previous)globalThis.DOMParser=previous;else delete globalThis.DOMParser;}
});
