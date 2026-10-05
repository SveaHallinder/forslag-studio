import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProject,renderDemo} from '../public/render.mjs';
import {encodeProject,decodeProject} from '../public/share.mjs';
import {readPublic,createWorker} from '../worker.mjs';
const typography={heading:'Source Serif',body:'Source Sans',faces:[{family:'Source Serif',url:'https://example.com/serif.woff2',weight:'100 900',style:'normal',unicodeRange:'U+0000-00FF'},{family:'Source Sans',url:'https://example.com/sans.woff2',weight:'400',style:'normal'}]};
const project={name:'Company',headline:'Original heading',typography};
test('source typography survives normalization and shared links',async()=>{
 const normalized=normalizeProject(project);assert.deepEqual(normalized.typography,typography);
 const decoded=await decodeProject(new URL(await encodeProject(project,'https://studio.example/demo.html')).hash);assert.deepEqual(decoded.typography,typography);
 assert.equal(normalizeProject({name:'Old'}).typography,undefined);
});
test('font CSS preserves variable weight and subsets and overrides template fonts',()=>{
 const html=renderDemo({...project,templateId:'dining'});
 assert.ok(html.includes('@font-face'));assert.ok(html.includes('font-weight:100 900'));assert.ok(html.includes('unicode-range:U+0000-00FF'));
 assert.ok(html.includes('/api/font?url=https%3A%2F%2Fexample.com%2Fserif.woff2'));assert.ok(html.includes('font-family:"Source Serif"'));
});
test('invalid families, font URLs and CSS descriptor injection are removed',()=>{
 const p=normalizeProject({typography:{heading:'</style><script>x</script>',body:'Source Sans',faces:[...typography.faces,{family:'Source Sans',url:'javascript:alert(1)'},{family:'Source Sans',url:'https://user:pass@example.com/font.woff2'},{family:'Source Sans',url:'https://example.com/x.woff2',weight:'400;}body{color:red}',unicodeRange:'x;}'}]}});
 assert.equal(p.typography.heading,'');assert.ok(p.typography.faces.every(f=>f.family==='Source Sans'&&!f.url.includes('javascript')&&!f.url.includes('pass@')));
 assert.ok(!renderDemo(p).includes('color:red'));
});
test('all subpages use the root typography',()=>{
 const html=renderDemo({...project,source:'https://example.com/',pages:[{source:'https://example.com/team',headline:'Team',typography:{heading:'Wrong font'}}]},{pageSource:'https://example.com/team'});
 assert.ok(html.includes('Source Serif'));assert.ok(!html.includes('Wrong font'));
});
test('font reader accepts only recognized font bytes and rejects HTML or private redirects',async()=>{
 const bytes=new Uint8Array(48);bytes.set([119,79,70,50]);
 const result=await readPublic('https://example.com/f.woff2','font',async()=>new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}));assert.equal(result.mime,'font/woff2');
 await assert.rejects(readPublic('https://example.com/f.woff2','font',async()=>new Response('<html>blocked</html>',{headers:{'Content-Type':'font/woff2'}})),/font|typsnitt/i);
 await assert.rejects(readPublic('https://example.com/f.woff2','font',async()=>new Response(null,{status:302,headers:{Location:'http://127.0.0.1/f.woff2'}})),/offentlig/);
});
test('font proxy refuses private addresses with useful errors',async()=>{
 const response=await createWorker({}).fetch(new Request('https://studio.example/api/font?url=http%3A%2F%2Flocalhost%2Ffont.woff2'));
 assert.equal(response.status,400);assert.match((await response.json()).error,/offentlig/);
});
test('a known serif source family keeps serif character when the font file is unavailable',()=>{
 const html=renderDemo({name:'Anna Lind',headline:'Journalist och författare',description:'Anna skriver böcker.',importedAt:'today',typography:{heading:'Playfair Display',body:'Arial'}});
 assert.ok(html.includes('"Playfair Display",serif'),'serif fallback');assert.ok(html.includes('.profile-name){font-family:"Playfair Display",serif!important}'),'name follows source heading font');
});
