import {brandPalette,bestInk} from './branding.mjs';

// Presentation only. Each direction styles the existing semantic sections;
// copy, asset associations, links and explicit image framing remain untouched.
export function artDirectionCSS(project) {
  const id=project.templateId;
  if(!['cinema','pop','atelier','precision'].includes(id))return '';
  const s=`html body[data-template="${id}"][data-imported]`,b=brandPalette(project.branding);
  const accent=/^#[a-f\d]{6}$/i.test(project.accent||'')?project.accent:'#637b53';
  const common=`/* Art direction: ${id} */
${s}{--art-paper:${b.background};--art-ink:${b.text};--art-soft:color-mix(in srgb,${accent} 10%,${b.background});--art-solid:${accent};--art-solid-ink:${bestInk(accent)};--page-gutter:clamp(20px,4vw,64px);--section-space:clamp(48px,6vw,88px)}
${s} .hero-layout{position:relative;isolation:isolate;min-width:0}
${s} .hero-copy,${s} .visual{min-width:0}
${s} .hero-copy{background:transparent}
${s} .hero-copy h1{max-width:18ch}
${s} .hero-copy h1[data-length="long"]{font-size:clamp(38px,4.8vw,72px)}
${s} .hero-copy h1[data-length="extended"]{font-size:clamp(32px,3.8vw,56px)}
${s} .card :is(h2,p){color:inherit}
${s} .card[data-composition="logos"]{grid-column:1/-1;background:var(--art-paper);color:var(--art-ink);padding:40px!important}
${s} .card[data-composition="logos"] img{border-radius:0}
${s} .card[data-publication="true"] img{object-fit:contain;border-radius:0}
${s} .hero-layout[data-hero="text"]{display:block;min-height:0}
${s} .hero-layout[data-hero="text"] .no-image{display:none}
${s} .hero-layout[data-hero="text"] .hero-copy{max-width:960px;margin-inline:auto}
${s} .button:focus-visible,${s} a:focus-visible{outline-color:currentColor}
`;
  const cinema=`
${s}{background:color-mix(in srgb,${b.secondary} 18%,#111713);color:#fffaf1}
${s} .shell{max-width:1800px}
${s} .nav[data-header]{margin:18px 0 0;border-radius:0;border:0;box-shadow:none}
${s} .hero-layout{display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:56px;padding:72px 0;background:transparent;color:inherit}
${s} .hero-copy h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(56px,7.5vw,120px);letter-spacing:-.05em}
${s} .hero-copy>p,${s} .eyebrow{color:inherit}
${s} .hero-image{aspect-ratio:4/5;border-radius:0}
${s} .hero-layout:has(>.visual>.hero-image):not(:has(.hero-copy[data-density="long"])):not([data-profile="person"]){display:grid;grid-template-columns:1fr;min-height:690px;min-height:min(82svh,900px);padding:clamp(48px,7vw,110px);margin-top:16px}
${s} .hero-layout:has(>.visual>.hero-image):not(:has(.hero-copy[data-density="long"])):not([data-profile="person"]) .visual{position:absolute;inset:0;z-index:-2}
${s} .hero-layout:has(>.visual>.hero-image):not(:has(.hero-copy[data-density="long"])):not([data-profile="person"]) .hero-image{height:100%;width:100%;aspect-ratio:auto}
${s} .hero-layout:has(>.visual>.hero-image):not(:has(.hero-copy[data-density="long"])):not([data-profile="person"])::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(0,0,0,.84),rgba(0,0,0,.58));pointer-events:none}
${s} .hero-copy{max-width:900px;color:inherit}
${s} .hero-layout[data-profile="person"]{background:transparent;color:inherit}
${s} .hero-layout[data-profile="person"] .hero-copy{color:inherit}
${s} .hero-layout[data-profile="person"] .visual{order:-1}
${s} .button{border-radius:0;background:#fffaf1;color:#171b17;border:1px solid #fffaf1;text-transform:uppercase;letter-spacing:.1em;font-size:11px}
${s} .cards{gap:0 48px}
${s} .card:not(.content-heading){background:transparent;color:inherit;border-color:#ffffff35}
${s} .card[data-composition="feature"]{grid-template-columns:1.4fr 1fr;gap:clamp(32px,7vw,100px)}
${s} .card h2{font-family:Georgia,serif;font-weight:400;font-size:clamp(36px,4.3vw,64px)}
${s} .card[data-density="compact"]{display:block;grid-column:span 3}
${s} .card[data-density="compact"] .card-meta{margin-top:28px}
${s} .card[data-density="compact"] h2{font-size:36px}
${s} .card[data-composition="collection"]{border:0;padding:48px!important;background:#ffffff0a}
${s} .contact{background:var(--art-solid);color:var(--art-solid-ink);text-align:center;display:block;border-radius:0;padding-block:100px}
${s} .contact h2{font-family:Georgia,serif;font-weight:400;max-width:none}
${s} .contact-links{align-items:center}
${s} .contact .button{margin-top:32px}
${s} .footer,${s} .footer .brand-name{color:inherit}
`;
  const pop=`
${s}{background:var(--art-soft);color:var(--art-ink)}
${s} .shell{max-width:1640px}
${s} .nav[data-header]{border:0;border-radius:0;background:var(--brand-header-background,var(--art-paper));box-shadow:none;margin:16px 0;padding-block:16px}
${s} .nav[data-header] .nav-action{border-radius:100px;transform:rotate(-3deg)}
${s} .hero-layout{display:grid;grid-template-columns:1.1fr 1fr;gap:12px;padding:0;margin:12px 0 56px;align-items:stretch;background:transparent}
${s} .hero-copy{background:var(--art-solid);color:var(--art-solid-ink);border-radius:44px;padding:clamp(32px,4vw,64px)!important;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}
${s} .hero-copy:not(:has(p)):not(:has(.button)){display:flex}
${s} .hero-layout[data-hero="text"] .hero-copy{padding:clamp(32px,4vw,64px)!important}
${s} .hero-copy h1{font-family:'Arial Rounded MT Bold','Trebuchet MS',sans-serif;font-weight:900;font-size:clamp(56px,6.8vw,106px);letter-spacing:-.065em;line-height:.98}
${s} .hero-copy>p,${s} .eyebrow{color:inherit}
${s} .visual{border-radius:44px;background:var(--art-paper);overflow:hidden;display:flex;align-items:center}
${s} .hero-layout[data-profile="person"]{background:transparent}
${s} .hero-layout[data-profile="person"] .hero-copy{background:var(--art-solid);color:var(--art-solid-ink);padding:32px!important}
${s} .hero-image{height:100%;min-height:480px;aspect-ratio:4/5;border-radius:44px}
${s} .button{background:var(--art-ink);color:var(--art-paper);border:0;border-radius:100px;min-height:58px;font-weight:700}
${s} .cards{gap:18px;margin-bottom:48px}
${s} .card:not(.content-heading){border:0;border-radius:36px;background:var(--art-paper);color:var(--art-ink);padding:40px!important}
${s} .card:nth-child(3n+2):not(.content-heading){background:var(--art-solid);color:var(--art-solid-ink)}
${s} .card[data-density="compact"],${s} .card[data-composition="text"]{grid-column:span 3;display:flex;flex-direction:column;align-items:stretch;gap:28px}
${s} .card[data-density="compact"]:nth-of-type(n){padding:40px!important}
${s} .card .card-meta>div,${s} .card[data-composition="text"] .card-meta>div{display:block}
${s} .card h2{font-family:'Arial Rounded MT Bold','Trebuchet MS',sans-serif;font-weight:800;letter-spacing:-.045em;font-size:clamp(32px,3.8vw,56px)}
${s} .card img{border-radius:24px}
${s} .card[data-composition="heading"]{padding:32px 12px 18px!important}
${s} .card[data-composition="link"]{grid-column:span 3}
${s} .card[data-composition="link"] h2{font-size:25px}
${s} .contact{border-radius:44px;background:var(--art-ink);color:var(--art-paper)}
${s} .contact .button{background:var(--art-solid);color:var(--art-solid-ink)}
`;
  const atelier=`
${s}{background:var(--art-paper);color:var(--art-ink)}
${s} .shell{max-width:1500px;--page-gutter:clamp(24px,6vw,96px)}
${s} .nav[data-header]{border:0;border-bottom:1px solid currentColor;border-radius:0;box-shadow:none;margin:12px 0 0;padding-inline:0}
${s} .nav-links{font-size:11px;text-transform:uppercase;letter-spacing:.12em;gap:26px}
${s} .nav[data-header] .nav-action{border:0;border-bottom:1px solid currentColor;border-radius:0;background:transparent;color:inherit;padding-inline:0}
${s} .hero-layout{display:grid;grid-template-columns:1fr 1.05fr;align-items:center;padding:64px 0 110px;gap:clamp(32px,7vw,100px);background:transparent}
${s} .hero-copy{padding:32px 0!important;background:transparent}
${s} .hero-copy h1{font-family:Georgia,serif;font-size:clamp(54px,6.2vw,96px);font-weight:400;line-height:1.06;letter-spacing:-.065em;max-width:13ch}
${s} .hero-image{aspect-ratio:4/5;border-radius:50% 50% 0 0;max-height:700px}
${s} .hero-layout[data-profile="person"] .hero-image{border-radius:50% 50% 0 0}
${s} .hero-layout[data-profile="person"]{grid-template-columns:.85fr 1.15fr;padding-inline:0}
${s} .button{background:transparent;color:inherit;border:0;border-bottom:1px solid currentColor;padding:12px 0;border-radius:0;text-transform:uppercase;font-size:11px;letter-spacing:.14em}
${s} .cards{column-gap:clamp(32px,8vw,120px)}
${s} .card:not(.content-heading){border:0;background:transparent;color:inherit}
${s} .card h2{font-family:Georgia,serif;font-weight:400;line-height:1.12;font-size:clamp(34px,4vw,58px)}
${s} .card[data-density="compact"]{display:flex;flex-direction:column;align-items:stretch;grid-column:span 3;gap:30px}
${s} .card[data-density="compact"]:nth-child(even){padding-top:150px!important}
${s} .card[data-density="compact"] img{max-height:600px;border-radius:48% 48% 0 0}
${s} .card[data-composition="text"]{border-top:1px solid var(--rule)}
${s} .card[data-composition="text"] .card-meta>div{grid-template-columns:.8fr 1.2fr}
${s} .card[data-composition="collection"]{background:var(--art-soft);padding:clamp(24px,5vw,72px)!important}
${s} .section-gallery{gap:32px}
${s} .contact{border-radius:0;border-block:1px solid currentColor;background:transparent;color:inherit;padding:72px 0}
${s} .contact h2{font-family:Georgia,serif;font-weight:400}
${s} .contact .button{background:transparent;color:inherit;border-bottom:1px solid currentColor}
`;
  const precision=`
${s}{background:var(--art-paper);color:var(--art-ink)}
${s} .shell{max-width:1480px}
${s} .nav[data-header]{max-width:1160px;margin:24px auto 0;border:1px solid var(--rule);border-radius:18px;box-shadow:0 8px 24px #00000006;min-height:76px;padding:12px 24px}
${s} .nav[data-header] .nav-action{border-radius:10px}
${s} .hero-layout{display:flex;flex-direction:column;gap:48px;padding:76px 0 64px;background:radial-gradient(ellipse at 50% 70%,var(--art-soft),transparent 68%)}
${s} .hero-copy{max-width:940px;text-align:center;margin:auto;background:transparent}
${s} .hero-copy h1{font-family:'Avenir Next','Segoe UI',sans-serif;font-weight:650;font-size:clamp(48px,6vw,84px);margin:auto;max-width:19ch;letter-spacing:-.06em;line-height:1.06}
${s} .hero-copy>p{margin:28px auto;max-width:62ch}
${s} .eyebrow{justify-content:center;font-size:10px;letter-spacing:.1em}
${s} .eyebrow::before{width:7px;height:7px;border-radius:50%;background:var(--accent)}
${s} .button{border-radius:10px;background:var(--art-ink);color:var(--art-paper);border:0;font-weight:600}
${s} .visual{width:88%;padding:12px;border:1px solid var(--rule);border-radius:24px;background:var(--art-paper);box-shadow:0 28px 70px #0000000c}
${s} .hero-image{aspect-ratio:2.2/1;border-radius:14px;max-height:500px}
${s} .hero-layout[data-profile="person"]{display:flex;flex-direction:column;gap:48px;text-align:center;background:transparent}
${s} .hero-layout[data-profile="person"] .hero-copy{text-align:center;max-width:880px}
${s} .hero-layout[data-profile="person"] .profile-name{max-width:none;margin-inline:auto}
${s} .hero-layout[data-profile="person"] h1{margin-inline:auto}
${s} .hero-layout[data-profile="person"] .hero-copy>p:not(.profile-name){margin-inline:auto}
${s} .hero-layout[data-profile="person"] .visual{width:min(460px,100%);padding:12px}
${s} .cards{gap:22px;margin-bottom:64px}
${s} .card:not(.content-heading){border:1px solid var(--rule);border-radius:20px;padding:clamp(24px,4vw,56px)!important;background:var(--art-soft);color:var(--art-ink)}
${s} .card h2{font-family:'Avenir Next','Segoe UI',sans-serif;font-weight:600;font-size:clamp(28px,3.3vw,46px);letter-spacing:-.045em}
${s} .card[data-composition="text"] .card-meta>div{display:block}
${s} .card[data-density="text-compact"]{grid-column:span 2}
${s} .card[data-density="compact"]{grid-column:span 3;display:flex;flex-direction:column;align-items:stretch;gap:28px}
${s} .card[data-density="compact"]:nth-of-type(n){padding:clamp(24px,4vw,56px)!important}
${s} .card[data-density="text-compact"] h2,${s} .card[data-composition="link"] h2{font-size:24px}
${s} .card img{border-radius:12px}
${s} .contact{border-radius:24px;background:var(--art-ink);color:var(--art-paper)}
${s} .contact .button{background:var(--art-paper);color:var(--art-ink)}
`;
  const responsive=`
${s} .card[data-composition="logos"]:not(.content-heading){background:var(--art-paper);color:var(--art-ink)}
/* Personal names retain their hierarchy, with the selected direction's framing. */
${s} .hero-layout[data-profile="person"] .profile-name{color:inherit}
${s} .hero-layout[data-profile="person"] .hero-copy h1{font-size:clamp(22px,2.1vw,30px);max-width:32ch}
${s} .hero-layout[data-profile="person"] .hero-image{aspect-ratio:4/5}
${s} .hero-layout[data-profile="person"] .hero-copy>p:not(.profile-name){margin:0 0 26px}
@media(max-width:900px){
 ${s} .hero-layout{gap:32px}
 ${s} .card[data-density="text-compact"]{grid-column:span 3}
}
@media(max-width:760px){
 ${s} .nav[data-header]{margin-top:12px;padding:12px 16px}
 ${s} .hero-layout,${s} .hero-layout[data-profile="person"]{display:flex;flex-direction:column;padding:32px 0 48px;gap:28px;margin:0;min-height:0}
 ${s} .hero-copy,${s} .hero-layout[data-profile="person"] .hero-copy{display:block;width:100%;margin:0;padding:0!important}
 ${s} .hero-copy h1,${s} .hero-copy h1[data-length]{font-size:clamp(38px,10.5vw,68px);line-height:1.08;max-width:100%}
 ${s} .hero-layout[data-profile="person"] .profile-name{font-size:clamp(48px,13vw,72px)}
 ${s} .hero-copy>p{font-size:15px}
 ${s} .visual,${s} .hero-layout[data-profile="person"] .visual{width:100%;order:0}
 ${s} .hero-image{min-height:0;max-height:480px}
 ${s} .cards{grid-template-columns:1fr;gap:20px}
 ${s} .card[data-composition],${s} .card[data-composition]:nth-child(even){grid-column:1/-1;display:flex;flex-direction:column;align-items:stretch;gap:24px;padding:28px!important}
 ${s} .card[data-composition] .card-meta>div{display:block}
 ${s} .card h2{font-size:32px}
 ${s} .card[data-composition]>.section-gallery,${s} .card[data-composition]>img{order:0!important}
 ${s} .contact{padding:40px 24px;margin-top:32px}
 ${s} .contact h2{font-size:42px}
 ${s} .hero-layout:has(>.visual>.hero-image):not(:has(.hero-copy[data-density="long"])):not([data-profile="person"]){${id==='cinema'?'min-height:620px;padding:40px 24px;justify-content:center;':''}}
 ${s} .hero-copy{${id==='pop'?'padding:32px 24px!important;border-radius:28px;':''}}
 ${s} .visual,${s} .hero-image{${id==='pop'?'border-radius:28px;':''}}
}
`;
  return common+({cinema,pop,atelier,precision}[id])+responsive;
}
