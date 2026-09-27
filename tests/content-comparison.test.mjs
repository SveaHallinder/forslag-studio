import test from 'node:test';import assert from 'node:assert/strict';
import {compareContent} from '../public/content-comparison.mjs';
test('missing source snapshot is explicit',()=>assert.deepEqual(compareContent(null,{}),[]));
test('card moves are not missing text and altered text points to current index',()=>{
 const original={headline:'A',description:'Copy',cards:[{anchor:'a',title:'A',description:'First'},{anchor:'b',title:'B',description:'Second'}]};
 const current={...original,cards:[{...original.cards[1],description:'Changed'},original.cards[0]]};
 const diff=compareContent(original,current);assert.equal(diff.filter(d=>d.kind==='removed').length,0);assert.ok(diff.some(d=>d.target?.index===0&&d.target?.field==='description'));
});
test('removed blocks and removed original sentences remain visible in comparison',()=>{
 const diff=compareContent({description:'Full original',cards:[{anchor:'a',title:'Gone',description:'Keep me'}]},{description:'Shorter',cards:[]});
 assert.ok(diff.some(d=>d.kind==='removed'&&d.before.includes('Keep me')));assert.ok(diff.some(d=>d.before==='Full original'&&d.after==='Shorter'));
});
test('image and navigation changes do not claim semantic correctness',()=>{
 const diff=compareContent({hero:'https://a.test/old',navigation:[{label:'Home',href:'#start'}],cards:[]},{hero:'https://a.test/new',navigation:[],cards:[]});
 assert.ok(diff.some(d=>d.target?.type==='image'));assert.ok(diff.some(d=>d.target?.type==='navigation'));assert.ok(diff.every(d=>!d.label.includes('korrekt')));
});
test('secondary hero images and gallery captions are included in comparison',()=>{
 const a={hero:'https://a.test/a',heroGallery:[{url:'https://a.test/a'},{url:'https://a.test/b',caption:'Original'}],cards:[{title:'Team',gallery:[{url:'https://a.test/c',caption:'Anna'}]}]};
 const b={...a,heroGallery:[a.heroGallery[0]],cards:[{title:'Team',gallery:[{url:'https://a.test/c',caption:'Maria'}]}]};
 const diff=compareContent(a,b);assert.ok(diff.some(d=>d.target?.scope==='hero'&&d.before.includes('Original')));assert.ok(diff.some(d=>d.target?.scope==='0'&&d.before.includes('Anna')&&d.after.includes('Maria')));
});
