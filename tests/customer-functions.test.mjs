import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareCustomerFunctions,customerFunctionURL,customerFunctionLinks} from '../public/customer-functions.mjs';
import {renderDemo} from '../public/render.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';

const project={name:'Café QA',headline:'Kaffe för hela dagen.',email:'hello@example.com',cta:'Prata med oss',ctaHref:'mailto:hello@example.com',navigation:[{label:'Meny',href:'#erbjudande'}],cards:[{title:'Meny'}]};
const input={email:project.email,booking:'https://booking.example.com/table',payment:'https://buy.stripe.com/fixture',primary:'booking'};
test('booking and payment coexist in the menu, primary button and public customer copy',async()=>{
  const before=JSON.stringify(project),next=prepareCustomerFunctions(project,input);
  assert.equal(JSON.stringify(project),before);assert.equal(next.ctaHref,input.booking);assert.equal(next.cta,'Boka besök');
  assert.deepEqual(next.navigation,[...project.navigation,{label:'Boka besök',href:input.booking},{label:'Till betalning',href:input.payment}]);
  const restored=await decodeProject(new URL(await encodeProject(next,'https://studio.example.com/demo.html')).hash);
  assert.deepEqual(restored.navigation,next.navigation);assert.equal(restored.ctaHref,input.booking);
  const html=renderDemo(restored);assert.ok(html.includes(input.booking));assert.ok(html.includes(input.payment));assert.match(html,/rel="noopener noreferrer"/);
  const header=html.match(/<header[\s\S]*?<\/header>/)[0];assert.match(header,/<a class="nav-action" href="https:\/\/booking.example.com\/table" data-nav-priority="true"/);
});
test('unsafe or private customer URLs and invalid contact details fail explicitly',()=>{
  for(const url of ['http://booking.example.com','javascript:alert(1)','https://user:password@example.com','https://127.0.0.1','https://[::1]','https://server.local','https://server.test','https://localhost','https://localhost:4183','/checkout'])assert.throws(()=>customerFunctionURL(url,'Bokning'),/Bokning:/);
  assert.equal(customerFunctionURL('','Bokning'),'');assert.throws(()=>prepareCustomerFunctions(project,{...input,email:'broken'}),/giltiga mejladress/);
  for(const email of ['hello@example.com?bcc=other@example.com','a'.repeat(150)+'@example.com'])assert.throws(()=>prepareCustomerFunctions(project,{...input,email}),/giltiga mejladress/);
});
test('editing an existing function preserves its label and updates the connected primary button',()=>{
  const original={...project,cta:'Boka bord',ctaHref:'https://booking.example.com/old',navigation:[...project.navigation,{label:'Boka bord',href:'https://booking.example.com/old'}]};
  const next=prepareCustomerFunctions(original,{...input,primary:'keep'});
  assert.equal(next.cta,'Boka bord');assert.equal(next.ctaHref,input.booking);assert.equal(customerFunctionLinks(next).booking[0].label,'Boka bord');
  const chosen=prepareCustomerFunctions(original,input);assert.match(renderDemo(chosen).match(/<header[\s\S]*?<\/header>/)[0],/<a class="nav-action" href="https:\/\/booking.example.com\/table" data-nav-priority="true"/);
  assert.throws(()=>prepareCustomerFunctions(original,{...input,booking:'',primary:'keep'}),/borttagna länken/);
});
test('contact route is validated and updated without leaving a stale primary email',()=>{
  const next=prepareCustomerFunctions(project,{...input,email:'new@example.com',primary:'keep'});assert.equal(next.ctaHref,'mailto:new@example.com');
  assert.throws(()=>prepareCustomerFunctions(project,{...input,email:'',primary:'keep'}),/Mejladressen används/);
  const phone=prepareCustomerFunctions({...project,email:'',phone:'+46 70 123 45 67'},{...input,email:'',primary:'contact'});assert.equal(phone.ctaHref,'tel:+46701234567');
  assert.throws(()=>prepareCustomerFunctions({...project,email:'',phone:''},{...input,email:'',primary:'contact'}),/mejladress eller telefon/);
  assert.throws(()=>prepareCustomerFunctions(project,{...input,payment:'',primary:'payment'}),/giltig länk/);
});
test('ambiguous or full menus are never truncated or silently reassigned',()=>{
  const full={...project,navigation:Array.from({length:12},(_,i)=>({label:'Sida '+i,href:'https://example.com/'+i}))};
  assert.throws(()=>prepareCustomerFunctions(full,input),/Menyn är full/);assert.equal(full.navigation.length,12);
  assert.throws(()=>prepareCustomerFunctions({...project,navigation:[{label:'Boka bord',href:input.booking},{label:'Bokning',href:'https://example.com/book'}]},input),/Flera bokningslänkar/);
});
test('existing booking CTAs populate the function and a chosen action follows all subpages',()=>{
  const original={...project,cta:'Boka bord',ctaHref:input.booking,pages:[{name:'Om oss',source:'https://example.com/about',headline:'Vårt café',email:project.email,cta:'Kontakt',ctaHref:project.ctaHref}]};
  assert.equal(customerFunctionLinks(original).booking[0].href,input.booking);
  const next=prepareCustomerFunctions(original,{...input,email:'new@example.com',primary:'payment'});
  assert.equal(next.pages[0].ctaHref,input.payment);assert.equal(next.pages[0].email,'new@example.com');assert.equal(next.pages[0].headline,'Vårt café');
  assert.equal(original.pages[0].ctaHref,project.ctaHref);
});
test('keeping page actions preserves unrelated destinations and rejects removal of a used link',()=>{
  const page={source:'https://example.com/about',headline:'Om oss',email:project.email,cta:'Boka bord',ctaHref:input.booking};
  const original={...project,ctaHref:'#kontakt',navigation:[...project.navigation,{label:'Boka bord',href:input.booking}],pages:[page,{...page,source:'https://example.com/work',ctaHref:'https://example.com/work'}]};
  const next=prepareCustomerFunctions(original,{...input,booking:'https://example.com/new-booking',primary:'keep'});
  assert.equal(next.pages[0].ctaHref,'https://example.com/new-booking');assert.equal(next.pages[1].ctaHref,'https://example.com/work');
  assert.throws(()=>prepareCustomerFunctions(original,{...input,booking:'',primary:'keep'}),/undersida/);
  const contact={...original,navigation:project.navigation,pages:[{...page,ctaHref:'mailto:'+project.email}]};
  assert.throws(()=>prepareCustomerFunctions(contact,{...input,email:'',primary:'keep'}),/undersida/);
});
test('a chosen payment action stays visible when the navigation overflows',()=>{
  const original={...project,navigation:[{label:'Hem',href:'#start'},{label:'Meny',href:'#erbjudande'},{label:'Kontakt',href:'#kontakt'},{label:'Galleri',href:'#gallery'},{label:'Om oss',href:'#about'}]};
  const next=prepareCustomerFunctions(original,{...input,primary:'payment'}),header=renderDemo(next).match(/<header[\s\S]*?<\/header>/)[0];
  assert.match(header,/data-menu-density="overflow"/);assert.match(header,/<a class="nav-action" href="https:\/\/buy.stripe.com\/fixture" data-nav-priority="true"/);
  assert.equal((header.match(/data-nav-priority="true"/g)||[]).length,3);
});
