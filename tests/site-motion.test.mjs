import test from 'node:test';
import assert from 'node:assert/strict';
import {installSiteMotion} from '../public/site-motion.mjs';
import {renderDemo} from '../public/render.mjs';

function surface({reduced=false,staticEditor=false,animate=true}={}) {
  const events=new Map(),mediaEvents=new Map(),animations=[],observers=[];
  const node=()=>({isConnected:true,contains:()=>false,getBoundingClientRect:()=>({top:100,bottom:300}),animate(frames,options){
    const animation={effect:{target:this},frames,options,cancelled:false,cancel(){this.cancelled=true;this.oncancel?.();}};
    animations.push(animation);return animation;
  }});
  const hero=node(),visual=node(),card=node(),cafeBlock=node();
  const preference={matches:reduced,addEventListener:(_,fn)=>mediaEvents.set('change',fn),removeEventListener:()=>mediaEvents.delete('change')};
  const win={innerHeight:800,Element:{prototype:{animate:animate?()=>{}:undefined}},matchMedia:query=>query==='print'?{matches:false}:preference,
    addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name),
    IntersectionObserver:class{constructor(callback){this.callback=callback;this.nodes=[];this.disconnected=false;observers.push(this);}observe(node){this.nodes.push(node);}unobserve(node){this.nodes=this.nodes.filter(item=>item!==node);}disconnect(){this.disconnected=true;}},
  };
  const doc={defaultView:win,body:{dataset:{template:'gallery',...(staticEditor?{motion:'static'}:{})}},activeElement:null,
    querySelector:selector=>selector==='.hero-copy'?hero:visual,
    querySelectorAll:selector=>{assert.ok(selector.includes('.cafe-sections>.cafe-block'));return [card,cafeBlock];},
    addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name),
  };
  return {doc,hero,visual,card,cafeBlock,animations,observers,events,mediaEvents,preference};
}

test('sections enter once and a new customer page receives a fresh observer',()=>{
  const s=surface();installSiteMotion(s.doc);
  assert.equal(s.animations.length,2);
  const observer=s.observers[0];assert.deepEqual(observer.nodes,[s.card,s.cafeBlock]);
  observer.callback([{target:s.card,isIntersecting:true},{target:s.cafeBlock,isIntersecting:true}]);
  assert.equal(s.animations.length,4);assert.equal(s.animations[3].options.delay,60);
  observer.callback([{target:s.card,isIntersecting:true}]);assert.equal(s.animations.length,4);
  s.events.get('demo-page-change')();assert.equal(s.observers.length,2);assert.ok(observer.disconnected);
});

test('reduced motion uses a brief stationary fade and no scroll animation',()=>{
  const s=surface({reduced:true});installSiteMotion(s.doc);
  assert.equal(s.observers.length,0);assert.equal(s.animations.length,2);
  for(const animation of s.animations){assert.equal(animation.options.duration,120);assert.equal(animation.options.delay,0);assert.ok(animation.frames.every(frame=>!frame.transform));}
});

test('editor and browsers without animation support stay completely static',()=>{
  for(const options of [{staticEditor:true},{animate:false}]){
    const s=surface(options);installSiteMotion(s.doc);assert.equal(s.animations.length,0);assert.equal(s.observers.length,0);assert.equal(s.events.size,0);
  }
});

test('keyboard navigation settles motion and never restarts it on page changes',()=>{
  const s=surface();installSiteMotion(s.doc);s.events.get('keydown')();
  assert.ok(s.animations.every(animation=>animation.cancelled));assert.ok(s.observers[0].disconnected);
  s.events.get('demo-page-change')();assert.equal(s.animations.length,2);assert.equal(s.observers.length,1);
});

test('anchors, printing and preference changes immediately reveal stable content',()=>{
  for(const action of [s=>s.events.get('click')({target:{closest:()=>({})}}),s=>s.events.get('beforeprint')(),s=>s.mediaEvents.get('change')()]){
    const s=surface();installSiteMotion(s.doc);action(s);assert.ok(s.animations.every(animation=>animation.cancelled));assert.ok(s.observers[0].disconnected);
  }
});

test('reinstalling and disposing remove old observers and event listeners',()=>{
  const s=surface();installSiteMotion(s.doc);installSiteMotion(s.doc);
  assert.ok(s.observers[0].disconnected);assert.equal(s.observers.length,2);
  s.doc.__disposeSiteMotion();assert.ok(s.observers[1].disconnected);assert.equal(s.events.size,0);assert.equal(s.mediaEvents.size,0);
});

test('standalone and multipage exports install motion once without hiding content in CSS',()=>{
  const base={name:'Original företag',source:'https://example.com/',templateId:'gallery',headline:'Original rubrik',cards:[{title:'Original sektion',description:'Original innehåll'}]};
  for(const input of [base,{...base,pages:[{...base,source:'https://example.com/about',headline:'Om oss'}]}]){
    const html=renderDemo(input);assert.equal((html.match(/<script data-site-motion>/g)||[]).length,1);
    assert.match(html,/Original innehåll/);assert.doesNotMatch(html,/\.card\s*\{[^}]*opacity\s*:\s*0/);
    if(input.pages)assert.match(html,/data-demo-stage/);
  }
});
