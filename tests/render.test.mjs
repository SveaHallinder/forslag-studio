import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDemo, normalizeProject } from '../public/render.mjs';

test('imported text cannot inject markup and unsafe links are discarded', () => {
  const html = renderDemo({ name: '<img src=x onerror=alert(1)>', headline: '</h1><script>alert(1)</script>', email: 'x\" onclick=alert(1)', hero: 'javascript:alert(1)', cards: [] });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('src="javascript:'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('missing business details do not become fake contact links or invented proof', () => {
  const html = renderDemo({ name: 'Testföretag', headline: 'Välkommen', cards: [] });
  assert.ok(!html.includes('mailto:'));
  assert.ok(!html.includes('tel:'));
  assert.ok(!html.includes('Trustpilot'));
  assert.ok(html.includes('Designförslag'));
});

test('project limits bound hostile or oversized imported content', () => {
  const p = normalizeProject({ name: 'A'.repeat(1000), accent: 'red;}</style><script>', cards: Array(100).fill({ title: 'B' }) });
  assert.ok(p.name.length <= 100);
  assert.ok(p.cards.length <= 12);
  assert.match(p.accent, /^#[a-f0-9]{6}$/i);
});

test('standalone exports preserve an entire accepted image above 3 MB', () => {
  const bytes = Buffer.alloc(3300000, 7);
  const url = 'data:image/png;base64,' + bytes.toString('base64');
  const html = renderDemo({name:'Bildtest',hero:url});
  const image = html.match(/src="data:image\/png;base64,([^"]+)"/);
  assert.ok(image, 'The hero must remain in the exported document');
  assert.equal(Buffer.from(image[1], 'base64').length, bytes.length);
});

test('GIF images accepted by import survive standalone export rendering', () => {
  const html = renderDemo({name:'GIF-test',hero:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'});
  assert.ok(html.includes('src="data:image/gif;base64,'));
});

test('top-aligned image crop remains at zero in preview and exports', () => {
  assert.equal(normalizeProject({heroPosition:0}).heroPosition,0);
  assert.match(renderDemo({heroPosition:0}),/--hero-position:0%/);
  assert.equal(normalizeProject({heroPosition:'not-a-number'}).heroPosition,50);
});

test('saving an unfinished card preserves its description', () => {
  const p = normalizeProject({cards:[{description:'Utkast som ska få en rubrik senare'}]});
  assert.equal(p.cards.length,1);
  assert.equal(p.cards[0].description,'Utkast som ska få en rubrik senare');
});

test('hidden benefits keep their draft text and slot without appearing in the demo', () => {
  const p=normalizeProject({benefits:[{title:'',description:'Dolt utkast'},{title:'Synlig',description:'Visas'}]});
  assert.equal(p.benefits.length,2);
  assert.equal(p.benefits[0].description,'Dolt utkast');
  assert.equal(p.benefits[1].title,'Synlig');
  const html=renderDemo(p);
  assert.doesNotMatch(html,/Dolt utkast/);
  assert.match(html,/--benefit-count:1/);
});
