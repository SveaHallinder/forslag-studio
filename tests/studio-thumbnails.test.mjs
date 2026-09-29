import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTemplateThumbnail} from '../public/design-workbench.mjs';
import {normalizeProject,renderDemo} from '../public/render.mjs';

const project=()=>normalizeProject({
  name:'Företagets identitet',source:'https://example.com/',headline:'Startsidan',templateId:'story',accent:'#db4731',logo:'https://example.com/root-logo.png',
  branding:{background:'#faf5ed',text:'#222222'},typography:{heading:'Georgia',body:'Verdana'},navigation:[{label:'Om oss',href:'https://example.com/about'}],
  pages:[{source:'https://example.com/about',headline:'Aktuella undersidans rubrik',name:'Sidans namn',logo:'https://example.com/wrong-logo.png',description:'Endast den aktiva sidans innehåll',cards:[{title:'Aktuellt block',image:'https://example.com/current-image.jpg'}]},{source:'https://example.com/hidden',headline:'ANNAN UNDERSIDA',cards:[{title:'Ska inte hamna i miniatyren',image:'https://example.com/other-image.jpg'}]}],
});

test('template thumbnails render the current page with the root identity and selected template',()=>{
  const p=project(),html=renderTemplateThumbnail(p,p.pages[0],'atelier');
  assert.match(html,/Aktuella undersidans rubrik/);
  assert.match(html,/Endast den aktiva sidans innehåll/);
  assert.match(html,/current-image\.jpg/);
  assert.match(html,/Företagets identitet/);
  assert.match(html,/root-logo\.png/);
  assert.match(html,/href="https:\/\/example.com\/about"/);
  assert.match(html,/data-template="atelier"/);
  assert.match(html,/--accent:#db4731/);
  assert.match(html,/#faf5ed/);
  assert.match(html,/font-family:"Verdana"/);
  assert.doesNotMatch(html,/wrong-logo\.png|ANNAN UNDERSIDA|other-image\.jpg|data-demo-pages|data-demo-page=/);
});

test('home thumbnails omit subpages without modifying the saved project or full demo/export',()=>{
  const p=project(),before=JSON.stringify(p),thumbnail=renderTemplateThumbnail(p);
  assert.match(thumbnail,/<h1[^>]*>Startsidan<\/h1>/);
  assert.doesNotMatch(thumbnail,/ANNAN UNDERSIDA|Aktuella undersidans rubrik|data-demo-pages/);
  assert.equal(JSON.stringify(p),before);
  assert.equal(p.pages.length,2);
  const demo=renderDemo(p,{pageSource:p.pages[0].source});
  assert.match(demo,/data-demo-initial="1"/);
  assert.match(demo,/data-demo-pages/);
  assert.match(demo,/data-demo-page="2"/);
  assert.match(demo,/ANNAN UNDERSIDA/);
  assert.match(demo,/Aktuella undersidans rubrik/);
});
