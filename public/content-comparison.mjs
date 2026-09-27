const content=value=>String(value??'').trim();
const images=(gallery,primary)=>(gallery?.length?gallery:[{url:primary}]).filter(i=>i.url).map(i=>i.url+(i.caption?' · '+i.caption:'')).join('\n');
export function compareContent(original,current={}) {
  if(!original)return [];
  const differences=[];
  const compare=(label,before,after,target)=>{if(content(before)!==content(after))differences.push({kind:!content(after)?'removed':'changed',label,before:content(before),after:content(after),target});};
  for(const [field,label] of [['headline','Huvudrubrik'],['description','Introduktion'],['cta','Knapptext'],['ctaHref','Knappdestination']])compare(label,original[field],current[field],{type:'field',field});
  compare('Huvudbilder och bildtexter',images(original.heroGallery,original.hero),images(current.heroGallery,current.hero),{type:'image',scope:'hero',index:0});
  const menu=items=>(items||[]).map(n=>n.label+' → '+n.href).join('\n');compare('Meny',menu(original.navigation),menu(current.navigation),{type:'navigation'});
  const cards=current.cards||[],used=new Set();
  for(const source of original.cards||[]){
    let index=source.anchor?cards.findIndex((c,i)=>!used.has(i)&&c.anchor===source.anchor):-1;
    if(index<0)index=cards.findIndex((c,i)=>!used.has(i)&&c.title===source.title&&c.description===source.description);
    if(index<0)index=cards.findIndex((c,i)=>!used.has(i)&&c.title===source.title);
    if(index<0){differences.push({kind:'removed',label:'Sektion saknas: '+(source.title||'Utan rubrik'),before:[source.title,source.description].filter(Boolean).join('\n\n'),after:'',source});continue;}
    used.add(index);const card=cards[index],label=source.title||'Sektion '+(index+1);
    for(const [field,part] of [['title','Rubrik'],['description','Text']])compare(part+' · '+label,source[field],card[field],{type:'card',index,field});
    compare('Bilder och bildtexter · '+label,images(source.gallery,source.image),images(card.gallery,card.image),{type:'image',scope:String(index),index:0});
  }
  cards.forEach((card,index)=>{if(!used.has(index)&&(card.title||card.description||card.image))differences.push({kind:'added',label:'Tillagd sektion: '+(card.title||'Utan rubrik'),before:'',after:[card.title,card.description].filter(Boolean).join('\n\n'),target:{type:'card',index,field:'description'}});});
  return differences;
}
