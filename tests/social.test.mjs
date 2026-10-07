import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {socialProfileURL,extractSocialProfile,socialProfileDetails} from '../public/social-content.mjs';
import {createSocialProject} from '../public/social-project.mjs';
import {normalizeProject,renderDemo} from '../public/render.mjs';
import {readSocialProfile,createWorker} from '../worker.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';
import {assessProject,restoreProject} from '../public/project-tools.mjs';

test('social profiles are canonical, bounded and separate from posts or login pages',()=>{
  assert.equal(socialProfileURL('instagram.com/little.beans/?igsh=tracking').url,'https://www.instagram.com/little.beans/');
  assert.equal(socialProfileURL('https://m.facebook.com/LittleBeans/').platform,'Facebook');
  assert.equal(socialProfileURL('https://tiktok.com/@little.beans').handle,'little.beans');
  for(const value of ['https://instagram.com.evil.com/cafe','http://instagram.com/cafe','https://user:password@instagram.com/cafe','https://instagram.com/p/post','https://instagram.com/accounts/login','https://facebook.com/sharer','https://tiktok.com/t/random','https://127.0.0.1/cafe'])assert.throws(()=>socialProfileURL(value));
});
const profileHTML=JSON.stringify({data:{user:{username:'little.beans',full_name:'Little Beans',biography:'Coffee & conversation.\nWelcome to our little café.',profile_pic_url:'https://cdn.example/avatar.jpg',edge_owner_to_timeline_media:{edges:[{node:{display_url:'https://cdn.example/small.jpg',display_resources:[{src:'https://cdn.example/small.jpg',config_width:300},{src:'https://cdn.example/coffee.jpg',config_width:1080}],edge_media_to_caption:{edges:[{node:{text:'A real coffee photo'}}]}}}]}}}});
test('public JSON retains source copy, selects the large post image and separates the avatar',()=>{
  const p=extractSocialProfile(`<script type="application/json">${profileHTML}</script>`,'https://instagram.com/little.beans/');
  assert.equal(p.status,'read');assert.equal(p.name,'Little Beans');assert.match(p.bio,/Coffee & conversation/);assert.equal(p.avatar,'https://cdn.example/avatar.jpg');assert.equal(p.photos[0].url,'https://cdn.example/coffee.jpg');assert.equal(p.photos[0].label,'A real coffee photo');
  assert.equal(p.photos.some(i=>i.url===p.avatar),false);
});
test('login walls and the wrong profile cannot become a fabricated company',()=>{
  for(const html of ['<meta property="og:title" content="Instagram"><meta property="og:description" content="Log in to Instagram">',`<script type="application/json">${profileHTML.replaceAll('little.beans','different.company')}</script>`]){
    const p=extractSocialProfile(html,'https://instagram.com/little.beans/');assert.equal(p.status,'limited');assert.equal(p.bio,'');assert.deepEqual(p.photos,[]);
  }
  const p=extractSocialProfile('<meta content="Another Café (@another.cafe) • Instagram photos and videos" property="og:title"><meta property="og:description" content="20 followers, 10 following, 2 posts - Another Café on Instagram: &quot;Our public café bio&quot;">','https://instagram.com/another.cafe/');assert.equal(p.name,'Another Café');assert.equal(p.bio,'Our public café bio');
  const other=extractSocialProfile('<meta property="og:title" content="Other company (@other.company) • Instagram"><meta property="og:description" content="Our public biography">','https://instagram.com/little.beans/');assert.equal(other.status,'limited');assert.equal(other.name,'');
});
test('profile facts require explicit address and opening-hours lines, never guessed details',()=>{
  assert.deepEqual(socialProfileDetails('Specialty coffee\n📍 10 Public Street\nWeekdays: 08:00-17:00\nWeekends: 10:00-19:00'),{address:'10 Public Street',hours:'Weekdays: 08:00-17:00\nWeekends: 10:00-19:00'});
  assert.deepEqual(socialProfileDetails('10 Public Street\nGood coffee since 2010\nMondays bring your friends'),{address:'',hours:''});
});
test('a blocked platform gives a manual intake; unsafe addresses never trigger a fetch',async()=>{
  let calls=0;const p=await readSocialProfile('https://instagram.com/little.beans/',async()=>{calls++;return new Response('',{status:403});});
  assert.equal(p.status,'limited');assert.equal(calls,1);assert.equal(p.name,'');assert.match(p.warning,/Klistra in/);
  await assert.rejects(readSocialProfile('https://example.com/not-social',async()=>{calls++;}),/profil/);assert.equal(calls,1);
  const redirected=await readSocialProfile('https://instagram.com/little.beans/',async url=>url.includes('/accounts/')?new Response('<h1>Log in</h1>',{headers:{'Content-Type':'text/html'}}):new Response(null,{status:302,headers:{Location:'/accounts/login/'}}));assert.equal(redirected.status,'limited');
});
test('social route is same-origin and invalid profile URLs return actionable errors',async()=>{
  const request=(url,origin='https://studio.example')=>new Request('https://studio.example/api/social',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({url})});
  assert.equal((await createWorker({}).fetch(request('https://instagram.com/cafe','https://other.example'))).status,403);
  const response=await createWorker({}).fetch(request('https://example.com/cafe'));assert.equal(response.status,400);assert.match((await response.json()).error,/profil/);
});
const draft={links:'https://instagram.com/little.beans/\nhttps://facebook.com/LittleBeans/',name:'Little Beans',industry:'cafe',language:'en',bio:'Our own short bio.',about:'Our real story.',offer:'Filter coffee\nEspresso',hours:'Mon–Fri 09–17',address:'10 Public Street, Town',photos:[{url:'https://cdn.example/hero.jpg',role:'hero',label:'Entrance'},{url:'https://cdn.example/cup.jpg',role:'offer',label:'Our coffee'},{url:'https://cdn.example/room.jpg',role:'gallery',caption:'Our café',label:'Our room'},{url:'https://cdn.example/rejected.jpg',role:'none'}]};
test('a new website preserves chosen photo roles and real facts, and does not guess a logo or prices',()=>{
  const p=createSocialProject(draft);assert.equal(p.templateId,'cafe');assert.equal(p.hero,draft.photos[0].url);assert.equal(p.cards[0].image,draft.photos[1].url);assert.equal(p.cards[1].gallery[0].url,draft.photos[2].url);assert.equal(p.logo,'');assert.equal(p.images.length,3);assert.ok(p.cards.some(card=>card.description===draft.hours));
  assert.equal(p.source,'https://www.instagram.com/little.beans/');assert.ok(p.navigation.some(n=>n.label==='Facebook'));assert.equal(assessProject(p).filter(c=>c.blocking&&!c.ok).length,0);
  assert.equal(assessProject(p).find(c=>c.id==='contact').ok,true);
  assert.equal(assessProject({...p,navigation:[]}).find(c=>c.id==='contact').ok,false);
  const html=renderDemo(p);for(const text of ['Our own short bio.','Our real story.','Filter coffee','10 Public Street','Mon–Fri 09–17','Our café'])assert.ok(html.includes(text));assert.doesNotMatch(html,/Pebble|Bucharest|Trustpilot|\$12|rejected.jpg/);assert.match(html,/cafe-footer/);assert.match(html,/data:font\/woff2/);assert.match(html,/lang="en"/);
});
test('social drafts survive normal project copies and customer links without a new schema',async()=>{
  const project=createSocialProject(draft),restored=restoreProject(JSON.stringify(project));assert.deepEqual(normalizeProject(restored),project);
  const url=await encodeProject(project,'https://studio.example/demo.html'),customer=await decodeProject(new URL(url).hash);assert.equal(customer.hero,project.hero);assert.deepEqual(customer.cards,project.cards);assert.deepEqual(customer.navigation,project.navigation);assert.equal(customer.templateId,'cafe');assert.equal(customer.address,project.address);
});
test('customer links store uploaded gallery primaries once and restore their roles and captions',async()=>{
  const hero='data:image/webp;base64,'+randomBytes(80000).toString('base64'),gallery='data:image/webp;base64,'+randomBytes(80000).toString('base64');
  const project=createSocialProject({...draft,photos:[{url:hero,role:'hero',caption:'Our entrance'},{url:gallery,role:'gallery',caption:'Our little place'}]});
  const url=await encodeProject(project,'https://studio.example/demo.html'),customer=await decodeProject(new URL(url).hash);
  assert.ok(url.length<220000);assert.equal(customer.hero,hero);assert.deepEqual(customer.heroGallery,project.heroGallery);assert.deepEqual(customer.cards,project.cards);
});
test('other industries and an image-free café use the same feature without inventing facts',()=>{
  for(const [industry,id] of [['restaurant','dining'],['wellness','wellness'],['retail','retail'],['construction','construction'],['services','services'],['hospitality','hospitality']])assert.equal(createSocialProject({...draft,industry}).templateId,id);
  const p=createSocialProject({...draft,photos:[],hours:'',address:'',offer:'',about:''});assert.equal(p.hero,'');assert.equal(p.cards.length,0);assert.match(renderDemo(p),/Contact details are missing/);assert.doesNotMatch(renderDemo(p),/src=""|id="om"|id="erbjudande"/);
  assert.throws(()=>createSocialProject({...draft,email:'bad-email'}),/Mejladressen/);
});
