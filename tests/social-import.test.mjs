import test from 'node:test';
import assert from 'node:assert/strict';
import {readSocialProfiles} from '../public/social-import.mjs';
import {socialProfileURL} from '../public/social-content.mjs';
const profiles=['https://instagram.com/acme/','https://facebook.com/acme/','https://tiktok.com/@acme/'].map(socialProfileURL);
const readable=(name='Acme',photos=[])=>({status:'read',name,bio:'Företagets egna ord.',avatar:'https://images.example/avatar.jpg',photos});

test('a blocked first profile does not hide content from a readable second platform',async()=>{
  const calls=[],result=await readSocialProfiles(profiles,async(_path,options)=>{const url=JSON.parse(options.body).url;calls.push(url);return url.includes('facebook')?Response.json(readable()):new Response('blocked',{status:403});});
  assert.deepEqual(calls,profiles.map(p=>p.url));assert.equal(result.name,'Acme');assert.equal(result.status,'read');assert.match(result.warning,/1 av 3/);
});
test('matching profiles combine photos once without treating avatars as business photos',async()=>{
  const result=await readSocialProfiles(profiles,async()=>Response.json(readable('Acme Café',[{url:'https://images.example/store.jpg'},{url:'https://images.example/coffee.jpg'}])));
  assert.equal(result.photos.length,2);assert.ok(result.photos.every(p=>p.url!==result.avatar));assert.match(result.warning,/3 av 3/);
});
test('photos from an unrelated business are not silently merged into the first profile',async()=>{
  const values=[{url:'https://instagram.com/acme/',handle:'acme'},{url:'https://facebook.com/unrelated/',handle:'unrelated'}];
  const result=await readSocialProfiles(values,async(_path,options)=>Response.json(JSON.parse(options.body).url.includes('unrelated')?readable('Other shop',[{url:'https://images.example/other.jpg'}]):readable()));
  assert.equal(result.photos.length,0);assert.match(result.warning,/olika företagsnamn/);
});
test('duplicate URLs consume one request and all failures leave a useful manual path',async()=>{
  let calls=0;const result=await readSocialProfiles([profiles[0],profiles[0]],async()=>{calls++;throw new TypeError('Network unavailable');});
  assert.equal(calls,1);assert.equal(result.status,'limited');assert.deepEqual(result.photos,[]);assert.match(result.warning,/Klistra in profiltexten/);
});
