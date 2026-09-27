import test from 'node:test';import assert from 'node:assert/strict';
import {imageCandidates,replaceGalleryImage} from '../public/image-selection.mjs';
test('visual picker includes current and selected images, excludes invalid URLs and deduplicates',()=>{
 const page={hero:'https://a.test/hero.png',cards:[{image:'https://a.test/card.png'}],images:[{url:'https://a.test/card.png',label:'Portrait'},{url:'javascript:bad',label:'Bad'}]};
 const list=imageCandidates(page);assert.equal(list.length,2);assert.equal(list[1].label,'Portrait');
});
test('replacing a gallery image preserves other images and does not duplicate an existing one',()=>{
 const owner={image:'https://a.test/a.png',gallery:[{url:'https://a.test/a.png',caption:'A'},{url:'https://a.test/b.png',caption:'B'},{url:'https://a.test/c.png',caption:'C'}]};
 const before=JSON.stringify(owner),next=replaceGalleryImage(owner,'gallery','image',0,{url:'https://a.test/b.png',caption:'B'});
 assert.deepEqual(next.gallery.map(i=>i.url),['https://a.test/b.png','https://a.test/c.png']);assert.equal(next.image,'https://a.test/b.png');assert.equal(JSON.stringify(owner),before);
});
test('clearing primary image promotes the next and preserves its caption',()=>{
 const next=replaceGalleryImage({hero:'https://a.test/a.png',heroGallery:[{url:'https://a.test/a.png'},{url:'https://a.test/b.png',caption:'Original'}]},'heroGallery','hero',0,null);
 assert.equal(next.hero,'https://a.test/b.png');assert.equal(next.heroGallery[0].caption,'Original');
});
test('choosing an already-used image retains the newly edited caption',()=>{
 const next=replaceGalleryImage({image:'https://a.test/a.png',gallery:[{url:'https://a.test/a.png',caption:'Old'},{url:'https://a.test/b.png'}]},'gallery','image',1,{url:'https://a.test/a.png',caption:'New'});
 assert.equal(next.gallery[0].caption,'New');
});
