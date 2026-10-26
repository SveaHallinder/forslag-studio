import {customerJourney} from './customer-journey.mjs';
import {customerText} from './customer-language.mjs';
// Review suggestions never manufacture business facts. A copy improvement moves
// the exact remainder of an introduction into an editable section, after opt-in.
const fold=value=>String(value||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
const sectors=[
  {cues:/\b(?:cafe|coffee|restaurang|restaurant|bageri|bakery)\b/,needs:[['meny',/\b(?:meny|menu|meniu|utbud)\b/,'Lägg till företagets meny eller en länk till den, med bekräftade priser.'],['öppettider',/oppettider|opening hours|\b(?:oppet|open)\b/,'Lägg till företagets bekräftade öppettider så besökaren kan planera sitt besök.']]},
  {cues:/advokat|jurid|jurist|konsult|consult|radgiv|accounting|redovis|webbutveckl|webblosning/,needs:[['tjänster',/tjanst|service|erbjudande/,'Beskriv företagets tjänster: vad kunden får och hur man tar nästa steg.'],['kundcase',/kundcase|kundprojekt|referensprojekt|case stud|customer stor/,'Visa ett verifierat kundcase med uppdrag och resultat. Publicera bara godkända uppgifter.']]},
  {cues:/\b(?:butik|shop|retail|forpackningar|packaging|emballage)\b/,needs:[['produkter',/produkt|sortiment|kollektion|product|collection|papperspas|pizzakartong/,'Visa företagets produkter med rätt bilder, beskrivningar och bekräftade priser eller offertväg.']]},
  {cues:/\b(?:salong|frisor|klinik|wellness|spa|yoga)\b/,needs:[['behandlingar',/behandling|tjanst|treatment|service/,'Beskriv företagets behandlingar eller tjänster och ange bara bekräftade priser.']]},
  {cues:/byggforetag|byggfirma|snickeri|renover|construction/,needs:[['projekt',/referensprojekt|kundprojekt|vara projekt|our projects|kundcase/,'Visa genomförda projekt med godkända bilder och företagets faktiska insats.']]},
  {cues:/\b(?:hotell|hotel|boende|hospitality)\b/,needs:[['rum',/\brum\b|rooms|boende|accommodation/,'Visa boendet med aktuella bilder och företagets beskrivning av rum och vistelse.']]},
];
export function industryChecks(raw={}) {
  const primary=[[raw.name,5],[raw.headline,5],[raw.description,1]],scores=sectors.map(sector=>({sector,score:primary.reduce((n,[value,weight])=>n+(sector.cues.test(fold(value))?weight:0),0)})).sort((a,b)=>b.score-a.score);
  if((scores[0]?.score||0)<5)return [];
  const sector=scores[0].sector,content=fold([raw.description,raw.about,...(raw.cards||[]).flatMap(c=>[c.title,c.description]),...(raw.navigation||[]).map(n=>n.label)].join(' '));
  const checks=sector.needs.filter(([,pattern])=>!pattern.test(content)).map(([label,,help])=>({id:'industry',label:'Startsida: granska '+label,ok:false,blocking:false,pageIndex:-1,field:'addCard',tab:'content',help}));
  if(sector===sectors[0]&&!raw.address)checks.push({id:'industry',label:'Startsida: granska besöksadress',ok:false,blocking:false,pageIndex:-1,field:'address',tab:'details',help:'Lägg till företagets bekräftade adress så besökaren kan hitta till caféet eller restaurangen.'});
  return checks;
}
function splitIntroduction(description) {
  if(typeof description!=='string'||description.length<=480||description.length>6000||description.includes('\n')&&!description.includes('\n\n'))return;
  let end=0;
  for(const part of new Intl.Segmenter(undefined,{granularity:'sentence'}).segment(description)){
    const boundary=part.index+part.segment.length;
    if(boundary>320)break;
    if(boundary>=60&&/[.!?][”"')\]]?\s*$/.test(part.segment)){end=boundary;break;}
  }
  if(!end)return;
  const intro=description.slice(0,end).trimEnd(),remainder=description.slice(end).trimStart();
  if(remainder.length<120)return;
  return {intro,remainder};
}
function labelledIntroduction(description) {
  const markers=[...String(description||'').matchAll(/^[ \t]*(meny|menu|meniu|öppettider|opening hours|program|tjänster|services|kundcase|case studies)[ \t]*:?[ \t]*\r?\n/gim)];
  if(!markers.length)return;
  const intro=description.slice(0,markers[0].index).trim();if(intro.length<40||intro.length>320)return;
  const cards=markers.map((match,index)=>({title:match[1],description:description.slice(match.index+match[0].length,markers[index+1]?.index).trim(),...(/^(meny|menu|meniu)$/i.test(match[1])?{kind:'pricing'}:/^(tjänster|services)$/i.test(match[1])?{kind:'service'}:/^(kundcase|case studies)$/i.test(match[1])?{kind:'case'}:{})}));
  return cards.every(card=>card.description)&&description.length<=6000?{intro,cards}:undefined;
}
export function planCopyRefinements(raw) {
  const changes=[];
  for(const [index,page] of [raw,...(raw.pages||[]).slice(0,5)].entries()){
    if((page.cards||[]).length>=40)continue;
    const labelled=labelledIntroduction(page.description),split=labelled||splitIntroduction(page.description);if(!split||(page.cards||[]).length+(labelled?.cards.length||1)>40)continue;
    const reserved=new Set([...(page.cards||[]).map(c=>c.anchor),...(page.navigation||[]).map(n=>String(n.href||'').replace(/^#/,'')),...(raw.navigation||[]).map(n=>String(n.href||'').replace(/^#/,''))]);
    let anchor='fordjupning',suffix=2;while(reserved.has(anchor)||labelled?.cards.some((_,i)=>reserved.has(anchor+'-'+(i+1))))anchor='fordjupning-'+suffix++;
    const cards=labelled?labelled.cards.map((card,i)=>({...card,anchor:anchor+'-'+(i+1)})):[{title:customerText(page).about+' '+page.name,description:split.remainder,anchor}];
    if(cards.some(card=>reserved.has(card.anchor)))continue;
    changes.push({pageIndex:index-1,label:index?page.name||'Undersida':'Startsida',before:page.description,after:split.intro,card:cards[0],...(labelled?{cards}:{})});
  }
  return {signature:JSON.stringify(raw),changes};
}
export function applyCopyRefinements(current,plan) {
  if(JSON.stringify(current)!==plan.signature)throw new Error('Förslaget ändrades efter kontrollen. Kontrollera igen; dina senaste ändringar finns kvar.');
  const next=structuredClone(current);
  for(const change of plan.changes){const page=change.pageIndex<0?next:next.pages[change.pageIndex];page.description=change.after;page.cards=[...(change.cards||[change.card]),...(page.cards||[])];}
  return next;
}

export function planActionRefinements(raw={}) {
  const changes=[];
  for(const [index,page]of [raw,...(raw.pages||[])].entries()){
    if(page.cta&&!/^(kontakta oss|contact us|läs mer|read more|learn more|klicka här|click here|citește mai mult)$/i.test(page.cta.trim()))continue;
    const effective={...raw,...page,navigation:raw.navigation||[],cards:page.cards||[],email:page.email||raw.email,phone:page.phone||raw.phone},journey=customerJourney(effective),action=journey.primary;
    if(!action?.href)continue;
    const words=customerText(effective).journey,label=action.href.startsWith('mailto:')?words.email:action.href.startsWith('tel:')?words.phone:effective.navigation.find(n=>n.href===action.href&&n.label)?.label||(effective.requestForm?.url===action.href?action.label:'');
    if(!label||label===page.cta&&action.href===page.ctaHref)continue;
    changes.push({pageIndex:index-1,label:index?page.name||'Undersida':'Startsida',before:page.cta||'',after:label,href:action.href});
  }
  return {signature:JSON.stringify(raw),changes};
}
export function applyActionRefinements(current,plan) {
  if(JSON.stringify(current)!==plan.signature)throw new Error('Förslaget ändrades efter kontrollen. Kontrollera igen.');
  const next=structuredClone(current);for(const change of plan.changes){const page=change.pageIndex<0?next:next.pages[change.pageIndex];page.cta=change.after;page.ctaHref=change.href;}return next;
}
