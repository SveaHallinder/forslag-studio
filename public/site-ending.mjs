import {brandPalette,bestInk} from './branding.mjs';

const toneFor=id=>['atelier','editorial','story','wellness','retail'].includes(id)?'editorial':['cinema','studio','dining','hospitality'].includes(id)?'atmospheric':id==='pop'?'playful':'structured';
const external=href=>/^https?:/.test(href)?' target="_blank" rel="noopener noreferrer"':'';
function websiteURL(value) {
  try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}
}

// The ending uses actual contact routes and navigation. A missing import stays
// compact rather than turning an empty contact section into the page's focal point.
export function renderSiteEnding(p,e,picture) {
  const source=websiteURL(p.source),tone=toneFor(p.templateId);
  const phone=p.phone?`tel:${p.phone.replace(/[^+\d]/g,'')}`:'';
  const contactLink=p.navigation.find(item=>/^(kontakt|kontakta oss|contact|contact us)$/i.test(item.label.trim())&&item.href!=='#kontakt'&&!item.href.startsWith('#'));
  const direct=p.email?{href:`mailto:${p.email}`,label:'Skicka ett mejl'}:phone?{href:phone,label:'Ring oss'}:contactLink?{href:contactLink.href,label:contactLink.label}:null;
  const mode=direct||p.address?'available':source?'website':'empty';
  const route=direct||(source?{href:source,label:'Besök webbplatsen'}:null);
  const rows=[
    p.email?`<div class="ending-detail"><span class="ending-label">E-post</span><a href="mailto:${e(p.email)}">${e(p.email)}<span aria-hidden="true">↗</span></a></div>`:'',
    p.phone?`<div class="ending-detail"><span class="ending-label">Telefon</span><a href="${e(phone)}">${e(p.phone)}<span aria-hidden="true">↗</span></a></div>`:'',
    p.address?`<div class="ending-detail"><span class="ending-label">Adress</span><span class="ending-address">${e(p.address)}</span></div>`:'',
    !p.email&&!p.phone&&contactLink?`<div class="ending-detail"><span class="ending-label">På webbplatsen</span><a href="${e(contactLink.href)}"${external(contactLink.href)}>${e(contactLink.label)}<span aria-hidden="true">↗</span></a></div>`:'',
    !direct&&!p.address?`<p class="contact-empty">${source?'Kontakt och mer information finns på företagets webbplats.':'Kontaktuppgifter saknas i det här designförslaget.'}</p>`:'',
  ].join('');
  const contact=`<section class="contact site-contact" id="kontakt" data-ending="${tone}" data-contact="${mode}" aria-label="Kontakt"><div class="ending-invitation"><h2>Kontakt<span aria-hidden="true">.</span></h2>${route?`<a class="ending-action" href="${e(route.href)}"${external(route.href)} aria-label="${e(route.label)}"><span class="ending-action-label">${e(route.label)}</span><svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><path d="M10 38 38 10M10 10h28v28"/></svg></a>`:''}</div><div class="contact-links">${rows}</div></section>`;
  const links=p.navigation.map(item=>`<a href="${e(item.href)}"${external(item.href)}>${e(item.label)}</a>`).join('');
  const nameLength=p.name.length>45?'extended':p.name.length>24?'long':'short';
  // A known dark/light logo is shown on its matching imported header surface.
  // The large name below is type, so an opaque or white-only logo never disappears.
  const footerLogo=p.logo?`<a class="ending-logo" href="#start" aria-label="${e(p.name)} – till toppen">${picture(p.logo,p.name,'',true)}</a>`:'';
  const footer=`<footer class="footer site-footer" data-ending="${tone}"><div class="ending-index">${footerLogo}${links?`<nav class="ending-links" aria-label="Sidfotsmeny">${links}</nav>`:''}<a class="ending-top" href="#start">Till toppen<span aria-hidden="true">↑</span></a></div><p class="ending-wordmark" data-name-length="${nameLength}">${e(p.name)}</p><div class="ending-colophon"><span class="source">Designförslag · Innehåll och bilder från ${source?`<a href="${e(source)}" target="_blank" rel="noopener noreferrer">företagets webbplats</a>`:'företaget'}.</span><span class="ending-note">Designförslag för ${e(p.name)}</span></div></footer>`;
  return {contact,footer};
}

