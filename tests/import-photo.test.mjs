import test from 'node:test';import assert from 'node:assert/strict';
import {chooseImportPhoto} from '../public/import-photo.mjs';
const photo=(url,width,height,label='')=>({url,width,height,label});
test('readable photography wins over a small thumbnail only within supplied candidates',()=>{
 const small=photo('/thumb.jpg',320,240),large=photo('/photo.jpg',1600,1000),input=[small,large];assert.equal(chooseImportPhoto(input),large);assert.deepEqual(input,[small,large]);
});
test('certifications, tracking pixels and icons cannot become a hero',()=>{
 const support=photo('/iso-certificate.jpg',1800,1200,'ISO 9001 certificate'),real=photo('/studio.jpg',1200,800);assert.equal(chooseImportPhoto([support,real]),real);assert.equal(chooseImportPhoto([support]),undefined);assert.equal(chooseImportPhoto([photo('/tracking.gif',1,1)]),undefined);
});
test('unknown dimensions and equivalent image quality retain authored order',()=>{
 const first=photo('/original.jpg',0,0),other=photo('/other.jpg',2000,1200);assert.equal(chooseImportPhoto([first,other]),first);
 const a=photo('/one.jpg',1600,1000),b=photo('/two.jpg',2000,1250);assert.equal(chooseImportPhoto([a,b]),a);
});
test('section images retain certification content when explicitly allowed',()=>{
 const support=photo('/certificate.jpg',1200,800);assert.equal(chooseImportPhoto([support],{hero:false}),support);
});
test('relevant source words beat a bigger unrelated photo within the same block',()=>{
 const coffee=photo('/kaffe.jpg',800,600,'Kaffe hos oss'),team=photo('/team.jpg',2000,1200,'Vårt team');assert.equal(chooseImportPhoto([team,coffee],{context:'Kaffe och nybakat'}),coffee);
});
