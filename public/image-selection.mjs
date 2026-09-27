import {imageURL,normalizeGallery} from './render.mjs';
export function imageCandidates(page={}) {
  const selected=[{url:page.hero,label:'Huvudbild'},...(page.heroGallery||[]),...(page.cards||[]).flatMap(card=>[{url:card.image,label:card.title},...(card.gallery||[])])];
  const map=new Map();for(const item of [...selected,...(page.images||[])]){const url=imageURL(item?.url);if(url)map.set(url,{url,label:String(item.label||map.get(url)?.label||'Bild').slice(0,160)});}return [...map.values()];
}
export function replaceGalleryImage(owner,key,primary,index,item) {
  const gallery=normalizeGallery(owner[key]||[],owner[primary])||[];
  if(!Number.isInteger(index)||index<0||index>=Math.max(1,gallery.length))throw new Error('Bilden finns inte längre. Stäng bildväljaren och välj igen.');
  if(item){const url=imageURL(item.url);if(!url)throw new Error('Välj en giltig bild.');gallery.splice(index,1,{...item,url});}
  else gallery.splice(index,1);
  const normalized=normalizeGallery(item?gallery.filter((candidate,i)=>candidate.url!==item.url||i===index):gallery)||[];
  return {...owner,[key]:normalized,[primary]:normalized[0]?.url||''};
}
