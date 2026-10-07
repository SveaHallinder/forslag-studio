import {brandPalette,bestInk} from './branding.mjs';
import {cafeFontCSS} from './cafe-fonts.mjs';

function labels(p) {
  const visit=p.navigation.find(item=>item.href==='#kontakt')?.label||'';
  if(/Unde|Treci/i.test(visit))return {lang:'ro',visit:'Treci pe la noi.',address:'Ne găsești aici',contact:'Hai să vorbim',social:'Ne vedem și aici.',follow:'Urmărește-ne',top:'Sus',empty:'Detaliile de contact lipsesc din acest concept.',note:'Concept independent de website. Nu este site-ul oficial al companiei.'};
  if(/Find|Come|Visit/i.test(visit))return {lang:'en',visit:'Come by.',address:'Find us here',contact:'Say hello',social:'A little more, over here.',follow:'Follow along',top:'Back to top',empty:'Contact details are missing from this website concept.',note:'Independent website concept. This is not the company’s official website.'};
  return {lang:'sv',visit:'Välkommen förbi.',address:'Här hittar du oss',contact:'Säg hej',social:'Lite mer, här borta.',follow:'Följ oss',top:'Till toppen',empty:'Kontaktuppgifter saknas i det här designförslaget.',note:'Oberoende hemsideförslag. Detta är inte företagets officiella webbplats.'};
}
export function cafeBody(p,{e,pic,header,renderCard}) {
  const c=labels(p),headline=p.headline.split('\n'),external=href=>/^https?:/.test(href)?' target="_blank" rel="noopener noreferrer"':'';
  const arrow='<span aria-hidden="true">↗</span>',socials=p.navigation.filter(n=>/^https?:/.test(n.href)&&/Instagram|Facebook|TikTok/i.test(n.label)),phone=p.phone?'tel:'+p.phone.replace(/[^+\d]/g,''):'';
  const action=(href,label,cls='cafe-button')=>`<a class="${cls}" href="${e(href)}"${external(href)}>${e(label)}${arrow}</a>`;
  const photo=p.hero?`<figure class="cafe-hero-visual">${pic(p.hero,p.heroGallery?.find(i=>i.url===p.hero)?.label||p.name,'cafe-hero-photo',false,p.heroGallery?.find(i=>i.url===p.hero)?.presentation)}${p.eyebrow?`<span class="cafe-seal">${e(p.eyebrow)}</span>`:''}<figcaption>${e(p.heroGallery?.find(i=>i.url===p.hero)?.caption||p.name)}<span aria-hidden="true">01</span></figcaption></figure>`:'';
  const facts=p.benefits.filter(b=>b.title),ritual=facts.length?`<div class="cafe-ritual">${facts.map(b=>`<div><strong>${e(b.title)}</strong>${b.description?`<p>${e(b.description)}</p>`:''}</div>`).join('')}</div>`:'';
  const cards=p.cards.map((card,i)=>`<div class="cafe-block" data-cafe-role="${/^(?:opening hours|öppettider|program)$/i.test(card.title)?'hours':card.gallery?.length?'gallery':'story'}">${renderCard(card,i)}</div>`).join('');
  const details=[p.address?`<div class="cafe-detail"><span class="cafe-kicker">${e(c.address)}</span><address>${e(p.address)}</address>${action('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.address),c.address,'cafe-link')}</div>`:'',p.email?`<div class="cafe-detail">${action('mailto:'+p.email,p.email,'cafe-link')}</div>`:'',phone?`<div class="cafe-detail">${action(phone,p.phone,'cafe-link')}</div>`:''].join('');
  const nav=p.navigation.map(n=>action(n.href,n.label,'cafe-footer-link')).join('');
  const footerLogo=p.logo?pic(p.logo,p.name,'cafe-footer-logo'):'';
  return {lang:c.lang,body:`<div class="demo-note">Designförslag · ${e(p.name)}</div><div class="shell">${header}<main id="start"><div class="cafe-hero ${p.hero?'':'cafe-hero-text'}"><section class="cafe-hero-copy hero-copy"><p class="cafe-kicker">${e(p.eyebrow||p.name)}</p><h1 data-length="${p.headline.length>80?'long':'short'}">${headline.map((line,i)=>i===1?`<em>${e(line)}</em>`:`<span>${e(line)}</span>`).join(' ')}</h1>${p.description?`<p>${e(p.description)}</p>`:''}<div class="cafe-hero-actions">${action(p.ctaHref||'#kontakt',p.cta)}${socials[0]?action(socials[0].href,socials[0].label,'cafe-link'):''}</div>${p.address?`<p class="cafe-hero-address">${e(p.address)}</p>`:''}</section>${photo}</div>${ritual}${p.about?`<section class="cafe-about about" id="om"><p class="cafe-kicker">${e(p.name)}</p><div><h2>${e(p.aboutTitle||p.name)}</h2><p>${e(p.about)}</p></div></section>`:''}${cards?`<section class="cafe-sections" id="erbjudande" aria-label="${e(p.sectionTitle)}">${cards}</section>`:''}<section class="cafe-visit contact" id="kontakt"><div><p class="cafe-kicker">${e(p.name)}</p><h2>${e(p.address?c.visit:c.contact)}</h2>${!details?`<p class="contact-empty">${e(c.empty)}</p>`:''}${!details&&socials[0]?action(socials[0].href,socials[0].label):''}</div><div class="cafe-visit-details">${details}</div></section>${socials.length?`<section class="cafe-social"><div><p class="cafe-kicker">${e(c.follow)}</p><h2>${e(c.social)}</h2></div><div>${socials.map(n=>action(n.href,n.label,'cafe-link')).join('')}</div></section>`:''}</main></div><footer class="cafe-footer"><div class="shell"><div class="cafe-footer-top"><a href="#start" class="cafe-footer-brand" aria-label="${e(p.name)}">${footerLogo||e(p.name)}</a><nav aria-label="Footer">${nav}</nav></div><div class="cafe-footer-bottom"><span>${e(c.note)}</span>${action('#start',c.top,'cafe-footer-link')}</div></div></footer>`};
}