export function siteEndingCSS(p) {
  const b=brandPalette(p.branding),tone=toneFor(p.templateId),dark=tone==='atmospheric',playful=tone==='playful';
  const background=dark?b.text:playful?p.accent:b.background,ink=dark?b.background:playful?bestInk(p.accent):b.text;
  const displayFamily=p.typography?.heading?`${JSON.stringify(p.typography.heading)},serif`:"Georgia,'Times New Roman',serif";
  const s='html body[data-template][data-imported]',c=s+' .contact.site-contact',f=s+' .footer.site-footer';
  return `
/* A complete ending: invitation, contact routes, link index and signature. */
${c},${f}{--ending-paper:${background};--ending-ink:${ink};--ending-line:color-mix(in srgb,var(--ending-ink) 22%,transparent);background:var(--ending-paper);color:var(--ending-ink)}
${c}{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start;gap:clamp(40px,8vw,130px);margin:80px 0 0;padding:64px 0 72px;border:0;border-top:1px solid var(--ending-line);border-radius:0;box-shadow:none;text-align:left}
${c} .ending-invitation{min-width:0;display:flex;align-items:start;justify-content:space-between;gap:28px}
${c} h2{font-size:clamp(56px,7.8vw,116px);font-weight:400;line-height:.98;letter-spacing:-.065em;margin:0;max-width:none;color:inherit}
${c} h2>span{color:inherit}
${c} .ending-action{display:flex;align-items:center;justify-content:center;flex:none;gap:16px;min-width:72px;min-height:72px;padding:16px;border:1px solid var(--ending-line);border-radius:50%;color:inherit;background:transparent;transition:background .2s,color .2s}
${c} .ending-action:hover{background:var(--ending-ink);color:var(--ending-paper);text-decoration:none}
${c} .ending-action svg{width:36px;height:36px;fill:none;stroke:currentColor;stroke-width:1.5}
${c} .ending-action-label{position:absolute;clip-path:inset(50%);height:1px;width:1px;overflow:hidden;white-space:nowrap}
${c} .contact-links{display:grid;gap:0;min-width:0;max-width:none;color:inherit;font-size:16px;line-height:1.5}
${c} .ending-detail{padding:0 0 22px;margin:0 0 22px;border-bottom:1px solid var(--ending-line);min-width:0}
${c} .ending-detail:last-child{border:0;margin:0;padding-bottom:0}
${c} .ending-label{display:block;font-size:10px;line-height:1.4;font-weight:500;letter-spacing:.15em;text-transform:uppercase;margin-bottom:12px}
${c} .ending-detail>a{display:flex;align-items:baseline;justify-content:space-between;gap:24px;font-size:clamp(18px,2vw,30px);line-height:1.4;letter-spacing:-.025em;min-height:44px;overflow-wrap:anywhere;text-decoration:none;color:inherit}
${c} .ending-detail>a:hover{text-decoration:underline;text-underline-offset:6px}
${c} .ending-detail>a>span{flex:none;font-size:22px}
${c} .ending-address{display:block;max-width:34ch;font-size:17px;line-height:1.6;white-space:pre-line;overflow-wrap:anywhere}
${c} .contact-empty{font-size:14px;line-height:1.6;margin:0;max-width:45ch;color:inherit}
${c}[data-contact=website],${c}[data-contact=empty]{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;background:transparent;color:inherit;padding:32px 0;gap:40px;margin-top:56px}
${c}[data-contact=website] h2,${c}[data-contact=empty] h2{font-family:inherit;font-size:24px;font-weight:500;letter-spacing:-.025em;line-height:1.2}
${c}[data-contact=website] .ending-invitation,${c}[data-contact=empty] .ending-invitation{align-items:center;justify-content:start;gap:28px}
${c}[data-contact=website] .ending-action{min-height:44px;min-width:44px;padding:10px}
${c}[data-contact=website] .ending-action svg{width:22px;height:22px}
${f}{display:block;max-width:none;margin:0;padding:32px 0 24px;border:0;border-top:1px solid var(--ending-line);border-radius:0;font-size:12px;line-height:1.5;text-align:left}
${f} .ending-index{display:flex;align-items:start;gap:48px;justify-content:space-between;margin-bottom:72px;min-width:0}
${f} .ending-logo{display:flex;align-items:center;justify-content:start;min-height:44px;max-width:180px;flex:0 1 180px;padding:10px 14px;background:${b.headerBackground};color:${b.headerText};border:0}
${f} .ending-logo img{width:auto;height:auto;max-height:40px;max-width:100%;object-fit:contain;background:none;border:0;border-radius:0;filter:none}
${f} .ending-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px 40px;flex:1;max-width:700px;min-width:0}
${f} .ending-links a{display:flex;align-items:center;min-height:44px;padding:6px 0;font-size:13px;line-height:1.45;overflow-wrap:anywhere;text-decoration:none;color:inherit}
${f} .ending-links a:hover{text-decoration:underline;text-underline-offset:5px}
${f} .ending-top{display:flex;align-items:center;gap:24px;min-height:44px;font-size:12px;white-space:nowrap;margin-left:auto;color:inherit}
${f} .ending-top>span{font-size:22px}
${f} .ending-wordmark{margin:0 0 40px;font-size:clamp(56px,12vw,176px);font-weight:500;line-height:1.03;letter-spacing:-.065em;overflow-wrap:anywhere;text-wrap:balance;color:inherit}
${f} .ending-wordmark[data-name-length=long]{font-size:clamp(48px,9vw,140px)}
${f} .ending-wordmark[data-name-length=extended]{font-size:clamp(40px,6vw,100px);max-width:28ch}
${f} .ending-colophon{display:flex;align-items:start;justify-content:space-between;gap:24px;padding-top:22px;border-top:1px solid var(--ending-line);font-size:10px;line-height:1.6}
${f} .source{max-width:65%;font-size:10px;text-align:left;color:inherit}
${f} .source a{text-decoration:underline;text-underline-offset:3px}
${f} .ending-note{text-align:right;max-width:35%;overflow-wrap:anywhere}
${c} a:focus-visible,${f} a:focus-visible{outline:2px solid currentColor;outline-offset:5px}
${c}[data-ending=editorial] h2,${f}[data-ending=editorial] .ending-wordmark{font-family:${displayFamily};font-weight:400}
${c}[data-ending=atmospheric],${f}[data-ending=atmospheric]{padding-inline:clamp(28px,4vw,64px)}
${c}[data-ending=atmospheric]{padding-top:64px}
${c}[data-ending=atmospheric][data-contact=empty],${c}[data-ending=atmospheric][data-contact=website]{padding:32px 0}
${f}[data-ending=atmospheric] .ending-wordmark{font-family:${displayFamily};font-weight:400;letter-spacing:-.045em}
${c}[data-ending=playful]{border-radius:32px 32px 0 0;padding:56px 40px;border:0;gap:48px}
${f}[data-ending=playful]{border-radius:0 0 32px 32px;padding:32px 40px 24px;margin-bottom:24px}
${c}[data-ending=playful] h2,${f}[data-ending=playful] .ending-wordmark{font-weight:800;letter-spacing:-.06em}
${c}[data-ending=playful][data-contact=empty],${c}[data-ending=playful][data-contact=website]{padding:32px 0}
${c}[data-ending=structured]{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
${c}[data-ending=structured] h2{font-weight:600;font-size:clamp(48px,6vw,84px)}
@media(max-width:900px){
 ${c}{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px}
 ${c} .ending-invitation{flex-direction:column;gap:24px}
 ${f} .ending-index{gap:28px}
 ${f} .ending-links{grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 28px}
 ${f} .ending-logo{max-width:144px;flex-basis:144px}
}
@media(max-width:620px){
 ${c},${c}[data-ending=structured]{grid-template-columns:minmax(0,1fr);gap:40px;margin-top:48px;padding:40px 0}
 ${c} .ending-invitation{flex-direction:row;align-items:center}
 ${c} h2,${c}[data-ending=structured] h2{font-size:clamp(48px,13vw,72px)}
 ${c} .ending-action{min-width:56px;min-height:56px;padding:13px}
 ${c} .ending-action svg{width:28px;height:28px}
 ${c} .ending-detail>a{font-size:20px;gap:16px}
 ${c} .ending-detail{padding-bottom:16px;margin-bottom:16px}
 ${c}[data-contact=website],${c}[data-contact=empty]{grid-template-columns:minmax(0,1fr);gap:18px;padding:28px 0;margin-top:40px}
 ${c}[data-contact=website] .ending-invitation{justify-content:space-between}
 ${c}[data-contact=website] h2,${c}[data-contact=empty] h2{font-size:22px}
 ${f}{padding-top:26px}
 ${f} .ending-index{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;margin-bottom:44px}
 ${f} .ending-logo{grid-column:1;grid-row:1;max-width:150px}
 ${f} .ending-top{grid-column:2;grid-row:1;gap:16px}
 ${f} .ending-links{grid-column:1/-1;gap:0 24px;max-width:none}
 ${f} .ending-wordmark{margin-bottom:28px;font-size:clamp(48px,14vw,80px);line-height:1.07}
 ${f} .ending-wordmark[data-name-length=long]{font-size:clamp(42px,11vw,64px)}
 ${f} .ending-wordmark[data-name-length=extended]{font-size:clamp(32px,9vw,52px)}
 ${f} .ending-colophon{display:block;padding-top:18px}
 ${f} .source{display:block;max-width:none;font-size:10px}
 ${f} .ending-note{display:none}
 ${c}[data-ending=atmospheric],${f}[data-ending=atmospheric]{padding-inline:24px}
 ${c}[data-ending=atmospheric]{padding-top:40px}
 ${c}[data-ending=playful]{padding:36px 24px;border-radius:24px 24px 0 0;gap:32px}
 ${f}[data-ending=playful]{padding:28px 24px 22px;border-radius:0 0 24px 24px}
 ${c}[data-contact=empty],${c}[data-contact=website]{padding-inline:0}
}
@media(prefers-reduced-motion:reduce){${c} .ending-action{transition:none}}
@media print{${c}{break-inside:avoid;margin-top:30px;padding-block:28px}${f} .ending-wordmark{font-size:64px}${f} .ending-top{display:none}}
`;
}
