import test from 'node:test';import assert from 'node:assert/strict';
import {photoDetail} from '../public/photo-detail.mjs';
const pixels=fn=>{const width=64,height=64,data=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,value=fn(x,y);data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}return {data,width,height};};
test('low-detail tonal photos receive a cautious softness hint, sharp texture and flat artwork do not',()=>{
 assert.equal(photoDetail(pixels((x,y)=>30+x*3)).soft,true);
 assert.equal(photoDetail(pixels((x,y)=>(x+y)%2?230:30)).soft,false);
 assert.equal(photoDetail(pixels(()=>150)).soft,false);
});
test('invalid or undersized pixel buffers never claim verified softness',()=>{
 assert.equal(photoDetail({width:64,height:64,data:[]}).soft,false);assert.equal(photoDetail({width:1,height:1,data:[1,2,3,255]}).soft,false);
});
