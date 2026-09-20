import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeProject, decodeProject } from '../public/share.mjs';

test('a public link preserves Swedish content and resolves packaged assets', async () => {
  const link = await encodeProject({name:'Åkes kök',headline:'Kök för hela livet',hero:'/assets/hero.jpg',cards:[{title:'Måttanpassat',image:'https://example.com/kok.jpg'}]},'https://demo.example.com');
  const p = await decodeProject(new URL(link).hash);
  assert.equal(p.name,'Åkes kök');
  assert.equal(p.hero,'https://demo.example.com/assets/hero.jpg');
  assert.equal(p.cards[0].title,'Måttanpassat');
});

test('malformed and oversized links produce a controlled error', async () => {
  await assert.rejects(()=>decodeProject('#d=<script>'));
  await assert.rejects(()=>decodeProject('#d='+'a'.repeat(250001)));
});

test('encoder rejects projects larger than the viewer can decode', async () => {
  await assert.rejects(()=>encodeProject({name:'Stor bild',hero:'data:image/png;base64,'+'A'.repeat(1600000)},'https://demo.example.com'));
});
