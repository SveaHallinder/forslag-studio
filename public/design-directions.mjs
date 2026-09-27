const profiles = [
  {cues:/^(butik|sortiment|produkt|retail|shop$)/,ids:['story','retail','studio']},
  {cues:/^(restaurang|cafe|bageri|lunch|restaurant|bakery|dining)/,ids:['story','dining','studio']},
  {cues:/^(salong|behandling|klinik|traning|frisor|halsa|wellness|yoga|spa$)/,ids:['wellness','story','studio']},
  {cues:/^(bygg|hantverk|verkstad|snickeri|renover|construction)/,ids:['services','construction','studio']},
  {cues:/^(hotell|hotel|boende|resa$|resor|upplevelse|hospitality)/,ids:['story','hospitality','dining']},
  {cues:/^(radgiv|jurid|jurist|advokat|konsult|redovis|consult|law$|accounting)/,ids:['consulting','story','services']},
  {cues:/^(arkitekt|architect|inred|kultur|magasin|editorial|design)/,ids:['story','editorial','studio']},
];

const reasons = {
  story:'Ger innehållet luft med generösa mellanrum och tydlig läsordning.',
  studio:'Ger innehållet större uttryck med rymliga sektioner och ett förskjutet bildgalleri.',
  services:'Ger tjänstetexter tydliga sektioner och ett framträdande erbjudande.',
  dining:'Ger innehållet en växlande rytm med text och stora bildytor sida vid sida.',
  wellness:'Ger innehållet en lugn rytm med inramade kort och mjuka former.',
  editorial:'Ger innehållet en redaktionell rytm med stora rubriker och asymmetriska bildpar.',
  construction:'Ger projektsektioner tyngd med kraftiga linjer och bilden först.',
  hospitality:'Ger bilderna stort utrymme med panorama och en inramad introduktion.',
  consulting:'Ger texten fokus med en kompakt huvudbild och numrerade sektioner.',
  retail:'Ger bilderna tydliga ytor i ett luftigt galleri.',
};

const list = value=>Array.isArray(value)?value:[];
const text = value=>typeof value==='string'?value:'';

export function recommendDirections(project={}) {
  const p=project&&typeof project==='object'?project:{};
  const cards=list(p.cards).filter(card=>card&&typeof card==='object');
  const words=[p.name,p.eyebrow,p.headline,p.description,p.aboutTitle,p.about,...cards.flatMap(card=>[card.title,card.description])]
    .map(text).join(' ').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').match(/\p{L}+/gu)||[];
  let selected=null,highestScore=0;
  for(const profile of profiles) {
    const score=words.filter(word=>profile.cues.test(word)).length;
    if(score>highestScore) {selected=profile;highestScore=score;}
  }
  const images=new Set([p.hero,...list(p.heroGallery).map(image=>image?.url),
    ...cards.flatMap(card=>[card.image,...list(card.gallery).map(image=>image?.url)])].map(value=>text(value).trim()).filter(Boolean));
  const ids=selected?selected.ids:['consulting',images.size>=3?'retail':'story','studio'];
  return ids.map((templateId,index)=>({
    templateId,label:['Stilrent','Bilddrivet','Uttrycksfullt'][index],
    reason:index===1&&!images.size?`${reasons[templateId]} Kommer till sin rätt när du lägger till bilder.`:reasons[templateId],
  }));
}
