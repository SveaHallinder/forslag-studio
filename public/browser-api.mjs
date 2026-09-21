import { normalizeProject, renderDemo } from './render.mjs';
import { extractContent } from './import-content.mjs';

const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const problem=(message,status=400)=>Object.assign(new Error(message),{status});
let database;
async function openDatabase() {
  if(!database)database=new Promise((resolve,reject)=>{
    const request=indexedDB.open('forslag-studio-projects',1);
    request.onupgradeneeded=()=>{request.result.createObjectStore('active',{keyPath:'id'});request.result.createObjectStore('archive',{keyPath:'id'});request.result.createObjectStore('settings');};
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();database=null;};resolve(request.result);};
    request.onerror=()=>reject(problem('Webbläsaren kan inte spara projekt. Tillåt webbplatsdata och undvik privat läge.'));
    request.onblocked=()=>reject(problem('Stäng andra flikar med verktyget och ladda om sidan.'));
  }).catch(error=>{database=null;throw error;});
  return database;
}
function requestResult(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function transaction(stores,mode,run) {
  const db=await openDatabase(),tx=db.transaction(stores,mode);
  const done=new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||problem('Ändringen kunde inte sparas.'));tx.onerror=()=>{};});
  try{const result=await run(tx);await done;return result;}catch(error){try{tx.abort();}catch{}await done.catch(()=>{});throw error;}
}
async function initialize() {
  const seed=await(await fetch('/seed.json')).json();
  await transaction(['active','settings'],'readwrite',async tx=>{
    if(!await requestResult(tx.objectStore('settings').get('initialized'))){tx.objectStore('active').put(seed);tx.objectStore('settings').put(true,'initialized');}
  });
}
let ready;
async function remote(path,body) {
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  if(!response.ok){const data=await response.json().catch(()=>({}));throw problem(data.error||'Hämtningen misslyckades. Försök igen.',response.status);}return response;
}
async function importCompany(url) {
  const page=await(await remote('/api/read',{url})).json();
  let project=extractContent(page.html,page.url);
  const styles=await Promise.all(project.stylesheets.slice(0,2).map(async url=>{try{const result=await(await remote('/api/style',{url})).json();return {css:result.css,url:result.url||url};}catch{console.warn('[mockup online import] Brand stylesheet unavailable');return null;}}));
  if(styles.some(Boolean))project=extractContent(page.html,page.url,styles.filter(Boolean));
  if(!project.email&&!project.phone){
    const contact=project.links.find(link=>{try{return new URL(link).hostname===new URL(page.url).hostname&&/kontakt|contact|om-oss|about/i.test(new URL(link).pathname);}catch{return false;}});
    if(contact)try{const extra=await(await remote('/api/read',{url:contact})).json(),details=extractContent(extra.html,extra.url);project.email=details.email;project.phone=details.phone;if(details.email||details.phone)project.warnings=project.warnings.filter(w=>!w.startsWith('Kontaktuppgifter saknas'));}catch{console.warn('[mockup online import] Contact page unavailable');}
  }
  delete project.links;delete project.stylesheets;return project;
}
function dataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(problem('Bilden kunde inte läsas.'));reader.readAsDataURL(blob);});}
export async function imageDataURL(blob) {
  if(blob.type.split(';')[0]!=='image/svg+xml')return dataURL(blob);
  // An SVG loaded only as an image cannot execute its scripts. Export raster
  // pixels, never third-party SVG markup, into the standalone customer file.
  const url=URL.createObjectURL(blob),image=new Image();let timer;
  try{
    await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(problem('Logotypen tog för lång tid att läsa.')),10000);image.onload=resolve;image.onerror=()=>reject(problem('SVG-logotypen kunde inte läsas. Välj en PNG-logotyp.'));image.src=url;});
    if(!image.naturalWidth||!image.naturalHeight)throw problem('SVG-logotypen saknar en läsbar bildstorlek.');
    const scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png');
  }finally{clearTimeout(timer);image.src='';URL.revokeObjectURL(url);}
}
async function exportDemo(input){
  const p=normalizeProject(input),urls=[...new Set([p.hero,p.logo,...p.cards.map(c=>c.image)].filter(Boolean))],mapping=new Map();let size=0;
  for(let start=0;start<urls.length;start+=3)await Promise.all(urls.slice(start,start+3).map(async url=>{
    let data;
    try {data=url.startsWith('data:')?url:await imageDataURL(await(await remote('/api/image',{url})).blob());}
    catch(error){throw problem('En bild kunde inte bäddas in: '+error.message+' Byt eller ta bort bilden/logotypen under Bilder och försök igen. Ingen ofullständig export skapades.');}
    size+=data.length;if(size>30_000_000)throw problem('Bilderna är för stora för en fristående demosida. Välj färre eller mindre bilder.');mapping.set(url,data);
  }));
  p.hero=mapping.get(p.hero)||'';p.logo=mapping.get(p.logo)||'';p.cards=p.cards.map(c=>({...c,image:mapping.get(c.image)||''}));p.images=[];
  return new Response(renderDemo(p),{headers:{'Content-Type':'text/html; charset=utf-8'}});
}
export async function browserAPI(path,body) {
  try {
    if(path==='/api/config')return reply({publicBase:new URL('/demo.html',location.href).href,hostingStatus:'public',storage:'browser'});
    if(path==='/api/import')return reply(await importCompany(body.url));
    if(path==='/api/export')return await exportDemo(body);
    if(!ready)ready=initialize().catch(error=>{ready=null;throw error;});await ready;
    if(path==='/api/projects'||path==='/api/archived')return reply(await transaction([path==='/api/projects'?'active':'archive'],'readonly',async tx=>{
      const list=await requestResult(tx.objectStore(path==='/api/projects'?'active':'archive').getAll());
      return list.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).map(({id,name,updatedAt})=>({id,name,updatedAt}));
    }));
    if(path.startsWith('/api/projects/')){
      const item=await transaction(['active'],'readonly',tx=>requestResult(tx.objectStore('active').get(path.split('/').at(-1))));
      if(!item)throw problem('Projektet är arkiverat eller finns inte i den här webbläsaren.',404);return reply(item);
    }
    if(path==='/api/save'){
      const p=normalizeProject(body);if(!p.name.trim())throw problem('Fyll i företagsnamnet först.');
      p.id=/^[a-z0-9-]{1,70}$/.test(body.id)?body.id:crypto.randomUUID();p.updatedAt=new Date().toISOString();
      await transaction(['active','archive'],'readwrite',async tx=>{
        if(await requestResult(tx.objectStore('archive').get(p.id)))throw problem('Projektet är arkiverat. Återställ det under Mina förslag innan du sparar.',409);
        tx.objectStore('active').put(p);
      });
      return reply({id:p.id,url:'/preview.html#id='+encodeURIComponent(p.id)});
    }
    if(path==='/api/archive'||path==='/api/restore'){
      const from=path==='/api/archive'?'active':'archive',to=from==='active'?'archive':'active';
      await transaction(['active','archive'],'readwrite',async tx=>{
        const item=await requestResult(tx.objectStore(from).get(body.id));
        if(!item)throw problem('Projektet har redan flyttats. Öppna Mina förslag igen.',404);
        if(await requestResult(tx.objectStore(to).get(body.id)))throw problem('Ett projekt med samma id finns redan. Ingen ändring gjordes.',409);
        tx.objectStore(to).put(item);tx.objectStore(from).delete(body.id);
      });return reply({id:body.id});
    }
    throw problem('Funktionen hittades inte.',404);
  }catch(error){console.warn('[mockup browser storage]',path,error.name);return reply({error:error.name==='QuotaExceededError'?'Webbläsarens lagring är full. Ladda ner en projektkopia och frigör utrymme. Ditt öppna utkast finns kvar.':error.message||'Förslaget kunde inte sparas.'},error.status||400);}
}
