import {decodeProject} from './share.mjs';
import {renderDemo} from './render.mjs';
try {
  const project=await decodeProject(location.hash);
  const doc=new DOMParser().parseFromString(renderDemo(project),'text/html');
  document.title=doc.title;
  document.querySelector('style').textContent=doc.querySelector('style').textContent;
  document.body.replaceChildren(...doc.body.childNodes);
  document.body.setAttribute('style',doc.body.getAttribute('style'));
  Object.assign(document.body.dataset,doc.body.dataset);
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();const id=link.getAttribute('href').slice(1);
    if(id)document.getElementById(id)?.scrollIntoView({behavior:'smooth'});else window.scrollTo(0,0);
  }));
} catch(error){document.body.textContent=error.message+' Be avsändaren skicka en ny, fullständig demolänk.';}
