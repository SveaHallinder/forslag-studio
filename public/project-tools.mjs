import { normalizeProject, linkURL } from './render.mjs';

export function prepareNavigation(items) {
  if(!Array.isArray(items)||items.length>12)throw new Error('Menyn kan innehålla högst 12 länkar.');
  return items.map((item,index)=>{
    const label=String(item?.label??'').trim(),raw=String(item?.href??'').trim(),href=linkURL(raw);
    const field=!label||label.length>70?'label':!href||raw.length>2000?'href':'';
    if(field)throw Object.assign(new Error(`Menylänk ${index+1}: ${field==='label'?'skriv en menytext på högst 70 tecken.':'ange en fullständig https://-adress, mejl-/telefonlänk eller ett #ankare.'}`),{index,field});
    return {label,href};
  });
}

export function assessProject(raw = {}) {
  const p = normalizeProject(raw);
  const name = String(raw.name ?? '').trim();
  const headline = String(raw.headline ?? '').trim();
  return [
    {id:'name',label:'Företagsnamn',ok:!!name&&!['Nytt förslag','Ditt företag'].includes(name),blocking:true,field:'name',tab:'content',help:'Ange kundens företagsnamn.'},
    {id:'headline',label:'En egen huvudrubrik',ok:!!headline&&!['Här börjar nästa kunds hemsida.','En ny plats för ert företag.'].includes(headline),blocking:true,field:'headline',tab:'content',help:'Skriv en rubrik som passar företaget.'},
    {id:'contact',label:'Giltig kontaktväg',ok:!!(p.email||p.phone),blocking:false,field:'email',tab:'details',help:'Lägg till mejladress eller telefon om kontaktknappen ska fungera.'},
    {id:'images',label:'Valda verksamhetsbilder',ok:!!p.hero||p.cards.some(c=>c.image),blocking:false,field:'imageUpload',tab:'images',help:'Välj en huvudbild eller fortsätt med en textbaserad demo.'},
  ];
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
  return normalizeProject({...raw,id:''});
}
