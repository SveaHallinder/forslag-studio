import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { normalizeProject, renderDemo } from '../public/render.mjs';

const source = (await readFile(new URL('../public/browser-api.mjs', import.meta.url), 'utf8'))
  .replace(/^import .*\n/gm, '').replace(/^export /gm, '');
const image = name => 'https://example.com/' + name + '.png';
const embedded = url => 'data:image/png;base64,' + Buffer.from(url).toString('base64');

function harness(failedURL) {
  const calls = [];
  class FileReader {
    readAsDataURL(blob) {
      blob.arrayBuffer().then(bytes => {
        this.result = 'data:' + blob.type + ';base64,' + Buffer.from(bytes).toString('base64');
        this.onload();
      }, () => this.onerror());
    }
  }
  const context = vm.createContext({
    normalizeProject, renderDemo, Response, AbortSignal, FileReader,
    console: { warn() {} },
    fetch: async (path, options) => {
      assert.equal(path, '/api/image');
      const { url } = JSON.parse(options.body);
      calls.push(url);
      if (url === failedURL) return new Response(JSON.stringify({ error: 'Image unavailable' }), { status: 503 });
      return new Response(url, { headers: { 'Content-Type': 'image/png' } });
    }
  });
  vm.runInContext(source, context);
  return { context, calls };
}

function project() {
  return {
    name: 'Root brand', source: 'https://example.com/', headline: 'Root headline',
    logo: image('root-logo'), hero: image('root-hero'),
    cards: [{ title: 'Root card', image: image('root-card') }],
    pages: [{
      name: 'Team', source: 'https://example.com/team', headline: 'Team headline',
      logo: image('hidden-child-logo'), hero: image('child-hero'),
      cards: [{ title: 'Team portrait', image: image('child-card') }, { title: 'Shared photo', image: image('root-card') }]
    }]
  };
}

for (const hasLogo of [true, false]) test('multipage export embeds used images and ignores hidden child logo' + (hasLogo ? '' : ' after removing root logo'), async () => {
  const input = project();
  if (!hasLogo) input.logo = '';
  const before = JSON.stringify(input);
  const { context, calls } = harness(image('hidden-child-logo'));
  const response = await context.browserAPI('/api/export', input);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /text\/html/);
  const html = await response.text();
  const used = ['root-hero', 'root-card', 'child-hero', 'child-card'].map(image);
  if (hasLogo) used.push(image('root-logo'));
  assert.deepEqual([...calls].sort(), [...used].sort());
  for (const url of used) {
    assert.ok(html.includes(embedded(url)), 'Missing embedded image: ' + url);
    assert.ok(!html.includes(url), 'Remote image remains: ' + url);
  }
  assert.ok(!html.includes(image('hidden-child-logo')));
  assert.match(html, /Team headline/);
  assert.match(html, /Team portrait/);
  assert.match(html, /data-demo-page="1"/);
  assert.equal(JSON.stringify(input), before, 'Export must not mutate the editable project');
});

test('multipage export returns an error instead of incomplete HTML when a child image fails', async () => {
  const input = project(), before = JSON.stringify(input);
  const { context, calls } = harness(image('child-card'));
  const response = await context.browserAPI('/api/export', input);
  assert.equal(response.ok, false);
  assert.match(response.headers.get('Content-Type'), /application\/json/);
  const body = await response.text();
  assert.match(JSON.parse(body).error, /Image unavailable.*Ingen ofullständig export skapades/);
  assert.ok(!body.includes('<!doctype html>'));
  assert.ok(calls.includes(image('child-card')));
  assert.ok(!calls.includes(image('hidden-child-logo')));
  assert.equal(JSON.stringify(input), before);
});
