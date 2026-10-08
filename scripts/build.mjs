import {readFile,writeFile,mkdir,readdir,cp} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const assets={};
for(const name of await readdir(path.join(root,'public'))){
  const type=name.endsWith('.mjs')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.json')?'application/json':name.endsWith('.txt')?'text/plain; charset=utf-8':'text/html; charset=utf-8';
  assets['/'+name]={body:await readFile(path.join(root,'public',name),'utf8'),type};
}
assets['/seed.json']={body:await readFile(path.join(root,'seed.json'),'utf8'),type:'application/json'};
await mkdir(path.join(root,'dist/server'),{recursive:true});await mkdir(path.join(root,'dist/.openai'),{recursive:true});
const socialSource=await readFile(path.join(root,'public/social-content.mjs'),'utf8');
const cloudSource=await readFile(path.join(root,'cloud-worker.mjs'),'utf8');
const mailSource=await readFile(path.join(root,'customer-mail.mjs'),'utf8');
const bookingSource=await readFile(path.join(root,'public/booking-settings.mjs'),'utf8');
const flowSource=await readFile(path.join(root,'customer-flows.mjs'),'utf8');
const inline=value=>value.replace(/^import .*;\n/gm,'').replace(/^export \{[^\n]+\};\n/gm,'').replace(/^export /gm,'');
const source=(await readFile(path.join(root,'worker.mjs'),'utf8')).replace("import {socialProfileURL,extractSocialProfile} from './public/social-content.mjs';",inline(socialSource)).replace("import {handleCloud} from './cloud-worker.mjs';",inline(cloudSource)).replace("import {customerMailConfigured} from './customer-mail.mjs';",inline(mailSource)).replace("import {handleCustomerFlows,pilotStatus,browserAgentConfigured,queueBrowserPage} from './customer-flows.mjs';",inline(bookingSource)+'\n'+inline(flowSource));
await writeFile(path.join(root,'dist/server/index.js'),source+'\nconst bundledAssets='+JSON.stringify(assets)+';\nexport default createWorker(bundledAssets);\n');
await writeFile(path.join(root,'dist/.openai/hosting.json'),await readFile(path.join(root,'.openai/hosting.json')));
await cp(path.join(root,'drizzle'),path.join(root,'dist/.openai/drizzle'),{recursive:true});
console.log('Built the online editor and Worker importer. Local Chromium stays outside the Worker bundle.');
