import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProject,renderDemo,escapeHTML} from '../public/render.mjs';
import {pageSectionPlan,pageDesignFamily} from '../public/page-design.mjs';

const image='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const secondImage='data:image/gif;base64,R0lGODlhAQABAIAAAP8AAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const longCopy='Originaltexten behåller innehåll och samband med sin egen bild. '.repeat(7).trim();
const original={name:'Originalföretaget',source:'https://example.com/original',headline:'Originalets huvudrubrik',description:'Originalets introduktion.',importedAt:'today',hero:image,accent:'#9c4935',navigation:[{label:'Aktuellt',href:'#aktuellt'},{label:'Böcker',href:'#bocker'}],cards:[
  {title:'Aktuellt',anchor:'aktuellt'},
  {title:'Ny föreläsning',description:'Originalets inbjudan till föreläsningen.',href:'https://example.com/evenemang'},
  {title:'Intervjun',description:'Originalets intervju, med tillhörande fotografi.',gallery:[{url:image,label:'Intervjubild',caption:'Fotografi från intervjun.'}]},
  {title:'Samtal i podden',description:'Två bilder från samma samtal.',gallery:[{url:image,label:'Omslag ett',caption:'Originalets första bildtext.'},{url:secondImage,label:'Omslag två',caption:'Originalets andra bildtext.'}]},
  {title:'Författare',description:'Originalets introduktion till de utgivna böckerna.',anchor:'bocker'},
  {title:'Första boken',description:longCopy,gallery:[{url:image,label:'Bokomslag första boken',caption:'Första omslaget.'}]},
  {title:'Andra boken',description:longCopy,gallery:[{url:secondImage,label:'Book cover second',caption:'Andra omslaget.'}]},
  {title:'Utvalda platser',anchor:'platser'},
  {title:'Första platsen',description:'Storlek: 5 kvm',image},
  {title:'Andra platsen',description:'Storlek: 8 kvm',image:secondImage},
  {title:'Ett urval av våra partners',gallery:[{url:image,label:'Partner ett'},{url:secondImage,label:'Partner två'}]},
  {title:'Mer information',href:'https://example.com/information'},
  {title:'Längre berättelse',description:longCopy,gallery:[{url:image,label:'Originalfotografi',presentation:{fit:'contain',ratio:'portrait',x:23,y:71}}]},
  {title:'En annan berättelse',description:longCopy,image:secondImage}
]};

const articles=html=>[...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(match=>match[0]);

test('page plan identifies chapters, news, books, showcases and partners without changing content',()=>{
  const p=normalizeProject(original),before=JSON.stringify(p),plan=pageSectionPlan(p.cards);
  assert.deepEqual(plan.map(item=>item.role),['chapter','dispatch','news','collection','introduction','publication','publication','chapter','showcase','showcase','logos','index','feature','feature']);
  assert.equal(plan[8].position,0);assert.equal(plan[9].position,1);
  assert.equal(plan[12].side,0);assert.equal(plan[13].side,1);
  assert.equal(JSON.stringify(p),before);
});

test('book treatment requires book artwork evidence and does not capture similarly named theater',()=>{
  const cards=normalizeProject({cards:[{title:'Mammorna',description:longCopy,gallery:[{url:image,label:'Bokomslag Mammorna'}]},{title:'Mammorna 2021',description:longCopy,gallery:[{url:secondImage,label:'Teateraffisch Mammorna'}]}]}).cards;
  assert.equal(pageSectionPlan(cards)[0].role,'publication');
  assert.equal(pageSectionPlan(cards)[1].role,'feature');
});

for(const templateId of ['atelier','cinema','pop','precision','story','wellness','hospitality','construction','consulting','retail']) {
  test(`${templateId} keeps source card order, copy, destinations and image associations`,()=>{
    const p=normalizeProject({...original,templateId}),before=JSON.stringify(p),html=renderDemo(p),rendered=articles(html);
    assert.equal(rendered.length,p.cards.length);
    assert.ok(html.includes(`href="${p.source}"`));
    p.cards.forEach((card,index)=>{
      const article=rendered[index];
      assert.ok(article.includes(escapeHTML(card.title)),`title ${index}`);
      for(const part of card.description.split(/\n\s*\n/))if(part)assert.ok(article.includes(escapeHTML(part)),`copy ${index}`);
      if(card.anchor)assert.ok(article.includes(`id="${card.anchor}"`),`anchor ${index}`);
      if(card.href)assert.ok(article.includes(`href="${escapeHTML(card.href)}"`),`destination ${index}`);
      const expected=card.gallery?.length?card.gallery.map(item=>item.url):card.image?[card.image]:[];
      assert.deepEqual([...article.matchAll(/<img src="([^"]+)"/g)].map(match=>match[1]),expected,`images ${index}`);
      for(const item of card.gallery||[])if(item.caption)assert.ok(article.includes(escapeHTML(item.caption)),`caption ${index}`);
    });
    assert.equal(JSON.stringify(p),before);
  });
}

test('manual image framing is retained in every full-page family',()=>{
  for(const templateId of ['atelier','cinema','pop','precision','story','wellness','hospitality','construction','consulting','retail']) {
    const article=articles(renderDemo({...original,templateId}))[12];
    assert.match(article,/object-fit:contain!important;object-position:23% 71%!important;/);
    assert.match(article,/aspect-ratio:3\/4!important/);
  }
});

test('four art directions have independent body families while classic story remains gallery',()=>{
  const expected={atelier:'editorial',cinema:'cinematic',pop:'playful',precision:'structured',story:'gallery'};
  assert.equal(new Set(Object.keys(expected).slice(0,4).map(pageDesignFamily)).size,4);
  for(const [templateId,family]of Object.entries(expected)) {
    assert.equal(pageDesignFamily(templateId),family);
    assert.match(renderDemo({...original,templateId}),new RegExp(`data-page-design="${family}"`));
  }
});

test('empty content introduces no article or fake image',()=>{
  assert.deepEqual(pageSectionPlan([]),[]);
  for(const templateId of ['atelier','cinema','pop','precision','story','wellness','hospitality','construction','consulting','retail']) {
    const html=renderDemo({name:'Tomt exempel',templateId,importedAt:'today',cards:[]});
    assert.equal(articles(html).length,0);
    assert.doesNotMatch(html,/<img\b/);
  }
});
