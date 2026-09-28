import {brandPalette} from './branding.mjs';

// A composed editorial spread, using the same editable fields and source sections.
export function atelierHero(p,{personal,e,visual,button,paragraph}) {
  return `<div class="hero-layout" data-hero="${p.hero?'image':'text'}"${personal?' data-profile="person"':''}><section class="hero-copy" data-density="${p.description.length>300?'long':'short'}">${p.eyebrow?`<div class="eyebrow">${e(p.eyebrow)}</div>`:''}${personal?`<p class="profile-name">${e(p.name)}</p>`:''}<h1 data-length="${p.headline.length>150?'extended':p.headline.length>80?'long':'short'}">${e(p.headline)}</h1>${visual}${p.description?`<p>${paragraph(p.description,e)}</p>`:''}${button}</section></div>`;
}

export function atelierCSS(p) {
  const b=brandPalette(p.branding),s='html body[data-template="atelier"]';
  return `/* Art direction: atelier */
${s}{--paper:${b.background};--ink:${b.text};--line:color-mix(in srgb,var(--ink) 22%,transparent);--tint:color-mix(in srgb,var(--accent) 7%,var(--paper));--brand-header-background:${b.headerBackground};--brand-header-text:${b.headerText};background:var(--paper);color:var(--ink);font-family:'Avenir Next',Avenir,'Segoe UI',sans-serif}
${s} .shell{max-width:1680px;padding:0 clamp(24px,5vw,88px)}
${s} .demo-note{background:var(--ink);color:var(--paper);padding:7px 16px;font-size:9px;letter-spacing:.16em}
${s}[data-imported] .nav[data-header]{margin:0;border-radius:0;box-shadow:none;min-height:92px;border:0;border-bottom:1px solid var(--line);padding:20px 0;background:var(--brand-header-background);color:var(--brand-header-text)}
${s}[data-imported] .nav[data-header] .nav-action{border-radius:0;background:transparent;color:inherit;border:0;border-bottom:1px solid currentColor;padding:12px 0;margin-left:16px}
${s} .hero-layout{margin:0;padding:0;border-bottom:1px solid var(--line)}
${s} .hero-copy{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:24px;row-gap:28px;max-width:none;margin:0;padding:32px 0 56px;text-align:left;align-items:start}
${s} .eyebrow{grid-column:1/-1;grid-row:1;font-size:11px;justify-content:flex-start;letter-spacing:.18em;margin:0}
${s} .eyebrow:before{display:none}
${s} h1,${s} .profile-name{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.065em;text-wrap:balance;overflow-wrap:anywhere}
${s} .hero-copy h1{grid-column:1/-1;grid-row:2;font-size:clamp(60px,8.4vw,132px);line-height:1.01;max-width:20ch;margin:0 0 24px}
${s} .hero-copy h1[data-length=long]{font-size:clamp(44px,6.2vw,92px);max-width:28ch}
${s} .hero-copy h1[data-length=extended]{font-size:clamp(38px,5.2vw,76px);max-width:32ch}
${s} .visual{grid-column:1/8;grid-row:3/6;min-width:0;margin:0;align-self:stretch}
${s} .hero-image{width:100%;height:100%;min-height:460px;max-height:780px;object-fit:cover;object-position:center var(--hero-position);border-radius:0;background:var(--tint)}
${s} .image-label{display:none}
${s} .hero-copy>p:not(.profile-name){grid-column:9/-1;grid-row:3;font-size:17px;line-height:1.75;color:inherit;max-width:none;margin:0;padding-top:18px;border-top:1px solid var(--ink);white-space:pre-line}
${s} .button{font:500 13px/1.4 'Avenir Next',Avenir,sans-serif;border-radius:0;background:var(--ink);color:var(--paper);padding:18px 24px;gap:40px;min-height:52px;max-width:100%;white-space:normal;text-align:left}
${s} .hero-copy>.button{grid-column:9/-1;grid-row:4;justify-self:start}
${s} .hero-copy:not(:has(>p:not(.profile-name))):not(:has(>.button)) .visual{grid-column:1/-1}
${s} .hero-copy:not(:has(>p:not(.profile-name))):not(:has(>.button)) .hero-image{height:580px;min-height:0}
${s} .hero-layout[data-profile=person] .profile-name{grid-column:1/-1;grid-row:2;font-size:clamp(64px,9.6vw,148px);line-height:.96;max-width:100%;margin:0 0 10px;color:var(--ink)}
${s} .hero-layout[data-profile=person] h1{grid-column:9/-1;grid-row:3;font-size:clamp(28px,2.8vw,44px);line-height:1.16;letter-spacing:-.035em;margin:0;max-width:none}
${s} .hero-layout[data-profile=person] .visual{grid-row:3/7}
${s} .hero-layout[data-profile=person] .hero-copy>p:not(.profile-name){grid-row:4;font-size:15px;border-top:0;padding:0}
${s} .hero-layout[data-profile=person] .hero-copy>.button{grid-row:5}
${s} .hero-layout[data-profile=person] .hero-image{min-height:640px;object-position:center 30%}
${s} .hero-layout[data-hero=text] .visual{display:none}
${s} .hero-layout[data-hero=text] .hero-copy>p:not(.profile-name){grid-column:1/8}
${s} .hero-layout[data-hero=text][data-profile=person] h1{grid-column:1/8}
${s} .hero-layout[data-hero=text] .hero-copy>.button{grid-column:9/-1;grid-row:3}
${s} .section{padding:0}
${s} .section-top[hidden]{display:none}
${s} .section-top:not([hidden]){padding:56px 0 0}
${s} .cards{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:0 48px;counter-reset:chapter}
${s} .card{grid-column:1/-1;padding:64px 0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;counter-increment:chapter;position:relative}
${s} .card-meta{margin:0;display:block}
${s} .card h2,${s} .card h3{font-family:Georgia,'Times New Roman',serif;font-size:clamp(28px,3.4vw,52px);font-weight:400;line-height:1.12;letter-spacing:-.045em;margin:0 0 24px;overflow-wrap:anywhere;text-wrap:balance}
${s} .card p,${s} .card blockquote{font-size:16px;line-height:1.8;color:inherit;margin:0;white-space:pre-line;overflow-wrap:anywhere}
${s} .card img{border-radius:0;background:var(--tint);width:100%;height:auto;max-height:640px;object-fit:cover}
${s} .card[data-composition=feature]{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:64px;align-items:center}
${s} .card[data-composition=feature]:nth-child(even)>:first-child{order:2}
${s} .card[data-composition=text] .card-meta>div{display:grid;grid-template-columns:1fr 1.2fr;gap:64px}
${s} .card[data-composition=heading]{padding:52px 0 20px;border-bottom:0}
${s} .card[data-composition=heading] h2{font-size:clamp(40px,5.5vw,84px);margin:0}
${s} .card[data-composition=link]{padding:26px 0}
${s} .card[data-composition=link] h2{font-size:clamp(24px,3vw,42px);font-weight:500;line-height:1.25;margin:0}
${s} .card[data-density=compact],${s} .card[data-publication]{grid-column:span 6;display:block;padding:56px 0}
${s} .card[data-density=compact] .card-meta,${s} .card[data-publication] .card-meta{margin-top:26px}
${s} .card[data-density=compact] h2,${s} .card[data-publication] h2{font-size:32px}
${s} .card[data-density=compact]>img{height:360px}
${s} .card[data-publication] img{height:420px;max-height:none;object-fit:contain;padding:30px;background:var(--tint)}
${s} .section-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;min-width:0}
${s} .section-gallery[data-image-count="1"]{grid-template-columns:1fr}
${s} .section-gallery figure{margin:0;min-width:0}
${s} .section-gallery img{width:100%;height:auto;object-fit:contain}
${s} figcaption{font-size:12px;line-height:1.6;padding-top:12px;overflow-wrap:anywhere}
${s} .card[data-composition=collection]{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:48px;align-items:center;background:var(--ink);color:var(--paper);padding:48px;margin:40px 0;border:0}
${s} .card[data-composition=collection] .card-meta{margin:0;max-width:800px}
${s} .copy-part{display:block;white-space:pre-line}
${s} p:has(>.copy-part){white-space:normal}
${s} .copy-part+.copy-part{margin-top:1.2em}
${s} .card[data-composition=logos] .section-gallery{grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:40px;align-items:center}
${s} .card[data-composition=logos] img{height:70px;object-fit:contain;background:transparent}
${s} .faq-item{padding:20px 0;border-top:1px solid var(--line)}
${s} .faq-item summary{cursor:pointer;min-height:44px;font-size:20px}
${s} .about{padding:64px 0;border-top:0;gap:64px}
${s} .about p{color:inherit}
${s} .benefits{margin:48px 0;padding:32px 0;max-width:none;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;color:inherit}
${s} .benefit p{color:inherit}
${s} .contact{margin:64px 0 0;border-radius:0;border-top:1px solid var(--ink);padding:56px 0;background:transparent;color:var(--ink);align-items:start}
${s} .contact .section-kicker{color:inherit!important}
${s} .contact h2{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(48px,7vw,100px);letter-spacing:-.055em}
${s} .contact-links,${s} .contact-empty{color:inherit;font-size:16px}
${s} .contact .button{background:var(--ink);color:var(--paper)}
${s} .footer{border-top:1px solid var(--line);padding:26px 0;color:inherit}
${s} .footer .brand-name{color:inherit}
${s} a:focus-visible{outline:2px solid currentColor;outline-offset:5px}
${s} a:hover{text-decoration:underline;text-underline-offset:5px}
@media(max-width:900px){
${s} .hero-copy{column-gap:20px}
${s} .visual{grid-column:1/8}
${s} .hero-copy>p:not(.profile-name),${s} .hero-copy>.button,${s} .hero-layout[data-profile=person] h1{grid-column:8/-1}
${s} .hero-layout[data-profile=person] .hero-image{min-height:540px}
${s} .cards{column-gap:28px}
${s} .card[data-composition=feature],${s} .card[data-composition=text] .card-meta>div{gap:32px}
}
@media(max-width:760px){
${s} .shell{padding:0 22px}
${s}[data-imported] .nav[data-header]{min-height:76px;padding:16px 0}
${s} .hero-copy{display:flex;flex-direction:column;gap:24px;padding:32px 0 40px}
${s} .hero-copy h1{font-size:52px;line-height:1.04;letter-spacing:-.055em;margin:0;max-width:100%;order:1}
${s} .hero-copy h1[data-length=long]{font-size:40px}
${s} .hero-copy h1[data-length=extended]{font-size:34px}
${s} .eyebrow{order:0}
${s} .hero-layout[data-profile=person] .profile-name{font-size:clamp(52px,11.8vw,88px);margin:0;order:1}
${s} .visual{order:2;width:100%}
${s} .hero-image,${s} .hero-copy:not(:has(>p:not(.profile-name))):not(:has(>.button)) .hero-image{height:380px;min-height:0;max-height:none}
${s} .hero-layout[data-profile=person] .hero-image{height:460px;min-height:0}
${s} .hero-layout[data-profile=person] h1{order:3;font-size:30px}
${s} .hero-copy>p:not(.profile-name){order:4;font-size:16px;padding:0;border:0;width:100%;margin:0}
${s} .hero-copy>.button{order:5}
${s} .cards{display:block}
${s} .card,${s} .card[data-density=compact],${s} .card[data-publication]{padding:36px 0}
${s} .card[data-composition=feature],${s} .card[data-composition=text] .card-meta>div{display:block}
${s} .card[data-composition=feature] .card-meta{margin-top:26px}
${s} .card h2,${s} .card h3{font-size:32px}
${s} .card p,${s} .card blockquote{font-size:15px}
${s} .card[data-composition=heading] h2{font-size:44px}
${s} .card[data-density=compact]>img{height:auto;max-height:440px}
${s} .section-gallery{gap:16px}
${s} .card[data-composition=collection]{display:block;padding:24px;margin:24px 0}
${s} .card[data-composition=collection] .card-meta{margin-top:28px}
${s} .card[data-publication] img{height:360px}
${s} .about{display:block;padding:40px 0}
${s} .about h2{margin-bottom:24px}
${s} .contact{margin-top:40px;padding:36px 0;display:block}
${s} .contact h2{font-size:52px}
${s} .contact .button{margin-top:24px}
}
@media(prefers-reduced-motion:reduce){${s} *{scroll-behavior:auto;transition:none}}
`;
}
