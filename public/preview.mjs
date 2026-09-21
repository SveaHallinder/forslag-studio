import {browserAPI} from './browser-api.mjs';
import {renderDemo,installDemoNavigation} from './render.mjs';
try {
  const id=new URLSearchParams(location.hash.slice(1)).get('id');
  const response=await browserAPI('/api/projects/'+encodeURIComponent(id||''));
  const p=await response.json();if(!response.ok)throw new Error(p.error);
  const doc=new DOMParser().parseFromString(renderDemo(p),'text/html');
  document.title=doc.title;document.querySelector('style').textContent=doc.querySelector('style').textContent;document.body.replaceChildren(...doc.body.childNodes);document.body.setAttribute('style',doc.body.getAttribute('style'));Object.assign(document.body.dataset,doc.body.dataset);
  installDemoNavigation(document,window);
} catch(error){document.body.textContent=error.message+' Öppna verktyget i samma webbläsare som projektet sparades i.';}
