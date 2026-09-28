import test from 'node:test';
import assert from 'node:assert/strict';
import {logoBounds} from '../public/logo-framing.mjs';
function canvas(width=200,height=100,color=[255,255,255,255]) {
 const pixels=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<pixels.length;i+=4)pixels.set(color,i);
 const fill=(x,y,w,h,rgba)=>{for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)pixels.set(rgba,(row*width+col)*4);};
 return {pixels,width,height,fill,bounds:()=>logoBounds(pixels,width,height)};
}
test('uniform white padding is removed with space around the entire mark',()=>{
 const c=canvas();c.fill(50,40,100,20,[25,25,25,255]);const b=c.bounds();
 assert.ok(b);assert.ok(b.x<50&&b.y<40);assert.ok(b.x+b.width>150&&b.y+b.height>60);assert.ok(b.width<130&&b.height<40);
});
test('transparent padding ignores invisible RGB and retains visible ink',()=>{
 const c=canvas(200,100,[180,50,240,0]);c.fill(60,35,80,30,[255,255,255,255]);
 const b=c.bounds();assert.ok(b);assert.ok(b.x<=60&&b.y<=35&&b.x+b.width>=140&&b.y+b.height>=65);
});
test('uniform neutral margins may include a transparent edge column',()=>{
 for(const background of [[255,255,255,255],[0,0,0,255]])for(const edge of [0,199]){
  const c=canvas(200,100,background);c.fill(50,40,100,20,[90,120,160,255]);c.fill(edge,0,1,100,[0,0,0,0]);
  const b=c.bounds();assert.ok(b);assert.ok(b.x<50&&b.y<40&&b.x+b.width>150&&b.y+b.height>60);assert.ok(b.width<130);
 }
});
test('transparent edges do not permit mixed visible neutral border colors',()=>{
 const c=canvas();c.fill(0,0,1,100,[0,0,0,0]);c.fill(199,0,1,100,[0,0,0,255]);c.fill(50,40,100,20,[90,120,160,255]);assert.equal(c.bounds(),null);
});
test('uniform black margins around a light mark can be trimmed',()=>{
 const c=canvas(200,100,[0,0,0,255]);c.fill(50,40,100,20,[245,245,245,255]);assert.ok(c.bounds());
});
test('fullbleed photo-like edges and arbitrary colored backgrounds are not cropped',()=>{
 const c=canvas();for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)c.fill(x,y,1,1,[x%256,y%256,(x+y)%256,255]);assert.equal(c.bounds(),null);
 const colored=canvas(200,100,[230,210,180,255]);colored.fill(50,40,100,20,[20,20,20,255]);assert.equal(colored.bounds(),null);
});
test('blank canvases and negligible margins are not cropped',()=>{
 for(const color of [[255,255,255,255],[0,0,0,255],[0,0,0,0]])assert.equal(canvas(200,100,color).bounds(),null);
 const c=canvas();c.fill(2,2,196,96,[20,20,20,255]);assert.equal(c.bounds(),null);
});
test('sparse colored corner pixels make the border ambiguous',()=>{
 const c=canvas();c.fill(50,40,100,20,[20,20,20,255]);c.fill(0,0,1,1,[230,40,30,255]);c.fill(199,99,1,1,[20,130,230,255]);assert.equal(c.bounds(),null);
});
test('small separate accent marks remain inside the crop',()=>{
 const c=canvas();c.fill(50,40,100,20,[20,20,20,255]);c.fill(165,25,2,2,[210,100,20,255]);const b=c.bounds();
 assert.ok(b);assert.ok(b.x+b.width>167&&b.y<25);
});
test('invalid dimensions and insufficient visible ink are rejected',()=>{
 assert.equal(logoBounds(new Uint8ClampedArray(4),200,100),null);assert.equal(logoBounds([],0,100),null);
 const c=canvas();c.fill(100,50,1,1,[20,20,20,255]);assert.equal(c.bounds(),null);
});
