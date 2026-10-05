import {detectSectionKind} from './section-design.mjs';
import {sectionComposition} from './composition.mjs';
const profiles = [
  {cues:/^(journalist|forfattare|author$|novelist|poet$|dramatiker|fotograf|photographer|konstnar|artist$)/,ids:['editorial','story','atelier']},
  {cues:/^(webblosning|webbplats|hemsidor|mjukvara|software|webbutveckl|digitalbyra)/,ids:['precision','consulting','studio']},
  {cues:/^(annons|annonser|annonsera|dooh$|utomhusreklam|storbildsskarm)/,ids:['editorial','story','studio']},
  {cues:/^(butik|sortiment|produkt|retail|shop$)/,ids:['retail','atelier','pop']},
  {cues:/^(restaurang|cafe|bageri|lunch|restaurant|bakery|dining)/,ids:['dining','cinema','pop']},
  {cues:/^(salong|behandling|klinik|traning|frisor|halsa|wellness|yoga|spa$)/,ids:['wellness','story','studio']},
  {cues:/^(bygg$|byggforetag|byggfirma|byggbolag|byggtjanst|hantverk|verkstad|snickeri|renover|construction)/,ids:['construction','services','studio']},
  {cues:/^(hotell|hotel|boende|resa$|resor|upplevelse|hospitality)/,ids:['hospitality','story','cinema']},
  {cues:/^(radgiv|jurid|jurist|advokat|konsult|redovis|consult|law$|accounting)/,ids:['consulting','story','services']},
  {cues:/^(arkitekt|architect|inred|kultur|magasin|editorial|design)/,ids:['story','editorial','atelier']},
];

const reasons = {
  cinema:'Ger verksamheten en filmisk entré med panoramabild och stora bildberättelser.',
  pop:'Ger innehållet ett lekfullt uttryck med färgblock, fylliga rubriker och rundade bildkort.',
  atelier:'Ger bilder och text en elegant rytm med bildvalv och asymmetriska uppslag.',
  precision:'Ger erbjudandet struktur med centrerad introduktion och tydliga innehållspaneler.',
  story:'Ger innehållet luft med generösa mellanrum och tydlig läsordning.',
  studio:'Ger innehållet större uttryck med stor typografi och breda bildsektioner.',
  services:'Ger tjänstetexter tydliga sektioner och ett framträdande erbjudande.',
  dining:'Ger innehållet en växlande rytm med text och stora bildytor sida vid sida.',
  wellness:'Ger innehållet en lugn rytm med luftig typografi och mjuka bildformer.',
  editorial:'Ger innehållet en redaktionell rytm med stora rubriker och asymmetriska bildpar.',
  construction:'Ger projektsektioner tyngd med kraftiga linjer och bilden först.',
  hospitality:'Ger vistelsen en panoramisk entré, stora bildberättelser och ett kompakt bokningsavslut.',
  consulting:'Ger texten fokus med en kompakt huvudbild och tydligt uppdelade sektioner.',
  retail:'Ger sortimentet redaktionella uppslag, tydliga produkthyllor och ett sammanhållet avslut.',
};

const list = value=>Array.isArray(value)?value:[];
const text = value=>typeof value==='string'?value:'';

export function recommendDirections(project={}) {
  const p=project&&typeof project==='object'?project:{};
  const cards=list(p.cards).filter(card=>card&&typeof card==='object');
  const words=value=>new Set(text(value).toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').match(/\p{L}+/gu)||[]);
  const fields=[[p.name,5],[p.eyebrow,3],[p.headline,5],[p.description,2],[p.aboutTitle,2],[p.about,1]];
  let selected=null,highestScore=0;
  for(const profile of profiles) {
    const scoreFields=items=>items.reduce((sum,[value,weight])=>sum+Math.min(2,[...words(value)].filter(word=>profile.cues.test(word)).length)*weight,0);
    const score=scoreFields(fields)+Math.min(4,scoreFields(cards.flatMap(card=>[[card.title,1],[card.description,.2]])));
    if(score>highestScore) {selected=profile;highestScore=score;}
  }
  const visualCards=cards.filter(card=>!['team','testimonial'].includes(detectSectionKind(card))&&sectionComposition(card)!=='logos');
  const images=new Set([p.hero,...list(p.heroGallery).map(image=>image?.url),
    ...visualCards.flatMap(card=>[card.image,...list(card.gallery).map(image=>image?.url)])].map(value=>text(value).trim()).filter(Boolean));
  let ids=selected?[...selected.ids]:['consulting',images.size>=3?'retail':'story','studio'];
  const textFirst=!text(p.hero).trim()&&text(p.description).length>450;
  if(textFirst)ids=['consulting',...ids.filter(id=>id!=='consulting')].slice(0,3);
  return ids.map((templateId,index)=>({
    templateId,label:['Stilrent','Bilddrivet','Uttrycksfullt'][index],
    reason:textFirst&&index===0?`${reasons[templateId]} Passar din längre introduktion utan huvudbild.`:index===1&&!images.size?`${reasons[templateId]} Kommer till sin rätt när du lägger till bilder från verksamheten.`:reasons[templateId],
  }));
}
