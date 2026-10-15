import {brandPalette,bestInk,contrast} from './branding.mjs';
import {paragraphContent,sectionComposition} from './composition.mjs';
import {detectSectionKind} from './section-design.mjs';
import {cafeFontCSS} from './cafe-fonts.mjs';

// A presentation layer, never a rewrite of the saved company source.
export const redesignedTemplates=new Set(['gallery','poster','cinema','pop','precision','story','studio','services','wellness','editorial','construction','hospitality','consulting','retail']);
export function copyLead(value,limit=240) {
  const copy=String(value||'').trim();
  if(copy.length<=limit)return copy;
  const paragraph=copy.split(/\n\s*\n/)[0];
  if(paragraph.length<=limit)return paragraph;
  const sentences=paragraph.match(/.+?[.!?](?:[”"'](?=\s|$))?(?=\s|$)/g)||[];
  if(sentences.length){let lead=sentences[0].trim();for(const sentence of sentences.slice(1)){if((lead+' '+sentence.trim()).length>limit)break;lead+=' '+sentence.trim();}if(lead.length<=limit+80)return lead;}
  const end=copy.lastIndexOf(' ',limit);return copy.slice(0,end>limit/2?end:limit)+'…';
}

export function websiteSectionRole(card={}) {
  const title=String(card.title||''),description=String(card.description||'');
  if(/(?:kontakt|contact|hur kan vi hjälpa)/i.test(title)&&/(?:privacy policy|all rights reserved|\blegal\b|integritetspolicy)/i.test(description))return 'source-contact';
  const kind=detectSectionKind(card);
  if(sectionComposition(card)==='logos')return 'logos';
  if(kind==='product'&&(card.kind==='product'||card.image||card.gallery?.length))return card.gallery?.length>1?'collection':'product';
  if(['team','pricing','faq'].includes(kind))return card.gallery?.length>1&&kind==='team'?'collection':kind;
  if(kind==='testimonial'||/^\s*["“”«]/.test(description))return 'reference';
  if(card.gallery?.length>1)return 'collection';
  if(card.image||card.gallery?.length)return 'project';
  if(card.href&&!description)return 'index';
  if(!description)return 'chapter';
  return 'text';
}

export function websiteContactDetails(p) {
  const lines=p.cards.filter(card=>websiteSectionRole(card)==='source-contact').flatMap(card=>card.description.split(/\n+/).map(line=>line.trim()));
  const phone=p.phone||lines.find(line=>/^\+\d[\d ()-]{7,32}$/.test(line))||'';
  const email=p.email||lines.find(line=>/^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/.test(line))||'';
  return {phone,email};
}

function readableCopy(value,e,limit=240) {
  const lead=copyLead(value,limit),full=String(value||'').trim();
  return `<p class="rd-lead">${paragraphContent(lead,e)}</p>${lead!==full?`<details class="rd-more"><summary>Läs mer<span aria-hidden="true"> +</span></summary><p>${paragraphContent(full,e)}</p></details>`:''}`;
}

export function renderWebsiteRedesign(p,{e,pic,header,renderCard,benefits,ending,imported,personal}) {
  const external=href=>/^https?:/.test(href)?' target="_blank" rel="noopener noreferrer"':'';
  const hero=p.heroGallery?.length?p.heroGallery:p.hero?[{url:p.hero,label:p.name}]:[];
  const pictures=hero.map((item,index)=>`<figure>${pic(item.url,item.label||p.name,'hero-image',index>0,item.presentation,index===0)}${item.caption?`<figcaption>${e(item.caption)}</figcaption>`:''}</figure>`).join('');
  const primary=p.ctaHref||(!imported&&p.cards.length)?`<a class="button rd-primary" href="${e(p.ctaHref||'#erbjudande')}"${external(p.ctaHref)}>${p.ctaHref?e(p.cta):'Utforska vårt utbud'}<span aria-hidden="true">↗</span></a>`:'';
  const local=p.cards.find(card=>card.anchor&&websiteSectionRole(card)!=='source-contact');
  const secondary=local&&p.ctaHref&&p.ctaHref!=='#'+local.anchor?`<a class="rd-secondary" href="#${e(local.anchor)}">Upptäck mer<span aria-hidden="true">↓</span></a>`:'';
  const heroHTML=`<div class="hero-layout"${personal?' data-profile="person"':''} data-hero="${hero.length?'image':'text'}"><section class="hero-copy"><div class="eyebrow">${e(p.eyebrow||p.name)}</div>${personal?`<p class="profile-name">${e(p.name)}</p>`:''}<h1 data-length="${p.headline.length>150?'extended':p.headline.length>80?'long':'short'}">${e(p.headline)}</h1>${p.description?readableCopy(p.description,e,160):''}<div class="rd-actions">${primary}${secondary}</div></section><div class="visual${hero.length?'':' no-image'}">${hero.length?`<div class="rd-image-frame" data-image-count="${hero.length}"${p.heroPosition!==50?' data-position="custom"':''}${hero.length>1?' data-gallery-title="'+e(p.name)+'"':''}>${pictures}</div>`:''}</div></div>`;
  let projectIndex=0;
  const roles=p.cards.map(websiteSectionRole);
  const cards=p.cards.map((card,index)=>{
    const role=roles[index];
    let html=renderCard(card,index).replace(/(<article\b[^>]*)(>)/,(_,open,end)=>open+' data-redesign-role="'+role+'"'+end);
    if(['product','team'].includes(role)){
      let start=index,end=index+1;while(start>0&&roles[start-1]===role)start--;while(end<roles.length&&roles[end]===role)end++;
      html=html.replace('data-redesign-role="'+role+'"','data-redesign-role="'+role+'" data-redesign-group-count="'+(end-start)+'"'+(index===start?' data-redesign-group-start':''));
    }
    if(['project','product','team'].includes(role)){
      if(role==='project')html=html.replace('data-redesign-role="project"','data-redesign-role="project" data-redesign-position="'+projectIndex+'" data-redesign-side="'+(projectIndex++%2)+'"');
      // Limit reading load, with the full original retained in a native disclosure.
      if(role==='project'&&card.description.length>240){const full=paragraphContent(card.description,e);html=html.replace('<p class="section-copy">'+full+'</p>',readableCopy(card.description,e,200));}
      if(card.image||card.gallery?.length)html=html.replace(/^(<article\b[^>]*>)([\s\S]*?)(<div class="card-meta")/,(_,open,images,meta)=>open+'<div class="rd-project-image">'+images+'</div>'+meta);
    }
    if(role==='faq')html=html.replaceAll('class="faq-item" open','class="faq-item"');
    if(role==='text'&&card.description.length>360&&['generic','service','case'].includes(detectSectionKind(card))){const full=paragraphContent(card.description,e);html=html.replace('<p class="section-copy">'+full+'</p>',readableCopy(card.description,e,260));}
    if(role==='reference'){
      const parts=card.description.split(/\n\s*\n/),quote=parts[0];
      if(parts.length>1&&/^\s*["“«]/.test(quote)&&/["”»]\s*$/.test(quote)){
        const full=paragraphContent(card.description,e),content=`<blockquote>${e(quote)}</blockquote><p class="rd-reference-note">${paragraphContent(parts.slice(1).join('\n\n'),e)}</p>`;
        html=html.replace('<p class="section-copy">'+full+'</p>',content).replace('<blockquote>'+full+'</blockquote>',content);
      }
    }
    if(role==='source-contact')html=html.replace(/^(<article\b[^>]*>)([\s\S]*)(<\/article>)$/,(_,open,content,end)=>open+'<details class="rd-original-contact"><summary>Fler uppgifter</summary>'+content+'</details>'+end);
    return html;
  }).join('');
  return `<div class="demo-note">Designförslag · Framtagen för ${e(p.name)}</div><div class="shell">${header}<main id="start">${heroHTML}${benefits}${p.cards.length?`<section class="section rd-content" id="erbjudande">${p.sectionIntro?`<div class="section-top"><h2>${e(p.sectionTitle)}</h2><p>${e(p.sectionIntro)}</p></div>`:''}<div class="cards">${cards}</div></section>`:''}${p.about?`<section class="section about" id="om"><div><p class="section-kicker">Om ${e(p.name)}</p><h2>${e(p.aboutTitle||p.name)}</h2></div><p>${paragraphContent(p.about,e)}</p></section>`:''}${ending.contact}</main>${ending.footer}</div>`;
}

export function websiteRedesignCSS(p) {
  if(!redesignedTemplates.has(p.templateId))return '';
  const b=brandPalette(p.branding),id=p.templateId;
  const dark=['studio','cinema'].includes(id),serif=['story','gallery','editorial','wellness','hospitality','retail','cinema'].includes(id);
  const paper=dark?'#171c21':p.branding?.background||(['story','editorial','gallery','wellness'].includes(id)?'#f8f7f2':'#ffffff');
  const ink=dark?'#fbfaf7':contrast(b.text,paper)>=7?b.text:bestInk(paper);
  const accent=p.accent,accentInk=bestInk(accent),soft=p.branding?.surface||(dark?'#252c33':`color-mix(in srgb,${accent} 5%,${paper})`);
  const quote=value=>JSON.stringify(value).replace(/</g,'\\3c ').replace(/>/g,'\\3e ');
  const sourceSerif=/serif|fraunces|georgia|times|playfair/i.test(p.typography?.heading||'')&&!/sans/i.test(p.typography?.heading||'');
  const heading=p.typography?.heading?quote(p.typography.heading)+(sourceSerif?',serif':',sans-serif'):serif?'Fraunces,Georgia,serif':"'DM Sans','Avenir Next',sans-serif";
  const bodyFont=p.typography?.body?quote(p.typography.body)+',sans-serif':"'DM Sans','Avenir Next',sans-serif";
  const s='html body[data-template][data-imported][data-page-design][data-website-design]';
  const c=s+' .cards>.card[data-redesign-role]';
  return `${cafeFontCSS}
/* New website composition: source content stays editable and exports stay standalone. */
${s}{--rd-paper:${paper};--rd-ink:${ink};--rd-soft:${soft};--rd-accent:${accent};--rd-accent-ink:${accentInk};--rd-line:color-mix(in srgb,var(--rd-ink) 15%,transparent);--rd-heading:${heading};background:var(--rd-paper);color:var(--rd-ink);font-family:${bodyFont};font-size:16px;line-height:1.6}
${s} .shell{max-width:1440px;padding:0 clamp(24px,5vw,76px);margin:auto}
${s} .demo-note{padding:6px 20px;background:var(--rd-paper);color:var(--rd-ink);border-bottom:1px solid var(--rd-line);font-size:9px;letter-spacing:.12em;opacity:.7}
${s} :is(h1,h2,h3){font-family:var(--rd-heading)!important;color:inherit;letter-spacing:-.045em;font-weight:500;text-wrap:balance}
${s} .nav[data-header]{min-height:92px;margin:0;padding:20px 0;border:0;border-bottom:1px solid var(--rd-line);border-radius:0;background:${dark&&!p.logo?'transparent':b.headerBackground};color:${dark&&!p.logo?ink:b.headerText}}
${s} .nav[data-header] .brand{font-size:24px;max-width:30%}
${s} .nav[data-header] .brand-mark img{max-width:min(156px,100%);max-height:36px}
${s} .nav[data-header] .nav-links{gap:32px;font-size:12px;letter-spacing:0}
${s} .nav[data-header] .nav-action{padding:10px 19px;border-radius:7px;border:1px solid currentColor;transform:none;background:transparent;color:inherit;min-height:44px}
${s} .hero-layout{display:grid;grid-template-columns:1.08fr 1fr;position:relative;isolation:isolate;align-items:center;gap:clamp(32px,6vw,88px);padding:72px 0 76px;margin:0;background:transparent;color:inherit;min-height:0}
${s} .hero-layout::after{content:none}
${s} .hero-layout .hero-copy{display:block;padding:0!important;margin:0;max-width:none;text-align:left;background:transparent;color:inherit;border-radius:0}
${s} .hero-layout .eyebrow{display:flex;justify-content:flex-start;grid-column:auto;font-size:10px;letter-spacing:.14em;line-height:1.5;text-transform:uppercase;max-width:none;margin:0 0 24px;color:inherit;opacity:.65}
${s} .hero-layout .eyebrow::before{content:none}
${s} .hero-layout h1{font-size:clamp(45px,5.35vw,82px);font-weight:500;line-height:1.04;margin:0 0 26px;max-width:17ch;grid-column:auto;grid-row:auto;text-transform:none;font-style:normal;letter-spacing:-.055em}
${s} .hero-layout h1[data-length=long]{font-size:clamp(42px,4.4vw,66px)}
${s} .hero-layout h1[data-length=extended]{font-size:clamp(36px,3.6vw,54px)}
${s} .hero-layout .rd-lead{font-size:16px;line-height:1.7;margin:0;max-width:43ch;color:inherit;opacity:.76;white-space:pre-line}
${s} .rd-actions{display:flex;flex-wrap:wrap;align-items:center;gap:24px;margin-top:30px}
${s} .button.rd-primary{padding:15px 23px;min-height:52px;font-size:12px;font-weight:600;border:0;border-radius:6px;background:var(--rd-accent);color:var(--rd-accent-ink);letter-spacing:0;text-transform:none;gap:30px;margin:0;transform:none}
${s} .rd-secondary{display:flex;align-items:center;gap:16px;min-height:44px;font-size:12px;border-bottom:1px solid var(--rd-line)}
${s} .hero-layout .visual{position:relative;inset:auto;z-index:auto;order:0;margin:0;display:block;min-width:0;max-width:none;background:transparent;border-radius:0;padding:0;overflow:visible}
${s} .rd-image-frame{position:relative;background:var(--rd-soft);border-radius:14px;overflow:hidden;display:grid;gap:12px;min-width:0}
${s} .rd-image-frame figure{margin:0;min-width:0;display:flex;flex-direction:column;align-items:center}
${s} .rd-image-frame:has(figure+figure){grid-template-columns:repeat(2,minmax(0,1fr));padding:12px}
${s} .rd-image-frame:has(figure+figure) .hero-image{aspect-ratio:4/5}
${s} .hero-layout .hero-image{display:block;width:100%;height:auto;min-height:0;max-height:560px;aspect-ratio:1/1;object-fit:cover;border-radius:0;object-position:50% var(--hero-position);padding:0;filter:none}
${s} .rd-image-frame figcaption{font-size:11px;padding:12px 16px;line-height:1.6;white-space:pre-line}
${s} .hero-layout[data-hero=text]{grid-template-columns:1fr;padding:76px 0;max-width:1050px}
${s} .hero-layout[data-hero=text] .hero-copy{max-width:900px;margin:0}
${s} .hero-layout[data-hero=text] h1{font-size:clamp(48px,7vw,104px);max-width:20ch}
${s} .hero-layout[data-hero=text] .visual{display:none}
${s} .rd-more{margin:12px 0 0;max-width:60ch}
${s} .rd-more summary{cursor:pointer;font-size:11px;min-height:36px;display:flex;align-items:center;gap:18px;list-style:none;text-decoration:underline;text-underline-offset:4px;opacity:.7}
${s} .rd-more summary::-webkit-details-marker{display:none}
${s} .rd-more[open] summary span{transform:rotate(45deg)}
${s} .rd-more p{font-size:14px;line-height:1.75;margin:14px 0 0;white-space:pre-line;color:inherit}
${s} .benefits{position:static;display:grid;grid-template-columns:repeat(var(--benefit-count),minmax(0,1fr));max-width:none;margin:0 0 48px;padding:24px 0;gap:32px;border:0;border-block:1px solid var(--rd-line);border-radius:0;background:transparent;color:inherit}
${s} .benefit h3{font-family:'DM Sans',sans-serif!important;font-size:15px;letter-spacing:-.02em;margin:0 0 8px}
${s} .benefit p{font-size:12px;line-height:1.65;color:inherit;opacity:.65;max-width:34ch}
${s} .benefit i{display:none}
${s} .rd-content{padding:0;margin:0}
${s} .cards{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));align-items:start;gap:24px;padding:0;margin:0}
${c}{grid-column:1/-1;display:block;min-width:0;margin:0!important;padding:52px 0!important;border:0;border-top:1px solid var(--rd-line);border-radius:0;background:transparent;color:inherit;box-shadow:none;text-align:left;align-self:stretch;overflow-wrap:anywhere}
${c}::before,${c}::after{content:none}
${c} .card-meta{display:block;margin:0;padding:0;max-width:none!important;border:0;min-width:0}
${c} .card-meta>div{display:block;max-width:none}
${c} :is(h2,h3){font-size:clamp(28px,3.25vw,46px);font-weight:500;line-height:1.14;max-width:24ch;margin:0 0 20px;text-transform:none;font-style:normal;letter-spacing:-.035em}
${c} :is(p,blockquote){font-size:15px;line-height:1.8;max-width:61ch;color:inherit;margin:0;white-space:pre-line;text-align:left;opacity:.8}
${c} p:has(>.copy-part){white-space:normal}
${c} .copy-part{display:block;white-space:pre-line}
${c} .copy-part+.copy-part{margin-top:1.1em}
${c} .flow-index{display:block;font:500 10px/1.5 'DM Sans',sans-serif;letter-spacing:.14em;opacity:.5;margin:0 0 16px}
${c} .section-link-arrow{font-size:.6em;vertical-align:middle;white-space:nowrap}
${c}[data-redesign-role=index]{grid-column:span 4;padding:26px!important;border:1px solid var(--rd-line);border-radius:8px;background:var(--rd-soft)}
${c}[data-redesign-role=index] h2{font-family:'DM Sans',sans-serif!important;font-size:19px;line-height:1.35;margin:0;max-width:none;letter-spacing:-.03em}
${c}[data-redesign-role=index] a{min-height:44px;display:flex;justify-content:space-between;align-items:center;gap:12px}
${c}[data-redesign-role=chapter]{padding:40px 0 4px!important;border:0;grid-column:1/-1}
${c}[data-redesign-role=chapter] h2{font-size:clamp(36px,4.5vw,66px);margin:0}
${c}[data-redesign-role=text] .card-meta>div{display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:clamp(28px,6vw,90px)}
${c}[data-redesign-role=text] h2{font-size:clamp(28px,3vw,42px)}
${c}[data-redesign-role=text] .flow-index{grid-column:1/-1}
${c}[data-redesign-role=project]{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);align-items:center;gap:clamp(28px,5vw,72px);padding:52px 0!important}
${c}[data-redesign-role=project][data-redesign-side="1"]{grid-template-columns:minmax(0,1fr) minmax(0,1.12fr)}
${c}[data-redesign-role=project][data-redesign-side="1"] .card-meta{order:-1}
${c} .rd-project-image{display:flex;align-items:center;justify-content:center;min-width:0;padding:clamp(16px,3vw,40px);background:var(--rd-soft);border:1px solid var(--rd-line);border-radius:14px;overflow:hidden}
${c} img{display:block;max-inline-size:min(100%,var(--rd-image-width,100%));width:auto;height:auto;max-height:480px;aspect-ratio:auto;object-fit:contain;border-radius:4px;padding:0;background:transparent;order:0!important}
${c} .section-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;padding:0;background:transparent;border-radius:0;min-width:0;order:0}
${c} .section-gallery[data-image-count="1"]{display:block}
${c} figure{margin:0;min-width:0}
${c} figcaption{font-size:11px;line-height:1.6;opacity:.6;white-space:pre-line;margin:12px 0 0}
${c}[data-redesign-role=collection]{display:block}
${c}[data-redesign-role=collection] .card-meta{margin:28px 0 0}
${c}[data-redesign-role=collection] .section-gallery img{max-height:480px;width:100%}
${c}[data-redesign-role=reference]{padding:clamp(32px,5vw,64px)!important;background:var(--rd-soft);border:0;border-radius:12px}
${c}[data-redesign-role=reference] .card-meta>div{display:flex;flex-direction:column;max-width:900px;margin:auto}
${c}[data-redesign-role=reference] h2{font-family:'DM Sans',sans-serif!important;font-size:12px;font-weight:600;letter-spacing:.06em;margin:0 0 24px;text-transform:uppercase}
${c}[data-redesign-role=reference] :is(p,blockquote){font-family:var(--rd-heading);font-size:clamp(20px,2.2vw,31px);line-height:1.55;letter-spacing:-.025em;max-width:55ch;opacity:1}
${c}[data-redesign-role=reference] .rd-reference-note{font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.75;letter-spacing:0;margin-top:28px;max-width:65ch;opacity:.65}
${c}[data-redesign-role=source-contact]{padding:20px 0!important;border-top:1px solid var(--rd-line)}
${c} .rd-original-contact summary{font:500 11px/1.5 'DM Sans',sans-serif;min-height:44px;display:flex;align-items:center;cursor:pointer;opacity:.55}
${c} .rd-original-contact[open]{max-width:800px}
${c} .rd-original-contact[open] h2{font-size:20px;margin-top:20px}
${c} .rd-original-contact[open] p{font-size:13px}
${s} .about{padding:64px 0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:72px;border-top:1px solid var(--rd-line)}
${s} .about h2{font-size:42px;line-height:1.2}
${s} .about>p{font-size:16px;line-height:1.8;color:inherit;opacity:.8}
${s} .contact.site-contact{--ending-paper:var(--rd-ink);--ending-ink:var(--rd-paper);--ending-line:color-mix(in srgb,var(--rd-paper) 20%,transparent);display:grid;grid-template-columns:1.15fr 1fr;gap:64px;align-items:start;margin:56px 0 0;padding:56px!important;border:0;border-radius:14px;background:var(--rd-ink);color:var(--rd-paper)}
${s} .contact.site-contact .ending-invitation{display:flex;align-items:start;justify-content:space-between;gap:28px}
${s} .contact.site-contact h2{font-family:var(--rd-heading)!important;font-size:clamp(40px,5vw,70px);line-height:1.1;margin:0;letter-spacing:-.05em}
${s} .contact.site-contact .ending-action{min-width:52px;min-height:52px;width:52px;height:52px;padding:12px;border:1px solid color-mix(in srgb,var(--rd-paper) 40%,transparent);color:inherit}
${s} .contact.site-contact .ending-action-label{position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden;white-space:nowrap}
${s} .contact.site-contact .ending-detail>a{font-size:19px;line-height:1.5;min-height:44px}
${s} .contact.site-contact .ending-address{font-size:14px}
${s} .contact.site-contact .ending-label{font-size:9px;opacity:.55;letter-spacing:.12em;margin-bottom:8px}
${s} .contact.site-contact .contact-links{font-size:14px;color:inherit}
${s} .contact.site-contact .ending-detail{border-color:color-mix(in srgb,var(--rd-paper) 20%,transparent);margin-bottom:18px;padding-bottom:18px}
${s} .contact.site-contact[data-contact=empty],${s} .contact.site-contact[data-contact=website]{background:var(--rd-soft);color:inherit;padding:28px!important;border:1px solid var(--rd-line);margin-top:32px}
${s} .contact.site-contact[data-contact=empty] h2,${s} .contact.site-contact[data-contact=website] h2{font-size:26px}
${s} .footer.site-footer{padding:40px 0 24px;margin:0;border:0;background:transparent;color:inherit;display:block}
${s} .footer.site-footer .ending-index{display:flex;align-items:start;gap:44px;justify-content:space-between;margin:0 0 32px}
${s} .footer.site-footer .ending-logo{padding:0;max-width:140px;flex-basis:140px;min-height:44px;background:transparent}
${s} .footer.site-footer .ending-logo img{max-height:30px}
${s} .footer.site-footer .ending-links{display:flex;flex-wrap:wrap;max-width:680px;justify-content:flex-end;gap:4px 26px}
${s} .footer.site-footer .ending-links a,${s} .footer.site-footer .ending-top{font-size:11px;min-height:44px}
${s} .footer.site-footer .ending-wordmark{font-family:var(--rd-heading)!important;font-size:clamp(38px,7vw,92px);line-height:1.06;margin:0 0 26px;max-width:none;letter-spacing:-.055em}
${s} .footer.site-footer .ending-colophon{font-size:9px;color:inherit;opacity:.55;gap:24px;padding-top:20px;border-top:1px solid var(--rd-line)}
${s} .footer.site-footer .source{font-size:9px;color:inherit}
${s} summary:focus-visible,${s} a:focus-visible{outline:2px solid currentColor;outline-offset:5px}
${id==='editorial'||id==='poster'?`
${s} .hero-layout{display:block;padding:56px 0 64px}
${s} .hero-layout .hero-copy{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,.7fr);gap:0 64px;margin-bottom:40px}
${s} .hero-layout .eyebrow{grid-column:1/-1;margin-bottom:22px}
${s} .hero-layout h1{grid-column:1;grid-row:2/5;font-size:clamp(52px,6vw,92px);max-width:18ch;margin:0}
${s} .hero-layout .rd-lead,${s} .hero-layout .rd-more,${s} .hero-layout .rd-actions{grid-column:2}
${s} .hero-layout .rd-lead{align-self:start;padding-top:8px}
${s} .hero-layout .hero-image{aspect-ratio:2.7/1;max-height:420px}
${c}[data-redesign-role=project]{grid-template-columns:1.4fr 1fr;gap:64px}
${c}[data-redesign-role=project][data-redesign-side="1"]{grid-template-columns:1fr .85fr;padding-inline:36px!important;background:var(--rd-soft);border-radius:8px;border:0}
`:''}
${id==='precision'?`
${s} .hero-layout{display:flex;flex-direction:column;text-align:center;padding:64px 0 40px;gap:44px}
${s} .hero-layout .hero-copy{text-align:center;max-width:820px}
${s} .hero-layout .eyebrow,${s} .hero-layout .rd-actions{justify-content:center}
${s} .hero-layout h1{margin-inline:auto;max-width:18ch;font-size:clamp(48px,5.5vw,80px);font-weight:600}
${s} .hero-layout .rd-lead,${s} .hero-layout .rd-more{margin-inline:auto;max-width:54ch}
${s} .hero-layout .visual{width:min(100%,1080px)}
${s} .rd-image-frame{padding:30px;border:1px solid var(--rd-line);background:var(--rd-soft)}
${s} .hero-layout .hero-image{aspect-ratio:2.4/1;object-fit:contain;max-height:420px;border-radius:6px}
${c}[data-redesign-role=project]{padding:36px!important;border:1px solid var(--rd-line);border-radius:14px;margin:16px 0!important}
${c}[data-redesign-role=project] .rd-project-image{border:0;padding:20px}
`:''}
${id==='studio'?`
${s} .hero-layout{display:grid;grid-template-columns:1.35fr 1fr;padding:72px 0 56px;align-items:end}
${s} .hero-layout h1{font-size:clamp(52px,6.1vw,90px);font-weight:500;max-width:15ch}
${s} .hero-layout .visual{align-self:start;padding-top:24px}
${s} .rd-image-frame{border-radius:0;background:#ffffff0c}
${s} .hero-layout .hero-image{aspect-ratio:4/5}
${c}[data-redesign-role=index]{background:transparent;border-radius:0;border-width:1px 0 0;padding:28px 0!important}
${c}[data-redesign-role=project]{display:flex;flex-direction:column;align-items:stretch;gap:28px}
${c}[data-redesign-role=project] .rd-project-image{padding:24px;border-radius:0;min-height:300px}
${c}[data-redesign-role=project] .card-meta{order:0}
${c}[data-redesign-role=project] .card-meta>div{display:grid;grid-template-columns:1fr 1fr;gap:48px}
${c}[data-redesign-role=project] img{max-height:500px}
`:''}
${id==='cinema'||id==='hospitality'?`
${s} .hero-layout{display:grid;grid-template-columns:1fr 1.15fr;gap:64px;padding:56px 0 72px}
${s} .hero-layout h1{font-weight:400;font-size:clamp(54px,6.2vw,92px);max-width:14ch}
${s} .hero-layout .hero-image{aspect-ratio:4/5;max-height:680px}
${s} .rd-image-frame{border-radius:0}
${c}[data-redesign-role=project]{grid-template-columns:1.3fr 1fr;gap:72px}
${c}[data-redesign-role=project] .rd-project-image{border-radius:0;padding:20px}
${c}[data-redesign-role=index]{border-radius:0;background:transparent;border-width:1px 0 0;padding:28px 0!important}
`:''}
${id==='pop'?`
${s} .hero-layout{grid-template-columns:1.1fr 1fr;gap:16px;padding:24px 0 48px;align-items:stretch}
${s} .hero-layout .hero-copy{background:var(--rd-accent);color:var(--rd-accent-ink);padding:48px!important;border-radius:28px;display:flex;flex-direction:column;justify-content:center}
${s} .hero-layout h1{font-weight:700;font-size:clamp(50px,5.9vw,90px);line-height:1.02}
${s} .button.rd-primary{background:var(--rd-accent-ink);color:var(--rd-accent);border-radius:100px}
${s} .rd-image-frame{border-radius:28px;height:100%}
${s} .rd-image-frame figure{height:100%}
${s} .hero-layout .hero-image{height:100%;max-height:720px;aspect-ratio:4/5}
${c}[data-redesign-role=index]{border-radius:18px;background:var(--rd-accent);color:var(--rd-accent-ink);border:0}
${c}[data-redesign-role=project]{padding:32px!important;border-radius:24px;background:var(--rd-soft);border:0}
${s} .contact.site-contact{border-radius:24px}
`:''}
${id==='consulting'||id==='services'||id==='construction'?`
${s} .hero-layout{grid-template-columns:1.2fr 1fr;gap:56px}
${s} .hero-layout h1{font-weight:600;font-size:clamp(48px,5.3vw,80px)}
${s} .rd-image-frame{border-radius:${id==='construction'?'0':'12px'}}
${c}[data-redesign-role=project]{padding:40px!important;background:var(--rd-soft);border:0;border-radius:${id==='construction'?'0':'12px'};margin-block:12px!important}
${c}[data-redesign-role=project] .rd-project-image{padding:12px;background:var(--rd-paper);border:0}
`:''}
${id==='wellness'||id==='retail'||id==='gallery'?`
${s} .hero-layout{grid-template-columns:.95fr 1.1fr;gap:72px}
${s} .hero-layout h1{font-weight:400;font-size:clamp(50px,5.8vw,86px)}
${s} .rd-image-frame{border-radius:${id==='wellness'?'160px 160px 12px 12px':'0'}}
${s} .hero-layout .hero-image{aspect-ratio:4/5;max-height:640px}
${c}[data-redesign-role=project]{grid-column:span 6;display:flex;flex-direction:column;align-items:stretch;gap:26px;padding:36px 0!important}
${c}[data-redesign-role=project] .card-meta{order:0}
${c}[data-redesign-role=project] h2{font-size:32px}
${c}[data-redesign-role=project] .rd-project-image{border-radius:0}
${c}[data-redesign-role=project][data-redesign-side="1"]{padding-top:94px!important}
`:''}
${['story','precision','services','consulting','poster'].includes(id)?`
${c}[data-redesign-role=project]:is([data-redesign-position="0"],[data-redesign-position="1"]){grid-column:span 6;display:flex;flex-direction:column;align-items:stretch;gap:24px;padding:28px 0!important;border:0;background:transparent}
${c}[data-redesign-role=project]:is([data-redesign-position="0"],[data-redesign-position="1"]) .card-meta{order:0!important;padding:0 4px}
${c}[data-redesign-role=project]:is([data-redesign-position="0"],[data-redesign-position="1"]) h2{font-size:30px;max-width:none;margin-bottom:14px}
${c}[data-redesign-role=project]:is([data-redesign-position="0"],[data-redesign-position="1"]) .rd-project-image{padding:26px;background:var(--rd-soft);border-radius:12px;min-height:330px}
${c}[data-redesign-role=project]:is([data-redesign-position="0"],[data-redesign-position="1"]) p{font-size:14px;line-height:1.75}
`:''}
/* Images belong to their authored group. A series is an editorial spread, not a wall of identical tiles. */
${s} .rd-image-frame:has(figure+figure){padding:0;gap:16px;background:transparent;align-items:start;border-radius:0}
${s} .rd-image-frame:has(figure+figure) figure{overflow:hidden;border-radius:10px;background:var(--rd-soft)}
${s} .rd-image-frame[data-image-count="2"]{grid-template-columns:1.15fr .85fr}
${s} .rd-image-frame[data-image-count="2"] figure+figure{margin-top:48px}
${s} .rd-image-frame[data-image-count="3"]{grid-template-columns:1.3fr .85fr;align-items:stretch}
${s} .rd-image-frame[data-image-count="3"] figure:first-child{grid-row:span 2}
${s} .rd-image-frame[data-image-count="3"] figure:first-child .hero-image{aspect-ratio:3/5;max-height:none}
${s} .rd-image-frame[data-image-count="3"] figure:not(:first-child) .hero-image{aspect-ratio:1/1;max-height:none}
${s} .rd-image-frame .hero-image{max-inline-size:min(100%,var(--rd-image-width,100%))}
${s} .rd-image-frame[data-image-count="1"]{max-width:min(100%,var(--rd-frame-width,100%));margin-inline:auto}
${s} .rd-image-frame:not([data-position=custom]) .hero-image[data-rd-shape=portrait]:not([style*="object-fit"]){aspect-ratio:auto;width:auto;object-fit:contain}
${id==='editorial'||id==='poster'?`@media(min-width:761px){
${s} .hero-layout:has(.rd-image-frame[data-image-count="1"] .hero-image[data-rd-shape=portrait]){display:grid;grid-template-columns:1.25fr .75fr;gap:clamp(36px,6vw,80px);align-items:center;padding:64px 0}
${s} .hero-layout:has(.rd-image-frame[data-image-count="1"] .hero-image[data-rd-shape=portrait]) .hero-copy{display:block;margin:0}
${s} .hero-layout:has(.rd-image-frame[data-image-count="1"] .hero-image[data-rd-shape=portrait]) h1{font-size:clamp(48px,5.7vw,86px);margin-bottom:26px}
}`:''}
${c}[data-redesign-role=collection] .section-gallery{align-items:start;gap:28px;grid-template-columns:1.2fr .85fr}
${c}[data-redesign-role=collection] .section-gallery[data-image-count="3"] figure:first-child{grid-column:1/-1}
${c}[data-redesign-role=collection] .section-gallery:not([data-image-count="3"]) figure:nth-child(even){padding-top:64px}
${c}[data-redesign-role=collection] .section-gallery img{width:auto;max-height:560px;margin-inline:auto}
${c}[data-redesign-role=collection] .card-meta{max-width:740px!important;margin:32px 0 0}
${c}[data-redesign-role=collection] figcaption{padding:12px 0 0;border-top:1px solid var(--rd-line);margin-top:16px;opacity:.75}
/* Preserve semantic content: products, people, prices, answers and partner marks have different jobs. */
${c}:is([data-redesign-role=product],[data-redesign-role=team]){grid-column:span 4;display:flex;flex-direction:column;gap:24px;padding:28px 0!important;align-items:stretch}
${c}:is([data-redesign-role=product],[data-redesign-role=team]) .rd-project-image{padding:24px;min-height:240px;border:0;border-radius:10px}
${c}:is([data-redesign-role=product],[data-redesign-role=team]) .card-meta{order:0!important}
${c}:is([data-redesign-role=product],[data-redesign-role=team]) :is(h2,h3){font-size:26px;line-height:1.2;max-width:none;margin-bottom:12px}
${c}:is([data-redesign-role=product],[data-redesign-role=team]) p{font-size:14px;line-height:1.75}
${c}:is([data-redesign-role=product],[data-redesign-role=team]) img{width:auto;height:auto;max-height:340px;object-fit:contain;border-radius:0}
${c}:is([data-redesign-role=product],[data-redesign-role=team])[data-redesign-group-start]{grid-column-start:1}
${c}:is([data-redesign-role=product],[data-redesign-role=team])[data-redesign-group-count="2"]{grid-column-end:span 6}
${c}:is([data-redesign-role=product],[data-redesign-role=team])[data-redesign-group-count="1"]{grid-column:1/-1}
${c}:is([data-redesign-role=product],[data-redesign-role=team])[data-redesign-group-count="1"]:has(.rd-project-image){display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(28px,6vw,90px);align-items:center}
${c}[data-redesign-role=team] .rd-project-image{padding:0;background:transparent;border-radius:0;min-height:0}
${c}[data-redesign-role=team] img{max-height:380px}
${c}[data-redesign-role=logos]{display:grid;grid-template-columns:minmax(140px,.4fr) minmax(0,1fr);align-items:center;gap:48px;padding:32px 0!important;border-block:1px solid var(--rd-line)}
${c}[data-redesign-role=logos] .card-meta{order:-1}
${c}[data-redesign-role=logos] :is(h2,h3){font:500 14px/1.5 'DM Sans',sans-serif!important;letter-spacing:0;margin:0}
${c}[data-redesign-role=logos] p{font-size:12px;margin-top:10px}
${c}[data-redesign-role=logos] .section-gallery{grid-template-columns:repeat(auto-fit,minmax(80px,1fr));align-items:center;gap:28px}
${c}[data-redesign-role=logos] img{width:auto;height:52px;max-height:52px;max-width:140px;object-fit:contain;margin:auto;border-radius:0}
${c}[data-redesign-role=logos] figcaption{font-size:10px;text-align:center}
${c}:is([data-redesign-role=faq],[data-redesign-role=pricing]) .card-meta>div{display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:24px clamp(28px,6vw,90px)}
${c}[data-redesign-role=faq] .faq-list:only-child{grid-column:1/-1}
${c}[data-redesign-role=faq] .faq-item{padding:18px 0;border:0;border-bottom:1px solid var(--rd-line);margin:0;border-radius:0}
${c}[data-redesign-role=faq] .faq-item:first-child{padding-top:0}
${c}[data-redesign-role=faq] summary{font:500 18px/1.5 'DM Sans',sans-serif;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:24px;list-style:none;cursor:pointer}
${c}[data-redesign-role=faq] summary::-webkit-details-marker{display:none}
${c}[data-redesign-role=faq] summary::after{content:'+';flex:none;font:400 24px/1 'DM Sans',sans-serif}
${c}[data-redesign-role=faq] details[open] summary::after{content:'−'}
${c}[data-redesign-role=faq] .faq-item p{font-size:14px;padding:14px 28px 6px 0;opacity:.8}
${c}[data-redesign-role=pricing] .section-copy{font-variant-numeric:tabular-nums;padding:24px 28px;border:1px solid var(--rd-line);background:var(--rd-soft);border-radius:10px;font-size:15px;line-height:2.2;max-width:none}
@media(max-width:900px){${s} .hero-layout{gap:32px}${s} .nav[data-header] .brand{max-width:calc(100% - 100px)}${s} .hero-layout h1{font-size:clamp(40px,6vw,64px)}${c}[data-redesign-role=project]{gap:32px}${s} .contact.site-contact{padding:36px!important;gap:36px}}
@media(max-width:760px){
${s} .shell{padding:0 22px}
${s} .nav[data-header]{min-height:74px;padding:15px 0;margin:0;gap:20px}
${s} .nav[data-header] .brand-mark img{max-height:30px;max-width:142px}
${s} .hero-layout,${s} .hero-layout[data-hero=text]{display:flex;flex-direction:column;gap:28px;padding:38px 0 44px;max-width:none;min-height:0;align-items:stretch}
${s} .hero-layout .hero-copy{display:block!important;max-width:none;text-align:left;padding:0!important;margin:0}
${s} .hero-layout .eyebrow{font-size:9px;margin:0 0 20px;justify-content:flex-start}
${s} .hero-layout h1,${s} .hero-layout[data-hero=text] h1,${s} .hero-layout h1[data-length]{font-size:clamp(38px,10vw,54px);line-height:1.06;max-width:none;margin:0 0 22px}
${s} .hero-layout .rd-lead{font-size:14px;line-height:1.75;margin:0;max-width:none;padding:0}
${s} .hero-layout .rd-actions{gap:20px;margin-top:24px;justify-content:flex-start}
${s} .hero-layout .visual{order:0!important;width:100%;padding:0;align-self:stretch}
${s} .rd-image-frame{border-radius:10px;padding:0;border:0}
${s} .hero-layout .hero-image{height:auto;min-height:0;max-height:420px;aspect-ratio:6/5;object-fit:cover}
${s} .rd-more summary{min-height:44px}
${s} .button.rd-primary{min-height:50px;padding:13px 18px;font-size:12px;gap:20px}
${s} .benefits{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;padding:24px 0;margin:0 0 32px}
${s} .cards{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;padding:0}
${c}[data-redesign-role],${c}[data-redesign-role][data-redesign-side="1"]{grid-column:1/-1;display:block;padding:32px 0!important;margin:0!important;gap:24px;grid-template-columns:minmax(0,1fr)}
${c}[data-redesign-role=project],${c}[data-redesign-role=collection]{display:flex;flex-direction:column;align-items:stretch}
${c}[data-redesign-role=project]:is([data-redesign-position="0"],[data-redesign-position="1"]){grid-column:1/-1;padding:28px 0!important}
${c}[data-redesign-role=project]:is([data-redesign-position="0"],[data-redesign-position="1"]) .rd-project-image{min-height:0;padding:18px}
${c}[data-redesign-role=project] .card-meta,${c}[data-redesign-role=project][data-redesign-side="1"] .card-meta{order:0}
${c}[data-redesign-role=project] .card-meta>div,${c}[data-redesign-role=text] .card-meta>div{display:block}
${c} :is(h2,h3){font-size:29px;max-width:none;margin:0 0 16px}
${c} :is(p,blockquote){font-size:14px;line-height:1.8;max-width:none}
${c} .rd-project-image{padding:18px;border-radius:10px;min-height:0}
${c} img{max-height:360px}
${c}[data-redesign-role=index]{padding:20px!important;border-radius:8px}
${c}[data-redesign-role=reference]{padding:28px!important;border-radius:10px}
${c}[data-redesign-role=reference] :is(p,blockquote){font-size:22px;line-height:1.6}
${c}[data-redesign-role=source-contact]{padding:12px 0!important}
${c} .section-gallery{grid-template-columns:minmax(0,1fr)}
${s} .about{display:block;padding:36px 0}
${s} .about h2{font-size:32px;margin-bottom:20px}
${s} .about>p{font-size:14px}
${s} .contact.site-contact{grid-template-columns:minmax(0,1fr);gap:32px;padding:30px 24px!important;margin-top:36px;border-radius:10px}
${s} .contact.site-contact .ending-invitation{flex-direction:row;gap:20px}
${s} .contact.site-contact h2{font-size:43px}
${s} .contact.site-contact .ending-detail>a{font-size:18px}
${s} .contact.site-contact .ending-action{min-width:44px;width:44px;height:44px;min-height:44px}
${s} .footer.site-footer .ending-index{display:block;margin-bottom:20px}
${s} .footer.site-footer .ending-links{justify-content:flex-start;gap:2px 24px;margin-top:18px}
${s} .footer.site-footer .ending-top{margin-top:12px}
${s} .footer.site-footer .ending-wordmark{font-size:clamp(36px,10vw,56px);margin-bottom:24px}
${s} .footer.site-footer .ending-colophon{display:block}
${s} .footer.site-footer .source,${s} .footer.site-footer .ending-note{display:block;max-width:none;text-align:left}
${s} .rd-image-frame[data-image-count="2"] figure+figure{margin-top:26px}
${s} .rd-image-frame[data-image-count="3"]{gap:10px}
${s} .rd-image-frame[data-image-count="3"] figure{min-height:0}
${s} .rd-image-frame:has(figure+figure) figcaption{font-size:10px;padding:10px 12px}
${c}[data-redesign-role=collection] .section-gallery{grid-template-columns:minmax(0,1fr);gap:28px}
${c}[data-redesign-role=collection] .section-gallery:not([data-image-count="3"]) figure:nth-child(even){padding-top:0}
${c}[data-redesign-role=collection] .card-meta{margin-top:0}
${c}:is([data-redesign-role=product],[data-redesign-role=team]) .rd-project-image{min-height:0;padding:20px}
${c}:is([data-redesign-role=product],[data-redesign-role=team])[data-redesign-group-count]{grid-column:1/-1;display:flex;flex-direction:column;gap:24px}
${c}[data-redesign-role=team] .rd-project-image{padding:0}
${c}:is([data-redesign-role=faq],[data-redesign-role=pricing]) .card-meta>div{display:block}
${c}[data-redesign-role=faq] .faq-list{margin-top:24px}
${c}[data-redesign-role=faq] summary{font-size:16px}
${c}[data-redesign-role=pricing] .section-copy{padding:20px}
${c}[data-redesign-role=logos]{display:block}
${c}[data-redesign-role=logos] .card-meta{margin-bottom:26px}
${c}[data-redesign-role=logos] .section-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}
${['cinema','hospitality'].includes(id)?`${s} .hero-layout .visual{order:-1!important}${s} .hero-layout .hero-image{aspect-ratio:4/3}${s} .rd-image-frame{border-radius:0}${s} .hero-layout h1{font-size:clamp(42px,11vw,60px)}`:''}
${id==='studio'?`${s} .hero-layout .visual{padding-top:0}${s} .hero-layout .hero-image{aspect-ratio:16/10}${s} .hero-layout h1{font-size:clamp(42px,11vw,60px)}`:''}
${id==='wellness'?`${s} .rd-image-frame:not(:has(figure+figure)){border-radius:140px 140px 8px 8px}${s} .hero-layout .hero-image{aspect-ratio:4/5}`:''}
${id==='pop'?`${s} .hero-layout .hero-copy{padding:30px 24px!important;border-radius:16px}`:''}
}
@media(prefers-reduced-motion:reduce){${s} *{animation:none!important;transition:none!important;scroll-behavior:auto}}
@media print{${s} .rd-more{display:block}${s} details:not([open])>p{display:block}${c}[data-redesign-role]{break-inside:avoid}}
`;
}

export function installImageResolution(doc=document) {
  // Intrinsic resolution bounds screenshots as well as any other small source image.
  // A customer can still explicitly choose image framing in the editor.
  if(doc.__imageResolution)return;doc.__imageResolution=true;
  const apply=img=>{if(img.naturalWidth>0){
    const ratio=img.naturalWidth/img.naturalHeight;
    img.dataset.rdShape=ratio<1?'portrait':ratio>1.4?'landscape':'square';
    if(!img.style.objectFit){
      img.style.setProperty('--rd-image-width',img.naturalWidth+'px');
      const frame=img.closest('.rd-image-frame[data-image-count="1"]');if(frame)frame.style.setProperty('--rd-frame-width',img.naturalWidth+'px');
    }
  }};
  const refresh=()=>{for(const img of doc.querySelectorAll('.rd-project-image img,.rd-image-frame img,.card[data-redesign-role=collection] img')){
    if(img.complete)apply(img);else img.addEventListener('load',()=>apply(img),{once:true});
  }};
  doc.addEventListener('demo-page-change',refresh);refresh();
}
