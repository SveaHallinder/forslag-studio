import {socialProfileURL} from './social-content.mjs';
import {normalizeProject,imageURL} from './render.mjs';
import {normalizeBranding} from './branding.mjs';

export const socialIndustries={cafe:{label:'Café & coffee shop',template:'cafe'},restaurant:{label:'Restaurang & bar',template:'dining'},wellness:{label:'Salong & välmående',template:'wellness'},retail:{label:'Butik & produkter',template:'retail'},services:{label:'Tjänster & rådgivning',template:'services'},construction:{label:'Bygg & hantverk',template:'construction'},hospitality:{label:'Hotell & upplevelser',template:'hospitality'}};
export const socialPalettes={
  warm:{label:'Varm & mjuk',accent:'#95382a',branding:{background:'#f5f1e8',surface:'#f5f1e8',text:'#29231e',mutedText:'#695d52',secondary:'#29231e',headerBackground:'#f5f1e8',headerText:'#29231e'}},
  light:{label:'Ljus & ren',accent:'#285744',branding:{background:'#fafbf8',surface:'#eef2eb',text:'#202b24',mutedText:'#556159',secondary:'#233d30',headerBackground:'#fafbf8',headerText:'#202b24'}},
  dark:{label:'Mörk & varm',accent:'#e7ba83',branding:{background:'#24221f',surface:'#302d29',text:'#f5eee4',mutedText:'#c4b8a8',secondary:'#171614',headerBackground:'#24221f',headerText:'#f5eee4'}},
};
export const socialCopy={
  en:{headline:'A little pause.\nA place to stay.',offer:'A taste of what we do.',place:'The little place.',about:'A little closer.',hours:'Opening hours',visit:'Come by.',navOffer:'Discover',navPlace:'The place',navAbout:'About us',navVisit:'Find us',social:'Follow along',restaurant:'Good food.\nBetter company.',other:'Meet your next\nfavourite place.'},
  sv:{headline:'En liten paus.\nEn plats att stanna.',offer:'En smak av det vi gör.',place:'Vår lilla plats.',about:'Lite närmare.',hours:'Öppettider',visit:'Välkommen förbi.',navOffer:'Upptäck',navPlace:'Platsen',navAbout:'Om oss',navVisit:'Hitta hit',social:'Följ oss',restaurant:'God mat.\nÄnnu bättre sällskap.',other:'Din nästa\nfavoritplats.'},
  ro:{headline:'O mică pauză.\nUn loc de stat.',offer:'Un gust din ce facem.',place:'Micul nostru loc.',about:'Un pic mai aproape.',hours:'Program',visit:'Treci pe la noi.',navOffer:'Descoperă',navPlace:'Locul',navAbout:'Despre noi',navVisit:'Unde suntem',social:'Urmărește-ne',restaurant:'Mâncare bună.\nCompanie mai bună.',other:'Următorul tău\nloc preferat.'},
};

// The resulting draft uses the existing project shape, save/share/export paths.
// Creative headings are proposed copy; prices, products and facts are not invented.
export function createSocialProject(input) {
  const links=String(input.links||input.url||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(!links.length||links.length>3)throw new Error('Lägg till en till tre företagsprofiler, en länk per rad.');
  const profiles=[...new Map(links.map(link=>{const p=socialProfileURL(link);return [p.url,p];})).values()];
  const name=String(input.name||'').trim();if(!name||name.length>100)throw new Error('Fyll i företagets riktiga namn, högst 100 tecken.');
  const bio=String(input.bio||'').trim();if(!bio)throw new Error('Lägg till en kort profiltext eller beskrivning av företaget.');
  const industry=socialIndustries[input.industry]||socialIndustries.cafe,c= socialCopy[input.language]||socialCopy.en;
  const photos=(Array.isArray(input.photos)?input.photos:[]).filter(p=>p.role!=='none'&&imageURL(p.url)).slice(0,8),hero=photos.find(p=>p.role==='hero'),offerPhoto=photos.find(p=>p.role==='offer'),gallery=photos.filter(p=>p.role==='gallery');
  if(photos.filter(p=>p.role==='hero').length>1)throw new Error('Välj en enda huvudbild. Övriga bilder kan användas i bildgalleriet.');
  const cards=[];
  if(String(input.offer||'').trim()||offerPhoto)cards.push({anchor:'utbud',title:String(input.offerTitle||'').trim()||c.offer,description:String(input.offer||'').trim(),image:offerPhoto?.url||''});
  if(gallery.length)cards.push({anchor:'platsen',title:c.place,description:'',gallery:gallery.map(p=>({url:p.url,label:p.label||name,caption:p.caption||''})),image:gallery[0].url});
  if(String(input.hours||'').trim())cards.push({anchor:'oppettider',title:c.hours,description:String(input.hours).trim(),image:''});
  const navigation=[...cards.filter(card=>card.anchor!=='oppettider').map(card=>({label:card.anchor==='utbud'?c.navOffer:c.navPlace,href:'#'+card.anchor})),...(input.about?[{label:c.navAbout,href:'#om'}]:[]),{label:c.navVisit,href:'#kontakt'},...profiles.map(p=>({label:p.platform,href:p.url}))];
  const proposed=input.industry==='cafe'||!input.industry?c.headline:input.industry==='restaurant'?c.restaurant:c.other;
  const raw={name,source:profiles[0].url,templateId:industry.template,headline:String(input.headline||'').trim()||proposed,eyebrow:String(input.eyebrow||'').trim(),description:bio,hero:hero?.url||'',heroGallery:hero?[{url:hero.url,label:hero.label||name,caption:hero.caption||''}]:[],logo:input.logo||'',accent:input.accent||'#95382a',branding:{...socialPalettes.warm.branding,...normalizeBranding(input.branding)},cards,navigation,aboutTitle:c.about,about:String(input.about||'').trim(),address:String(input.address||'').trim(),email:String(input.email||'').trim(),phone:String(input.phone||'').trim(),cta:c.navVisit,ctaHref:'#kontakt',sectionTitle:c.offer,images:photos.map(p=>({url:p.url,label:p.label||name})),warnings:['Hemsidan är ett nytt designförslag från sociala medier. Rubriker, färgpalett och typsnitt är föreslagna; de är inte automatiskt identifierad branding. Kontrollera företagets fakta, bilder och rättigheter före delning.'],importedAt:new Date().toISOString()};
  const project=normalizeProject(raw);
  if(raw.email&&!project.email)throw new Error('Mejladressen är ogiltig. Rätta eller töm den innan du skapar förslaget.');
  if(raw.phone&&!project.phone)throw new Error('Telefonnumret är ogiltigt. Rätta eller töm det innan du skapar förslaget.');
  return project;
}