export function cafeDesignCSS(p) {
  const b=brandPalette(p.branding),darkInk=bestInk(b.secondary),s='html body[data-template="cafe"][data-imported]';
  return `${cafeFontCSS}
/* Little Café: a complete editorial direction, with each company's own content. */
html body[data-template="cafe"]{--cafe-paper:${b.background};--cafe-ink:${b.text};--cafe-muted:${b.mutedText};--cafe-rule:color-mix(in srgb,${b.text} 20%,transparent);margin:0;background:var(--cafe-paper);color:var(--cafe-ink);font:14px/1.8 Manrope,'Avenir Next',sans-serif}
${s} *{box-sizing:border-box}${s} .shell{width:min(1320px,100%);max-width:1320px;margin:auto;padding:0 clamp(22px,4.6vw,72px)}
${s} .demo-note{background:var(--cafe-paper);color:var(--cafe-muted);font-size:9px;letter-spacing:.12em;border-bottom:1px solid var(--cafe-rule);padding:7px}
${s} h1,${s} h2,${s} h3{font-family:Fraunces,Georgia,serif;font-weight:400;line-height:1.07;letter-spacing:-.055em;text-wrap:balance;overflow-wrap:anywhere}
${s} .nav[data-header]{height:auto;min-height:88px;position:sticky;top:0;z-index:20;margin:0;padding:14px 0;border:0;border-bottom:1px solid var(--cafe-rule);background:${b.headerBackground};color:${b.headerText}}
${s} .nav[data-header] .brand{max-width:42%;font-family:Fraunces,Georgia,serif;font-size:28px;font-weight:400;letter-spacing:-.05em;line-height:1.1}
${s} .nav[data-header] .brand-mark img{width:auto;height:auto;max-width:126px;max-height:50px;object-fit:contain;border:0;border-radius:0;background:none;filter:none;mix-blend-mode:normal}
${s} .nav-links{gap:26px;font-size:11px;font-weight:500}${s} .nav-links a{padding:12px 0}${s} .nav-action{border:0;background:none!important}
${s} .cafe-kicker{font-family:Manrope,sans-serif;font-size:10px!important;line-height:1.6!important;text-transform:uppercase;letter-spacing:.17em;font-weight:600;white-space:normal}
${s} .cafe-hero{padding:44px 0 58px;display:grid;grid-template-columns:minmax(0,1.07fr) minmax(0,1fr);gap:48px;align-items:center}
${s} .cafe-hero .hero-copy{padding:0!important;background:transparent;color:inherit;margin:0;text-align:left;max-width:none}
${s} .cafe-hero-copy>.cafe-kicker{margin:0 0 30px;color:var(--cafe-muted)}
${s} .cafe-hero h1{font-size:clamp(52px,6.5vw,88px);line-height:1.04;max-width:10ch;margin:0 0 27px}
${s} .cafe-hero h1[data-length=long]{font-size:clamp(35px,4.5vw,62px);max-width:21ch}
${s} .cafe-hero h1 span,${s} .cafe-hero h1 em{display:block}${s} .cafe-hero h1 em{font-weight:400;color:var(--accent)}
${s} .cafe-hero-copy>p{font-size:14px;line-height:1.9;max-width:43ch;margin:0;color:var(--cafe-muted);white-space:pre-line}
${s} .cafe-hero-actions{display:flex;gap:26px;align-items:center;flex-wrap:wrap;margin-top:30px}
${s} .cafe-button,${s} .cafe-link{display:inline-flex;align-items:center;justify-content:space-between;gap:24px;font:600 12px/1.4 Manrope,sans-serif;min-height:48px;transition:transform 160ms ease;background:var(--accent);color:var(--accent-ink);border:1px solid var(--accent);padding:14px 25px;border-radius:100px}
${s} .cafe-button:hover{transform:translateY(-2px)}${s} .cafe-link{background:none;color:inherit;border:0;border-radius:0;padding:9px 0;border-bottom:1px solid var(--cafe-rule)}
${s} .cafe-hero-copy>.cafe-hero-address{font-size:10px;margin-top:35px;letter-spacing:.03em}
${s} .cafe-hero-visual{position:relative;margin:0 0 0 8px;min-width:0}
${s} .cafe-hero-photo{width:100%;height:auto;aspect-ratio:539/620;object-fit:cover;object-position:center var(--hero-position);border-radius:240px 240px 8px 8px;background:none}
${s} .cafe-hero-visual figcaption{display:flex;justify-content:space-between;gap:20px;padding-top:15px;font-size:9px;letter-spacing:.12em;text-transform:uppercase}
${s} .cafe-seal{position:absolute;left:-26px;bottom:48px;width:102px;height:102px;padding:18px;border:5px solid var(--cafe-paper);border-radius:50%;display:grid;place-content:center;text-align:center;font:400 19px/1.1 Fraunces,serif;transform:rotate(-10deg);background:var(--accent);color:var(--accent-ink);overflow-wrap:anywhere}
${s} .cafe-hero-text{display:block;max-width:900px;padding-block:65px}${s} .cafe-hero-text h1{max-width:20ch}
${s} .cafe-ritual{display:flex;justify-content:space-between;gap:30px;padding:23px 0;border-block:1px solid var(--cafe-rule)}${s} .cafe-ritual strong{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}${s} .cafe-ritual p{font-size:12px;margin:6px 0 0;color:var(--cafe-muted)}
${s} .cafe-about{display:grid;grid-template-columns:.55fr 1.45fr;gap:48px;border:0;padding:90px 0;margin:0}
${s} .cafe-about>.cafe-kicker{padding-top:10px;color:var(--cafe-muted)}${s} .cafe-about h2{font-size:clamp(35px,4vw,56px);max-width:21ch;margin:0 0 24px}${s} .cafe-about p:not(.cafe-kicker){font-size:14px;line-height:1.9;max-width:56ch;color:var(--cafe-muted);white-space:pre-line}
${s} .cafe-sections{padding:0}${s} .cafe-block{padding:68px 0;border-top:1px solid var(--cafe-rule)}
${s} .cafe-block .card{display:block!important;margin:0;padding:0!important;border:0;background:transparent;box-shadow:none;border-radius:0}
${s} .cafe-block .card:has(>img){display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.08fr);gap:80px;align-items:center}
${s} .cafe-block .card>img{height:auto;width:100%;max-height:560px;aspect-ratio:4/5;object-fit:cover;border-radius:8px 115px 8px 8px;background:none}
${s} .cafe-block .card-meta{display:block;margin:0;padding:0;border:0}${s} .cafe-block h2,${s} .cafe-block h3{font-size:clamp(38px,4.8vw,64px);margin:0 0 24px;max-width:14ch}
${s} .cafe-block .card p{font-size:14px;line-height:1.9;max-width:58ch;color:var(--cafe-muted)}${s} .cafe-block .flow-index,${s} .card-number,${s} .card-placeholder{display:none}
${s} .cafe-block[data-cafe-role=gallery] .card{display:flex!important;flex-direction:column-reverse;gap:30px;align-items:stretch}
${s} .cafe-block[data-cafe-role=gallery] .section-gallery{display:grid;grid-template-columns:1.5fr .75fr;gap:48px;align-items:start;background:none;margin:0;padding:0}
${s} .section-gallery figure{margin:0;padding:0;border:0;min-width:0}${s} .section-gallery img{width:100%;height:auto;aspect-ratio:4/3;max-height:620px;object-fit:cover;border-radius:7px;background:none}
${s} .section-gallery figure:nth-child(even){padding-top:65px}${s} .section-gallery figure:nth-child(even) img{aspect-ratio:4/5;border-radius:110px 110px 7px 7px}
${s} .section-gallery figcaption{display:block;font-size:11px;line-height:1.7;color:var(--cafe-muted);margin-top:14px;padding:0;background:none}
${s} .cafe-block[data-cafe-role=hours]{padding:30px 0}${s} .cafe-block[data-cafe-role=hours] .card-meta>div{display:grid;grid-template-columns:1fr 1fr;gap:48px}${s} .cafe-block[data-cafe-role=hours] h2{max-width:none;font:600 11px/1.8 Manrope,sans-serif;text-transform:uppercase;letter-spacing:.12em}
${s} .cafe-visit{display:grid;grid-template-columns:1fr 1fr;align-items:start;gap:80px;margin:30px calc(-1 * clamp(22px,4.6vw,72px)) 0;padding:70px clamp(22px,4.6vw,72px);background:color-mix(in srgb,var(--cafe-ink) 5%,var(--cafe-paper));color:inherit;border-radius:0;border:0}
${s} .cafe-visit h2{font-size:clamp(48px,5.8vw,76px);font-family:Fraunces,serif;max-width:10ch;margin:22px 0 24px}${s} .cafe-visit .contact-empty{color:var(--cafe-muted)}
${s} .cafe-detail{border-bottom:1px solid var(--cafe-rule);padding:20px 0}${s} .cafe-detail:first-child{padding-top:0}${s} .cafe-detail address{font-style:normal;font-size:16px;white-space:pre-line;margin:15px 0}${s} .cafe-detail .cafe-link{max-width:100%;overflow-wrap:anywhere}
${s} .cafe-social{display:flex;justify-content:space-between;align-items:center;gap:40px;padding:60px 0}${s} .cafe-social h2{font-size:clamp(32px,3.5vw,48px);margin:14px 0 0;max-width:14ch}${s} .cafe-social>div:last-child{display:flex;gap:24px;flex-wrap:wrap}
${s} .cafe-footer{background:${b.secondary};color:${darkInk};padding:48px 0 24px}${s} .cafe-footer-top{display:flex;justify-content:space-between;align-items:start;gap:40px;padding-bottom:35px}
${s} .cafe-footer-brand{font:400 clamp(32px,5vw,68px)/1.05 Fraunces,Georgia,serif;letter-spacing:-.06em;max-width:65%;overflow-wrap:anywhere}${s} .cafe-footer-logo{width:auto;height:auto;max-width:150px;max-height:90px;background:${b.headerBackground};padding:8px;border-radius:4px;object-fit:contain}
${s} .cafe-footer-top nav{display:flex;gap:10px 24px;max-width:40%;flex-wrap:wrap;justify-content:end}${s} .cafe-footer-link{display:inline-flex;justify-content:space-between;align-items:center;gap:12px;min-height:40px;font-size:11px}
${s} .cafe-footer-bottom{display:flex;justify-content:space-between;gap:30px;align-items:center;font-size:9px;border-top:1px solid color-mix(in srgb,currentColor 25%,transparent);padding-top:20px}
@media(max-width:1000px){${s} .cafe-hero{gap:30px}${s} .cafe-block .card:has(>img){gap:45px}${s} .cafe-visit{gap:48px}}
@media(max-width:680px){${s} .nav[data-header]{min-height:76px}${s} .nav[data-header] .brand{font-size:24px;max-width:60%}${s} .cafe-hero{display:block;padding:34px 0 38px}${s} .cafe-hero h1{font-size:clamp(46px,11.9vw,74px);max-width:11ch}${s} .cafe-hero-copy>.cafe-kicker{margin-bottom:22px}${s} .cafe-hero-copy>p{font-size:13px}${s} .cafe-hero-visual{margin:35px 0 0}${s} .cafe-hero-photo{aspect-ratio:539/560;border-radius:180px 180px 6px 6px}${s} .cafe-seal{width:88px;height:88px;left:10px;font-size:16px}${s} .cafe-hero-copy>.cafe-hero-address{margin-top:22px}${s} .cafe-about{display:block;padding:55px 0}${s} .cafe-about>.cafe-kicker{margin-bottom:24px}${s} .cafe-ritual{gap:20px;flex-wrap:wrap}${s} .cafe-block{padding:46px 0}${s} .cafe-block .card:has(>img){display:flex!important;flex-direction:column;gap:32px;align-items:stretch}${s} .cafe-block .card>img{aspect-ratio:1/1;max-height:440px;border-radius:8px 90px 8px 8px}${s} .cafe-block h2,${s} .cafe-block h3{font-size:40px}${s} .cafe-block .card p{font-size:13px}${s} .cafe-block[data-cafe-role=gallery] .section-gallery{grid-template-columns:1fr;gap:28px}${s} .section-gallery figure:nth-child(even){width:72%;margin-left:auto;padding:0}${s} .cafe-block[data-cafe-role=hours] .card-meta>div{display:block}${s} .cafe-visit{display:block;padding-block:46px}${s} .cafe-visit h2{font-size:53px}${s} .cafe-visit-details{margin-top:32px}${s} .cafe-social{display:block;padding:45px 0}${s} .cafe-social>div:last-child{margin-top:25px}${s} .cafe-footer-top{display:block}${s} .cafe-footer-brand{max-width:100%;font-size:48px;display:block}${s} .cafe-footer-top nav{max-width:none;justify-content:start;margin-top:25px}${s} .cafe-footer-bottom{display:block;line-height:1.8}${s} .cafe-footer-bottom .cafe-footer-link{margin-top:10px}}
@media(prefers-reduced-motion:reduce){${s} *{transition:none!important;animation:none!important}}
`;
}
