import {decodeProject} from './share.mjs';
import {renderDemo,installDemoNavigation} from './render.mjs';
let loadSequence=0,requestedHash;
const seenPayloads=new Set([location.hash]);
async function loadDemo(){
  const hash=location.hash;if(hash===requestedHash)return;
  requestedHash=hash;const sequence=++loadSequence;
  if(!seenPayloads.has(hash)){
    const url=new URL(location.href);url.searchParams.delete('demo-page');url.searchParams.delete('demo-anchor');
    history.replaceState(null,'',url);seenPayloads.add(hash);
  }
  try {
    const project=await decodeProject(hash);
    if(sequence!==loadSequence||location.hash!==hash)return;
    const doc=new DOMParser().parseFromString(renderDemo(project),'text/html');
    document.title=doc.title;
    document.querySelector('style').textContent=doc.querySelector('style').textContent;
    document.body.replaceChildren(...doc.body.childNodes);
    document.body.setAttribute('style',doc.body.getAttribute('style'));
    Object.assign(document.body.dataset,doc.body.dataset);
    installDemoNavigation(document,window);
  } catch(error){
    if(sequence!==loadSequence||location.hash!==hash)return;
    document.__disposeDemoNavigation?.();
    document.body.textContent=error.message+' Be avsändaren skicka en ny, fullständig demolänk.';
  }
}
window.addEventListener('hashchange',loadDemo);
await loadDemo();
