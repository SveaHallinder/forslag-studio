import worker from '../dist/server/index.js';
import {createLocalBrowser} from './local-browser.mjs';
import {createPreviewServer} from './preview-server.mjs';
const importer=createLocalBrowser();await importer.start();
const server=createPreviewServer(worker,importer);
const port=Number(process.env.PORT)||4183;
server.on('error',async error=>{console.error('[local browser import] Server failed',error.code);await importer.close();process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('Online editor with local importer: http://localhost:'+port));
for(const event of ['SIGINT','SIGTERM'])process.once(event,async()=>{server.close();await importer.close();process.exit(0);});
