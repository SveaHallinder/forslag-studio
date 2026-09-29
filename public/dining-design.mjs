import {brandPalette,contrast} from './branding.mjs';

// Presentation is inferred from the existing source cards, never saved as new content.
const priceLine=/^(.{2,100}?)\s+(\d{1,4}(?:[.,]\d{1,2})?(?:\s*(?:kr|sek|€|\$|:-|[:–—-]))?)\s*$/i;
export function diningMenuLines(value) {
  return String(value||'').split('\n').map(line=>{
    const text=line.trim(),match=text.match(priceLine);
    // Clock times, dates and prose are not menu prices.
    const calendar=/\b(?:måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag|monday|tuesday|wednesday|thursday|friday|saturday|sunday|januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|january|february|march|may|june|july|august|october)\b/i;
    const priced=match&&(/(?:kr|sek|€|\$|:-|[:–—-])$/i.test(match[2])||(/^\d{1,3}$/.test(match[2])));
    return priced&&!calendar.test(match[1])&&!/\d|[.!?]$/.test(match[1])&&!/\b(?:sedan|since|år|year|telefon|tel)\b/i.test(match[1])?{text,label:match[1],price:match[2]}:{text};
  });
}
export function diningCardRole(card,index) {
  const lines=diningMenuLines(card.description),prices=lines.filter(line=>line.price).length;
  if(prices>=2&&lines.length>=prices&&prices/lines.filter(line=>line.text).length>=.2)return 'menu';
  if(index<4&&card.description.length<350&&/^(?:öppet(?:tider)?|opening hours|hours|frukost|breakfast|dagens lunch|lunch|middag|dinner)$/i.test(card.title.trim())&&/\d{1,2}[.:]\d{2}/.test(card.description))return 'hours';
  if(!card.description&&!card.image&&!card.gallery?.length)return 'chapter';
  if(/^(?:kontakt(?:a oss)?|contact(?: us)?)$/i.test(card.title.trim()))return 'contact';
  return card.image||card.gallery?.length?'story':'note';
}
export function diningMenuContent(value,escape) {
  return diningMenuLines(value).map(line=>line.price?`<span class="menu-item"><span class="menu-item-name">${escape(line.label)}</span> <span class="menu-item-price">${escape(line.price)}</span></span>`:line.text?`<span class="menu-item-detail">${escape(line.text)}</span>`:'<span class="menu-item-space" aria-hidden="true"></span>').join('\n');
}
export function diningDesignCSS(p) {
  if(p.templateId!=='dining')return '';
  const b=brandPalette(p.branding),paper=b.background,ink=b.text;
  const display=p.typography?.heading&&!/^(Arial|Helvetica(?: Neue)?|Verdana|Tahoma|sans-serif|system-ui)$/i.test(p.typography.heading)?JSON.stringify(p.typography.heading):"Georgia,'Times New Roman',serif";
  const s='html body[data-template="dining"][data-imported][data-page-design]';
  const c=`${s} .cards>.card[data-dining]`;
  const headerInk=contrast(b.headerBackground,b.headerText)>=4.5?b.headerText:ink;
  return `
/* Dining: a photographic front, practical visit details and a typeset menu. */
${s}{background:${paper};color:${ink};--dining-paper:${paper};--dining-ink:${ink};--dining-soft:color-mix(in srgb,${ink} 4%,${paper});--dining-rule:color-mix(in srgb,${ink} 22%,transparent)}
${s} .shell{max-width:1600px;padding:0 clamp(24px,5vw,88px)}
${s} .demo-note{font-size:9px;letter-spacing:.15em;padding:8px 16px}
${s} .nav[data-header]{min-height:108px;padding:12px 28px;margin:0;border:0;background:${b.headerBackground};color:${headerInk}}
${s} .nav[data-header] .brand-mark img{max-height:76px;max-width:200px}
${s} .nav[data-header] .nav-links{font-size:12px;letter-spacing:.08em;text-transform:uppercase;gap:32px}
${s} .nav[data-header] .nav-links .nav-action{border:1px solid currentColor;padding:12px 20px}
${s} .hero-layout[data-hero]{display:grid!important;grid-template-columns:minmax(0,1fr);position:relative;min-height:610px;gap:0;padding:0;margin:0;background:${ink};color:${paper};isolation:isolate}
${s} .hero-layout[data-hero=image]{color:#fffaf1}
${s} .hero-layout[data-hero=image] .visual{position:absolute;inset:0;z-index:-2;margin:0;min-height:0;overflow:hidden;background:${ink}}
${s} .hero-layout[data-hero=image]:after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#000b,#0009 65%,#0004),linear-gradient(0deg,#0008,transparent 55%);pointer-events:none}
${s} .hero-layout .visual>img,${s} .hero-layout .visual .section-gallery,${s} .hero-layout .visual .section-gallery figure,${s} .hero-layout .visual .section-gallery img{height:100%;width:100%;max-height:none;min-height:0;aspect-ratio:auto;object-fit:cover;object-position:center var(--hero-position);border-radius:0;padding:0;margin:0;background:none}
${s} .hero-layout .visual .section-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:0}
${s} .hero-layout .image-label{display:none}
${s} .hero-layout .visual .section-gallery figure{position:relative}
${s} .hero-layout .visual figcaption{display:block;position:absolute;right:16px;bottom:12px;max-width:40%;padding:5px 9px;background:#000b;color:white;font-size:10px;line-height:1.4}
${s} .hero-layout .hero-copy{position:relative;align-self:end;display:block;max-width:940px;width:100%;padding:clamp(32px,5vw,80px)!important;margin:0;text-align:left;background:none;color:inherit}
${s} .hero-layout .hero-copy h1{font-family:${display};font-weight:400;font-style:normal;font-size:clamp(60px,7.8vw,118px);line-height:.97;letter-spacing:-.05em;max-width:13ch;color:inherit;margin:0 0 28px;text-wrap:balance}
${s} .hero-layout .hero-copy h1[data-length=long],${s} .hero-layout .hero-copy h1[data-length=extended]{font-size:clamp(42px,5vw,72px);max-width:23ch}
${s} .hero-layout .hero-copy>p{font-size:17px;line-height:1.7;max-width:52ch;color:inherit;margin:0 0 24px;text-align:left}
${s} .hero-layout .eyebrow{justify-content:start;color:inherit;font-size:11px;letter-spacing:.14em;margin-bottom:24px}
${s} .hero-layout .button{background:${paper};color:${ink};border:1px solid ${paper};border-radius:0;padding:16px 24px}
${s} .hero-layout[data-hero=text]{min-height:350px;background:${paper};color:${ink};border-bottom:1px solid var(--dining-rule)}
${s} .hero-layout[data-hero=text] .visual{display:none}
${s} #erbjudande{padding:0}
${s} .cards{grid-template-columns:repeat(12,minmax(0,1fr));gap:64px 48px;padding:0}
${c}{grid-column:1/-1;background:${b.surface};color:${b.surfaceText};box-shadow:none;border:0;border-radius:0;margin:0!important;padding:0!important;align-self:start}
${c} .flow-index{display:none}
${c} .card-meta,${c} .card-meta>div{display:block!important;grid-template-columns:none!important;width:100%;margin:0;padding:0;border:0;background:none}
${c} h2,${c} h3{font-family:${display};font-size:clamp(36px,4vw,58px);font-weight:400;font-style:normal;line-height:1.1;letter-spacing:-.04em;margin:0 0 24px;color:inherit;text-wrap:balance;max-width:none}
${c} p{font-size:15px;line-height:1.8;color:inherit;max-width:65ch;letter-spacing:0}
${c}[data-dining=hours]{display:flex;flex-direction:column;gap:24px;grid-column:span 4;align-self:stretch;border-bottom:1px solid var(--dining-rule);padding:34px 0!important}
${c}[data-dining=hours] h2{font-family:inherit;font-size:12px;font-weight:600;letter-spacing:.12em;margin:0 0 18px;text-transform:uppercase}
${c}[data-dining=hours] p{font-size:14px;line-height:1.9;max-width:none}
${c}[data-dining=hours]>img,${c}[data-dining=hours]>.section-gallery{display:block;width:100%;margin:0 0 24px}
${c}[data-dining=hours] img{width:100%;height:260px;object-fit:cover;border-radius:0}
${c}[data-dining=hours]:has(img){display:grid;grid-column:1/-1;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:center;gap:64px;padding:48px 0!important}
${c}[data-dining=hours]>.section-gallery{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:0;background:none;margin:0}
${c}[data-dining=hours]>.section-gallery figure{margin:0}
${s} .cards:has(>.card[data-dining=hours] img)>.card[data-dining=hours]:not(:has(img)){grid-column:span 6}
${c}[data-dining=chapter]{text-align:center;display:block;border:0;padding:24px 0 0!important}
${c}[data-dining=chapter] h2{font-size:clamp(62px,8vw,112px);margin:0;font-style:italic;font-weight:400;text-transform:none}
${c}[data-dining=menu]{grid-column:span 6;display:flex;flex-direction:column;gap:24px;border-top:1px solid var(--dining-rule);padding-top:26px!important;align-self:start}
${c}[data-dining=menu] h2{font-size:32px;letter-spacing:-.025em;margin-bottom:26px}
${c}[data-dining=menu] p{max-width:none;font-size:14px;line-height:1.6;white-space:normal}
${c}[data-dining=menu] .menu-item{display:flex;align-items:baseline;justify-content:space-between;gap:20px;min-height:32px;padding:5px 0}
${c}[data-dining=menu] .menu-item-name{font-weight:600;min-width:0}
${c}[data-dining=menu] .menu-item-price{flex:none;font-variant-numeric:tabular-nums}
${c}[data-dining=menu] .menu-item-detail{display:block;font-size:13px;line-height:1.6;opacity:.75;margin:0 0 12px;max-width:52ch}
${c}[data-dining=menu] .menu-item-space{display:block;height:10px}
${c}[data-dining=menu]>img,${c}[data-dining=menu]>.section-gallery{order:1;width:100%;margin-top:16px}
${c}[data-dining=menu]>img{height:280px;object-fit:cover;border-radius:0}
${c}[data-dining=story]{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(32px,6vw,96px);align-items:center;padding:40px 0!important;border-top:1px solid var(--dining-rule)}
${c}[data-dining=story]>.card-meta{order:0!important}
${c}[data-dining=story]:nth-of-type(even)>.card-meta{order:-1!important}
${c}[data-dining=story]>img{width:100%;height:560px;max-height:none;aspect-ratio:auto;object-fit:cover;border-radius:0}
${c}[data-dining=story]>.section-gallery{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;padding:0;background:none}
${c}[data-dining=story]>.section-gallery figure{margin:0;min-width:0}
${c}[data-dining=story]>.section-gallery img{height:auto;max-height:460px;aspect-ratio:auto;border-radius:0}
${c}[data-dining=story]>.section-gallery figure:has(img[style*="contain"]){width:100px;max-width:100%;margin:12px auto}
${c}[data-dining=story][data-dining-copy=long]{grid-template-columns:minmax(0,1fr);gap:44px}
${c}[data-dining=story][data-dining-copy=long]>.section-gallery{max-width:100%}
${c}[data-dining=story][data-dining-copy=long] .card-meta>div{display:grid!important;grid-template-columns:1fr 1.4fr!important;gap:64px}
${c}[data-dining=story][data-dining-copy=long]>.card-meta{order:0!important}
${c}[data-dining=note]{display:block;padding:48px 0!important;border-top:1px solid var(--dining-rule)}
${c}[data-dining=note] .card-meta>div{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)!important;gap:clamp(32px,6vw,96px)}
${c}[data-dining=contact]{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:64px;align-items:center;border-top:1px solid var(--dining-rule);padding-top:36px!important}
${c}[data-dining=contact] .section-gallery{padding:0;background:none}
${c}[data-dining=contact] img{width:100%;height:320px;object-fit:cover;border-radius:0}
${c}[data-dining=contact] h2{font-size:30px}
${s} .contact.site-contact{margin-top:64px;background:${ink};color:${paper};border:0;padding:64px}
${s} .footer.site-footer{background:${ink};color:${paper};padding-inline:64px;border-color:color-mix(in srgb,${paper} 22%,transparent)}
${s} .footer.site-footer .ending-logo{background:${b.headerBackground};padding:0;max-width:120px}
${s} .footer.site-footer .ending-logo img{max-height:90px}
${s} .footer.site-footer .ending-wordmark{font-size:clamp(48px,9vw,140px);font-family:${display}}
@media(max-width:900px){
${s} .shell{padding:0 24px}
${s} .nav[data-header]{padding:12px 20px;min-height:88px}
${s} .nav[data-header] .brand-mark img{max-height:60px}
${s} .hero-layout[data-hero]{min-height:540px}
${s} .cards{gap:44px 28px}
${c}[data-dining=story]{gap:32px}
${c}[data-dining=story]>img{height:420px}
${s} .contact.site-contact,${s} .footer.site-footer{padding-inline:32px}
}
@media(max-width:620px){
${s} .shell{padding:0 18px}
${s} .nav[data-header]{padding:12px 16px;min-height:82px}
${s} .hero-layout[data-hero]{min-height:480px}
${s} .hero-layout .hero-copy{padding:32px 24px!important}
${s} .hero-layout .hero-copy h1{font-size:clamp(48px,13vw,76px);margin-bottom:22px}
${s} .hero-layout .hero-copy>p{font-size:15px}
${s} .cards{display:grid;grid-template-columns:minmax(0,1fr);gap:36px;padding:0}
${c}[data-dining],${c}[data-dining]:nth-child(even){grid-column:1/-1;margin:0!important;gap:24px}
${c}[data-dining=hours],${c}[data-dining=hours]:has(img),${s} .cards:has(>.card[data-dining=hours] img)>.card[data-dining=hours]:not(:has(img)){display:flex;grid-column:1/-1;grid-template-columns:1fr;padding:24px 8px!important}
${c}[data-dining=hours] img{height:150px}
${c}[data-dining=hours]+.card[data-dining=hours]{margin-top:-24px!important}
${c}[data-dining=hours] h2{font-size:11px;margin-bottom:10px}
${c}[data-dining=hours] p{font-size:14px}
${c}[data-dining=chapter]{padding-top:28px!important;text-align:left}
${c}[data-dining=chapter] h2{font-size:64px}
${c}[data-dining=menu]{padding-top:24px!important}
${c}[data-dining=menu] h2{font-size:30px;margin-bottom:20px}
${c}[data-dining=menu] .menu-item{min-height:36px}
${c}[data-dining=story],${c}[data-dining=note],${c}[data-dining=contact]{display:flex;padding:32px 0 0!important}
${c}[data-dining=note] .card-meta>div,${c}[data-dining=story][data-dining-copy=long] .card-meta>div{display:block!important}
${c}[data-dining=story]:nth-of-type(even)>.card-meta{order:0!important}
${c}[data-dining=story]>img{height:360px;object-fit:cover}
${c}[data-dining=story] h2,${c}[data-dining=note] h2{font-size:38px}
${s} .contact.site-contact{margin-top:40px;padding:36px 24px}
${s} .footer.site-footer{padding-inline:24px}
}
`;
}
