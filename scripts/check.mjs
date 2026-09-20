import {readdirSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const folder of ['public','scripts','tests'])for(const file of readdirSync(folder))if(file.endsWith('.mjs'))execFileSync(process.execPath,['--check',folder+'/'+file]);
execFileSync(process.execPath,['--check','worker.mjs']);
const html=readFileSync('public/index.html','utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
if(new Set(ids).size!==ids.length)throw new Error('Duplicate HTML ids');
console.log('Syntax and unique HTML ids passed.');
