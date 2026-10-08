import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { normalizeProject, renderDemo } from '../public/render.mjs';
import { completeBrowserImport } from '../public/import-jobs.mjs';

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
    normalizeProject, renderDemo, completeBrowserImport, Response, AbortSignal, FileReader,
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

test('standalone export embeds selected fonts and fails clearly on a missing font',async()=>{
 const input={name:'Fonts',headline:'Heading',typography:{heading:'Original',body:'Original',faces:[{family:'Original',url:'https://example.com/original.woff2',weight:'400',style:'normal'}]}};
 for(const fails of [false,true]){
  const {context}=harness();
  context.fetch=async(path)=>{assert.equal(path,'/api/font');return fails?new Response(JSON.stringify({error:'Font unavailable'}),{status:503}):new Response('fontbytes',{headers:{'Content-Type':'font/woff2'}});};
  const response=await context.browserAPI('/api/export',input),output=await response.text();
  if(fails){assert.equal(response.ok,false);assert.match(JSON.parse(output).error,/Typsnitt.*Font unavailable/);}
  else{assert.equal(response.status,200);assert.ok(output.includes('data:font/woff2;base64,'));assert.ok(!output.includes('/api/font?'));}
 }
});

test('standalone export embeds galleries on both homepage and subpages',async()=>{
 const input=project();input.heroGallery=[{url:image('root-hero')},{url:image('hero-extra'),caption:'Extra hero'}];input.pages[0].cards[0].gallery=[{url:image('child-card')},{url:image('team-extra'),caption:'Team member'}];
 const {context,calls}=harness();const response=await context.browserAPI('/api/export',input),html=await response.text();assert.equal(response.status,200);
 for(const name of ['hero-extra','team-extra']){assert.ok(calls.includes(image(name)));assert.ok(html.includes(embedded(image(name))));assert.ok(!html.includes(image(name)));}
 assert.ok(html.includes('Team member'));
});

test('brand palette and both logo variants survive standalone export',async()=>{
 const input=project();input.branding={background:'#f7f2eb',text:'#252c38',headerBackground:'#141414',logoLight:image('white-logo'),logoDark:image('dark-logo')};
 const {context,calls}=harness();const response=await context.browserAPI('/api/export',input),html=await response.text();
 assert.equal(response.status,200);assert.ok(calls.includes(image('white-logo'))&&calls.includes(image('dark-logo')));
 assert.ok(html.includes(embedded(image('white-logo'))));assert.ok(!html.includes('https://example.com/white-logo'));
 assert.ok(html.includes('--brand-background:#f7f2eb'));
});


test('standalone export retains framing and section type without original snapshot or its assets',async()=>{
 const input=project();input.heroGallery=[{url:input.hero,presentation:{fit:'cover',ratio:'square',x:23,y:71}}];input.cards[0].kind='team';
 input.original={headline:'PRIVATE ORIGINAL COPY',hero:image('private-original')};input.pages[0].original={headline:'PRIVATE CHILD COPY',hero:image('private-child')};
 const {context,calls}=harness();const response=await context.browserAPI('/api/export',input),html=await response.text();
 assert.equal(response.status,200);assert.ok(html.includes('object-position:23% 71%'));assert.ok(html.includes('aspect-ratio:1/1'));assert.ok(html.includes('section-team'));
 assert.ok(!html.includes('PRIVATE'));assert.ok(!calls.includes(image('private-original')));assert.ok(!calls.includes(image('private-child')));
});
