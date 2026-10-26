// Rank only photos already associated with one source section. Unknown-size
// originals stay first; dimensions are evidence of readability, not relevance.
export function chooseImportPhoto(images,{hero=true,context=''}={}) {
  const support=/certificat|certifiering|certifikat|standard[\s_-]+developer|\biso[\s_-]*(?:9001|14001|27001)/i;
  const candidates=images.filter(image=>{
    const words=image.label+' '+image.url;
    return !/logo|favicon|sprite|tracking|spacer|ornament|decoration/i.test(words)&&!(hero&&support.test(words))&&(!image.width||image.width>=300)&&(!image.height||image.height>=180);
  });
  const first=candidates[0];if(!first||!first.width||!first.height)return first;
  const words=value=>String(value||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').match(/\p{L}{4,}/gu)||[];
  const relevant=new Set(words(context).filter(word=>!['vara','foretag','bilder','company','photo','image','with','fran','vara'].includes(word)));
  const score=image=>{
    if(!image.width||!image.height)return 0;
    const size=image.width>=1200&&image.height>=600?30:image.width>=800&&image.height>=400?20:10;
    const matches=new Set(words(image.label+' '+image.url).filter(word=>relevant.has(word))).size;
    return size+Math.min(2,matches)*30+(image.width/image.height>=1.15&&image.width/image.height<=2.2?4:0);
  };
  return candidates.reduce((best,image)=>score(image)>score(best)?image:best,first);
}
