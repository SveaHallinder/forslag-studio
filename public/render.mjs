import { getTemplate, templateCSS } from './templates.mjs';

const text = (value, limit = 2000) => String(value ?? '').trim().slice(0, limit);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function imageURL(value) {
  const url = String(value ?? '').trim();
  if (url.length > 8000000) return '';
  if (/^\/assets\/[a-zA-Z0-9_.-]+$/.test(url)) return url;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(url)) return url;
  try { const p = new URL(url); return ['https:', 'http:'].includes(p.protocol) && !p.username && !p.password ? p.href : ''; } catch { return ''; }
}
export function linkURL(value) {
  const raw=String(value||'').trim();
  if(/^#[a-zA-Z0-9_-]+$/.test(raw))return raw;
  try{const u=new URL(raw);return ['https:','http:','mailto:','tel:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}
}
export function normalizeProject(raw = {}) {
  return {
    templateId: getTemplate(raw.templateId).id,
    id: /^[a-z0-9-]{1,70}$/.test(raw.id ?? '') ? raw.id : '',
    name: text(raw.name, 100) || 'Ditt företag',
    source: /^https?:\/\//.test(raw.source ?? '') ? text(raw.source, 2000) : '',
    eyebrow: text(raw.eyebrow, 100),
    headline: text(raw.headline, 180) || 'En ny plats för ert företag.',
    description: text(raw.description, 6000),
    accent: /^#[a-f0-9]{6}$/i.test(raw.accent ?? '') ? raw.accent : '#cdeb60',
    logo: imageURL(raw.logo), hero: imageURL(raw.hero),
    heroPosition: Math.max(0, Math.min(100, Number.isFinite(Number(raw.heroPosition ?? 50)) ? Number(raw.heroPosition ?? 50) : 50)),
    email: /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/.test(raw.email ?? '') ? text(raw.email, 160) : '',
    phone: /^[+\d\s()-]{5,35}$/.test(raw.phone ?? '') ? raw.phone : '',
    address: text(raw.address, 200),
    sectionTitle: text(raw.sectionTitle, 140) || 'Upptäck vad vi erbjuder',
    sectionIntro: text(raw.sectionIntro, 600),
    aboutTitle: text(raw.aboutTitle, 180), about: text(raw.about, 1500),
    cta: text(raw.cta, 100) || 'Kontakta oss',
    ctaHref: linkURL(raw.ctaHref),
    navigation: (Array.isArray(raw.navigation)?raw.navigation:[]).slice(0,12).map(n=>({label:text(n?.label,70),href:linkURL(n?.href)})).filter(n=>n.label&&n.href),
    benefits: (Array.isArray(raw.benefits) ? raw.benefits : []).slice(0, 4).map(b => ({title:text(b.title,100),description:text(b.description,350)})),
    cards: (Array.isArray(raw.cards) ? raw.cards : []).slice(0, 40).map(c => ({title:text(c.title,300),description:text(c.description,6000),image:imageURL(c.image),...(c.href?{href:linkURL(c.href)}:{}),...(c.anchor?{anchor:/^[a-zA-Z0-9_-]{1,100}$/.test(c.anchor)?c.anchor:''}:{})})).filter(c => c.title || c.description || c.image),
    images: (Array.isArray(raw.images) ? raw.images : []).slice(0, 80).map(i => ({url:imageURL(i.url),label:text(i.label,160)})).filter(i => i.url),
    warnings: (Array.isArray(raw.warnings) ? raw.warnings : []).slice(0,10).map(w=>text(w,250)),
    importedAt: text(raw.importedAt,80),
  };
}

export const demoCSS = `
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:90px}body{margin:0;background:#f5f5f2;color:#222725;font-family:'Avenir Next',Avenir,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}button,a{-webkit-tap-highlight-color:transparent}img{display:block;max-width:100%}a:focus-visible{outline:3px solid #448940;outline-offset:6px}::selection{background:var(--accent)}.shell{max-width:1320px;margin:auto;padding:0 48px}.demo-note{background:#222725;color:white;text-align:center;font-size:11px;letter-spacing:.08em;padding:9px 12px;text-transform:uppercase}.nav{height:94px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{font-weight:800;font-size:25px;letter-spacing:-1.3px;max-width:55%;overflow-wrap:anywhere}.brand img{width:146px;height:66px;object-fit:contain}.nav-links{display:flex;align-items:center;gap:30px;font-size:13px;font-weight:600}.nav-contact{padding:13px 21px;border:1px solid #bfc2bc;border-radius:30px}.hero-copy{text-align:center;max-width:870px;margin:65px auto 82px}.eyebrow{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:24px}.eyebrow:before{content:'';width:24px;height:1px;background:currentColor}h1{font-size:clamp(40px,5.4vw,76px);font-weight:600;line-height:1.09;letter-spacing:-.052em;margin:0 0 24px;text-wrap:balance;overflow-wrap:anywhere}.hero-copy>p{font-size:17px;line-height:1.7;max-width:650px;margin:0 auto 30px;color:#646b65;white-space:pre-line}.button{display:inline-flex;align-items:center;justify-content:center;gap:22px;background:#242c27;color:white;padding:17px 26px;border-radius:50px;font-size:14px;font-weight:600;transition:transform .2s,background .2s}.button:hover{background:#3b4840;transform:translateY(-2px)}.button.accent{background:var(--accent);color:var(--accent-ink)}.button span{font-size:20px;font-weight:400}.visual{position:relative}.hero-image{width:100%;height:510px;object-fit:cover;object-position:center var(--hero-position);border-radius:26px;background:#e3e6df}.benefits{position:relative;z-index:1;display:grid;grid-template-columns:repeat(var(--benefit-count),1fr);gap:25px;max-width:1030px;margin:0 auto -51px;padding:32px 38px;background:white;border:1px solid #e9ece5;border-radius:25px}.benefit h3{font-weight:600;font-size:17px;letter-spacing:-.02em;margin:0 0 12px}.benefit p{font-size:13px;line-height:1.65;color:#686f69;margin:0}.benefit i{display:block;width:25px;height:3px;background:var(--accent);margin-bottom:13px}.visual:has(.benefits) .hero-image{padding-top:0}.image-label{position:absolute;bottom:22px;left:25px;color:#fff;background:#15211bc4;backdrop-filter:blur(8px);padding:9px 16px;border-radius:30px;font-size:12px}.section{padding:91px 0}.section-top{display:flex;justify-content:space-between;align-items:end;gap:36px;margin-bottom:34px}.section-kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#687264;margin:0 0 14px}.section h2{font-size:39px;line-height:1.17;letter-spacing:-.04em;font-weight:500;margin:0;text-wrap:balance;overflow-wrap:anywhere}.section-top>p{font-size:14px;line-height:1.7;color:#656c66;max-width:340px;margin:0}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:27px}.card{min-width:0}.card img{width:100%;height:263px;border-radius:20px;object-fit:cover;background:#e3e6df;transition:filter .3s}.card:hover img{filter:brightness(1.07)}.card-meta{display:flex;align-items:start;justify-content:space-between;gap:10px;margin-top:20px}.card h3{margin:0 0 7px;font-size:17px;letter-spacing:-.025em;font-weight:600;overflow-wrap:anywhere}.card p{font-size:13px;line-height:1.6;color:#687065;margin:0;white-space:pre-line}.card-number{font-size:11px;color:#7b867a;padding-top:3px}.about{border-top:1px solid #dce0d7;display:grid;grid-template-columns:1fr 1fr;gap:100px}.about h2{max-width:440px}.about p{color:#61695f;line-height:1.9;font-size:16px;margin:0;white-space:pre-line}.contact{background:#222c26;color:#f3f5ed;border-radius:27px;padding:64px;display:flex;gap:40px;justify-content:space-between;align-items:center;margin-bottom:50px}.contact h2{font-size:45px;max-width:600px;line-height:1.15;letter-spacing:-.04em;font-weight:500;margin:0 0 24px}.contact .contact-links{display:flex;flex-direction:column;gap:11px;font-size:14px;color:#d7ded6;overflow-wrap:anywhere}.contact .button{white-space:nowrap}.footer{display:flex;justify-content:space-between;gap:30px;padding:0 0 35px;font-size:12px;color:#71786e;flex-wrap:wrap}.footer .brand-name{font-weight:700;color:#293329}.footer .source{font-size:11px;max-width:65%;text-align:right}.no-image{min-height:0;margin-bottom:50px}.no-image .benefits{margin-bottom:0}.card-placeholder{height:180px;background:#e5e8df;border:1px solid #d9ddd2;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:50px;color:#a7b1a0;font-weight:300}.contact-empty{font-size:14px;line-height:1.6;color:#d7ded6}.print-only{display:none}@media(min-width:1600px){.hero-copy{margin-top:90px}}@media(max-width:760px){.shell{padding:0 22px}.nav{height:77px}.nav-links{gap:12px}.nav-links>a:not(.nav-contact){display:none}.brand{font-size:21px}.brand img{width:117px;height:55px}.nav-contact{font-size:12px;padding:11px 15px}.hero-copy{margin:44px auto 52px}.eyebrow{font-size:10px;letter-spacing:.1em;margin-bottom:21px}h1{font-size:43px;letter-spacing:-.045em}.hero-copy>p{font-size:15px;line-height:1.7}.button{font-size:13px;padding:16px 23px}.benefits{grid-template-columns:1fr 1fr;gap:24px;margin:0 12px -36px;padding:23px;border-radius:19px}.benefit h3{font-size:14px}.benefit p{font-size:12px}.hero-image{height:355px;border-radius:20px}.image-label{font-size:10px;left:15px;bottom:15px}.section{padding:57px 0}.section-top{display:block;margin-bottom:27px}.section h2{font-size:32px}.section-top>p{margin-top:18px;max-width:100%}.cards{grid-template-columns:1fr;gap:32px}.card img{height:260px}.card-meta{margin-top:14px}.about{grid-template-columns:1fr;gap:25px}.about p{font-size:15px}.contact{display:block;padding:32px 26px;border-radius:22px;margin-bottom:28px}.contact h2{font-size:34px}.contact .button{margin-top:28px}.footer{font-size:11px;gap:14px}.footer .source{max-width:100%;text-align:left}.demo-note{font-size:9px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}@media print{.demo-note{color:#222;background:white}.nav-links{display:none}.hero-image{height:300px}.section{padding:35px 0}.contact{break-inside:avoid}.cards{grid-template-columns:repeat(3,1fr)}.card img{height:150px}}
`;

function accentInk(hex) {
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*r+.7152*g+.0722*b>.179?'#152015':'#ffffff';
}
export function renderDemo(raw, options = {}) {
  const p = normalizeProject(raw), e = escapeHTML;
  p.benefits = p.benefits.filter(b => b.title);
  const src = value => e(options.resolveImage ? options.resolveImage(value) : value);
  const pic = (url, alt, cls = '', lazy = true) => `<img src="${src(url)}" alt="${e(alt)}" class="${cls}" ${lazy?'loading="lazy"':''} decoding="async" referrerpolicy="no-referrer">`;
  const contact = p.email ? `mailto:${p.email}` : p.phone ? `tel:${p.phone.replace(/[^+\d]/g,'')}` : '';
  const benefits = `${p.benefits.length?`<div class="benefits" style="--benefit-count:${p.benefits.length}">${p.benefits.map(b=>`<div class="benefit"><h3>${e(b.title)}</h3><i></i><p>${e(b.description)}</p></div>`).join('')}</div>`:''}`;
  const visual = `<div class="visual ${p.hero?'':'no-image'}">${p.templateId==='story'?benefits:''}${p.hero?`${pic(p.hero,p.name+' – verksamhetsbild','hero-image',false)}<div class="image-label">${e(p.name)}</div>`:''}</div>`;
  const imported=p.navigation.length>0||!!p.ctaHref||p.cards.some(c=>c.anchor);
  const navLinks=p.navigation.map(n=>`<a href="${e(n.href)}" ${/^https?:/.test(n.href)?'target="_blank" rel="noopener noreferrer" title="Öppnar företagets original"':''}>${e(n.label)}</a>`).join('');
  const body = `<div class="demo-note">Designförslag · Framtagen för ${e(p.name)}</div>
  <div class="shell"><header class="nav"><a class="brand" href="#" aria-label="${e(p.name)} startsida">${p.logo ? `<span class="brand-mark">${pic(p.logo,'','',false)}</span><span class="brand-caption">${e(p.name)}</span>`:e(p.name)}</a><nav class="nav-links" aria-label="Huvudmeny">${imported?navLinks:`${p.cards.length?'<a href="#erbjudande">Utforska</a>':''}${p.about?'<a href="#om">Om oss</a>':''}<a class="nav-contact" href="#kontakt">${e(p.cta)}</a>`}</nav></header>
  <main id="start"><div class="hero-layout"><section class="hero-copy">${p.eyebrow?`<div class="eyebrow">${e(p.eyebrow)}</div>`:''}<h1>${e(p.headline)}</h1>${p.description?`<p>${e(p.description)}</p>`:''}${!imported||p.ctaHref?`<a class="button" href="${e(p.ctaHref||(p.cards.length?'#erbjudande':'#kontakt'))}" ${/^https?:/.test(p.ctaHref)?'target="_blank" rel="noopener noreferrer"':''}>${imported?e(p.cta):p.cards.length?'Utforska vårt utbud':e(p.cta)}<span aria-hidden="true">↗</span></a>`:''}</section>
  ${visual}</div>${p.templateId!=='story'?benefits:''}
  ${p.cards.length?`<section class="section" id="erbjudande"><div class="section-top" ${imported?'hidden':''}><div><p class="section-kicker">${e(p.name)} / Utvalt</p><h2>${e(p.sectionTitle)}</h2></div>${p.sectionIntro?`<p>${e(p.sectionIntro)}</p>`:''}</div><div class="cards">${p.cards.map((c,i)=>`<article class="card" ${c.anchor?`id="${e(c.anchor)}"`:""}>${c.image?pic(c.image,c.title):`<div class="card-placeholder" aria-hidden="true">${String(i+1).padStart(2,'0')}</div>`}<div class="card-meta"><div><h3>${c.href?`<a href="${e(c.href)}" ${/^https?:/.test(c.href)?'target="_blank" rel="noopener noreferrer"':''}>${e(c.title)} ↗</a>`:e(c.title)}</h3>${c.description?`<p>${e(c.description)}</p>`:''}</div><span class="card-number">${String(i+1).padStart(2,'0')}</span></div></article>`).join('')}</div></section>`:''}
  ${p.about?`<section class="section about" id="om"><div><p class="section-kicker">Om ${e(p.name)}</p><h2>${e(p.aboutTitle || p.name)}</h2></div><p>${e(p.about)}</p></section>`:''}
  <section class="contact" id="kontakt"><div><p class="section-kicker" style="color:#bcc9b8">Ta nästa steg</p><h2>${p.ctaHref?'Kontakt':e(p.cta)+'.'}</h2><div class="contact-links">${p.email?`<a href="mailto:${e(p.email)}">${e(p.email)}</a>`:''}${p.phone?`<a href="tel:${e(p.phone.replace(/[^+\d]/g,''))}">${e(p.phone)}</a>`:''}${p.address?`<span>${e(p.address)}</span>`:''}${!contact?'<span class="contact-empty">Kontaktuppgifter saknas i det här designförslaget.</span>':''}</div></div>${contact?`<a class="button accent" href="${e(contact)}">${p.email?'Skicka ett mejl':'Ring oss'}<span aria-hidden="true">↗</span></a>`:''}</section></main>
  <footer class="footer"><span class="brand-name">${e(p.name)}</span><span class="source">Designförslag · Innehåll och bilder från ${p.source?`<a href="${e(p.source)}" rel="noopener noreferrer" target="_blank">företagets webbplats</a>`:'företaget'}.</span></footer></div>`;
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>${e(p.name)} – Designförslag</title><meta name="description" content="Ett nytt designförslag för ${e(p.name)}."><style>${demoCSS}${templateCSS}${homepageCSS}</style></head><body data-imported="${imported}" data-template="${p.templateId}" style="--accent:${p.accent};--accent-ink:${accentInk(p.accent)};--hero-position:${p.heroPosition}%">${body}</body></html>`;
}

const homepageCSS=`
[hidden]{display:none!important}
.brand{display:flex;align-items:center;gap:14px;flex-shrink:0;max-width:36%;letter-spacing:-.04em}
.brand-mark{display:flex;align-items:center;justify-content:center;background:#747474;border:1px solid #858585;border-radius:10px;padding:10px 14px}
.brand .brand-mark img{width:116px;height:42px;background:none;padding:0;border-radius:0;object-fit:contain}
.brand-caption{font-size:17px;font-weight:650;line-height:1.25;max-width:16ch;overflow-wrap:anywhere}
.nav{height:auto;min-height:104px;padding-top:18px;padding-bottom:18px;gap:28px;border-bottom:1px solid #dce0d7}
.nav-links{min-width:0;flex-wrap:wrap;justify-content:flex-end;gap:4px 20px}
.nav-links a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:8px 0;line-height:1.4;overflow-wrap:anywhere;text-underline-offset:5px}
.nav-links a:hover,.contact-links a:hover,.footer a:hover{text-decoration:underline}
.nav-links .nav-contact{padding:10px 20px}
a:focus-visible{outline:2px solid currentColor;outline-offset:5px}
body[data-imported="true"] .hero-copy{padding-block:8px}
body[data-imported="true"] .hero-copy h1{max-width:19ch;margin-inline:auto;text-wrap:balance}
body[data-imported="true"] .hero-copy>p{max-width:64ch;font-size:17px;line-height:1.8;overflow-wrap:anywhere}
body[data-imported="true"] .hero-copy .button{background:var(--accent);color:var(--accent-ink)}
body[data-imported="true"] .cards{display:flex;flex-direction:column;gap:0}
body[data-imported="true"] .card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(28px,5vw,72px);align-items:center;padding:56px 0;border-top:1px solid #dce0d7}
body[data-imported="true"] .card:first-child{border-top:0;padding-top:0}
body[data-imported="true"] .card:not(:has(img)){display:block;max-width:none}
body[data-imported="true"] .card:not(:has(img)) .card-meta{max-width:780px}
body[data-imported="true"] .card img{height:auto;max-height:520px;object-fit:contain}
body[data-imported="true"] .card-meta{margin:0;min-width:0}
body[data-imported="true"] .card h3{font-size:clamp(26px,3vw,38px);line-height:1.16;letter-spacing:-.035em;margin-bottom:18px;text-wrap:balance}
body[data-imported="true"] .card p{max-width:65ch;font-size:16px;line-height:1.85;overflow-wrap:anywhere}
body[data-imported="true"] .card-placeholder,body[data-imported="true"] .card-number{display:none}
.card[id]{scroll-margin-top:30px}
.contact-links a{display:inline-flex;align-items:center;min-height:44px}
.footer .source{font-size:12px;line-height:1.7}
[data-template="studio"] .brand-mark{border-radius:0}
[data-template="studio"] .nav{height:auto;min-height:108px}
body[data-template="studio"][data-imported="true"] .hero-copy h1{margin-inline:0;max-width:20ch;font-weight:400}
body[data-template="studio"][data-imported="true"] .card{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);border-color:#394039;padding-block:64px}
body[data-template="studio"][data-imported="true"] .card:first-child{padding-top:0}
body[data-template="studio"][data-imported="true"] .card-meta{border-top:0;padding-top:0}
[data-template="services"] .brand-mark{border-radius:4px}
[data-template="services"] .nav{height:auto;min-height:104px;border-color:#38483e}
body[data-template="services"][data-imported="true"] .hero-copy h1{margin-inline:0;text-transform:none}
body[data-template="services"][data-imported="true"] .card{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);border-color:#cbd3c7}
@media(max-width:760px){
  .nav{height:auto!important;min-height:80px;flex-wrap:wrap;padding-top:18px!important;padding-bottom:14px!important;gap:16px}
  .brand{max-width:100%;gap:12px}
  .brand-caption{font-size:16px;max-width:20ch}
  .brand-mark{padding:8px 12px}
  .brand .brand-mark img{width:90px;height:34px}
  .nav-links{width:100%;justify-content:flex-start;gap:0 20px}
  .nav-links>a:not(.nav-contact){display:inline-flex}
  .nav-links a{font-size:14px;min-height:44px}
  body[data-imported="true"] .hero-copy h1{font-size:clamp(34px,9vw,49px);line-height:1.1}
  body[data-imported="true"] .hero-copy>p{font-size:16px;line-height:1.8}
  body[data-imported="true"] .card,body[data-template="studio"][data-imported="true"] .card,body[data-template="services"][data-imported="true"] .card{grid-template-columns:1fr;gap:24px;padding-block:36px}
  body[data-imported="true"] .card:first-child{padding-top:0}
  body[data-imported="true"] .card:nth-child(even)>:first-child{order:0}
  body[data-imported="true"] .card h3{font-size:28px;margin-bottom:14px}
  body[data-imported="true"] .card img{max-height:420px;aspect-ratio:auto}
}
@media(prefers-reduced-motion:reduce){.button:hover{transform:none}}
@media print{.nav-links{display:none}body[data-imported="true"] .card{break-inside:avoid}}
`;
