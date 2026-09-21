import { normalizeProject, linkURL } from './render.mjs';

function validDestination(value,project) {
  const href=linkURL(value);if(!href)return false;
  if(!href.startsWith('#'))return true;
  const targets=new Set(['#start','#kontakt',...(project.cards.length?['#erbjudande']:[]),...(project.about?['#om']:[]),...project.cards.filter(c=>c.anchor).map(c=>'#'+c.anchor)]);
  return targets.has(href);
}
export function prepareNavigation(items,rawProject) {
  if(!Array.isArray(items)||items.length>12)throw new Error('Menyn kan innehålla högst 12 länkar.');
  const project=rawProject?normalizeProject(rawProject):null;
  return items.map((item,index)=>{
    const label=String(item?.label??'').trim(),raw=String(item?.href??'').trim(),href=linkURL(raw);
    if(project&&href.startsWith('#')&&!validDestination(href,project))throw Object.assign(new Error(`Menylänk ${index+1}: innehållsblocket finns inte. Välj ett block i listan eller länka till originalets sida.`),{index,field:'href'});
    const field=!label||label.length>70?'label':!href||raw.length>2000?'href':'';
    if(field)throw Object.assign(new Error(`Menylänk ${index+1}: ${field==='label'?'skriv en menytext på högst 70 tecken.':'ange en fullständig https://-adress, mejl-/telefonlänk eller ett #ankare.'}`),{index,field});
    return {label,href};
  });
}

function assessPage(raw = {}) {
  const p = normalizeProject(raw);
  const name = String(raw.name ?? '').trim();
  const headline = String(raw.headline ?? '').trim();
  const badCard=(Array.isArray(raw.cards)?raw.cards:[]).findIndex(c=>c?.href&&!validDestination(c.href,p));
  return [
    {id:'name',label:'Företagsnamn',ok:!!name&&!['Nytt förslag','Ditt företag'].includes(name),blocking:true,field:'name',tab:'content',help:'Ange kundens företagsnamn.'},
    {id:'headline',label:'En egen huvudrubrik',ok:!!headline&&!['Här börjar nästa kunds hemsida.','En ny plats för ert företag.'].includes(headline),blocking:true,field:'headline',tab:'content',help:'Skriv en rubrik som passar företaget.'},
    {id:'contact',label:'Giltig kontaktväg',ok:!!(p.email||p.phone),blocking:false,field:'email',tab:'details',help:'Lägg till mejladress eller telefon om kontaktknappen ska fungera.'},
    {id:'images',label:'Valda verksamhetsbilder',ok:!!p.hero||p.cards.some(c=>c.image),blocking:false,field:'imageUpload',tab:'images',help:'Välj en huvudbild eller fortsätt med en textbaserad demo.'},
    {id:'navigation',label:'Menyns destinationer',ok:!(Array.isArray(raw.navigation)?raw.navigation:[]).some(n=>!validDestination(n?.href,p)),blocking:true,field:'editNavigation',tab:'content',help:'En menylänk saknar giltig destination eller pekar på ett borttaget block. Rätta den under Redigera meny.'},
    {id:'cta',label:'Huvudknappens destination',ok:!raw.ctaHref||validDestination(raw.ctaHref,p),blocking:true,field:'ctaHref',tab:'details',help:'Ange en fullständig webbadress eller ett befintligt #ankare för huvudknappen.'},
    {id:'card-links',label:'Innehållsblockens länkar',ok:badCard<0,blocking:true,field:'card-href-'+badCard,tab:'content',help:'Ett innehållsblock har en ogiltig länk. Rätta eller töm fältet Länk under blocket.'},
  ];
}

export function assessProject(raw = {}) {
  const checks=assessPage(raw);
  for(const [pageIndex,page] of (Array.isArray(raw.pages)?raw.pages:[]).slice(0,5).entries()){
    if(!page||typeof page!=='object')continue;
    for(const check of assessPage(page)){
      if(['name','navigation'].includes(check.id)||check.ok)continue;
      checks.push({...check,label:(page.name||'Sida '+(pageIndex+2))+': '+check.label,pageIndex});
    }
  }
  return checks;
}

export function searchProjects(projects, query) {
  const needle = String(query ?? '').trim().toLocaleLowerCase('sv');
  return projects.filter(p=>String(p.name ?? '').toLocaleLowerCase('sv').includes(needle));
}

export function restoreProject(source) {
  let raw;
  try { raw=JSON.parse(source); } catch { throw new Error('Projektfilen är inte giltig JSON. Välj en nedladdad projektkopia.'); }
  if(!raw||Array.isArray(raw)||typeof raw.name!=='string'||!raw.name.trim()||typeof raw.headline!=='string')throw new Error('Filen innehåller inget giltigt projekt. Välj en projektkopia från Förslag.');
  if(raw.cards!==undefined&&(!Array.isArray(raw.cards)||raw.cards.length>40||raw.cards.some(c=>!c||typeof c!=='object')))throw new Error('Projektets bildkort är ogiltiga.');
  if(raw.benefits!==undefined&&(!Array.isArray(raw.benefits)||raw.benefits.some(b=>!b||typeof b!=='object')))throw new Error('Projektets fördelar är ogiltiga.');
  if(raw.images!==undefined&&(!Array.isArray(raw.images)||raw.images.some(i=>!i||typeof i!=='object')))throw new Error('Projektets bilder är ogiltiga.');
  if(raw.pages!==undefined){
    if(!Array.isArray(raw.pages)||raw.pages.length>5)throw new Error('Projektets undersidor är ogiltiga. Högst fem undersidor stöds.');
    const seen=new Set();
    const pageKey=value=>{const url=new URL(value);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error();url.hash='';return url.href.replace(/\/(?=\?|$)/,'');};
    if(raw.source)try{seen.add(pageKey(raw.source));}catch{}
    for(const page of raw.pages)try{
      if(!page||typeof page!=='object'||Array.isArray(page)||page.pages!==undefined)throw new Error();
      const key=pageKey(page.source);if(seen.has(key))throw new Error();seen.add(key);
      restoreProject(JSON.stringify(page));
    }catch{throw new Error('En undersida i projektkopian är ogiltig eller förekommer flera gånger. Originalfilen är oförändrad.');}
  }
  return normalizeProject({...raw,id:''});
}
