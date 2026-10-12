import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDemo,normalizeProject,escapeHTML} from '../public/render.mjs';
import {signatureDesignCSS} from '../public/signature-design.mjs';
import {templates} from '../public/templates.mjs';

const ids=['story','studio','editorial','cinema','pop','gallery','poster'];
const image='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const original={name:'Kundens egna företag',headline:'En egen rubrik',description:'Kundens introduktion',importedAt:'today',hero:image,cta:'Fråga om projektet',ctaHref:'#kontakt',email:'hej@example.com',navigation:[{label:'Projekt',href:'#projekt'},{label:'Kontakt',href:'#kontakt'}],cards:[
  {title:'Projekt',anchor:'projekt'},
  {title:'Första projektet',description:'Kundens bildtext.',image},
  {title:'Andra projektet',description:'Det här innehållet hör till andra bilden.',gallery:[{url:image,label:'Kundens bild',caption:'Originalets bildtext',presentation:{fit:'contain',ratio:'portrait',x:12,y:74}}]},
  {title:'Längre berättelse',description:'Hela originaltexten ska finnas kvar. '.repeat(40),image},
  {title:'Nästa steg',href:'https://example.com/projekt'},
]};

for(const templateId of ids)test(`${templateId} preserves content, image framing, editor indices and contact destinations`,()=>{
  const project=normalizeProject({...original,templateId}),snapshot=JSON.stringify(project),html=renderDemo(project);
  const cards=[...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(item=>item[0]);
  assert.equal(cards.length,project.cards.length);
  project.cards.forEach((card,index)=>{
    assert.ok(cards[index].includes(escapeHTML(card.title)));
    if(card.description)assert.ok(cards[index].replace(/<span class="copy-part">|<\/span>/g,'').includes(escapeHTML(card.description)));
    if(card.anchor)assert.ok(cards[index].includes(`id="${card.anchor}"`));
    if(card.href)assert.ok(cards[index].includes(`href="${card.href}"`));
    assert.deepEqual([...cards[index].matchAll(/<img src="([^"]+)"/g)].map(item=>item[1]),card.gallery?.map(item=>item.url)||[card.image].filter(Boolean));
  });
  assert.match(cards[2],/object-fit:contain!important;object-position:12% 74%!important/);
  assert.match(html,/href="mailto:hej@example.com"/);
  assert.match(html,/aria-label="Huvudmeny"/);
  assert.match(html,/aria-label="Sidfotsmeny"/);
  assert.equal(JSON.stringify(project),snapshot);
});

test('only selected signature ships and customer typography follows it',()=>{
  for(const templateId of ids){
    const html=renderDemo({...original,templateId,typography:{heading:'Georgia',body:'Arial'}});
    assert.match(html,new RegExp(`Signature: ${templateId};`));
    for(const other of ids.filter(id=>id!==templateId))assert.ok(!html.includes(`Signature: ${other};`));
    assert.ok(html.indexOf('Signature:')<html.lastIndexOf('font-family:"Georgia"'));
  }
  for(const {id} of templates.filter(template=>!ids.includes(template.id)))assert.equal(signatureDesignCSS(normalizeProject({templateId:id})), '');
});

test('text-only signatures retain honest empty contact states without fake photos',()=>{
  for(const templateId of ids){
    const html=renderDemo({templateId,name:'Företaget',importedAt:'today',cards:[]});
    assert.match(html,/data-hero="text"/);
    assert.match(html,/Kontaktuppgifter saknas/);
    assert.doesNotMatch(html,/<img\b|<article\b/);
  }
});
