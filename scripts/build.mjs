import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const assets={};
for(const name of await readdir(path.join(root,'public'))){
  const type=name.endsWith('.mjs')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';
  assets['/'+name]={body:await readFile(path.join(root,'public',name),'utf8'),type};
}
assets['/seed.json']={body:await readFile(path.join(root,'seed.json'),'utf8'),type:'application/json'};
await mkdir(path.join(root,'dist/server'),{recursive:true});await mkdir(path.join(root,'dist/.openai'),{recursive:true});
const source=await readFile(path.join(root,'worker.mjs'),'utf8');
await writeFile(path.join(root,'dist/server/index.js'),source+'\nconst bundledAssets='+JSON.stringify(assets)+';\nexport default createWorker(bundledAssets);\n');
await writeFile(path.join(root,'dist/.openai/hosting.json'),await readFile(path.join(root,'.openai/hosting.json')));
console.log('Built the online editor and public-page importer without package dependencies.');
