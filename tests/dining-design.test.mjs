import test from 'node:test';
import assert from 'node:assert/strict';
import {diningMenuLines,diningCardRole,diningMenuContent} from '../public/dining-design.mjs';
import {renderDemo,normalizeProject,escapeHTML} from '../public/render.mjs';

test('menu presentation keeps source prices and ingredients without interpreting dates or hours as prices',()=>{
  const copy='Juice 45:-\nLatte 42:-\nKYCKLINGEN 115:-\nfetaost, ägg, dressing\nMåndag 07:30 - 16:00\nSedan 1985\n';
  const rows=diningMenuLines(copy);
  assert.deepEqual(rows.filter(r=>r.price).map(r=>[r.label,r.price]),[['Juice','45:-'],['Latte','42:-'],['KYCKLINGEN','115:-']]);
  const html=diningMenuContent(copy,escapeHTML);
  for(const line of ['fetaost, ägg, dressing','Måndag 07:30 - 16:00','Sedan 1985'])assert.ok(html.includes(line));
  assert.equal(diningCardRole({title:'Utbud',description:copy},4),'menu');
  assert.equal(diningCardRole({title:'Öppet',description:'Måndag 07:30 - 16:00'},0),'hours');
  assert.notEqual(diningCardRole({title:'Afterwork',description:'På fredagar från 15:00 serveras öl för 49:- och mat från 79:-.'},9),'menu');
});

test('dining formatting preserves cards, anchors, editor descriptions, source links and assets',()=>{
  const p=normalizeProject({templateId:'dining',name:'Ett annat café',importedAt:'today',headline:'Kaffe vid torget',navigation:[{label:'Meny',href:'#meny'}],cards:[{title:'Meny',anchor:'meny'},{title:'Varma drycker',description:'Filterkaffe 35:-\nTe 30:-\nBryggt på våra egna bönor.'},{title:'Vår berättelse',description:'Originalets berättelse.',image:'https://example.com/interior.jpg'}]}),before=JSON.stringify(p),html=renderDemo(p);
  assert.equal((html.match(/<article\b/g)||[]).length,3);
  assert.match(html,/id="meny"/);
  assert.match(html,/<a class="button" href="#meny"[^>]*>Meny/);
  assert.match(html,/class="section-copy"><span class="menu-item"/);
  assert.match(html,/Originalets berättelse\./);
  assert.match(html,/src="https:\/\/example.com\/interior.jpg"/);
  assert.equal(JSON.stringify(p),before);
  assert.doesNotMatch(renderDemo({...p,templateId:'story'}),/data-dining=/);
});

test('menu text remains escaped and does not create injected elements',()=>{
  const html=diningMenuContent('<img src=x> 35:-\n<script>alert(1)</script>',escapeHTML);
  assert.doesNotMatch(html,/<img|<script/);
  assert.match(html,/&lt;img src=x&gt;/);
});

test('clock times and calendar years never turn into menu prices',()=>{
  for(const copy of ['Måndag 07.30\nTisdag 08.30','September 2025\nOktober 2026'])assert.equal(diningMenuLines(copy).filter(r=>r.price).length,0);
  assert.equal(diningCardRole({title:'Öppettider',description:'Måndag 07.30\nTisdag 08.30'},0),'hours');
  assert.equal(diningCardRole({title:'Våra arrangemang',description:'Livemusik från 18:30 varje fredag.',image:'https://example.com/gig.jpg'},1),'story');
});


test('automatic dining menu CTA stays on the homepage when subpages have different anchors',()=>{
  const html=renderDemo({templateId:'dining',source:'https://cafe.example/',navigation:[{label:'Meny',href:'#menu'}],cards:[{title:'Meny',anchor:'menu'}],pages:[{source:'https://cafe.example/about',headline:'Om oss',cards:[{title:'Historia',anchor:'history'}]}]});
  const subpage=html.match(/<template data-demo-page="1">([\s\S]*?)<\/template>/)[1];
  assert.doesNotMatch(subpage,/<a class="button" href="#menu"/);
  assert.match(html,/<a class="button" href="#menu"/);
});
