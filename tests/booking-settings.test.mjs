import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCustomerSetup,validateCustomerSetup,zonedSlot} from '../public/booking-settings.mjs';
import {normalizeProject,renderDemo} from '../public/render.mjs';

const setup={timeZone:'Europe/Stockholm',duration:60,capacity:1,slots:['2027-10-10T08:00:00.000Z','2027-10-10T09:00:00.000Z'],notifyTeam:true};
test('bookings interpret company time independently of the visitors timezone',()=>{
  assert.equal(zonedSlot('2026-10-10T10:00','Europe/Stockholm'),'2026-10-10T08:00:00.000Z');
  assert.equal(zonedSlot('2026-10-10T10:00','Europe/Bucharest'),'2026-10-10T07:00:00.000Z');
  assert.equal(zonedSlot('2026-12-10T10:00','Europe/Stockholm'),'2026-12-10T09:00:00.000Z');
  assert.equal(zonedSlot('2026-10-10T10:00','UTC'),'2026-10-10T10:00:00.000Z');
});
test('invalid calendar dates and ambiguous or missing daylight saving times are rejected',()=>{
  assert.throws(()=>zonedSlot('2026-02-30T10:00','Europe/Stockholm'),/ogiltigt/);
  assert.throws(()=>zonedSlot('2026-03-29T02:30','Europe/Stockholm'),/finns inte/);
  assert.throws(()=>zonedSlot('2026-10-25T02:30','Europe/Stockholm'),/två gånger/);
  assert.throws(()=>zonedSlot('2026-04-05T01:45','Australia/Lord_Howe'),/två gånger/);
});
test('changing visit duration cannot silently open overlapping appointments',()=>{
  assert.deepEqual(validateCustomerSetup(setup),setup);
  assert.throws(()=>validateCustomerSetup({...setup,duration:90}),/överlappar/);
  for(const duration of [14,241,60.5,Infinity,''])assert.throws(()=>validateCustomerSetup({...setup,duration}),/Besökslängden/);
  for(const capacity of [0,101,1.5,Infinity])assert.throws(()=>validateCustomerSetup({...setup,capacity}),/helt antal/);
  assert.throws(()=>validateCustomerSetup({...setup,slots:[setup.slots[0],setup.slots[0]]}),/unika/);
  assert.throws(()=>validateCustomerSetup({...setup,slots:[]},{requireSlots:true}),/framtiden/);
  assert.throws(()=>validateCustomerSetup(setup,{requireSlots:true,now:Date.parse('2028-01-01')}),/framtiden/);
});
test('malformed imports normalize safely while settings survive project copies and exports',()=>{
  for(const raw of [null,[],false,'bad'])assert.equal(normalizeCustomerSetup(raw).capacity,1);
  assert.equal(normalizeCustomerSetup({capacity:Infinity,duration:Infinity,timeZone:'invalid'}).timeZone,'Europe/Stockholm');
  assert.deepEqual(normalizeCustomerSetup({slots:['2026-02-30T10:00:00.000Z']} ).slots,[]);
  const project=normalizeProject({name:'QA Café',source:'https://cafe.example.com/',customerSetup:setup,pages:[{source:'https://cafe.example.com/menu',headline:'Meny'}]});
  assert.deepEqual(normalizeProject(JSON.parse(JSON.stringify(project))).customerSetup,setup);
  assert.match(renderDemo(project),/QA Café/);
});
test('native booking links survive exports but cannot masquerade as contact forms',()=>{
  const url='https://studio.example.com/booking.html?form='+crypto.randomUUID(),project=normalizeProject({name:'QA Café',customerSetup:setup,requestForm:{kind:'booking',url},cta:'Boka besök',ctaHref:url});
  assert.equal(project.requestForm.url,url);assert.match(renderDemo(project),new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.equal(normalizeProject({requestForm:{kind:'contact',url}}).requestForm,undefined);
});
