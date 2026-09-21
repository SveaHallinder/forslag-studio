import test from 'node:test';
import assert from 'node:assert/strict';
import {brandColor} from '../public/import-content.mjs';
test('branding requires an explicit brand variable, not arbitrary page colours',()=>{
  assert.equal(brandColor('body{color:#123456;background:#ffffff}'),'');
  assert.equal(brandColor(':root{--brand-primary:#b63552}'),'#b63552');
  assert.equal(brandColor(':root{--color-primary:#a3f}'),'#aa33ff');
  assert.equal(brandColor(':root{--primary-color:#12345678}'),'');
  assert.equal(brandColor(':root{--accent-hsl:0,100%,50%}'),'#ff0000');
});
