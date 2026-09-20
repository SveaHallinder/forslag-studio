import { renderDemo } from './render.mjs';
import { decodeProject } from './share.mjs';

async function show() {
  try {
    const project = location.hash.startsWith('#d=') ? await decodeProject(location.hash) : await (await fetch('/project.json')).json();
    const doc = new DOMParser().parseFromString(renderDemo(project), 'text/html');
    document.title = doc.title;
    document.querySelector('style').textContent = doc.querySelector('style').textContent;
    document.body.replaceChildren(...doc.body.childNodes);
    document.body.setAttribute('style',doc.body.getAttribute('style'));
    document.body.dataset.template = doc.body.dataset.template;
    // Keep the compressed project in the fragment when navigating sections.
    document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
      event.preventDefault();
      const id = link.getAttribute('href').slice(1);
      if(id)document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
      else window.scrollTo({top:0,behavior:'smooth'});
    }));
    // A broken source image must not leave the browser's broken-image icon in the demo.
    document.querySelectorAll('img').forEach(image=>image.addEventListener('error',()=>{
      image.style.display='none';
      if(image.closest('.brand'))image.parentNode.textContent=project.name;
    },{once:true}));
  } catch(error) {
    const main=document.createElement('main');main.className='opening';
    const heading=document.createElement('h1');heading.textContent='Förslaget kunde inte öppnas.';
    const message=document.createElement('p');message.textContent='Länken kan vara ofullständig. Be avsändaren om en ny länk eller den fristående demosidan.';
    main.append(heading,message);document.body.replaceChildren(main);
    console.error('[mockup viewer]', error.message);
  }
}
await show();
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#d='))show();});
