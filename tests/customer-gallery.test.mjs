import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDemo,normalizeProject} from '../public/render.mjs';
import {templates} from '../public/templates.mjs';
import {installCustomerGallery} from '../public/customer-gallery.mjs';

const first='https://example.com/first.jpg',second='https://example.com/second.jpg';
const gallery=[{url:first,label:'Första bilden',caption:'Företagets egen bildtext',presentation:{fit:'cover',x:20,y:75,ratio:'4/3'}},{url:second,label:'Andra bilden',caption:'Andra bildtexten'}];
const base={name:'Företag & vänner',headline:'Originaltext',importedAt:'today',source:'https://example.com/',logo:'https://example.com/logo.svg',hero:first,heroGallery:gallery,cards:[{title:'Utvalda bilder',anchor:'bilder',gallery}]};

test('first hero image has loading priority in every design while section images stay lazy',()=>{
  for(const {id}of templates){
    const html=renderDemo({...base,templateId:id}),images=[...html.matchAll(/<img\b[^>]+>/g)].map(m=>m[0]);
    const eager=images.filter(image=>image.includes('fetchpriority="high"'));
    assert.equal(eager.length,1,id);assert.match(eager[0],/first\.jpg/);assert.match(eager[0],/loading="eager"/);
    assert.ok(images.filter(image=>image.includes('loading="lazy"')).length>=2,id);
  }
});

test('customer viewer is installed once on standalone and multipage exports without altering the source',()=>{
  for(const input of [base,{...base,pages:[{...base,source:'https://example.com/about',headline:'Om oss'}]}]){
    const snapshot=JSON.stringify(input),html=renderDemo(input);
    assert.equal((html.match(/<script data-customer-gallery>/g)||[]).length,1);
    assert.equal(JSON.stringify(input),snapshot);
    assert.match(html,/data-gallery-title="Utvalda bilder"/);assert.match(html,/<figcaption>Företagets egen bildtext<\/figcaption>/);
    assert.deepEqual(normalizeProject(input).heroGallery,normalizeProject(base).heroGallery);
  }
});

test('gallery titles and captions are escaped and unsafe images never reach the viewer',()=>{
  const html=renderDemo({...base,cards:[{title:'</div><script>bad()</script>',gallery:[...gallery,{url:'javascript:bad()'}]}]});
  assert.doesNotMatch(html,/<script>bad|javascript:bad/);assert.match(html,/data-gallery-title="&lt;\/div&gt;&lt;script&gt;bad\(\)&lt;\/script&gt;"/);
  assert.match(html,/object-position:20% 75%/);
});

test('unsupported browsers leave images usable and install no dead controls',()=>{
  let appended=false,disposed=false;
  const doc={__disposeCustomerGallery:()=>{disposed=true;},createElement:()=>({}),defaultView:{},body:{append:()=>{appended=true;}}};
  installCustomerGallery(doc);assert.ok(disposed);assert.equal(appended,false);
});
