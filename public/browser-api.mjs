import {trimLogoBlob} from './logo-framing.mjs';
import {logoTone,bestInk} from './branding.mjs';
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
export async function importSavedPage(html,url,styles=[]) {
  let source;try{source=new URL(url);}catch{throw problem('Ange originalets fullständiga https-adress.');}
  if(!/^https?:$/.test(source.protocol)||source.username||source.password||source.port)throw problem('Ange originalets offentliga webbadress utan inloggningsuppgifter eller egen port.');
  if(typeof html!=='string'||!html.trim()||new TextEncoder().encode(html).length>2_000_000)throw problem('Välj en HTML-sida under 2 MB med läsbart innehåll.');
  const project=extractContent(html,source.href,styles);
  if(project.inlineLogo&&!project.logo){try{project.logo=await imageDataURL(new Blob([project.inlineLogo],{type:'image/svg+xml'}));}catch{project.warnings.push('Den inbäddade logotypen kunde inte läsas. Lägg till en egen logotyp under Bilder.');}}
  if(project.logo)await identifyLogo(project);
  for(const key of ['inlineLogo','links','stylesheets','sourceAnchors'])delete project[key];
  project.warnings.unshift('Importerad från ditt HTML-underlag. Originalets JavaScript körs inte. Granska bilder, färger och typsnitt; externa CSS-filer kan behöva läggas till.');
  return project;
}
async function readCompany(url,extraContact=true,renderFirst=false) {
  let page=await(await remote(renderFirst?'/api/render':'/api/read',{url})).json(),project,rendered=renderFirst;
  try{project=extractContent(page.html,page.url);}
  catch(error){
    if(error.code!=='EMPTY_CONTENT'||renderFirst)throw error;
    page=await(await remote('/api/render',{url:page.url})).json();
    project=extractContent(page.html,page.url);rendered=true;
  }
  const styles=[];
  for(let start=0;start<project.stylesheets.length;start+=3){
    styles.push(...await Promise.all(project.stylesheets.slice(start,start+3).map(async url=>{try{const result=await(await remote('/api/style',{url})).json();return {css:result.css,url:result.url||url,href:url};}catch{console.warn('[mockup online import] Brand stylesheet unavailable');return null;}})));
  }
  const imports=[];
  for(const style of styles.filter(Boolean))for(const match of style.css.matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]\s*\)?\s*;/gi)){
    try{const url=new URL(match[1],style.url).href;if(/^https?:/.test(url)&&!imports.some(item=>item.url===url)&&!styles.some(item=>item?.url===url))imports.push({url,importedBy:style.href||style.url});}catch{}
  }
  const fontSheets=await Promise.all(imports.slice(0,2).map(async ({url,importedBy})=>{try{const result=await(await remote('/api/style',{url})).json();return {css:result.css,url:result.url||url,href:url,importedBy};}catch{console.warn('[mockup online import] Imported font stylesheet unavailable');return null;}}));
  styles.unshift(...fontSheets.filter(Boolean));
  if(styles.some(Boolean))project=extractContent(page.html,page.url,styles.filter(Boolean));
  if(extraContact&&!project.email&&!project.phone){
    const contact=project.links.find(link=>{try{return new URL(link).hostname===new URL(page.url).hostname&&/kontakt|contact|om-oss|about/i.test(new URL(link).pathname);}catch{return false;}});
    if(contact)try{const extra=await(await remote('/api/read',{url:contact})).json(),details=extractContent(extra.html,extra.url);project.email=details.email;project.phone=details.phone;if(details.email||details.phone)project.warnings=project.warnings.filter(w=>!w.startsWith('Kontaktuppgifter saknas'));}catch{console.warn('[mockup online import] Contact page unavailable');}
  }
  if(rendered)project.warnings.unshift('Sidan har lästs med en webbläsare efter att JavaScript laddats. Jämför innehåll, bilder och meny med originalet.');
  if(project.inlineLogo&&!project.logo){try{project.logo=await imageDataURL(new Blob([project.inlineLogo],{type:'image/svg+xml'}));}catch{project.warnings.push('Den inbäddade logotypen kunde inte läsas. Välj en bild under Logotyp.');}}
  delete project.inlineLogo;
  if(extraContact&&project.logo)await identifyLogo(project);
  delete project.links;delete project.stylesheets;return project;
}
async function importCompany(url,includePages=true,renderFirst=false) {
  const project=await readCompany(url,true,renderFirst);project.pages=[];
  if(!includePages){delete project.sourceAnchors;return project;}
  const root=new URL(project.source),pathKey=url=>url.origin+(root.pathname==='/'&&url.origin===root.origin&&url.pathname==='/index.html'?'':url.pathname.replace(/\/$/,''));
  const seen=new Set([pathKey(root)]),targets=[];
  for(const item of project.navigation){
    let target;try{target=new URL(item.href,root);}catch{continue;}
    const key=pathKey(target);
    if(target.origin!==root.origin||seen.has(key)||target.search||/\.(?:pdf|zip|jpe?g|png|svg|webp)$/i.test(target.pathname))continue;
    seen.add(key);target.hash='';targets.push({label:item.label,url:target.href});
  }
  const failed=[],aliases=new Map();
  for(let start=0;start<Math.min(5,targets.length);start+=2){
    const batch=await Promise.all(targets.slice(start,Math.min(start+2,5)).map(async target=>{
      try{const page=await readCompany(target.url,false);aliases.set(target.url,page.source);return {...page,name:target.label};}
      catch{console.warn('[mockup online import] Subpage unavailable',new URL(target.url).pathname);failed.push(target.label);return null;}
    }));project.pages.push(...batch.filter(Boolean));
  }
  const content=[project,...project.pages],key=url=>pathKey(url)+url.search;
  const relink=href=>{
    if(!/^https?:/.test(href||''))return href;
    try{
      const url=new URL(href),original=new URL(href);url.hash='';
      const target=content.find(page=>key(new URL(page.source))===key(new URL(aliases.get(url.href)||url.href)));
      if(!target)return href;
      const mapped=original.hash&&target.sourceAnchors?.[decodeURIComponent(original.hash.slice(1))];
      return target.source+(mapped?'#'+mapped:original.hash);
    }catch{return href;}
  };
  for(const page of content){
    page.navigation=page.navigation?.map(item=>({...item,href:relink(item.href)}))||[];
    page.ctaHref=relink(page.ctaHref);page.cards=page.cards?.map(card=>({...card,...(card.href?{href:relink(card.href)}:{})}))||[];
    page.warnings=(page.warnings||[]).filter(w=>!w.startsWith('Menylänkar till undersidor öppnar'));
  }
  content.forEach(page=>delete page.sourceAnchors);
  if(project.navigation.some(item=>/^https?:/.test(item.href)&&!content.some(page=>{try{return key(new URL(page.source))===key(new URL(item.href));}catch{return false;}})))project.warnings.push('Menylänkar till sidor som inte importerats öppnar företagets original.');
  if(failed.length)project.warnings.unshift('Kunde inte hämta: '+failed.join(', ')+'. Menylänkarna öppnar originalet.');
  if(targets.length>5)project.warnings.push('Högst fem undersidor hämtas. Övriga menylänkar öppnar originalet.');
  return project;
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
export async function trimLogo(url) {
  const blob=url.startsWith('data:')?await(await fetch(url)).blob():await(await remote('/api/image',{url})).blob();
  if(blob.size>2_000_000)throw problem('Logotypen är för stor. Välj en bild under 2 MB.');
  return trimLogoBlob(blob);
}
async function identifyLogo(project) {
  let objectURL='',timer;
  try{
    let blob=project.logo.startsWith('data:')?await(await fetch(project.logo)).blob():await(await remote('/api/image',{url:project.logo})).blob();
    if(blob.size>2_000_000)throw new Error('Logotypen är för stor för färganalys.');
    const trimmed=await trimLogoBlob(blob);
    if(trimmed){const original=project.logo;project.logo=trimmed;for(const key of ['logoLight','logoDark'])if(project.branding?.[key]===original)project.branding[key]=trimmed;blob=await(await fetch(trimmed)).blob();}
    const image=new Image();objectURL=URL.createObjectURL(blob);
    await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(new Error('Logotypen tog för lång tid att avkoda.')),5000);image.onload=resolve;image.onerror=()=>reject(new Error('Logotypen kunde inte avkodas.'));image.src=objectURL;});
    const canvas=document.createElement('canvas'),scale=Math.min(1,160/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext('2d');context.drawImage(image,0,0,canvas.width,canvas.height);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;let tone=logoTone(pixels);
    // A multicolor symbol may dominate a wide wordmark. The trailing region
    // often contains its lettering; only accept a clear light/dark result.
    if(!tone&&canvas.width>canvas.height*3){const left=Math.floor(canvas.width*.35);tone=logoTone(context.getImageData(left,0,canvas.width-left,canvas.height).data);}
    if(tone){project.branding={...project.branding,[tone==='light'?'logoLight':'logoDark']:project.logo};const bg=project.branding.headerBackground;
      if(!bg||(tone==='light'&&bestInk(bg)!=='#ffffff')||(tone==='dark'&&bestInk(bg)!=='#000000')){project.branding.headerBackground=tone==='light'?'#202420':'#ffffff';project.branding.headerText=tone==='light'?'#ffffff':'#202420';project.warnings.push('Menyns bakgrund anpassades för att originalets logotyp ska synas. Du kan ändra färg och logovariant under Varumärke/Bilder.');}}
    else project.warnings.push('Logotypens ljusa/mörka variant kunde inte bedömas säkert. Granska den mot menyns bakgrund.');
  }catch(error){console.warn('[mockup branding] Logo analysis unavailable:',error.message);project.warnings.push('Logotypens färger kunde inte kontrolleras automatiskt. Granska logotypen under Bilder.');}
  finally{clearTimeout(timer);if(objectURL)URL.revokeObjectURL(objectURL);}
}
async function exportDemo(input){
  const p=normalizeProject(input),content=[p,...(p.pages||[])],urls=[...new Set([p.logo,p.branding?.logoLight,p.branding?.logoDark,...content.flatMap(page=>[page.hero,...(page.heroGallery||[]).map(i=>i.url),...page.cards.flatMap(c=>[c.image,...(c.gallery||[]).map(i=>i.url)])])].filter(Boolean))],mapping=new Map();let size=0;
  for(let start=0;start<urls.length;start+=3)await Promise.all(urls.slice(start,start+3).map(async url=>{
    let data;
    try {data=url.startsWith('data:')?url:await imageDataURL(await(await remote('/api/image',{url})).blob());}
    catch(error){throw problem('En bild kunde inte bäddas in: '+error.message+' Byt eller ta bort bilden/logotypen under Bilder och försök igen. Ingen ofullständig export skapades.');}
    size+=data.length;if(size>30_000_000)throw problem('Bilderna är för stora för en fristående demosida. Välj färre eller mindre bilder.');mapping.set(url,data);
  }));
  const fontData=new Map();
  for(const face of p.typography?.faces||[]){
    if(!fontData.has(face.url)){
      try{const data=face.url.startsWith('data:')?face.url:await dataURL(await(await remote('/api/font',{url:face.url})).blob());size+=data.length;if(size>30_000_000)throw problem('Exporten är för stor.');fontData.set(face.url,data);}
      catch(error){throw problem('Typsnitt kunde inte bäddas in: '+error.message+' Välj mallens typsnitt under Innehåll och försök igen. Ingen ofullständig export skapades.');}
    }
    face.url=fontData.get(face.url);
  }
  for(const page of content){page.hero=mapping.get(page.hero)||'';page.logo=mapping.get(page.logo)||'';page.cards=page.cards.map(c=>({...c,image:mapping.get(c.image)||''}));page.heroGallery=page.heroGallery?.map(i=>({...i,url:mapping.get(i.url)||''}));page.cards.forEach(c=>{if(c.gallery)c.gallery=c.gallery.map(i=>({...i,url:mapping.get(i.url)||''}));});page.images=[];}
  for(const key of ['logoLight','logoDark'])if(p.branding?.[key])p.branding[key]=mapping.get(p.branding[key])||'';
  return new Response(renderDemo(p),{headers:{'Content-Type':'text/html; charset=utf-8'}});
}
export async function browserAPI(path,body) {
  try {
    if(path==='/api/config')return reply({publicBase:new URL('/demo.html',location.href).href,hostingStatus:'public',storage:'browser'});
    if(path==='/api/import')return reply(await importCompany(body.url,body.includePages!==false,body.renderFirst===true));
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
