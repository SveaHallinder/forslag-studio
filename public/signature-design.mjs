import {brandPalette,bestInk} from './branding.mjs';

// Presentation only: keep the customer's words, destinations and image associations.
export function signatureDesignCSS(p) {
  const id=p.templateId;
  if(!['story','studio','editorial','cinema','pop','gallery','poster'].includes(id))return '';
  const defaults=id==='studio'?{background:'#191b19',text:'#f0f0e8'}:id==='cinema'?{background:'#232824',text:'#f6f1e8'}:id==='story'?{background:'#f5f2eb',text:'#2b322c'}:id==='poster'?{background:'#eee8dc',text:'#212321'}:{background:'#faf9f5',text:'#202320'};
  const b=brandPalette({...defaults,...p.branding}),s=`html body[data-template="${id}"][data-imported][data-page-design]`,c=`${s} .cards>.card[data-flow]`,f=`${s} .site-footer`,contact=`${s} .site-contact`;
  const common=`/* Signature: ${id}; customer typography follows this layer. */
${s}{--signature-paper:${b.background};--signature-ink:${b.text};--signature-line:color-mix(in srgb,var(--signature-ink) 20%,transparent);--signature-soft:color-mix(in srgb,var(--accent) 9%,var(--signature-paper));--signature-accent-ink:${bestInk(p.accent)};--flow-paper:var(--signature-paper);--flow-ink:var(--signature-ink);--flow-soft:var(--signature-soft);background:var(--signature-paper);color:var(--signature-ink)}
${s} .shell{max-width:1600px;padding-inline:clamp(22px,5vw,80px)}
${s} .demo-note{background:var(--signature-paper);color:var(--signature-ink);border-bottom:1px solid var(--signature-line);font-size:9px;padding:7px 16px;letter-spacing:.1em}
${s} .hero-copy{margin:0;min-width:0;text-align:left;color:inherit}
${s} :is(.hero-copy>p,.eyebrow,.about p,.section-top>p,.profile-name){color:inherit}
${s} .hero-copy h1{line-height:1.03;text-wrap:balance;margin:0;max-width:18ch}
${s} .hero-copy h1[data-length=long]{font-size:clamp(36px,4.6vw,70px)}
${s} .hero-copy h1[data-length=extended]{font-size:clamp(32px,3.8vw,58px)}
${s} .hero-layout[data-hero=text]{display:block;min-height:0}
${s} .hero-layout[data-hero=text] .hero-copy{max-width:1060px}
${s} .hero-layout[data-hero=text] .no-image{display:none}
${s} .hero-layout[data-profile=person]{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);align-items:center;gap:clamp(32px,6vw,88px);padding:48px 0;margin:0;background:transparent}
${s} .hero-layout[data-profile=person] .hero-copy{display:block}
${s} .hero-layout[data-profile=person] .profile-name{font-size:clamp(44px,5.5vw,80px);line-height:1.04;margin:0 0 24px;max-width:14ch}
${s} .hero-layout[data-profile=person] h1{font-size:clamp(22px,2.5vw,34px);line-height:1.3;max-width:32ch;margin-bottom:24px}
${s} .hero-image{object-position:center var(--hero-position);background:var(--signature-soft)}
${s} .image-label{display:none}
${s} .section{padding:0}
${s} .section-top[hidden]{display:none}
${s} .section-top:not([hidden]){padding:64px 0 0;margin-bottom:0}
${s} .cards{padding:clamp(56px,7vw,104px) 0;row-gap:clamp(56px,7vw,104px)}
${c} :is(h2,h3,p,blockquote),${c} .card-meta{color:inherit}
${c} .card-number,${c} .card-placeholder{display:none}
${c} img{transition:none}
${c}:hover img{filter:none}
${s} .benefits{background:transparent;color:inherit;max-width:none;margin:0;padding:32px 0;border:0;border-block:1px solid var(--signature-line);border-radius:0;gap:32px}
${s} .benefit :is(h3,p){color:inherit}
${s} .about{padding:64px 0;gap:clamp(32px,6vw,88px);border-color:var(--signature-line)}
${contact},${f}{--ending-paper:var(--signature-paper);--ending-ink:var(--signature-ink);--ending-line:var(--signature-line);background:var(--signature-paper);color:var(--signature-ink)}
${contact}{margin-top:32px}
${f} .ending-logo{padding:0;background:${b.headerBackground};border-radius:0}
${f} .ending-wordmark{font-size:clamp(40px,6vw,90px);max-width:24ch;letter-spacing:-.05em}
${f} .ending-wordmark[data-name-length=long]{font-size:clamp(36px,5vw,70px)}
${f} .ending-wordmark[data-name-length=extended]{font-size:clamp(30px,3.8vw,54px)}
${s} .button{max-width:100%;white-space:normal;min-height:48px;text-align:left;transition:none}
${s} .button:hover{transform:none}
${s} .button:active{transform:translateY(1px)}
`;
  const story=`
${s} .nav[data-header]{margin:0;padding:20px 0;border:0;border-bottom:1px solid var(--signature-line);border-radius:0;background:${b.headerBackground};color:${b.headerText}}
${s} .nav[data-header] .nav-action{border-radius:999px;padding:10px 20px;border:1px solid currentColor}
${s} .hero-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.85fr);gap:clamp(40px,8vw,128px);padding:64px 0 80px;align-items:center}
${s} .hero-copy h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(48px,5.8vw,88px);letter-spacing:-.055em;max-width:13ch}
${s} .eyebrow{justify-content:start;font-size:10px;letter-spacing:.14em;margin-bottom:26px}
${s} .hero-copy>p{margin:28px 0;max-width:42ch;font-size:16px;line-height:1.8}
${s} .visual{margin:0}
${s} .hero-image{height:auto;aspect-ratio:4/5;max-height:650px;border-radius:46% 46% 8px 8px;object-fit:cover}
${s} .visual .benefits{margin:0 0 24px}
${s} .button{background:var(--signature-ink);color:var(--signature-paper);border-radius:999px;padding:16px 24px}
${c}[data-flow=chapter]{padding:0!important;border:0}
${c}[data-flow=chapter] :is(h2,h3){font-family:Georgia,serif;font-size:clamp(38px,4vw,60px);letter-spacing:-.04em}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1fr) minmax(0,.85fr);gap:clamp(32px,7vw,112px);padding:0!important;background:transparent}
${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,.85fr) minmax(0,1fr)}
${c}[data-flow=feature]>img{aspect-ratio:5/4;object-fit:cover;border-radius:8px;max-height:600px}
${c}[data-flow=showcase]{gap:24px;grid-column:span 6}
${c}[data-flow=showcase] img{border-radius:8px;aspect-ratio:5/4}
${c}[data-flow=showcase][data-flow-position="1"],${c}[data-flow=showcase][data-flow-position="3"]{padding-top:56px!important}
${c} :is(h2,h3){font-family:Georgia,serif;font-weight:400;letter-spacing:-.04em}
${c}[data-flow=collection]{padding:40px!important;border-radius:8px;background:var(--signature-soft)}
${contact}{padding:56px 40px;gap:48px;border:0;border-radius:10px;background:var(--signature-soft)}
${contact} h2{font-family:Georgia,serif;font-size:clamp(44px,5vw,72px);letter-spacing:-.04em}
${f}{margin-top:48px;padding-bottom:32px;background:transparent}
${f} .ending-index{margin-bottom:44px}
${f} .ending-wordmark{font-family:Georgia,serif;font-weight:400}
`;
  const studio=`
${s} .nav[data-header]{margin:0;padding:22px 0;background:${p.branding||p.logo?b.headerBackground:b.background};color:${p.branding||p.logo?b.headerText:b.text};border-bottom:1px solid var(--signature-line)}
${s} .nav[data-header] .nav-links{font-size:11px;letter-spacing:.08em;text-transform:uppercase}
${s} .nav[data-header] .nav-action{border:0;border-bottom:1px solid currentColor;padding:8px 0;min-height:44px}
${s} .hero-layout{display:grid;grid-template-columns:1fr;gap:48px;padding:64px 0 0}
${s} .hero-copy{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,.8fr);gap:0 clamp(32px,5vw,80px);align-items:end}
${s} .eyebrow{grid-column:1/-1;justify-content:start;font:500 10px/1.5 ui-monospace,monospace;letter-spacing:.12em;margin-bottom:28px}
${s} .hero-copy h1{grid-column:1;grid-row:2/4;font-weight:500;font-size:clamp(52px,7vw,108px);letter-spacing:-.075em;max-width:14ch}
${s} .hero-copy>p{grid-column:2;grid-row:2;margin:0 0 24px;font-size:15px;line-height:1.75}
${s} .hero-copy>.button{grid-column:2;grid-row:3;justify-self:start;align-self:start;border-radius:0;background:transparent;color:inherit;border:0;border-bottom:1px solid currentColor;padding:12px 0;gap:40px}
${s} .hero-image{height:auto;aspect-ratio:2.3/1;max-height:620px;border-radius:0;object-fit:cover}
${s} .cards{row-gap:0;column-gap:40px;padding-bottom:0}
${c}{border-top:1px solid var(--signature-line);padding:48px 0!important}
${c} :is(h2,h3){font-family:inherit;font-weight:500;letter-spacing:-.05em}
${c}[data-flow=chapter] :is(h2,h3){font-size:clamp(32px,4.5vw,64px);font-weight:400}
${c}[data-flow=chapter]{margin-bottom:0!important;padding-bottom:24px!important}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1.5fr) minmax(0,.65fr);gap:clamp(32px,6vw,96px);background:transparent;align-items:start}
${c}[data-flow=feature][data-flow-side="1"]>.card-meta{order:0}
${c}[data-flow=feature]>img{aspect-ratio:16/11;object-fit:cover;max-height:650px}
${c}[data-flow=showcase]{grid-column:span 6;gap:22px;padding-bottom:64px!important}
${c}[data-flow=showcase] img{aspect-ratio:3/2;border-radius:0}
${c}[data-flow=showcase] :is(h2,h3){font-size:clamp(24px,2.8vw,40px)}
${c}[data-flow=collection]{grid-template-columns:minmax(0,1.5fr) minmax(0,.65fr)}
${c}[data-flow=collection]>.section-gallery{background:transparent;padding:0}
${c}[data-flow=index]{grid-column:1/-1;padding:28px 0!important}
${c}[data-flow=index] .card-meta>div{display:flex;align-items:baseline;gap:32px}
${c}[data-flow=index] .flow-index{margin:0}
${c}[data-flow=index] :is(h2,h3){font-size:clamp(22px,2.6vw,36px)}
${contact}{padding:56px 0;border:0;border-top:1px solid var(--signature-line)}
${contact} h2{font-family:inherit;font-size:clamp(40px,5vw,76px);font-weight:400;letter-spacing:-.065em}
${f}{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;padding:36px 0}
${f} .ending-index{grid-column:2;grid-row:1;margin:0;gap:24px;flex-wrap:wrap}
${f} .ending-wordmark{grid-column:1;grid-row:1;margin:0;font-family:inherit;font-weight:500;font-size:clamp(36px,4vw,60px)}
${f} .ending-colophon{grid-column:1/-1}
`;
  const editorial=`
${s} .nav[data-header]{margin:0;padding:20px 0;background:${b.headerBackground};color:${b.headerText};border-bottom:1px solid var(--signature-line)}
${s} .nav[data-header] .nav-links{font-size:11px;text-transform:uppercase;letter-spacing:.1em}
${s} .hero-layout{display:block;padding:48px 0 0}
${s} .hero-copy{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(0,.75fr);gap:0 clamp(32px,6vw,96px);align-items:end;margin:0 0 40px}
${s} .eyebrow{grid-column:1/-1;margin:0 0 28px;justify-content:start;font-size:10px}
${s} .hero-copy h1{grid-column:1;grid-row:2/4;font-family:Georgia,serif;font-weight:400;font-size:clamp(52px,7vw,108px);line-height:.99;letter-spacing:-.065em;max-width:16ch}
${s} .hero-copy>p{grid-column:2;grid-row:2;font-size:15px;line-height:1.75;margin:0 0 24px;padding:0}
${s} .hero-copy>.button{grid-column:2;grid-row:3;justify-self:start;align-self:start;background:transparent;color:inherit;border:0;border-bottom:1px solid currentColor;padding:14px 0;border-radius:0;gap:36px}
${s} .hero-image{height:auto;aspect-ratio:2.4/1;object-fit:cover;border-radius:0;max-height:640px}
${c}[data-flow=chapter]{padding:28px 0 0!important;border-top:1px solid var(--signature-ink)}
${c}[data-flow=chapter] :is(h2,h3){font-size:clamp(44px,5.6vw,80px);font-style:normal}
${c} :is(h2,h3){font-family:Georgia,serif;font-weight:400}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1.25fr) minmax(0,.7fr);gap:clamp(32px,8vw,128px);padding:0!important;background:transparent;align-items:start}
${c}[data-flow=feature]>img{aspect-ratio:4/3;object-fit:cover;max-height:660px}
${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,.7fr) minmax(0,1.25fr)}
${c}[data-flow=feature] .card-meta{padding-top:28px;border-top:1px solid var(--signature-line)}
${c}[data-flow=showcase]{grid-column:span 7;gap:22px}
${c}[data-flow=showcase][data-flow-position="1"],${c}[data-flow=showcase][data-flow-position="3"]{grid-column:span 5;padding-top:88px!important}
${c}[data-flow=showcase][data-flow-position="2"]{padding-top:0!important}
${c}[data-flow=showcase] img{aspect-ratio:4/3}
${c}[data-flow=showcase][data-flow-position="1"] img,${c}[data-flow=showcase][data-flow-position="3"] img{aspect-ratio:4/5}
${c}[data-flow=collection]{padding:48px!important;background:var(--signature-ink);color:var(--signature-paper);grid-template-columns:minmax(0,1.25fr) minmax(0,.7fr)}
${c}[data-flow=collection]>.section-gallery{padding:0;background:transparent}
${contact}{gap:64px;padding:64px 0;border-top:1px solid var(--signature-ink)}
${contact} h2{font-family:Georgia,serif;font-size:clamp(52px,6vw,88px);letter-spacing:-.05em}
${f}{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:32px;padding:40px 0 28px}
${f} .ending-index{grid-column:1;grid-row:1;margin:0;gap:28px;flex-wrap:wrap}
${f} .ending-wordmark{grid-column:2;grid-row:1;margin:0;text-align:right;font-family:Georgia,serif;font-weight:400}
${f} .ending-colophon{grid-column:1/-1}
`;
  const cinema=`
${s} .nav[data-header]{margin:0 0 16px;padding:22px 0;border:0;border-bottom:1px solid var(--signature-line);background:${p.branding||p.logo?b.headerBackground:b.background};color:${p.branding||p.logo?b.headerText:b.text}}
${s} .hero-layout{padding:64px 0;gap:64px}
${s} .hero-copy h1{font-size:clamp(48px,6vw,90px);font-weight:400;letter-spacing:-.04em;max-width:15ch}
${s} .hero-layout:has(>.visual>.hero-image):not(:has(.hero-copy[data-density=long])):not([data-profile=person]){min-height:620px;min-height:min(78svh,840px);padding:clamp(40px,6vw,88px);align-items:end;color:#fffaf1}
${s} .hero-copy>p{font-size:16px;max-width:44ch;line-height:1.8}
${s} .hero-layout:has(>.visual>.hero-image):not(:has(.hero-copy[data-density=long])):not([data-profile=person])::after{background:linear-gradient(0deg,#000b,transparent 85%),linear-gradient(90deg,#0008,transparent 90%)}
${s} .eyebrow{font-size:10px;letter-spacing:.18em}
${s} .button{border-radius:0;background:transparent;color:inherit;border:1px solid currentColor;padding:15px 24px;font-size:11px;letter-spacing:.08em}
${s} .cards{row-gap:clamp(64px,8vw,120px)}
${c}[data-flow=chapter]{padding:0!important;border:0}
${c}[data-flow=chapter] .card-meta>div{justify-content:start;text-align:left}
${c}[data-flow=chapter] :is(h2,h3){font-size:clamp(42px,5vw,72px)}
${c}[data-flow=feature]>img{aspect-ratio:2.3/1;object-fit:cover;max-height:660px}
${c}[data-flow=feature] .card-meta>div{grid-template-columns:minmax(0,1fr) minmax(0,.9fr)}
${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,.85fr) minmax(0,1fr);gap:clamp(40px,9vw,144px)}
${c}[data-flow=feature][data-flow-side="1"]>img{aspect-ratio:4/5}
${c}[data-flow=showcase]{grid-column:span 6;text-align:left;gap:24px}
${c}[data-flow=showcase] img{aspect-ratio:4/3}
${c}[data-flow=showcase][data-flow-position="1"] img,${c}[data-flow=showcase][data-flow-position="3"] img{aspect-ratio:4/5}
${c}[data-flow=showcase] :is(h2,h3),${c}[data-flow=showcase] p{margin-inline:0}
${contact}{padding:56px 0;border-top:1px solid var(--signature-line)}
${contact} h2{font-family:Georgia,serif;font-size:clamp(48px,5vw,76px)}
${f}{padding:36px 0 32px}
${f} .ending-index{margin-bottom:48px}
${f} .ending-wordmark{font-family:Georgia,serif;font-weight:400;text-align:center;max-width:none;padding:12px 0 28px}
`;
  const pop=`
${s} .shell{max-width:1640px;padding-inline:clamp(18px,3vw,48px)}
${s} .nav[data-header]{margin:0;padding:22px 8px;background:${b.headerBackground};color:${b.headerText};border-radius:0}
${s} .hero-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px;padding:0;margin:8px 0 32px;align-items:stretch}
${s} .hero-copy{padding:clamp(32px,4vw,64px)!important;border-radius:24px;background:var(--accent);color:var(--signature-accent-ink);justify-content:center;align-items:start}
${s} .hero-copy h1{font-size:clamp(52px,6.8vw,104px);font-weight:900;letter-spacing:-.06em;line-height:.98;max-width:14ch}
${s} .hero-copy>p{font-size:16px;max-width:36ch;margin:28px 0}
${s} .visual{border-radius:24px 120px 24px 24px;overflow:hidden;background:var(--signature-soft)}
${s} .hero-image{height:100%;min-height:480px;max-height:none;border-radius:0;aspect-ratio:4/5;object-fit:cover}
${s} .button{border-radius:999px;padding:17px 24px;background:var(--signature-ink);color:var(--signature-paper);min-height:52px}
${s} .cards{gap:20px;padding:48px 0}
${c}:not([data-flow=chapter]):not([data-flow=logos]){background:transparent;border:0;padding:0!important;border-radius:0;color:inherit}
${c} :is(h2,h3){font-family:'Arial Rounded MT Bold','Trebuchet MS',sans-serif;font-weight:800;letter-spacing:-.04em}
${c}[data-flow=chapter]{padding:36px 8px 16px!important}
${c}[data-flow=chapter] :is(h2,h3){font-size:clamp(42px,5.5vw,80px);letter-spacing:-.055em}
${c}[data-flow=feature][data-flow-side]{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;align-items:stretch;border-radius:24px;overflow:hidden;background:var(--signature-soft);padding:0!important}
${c}[data-flow=feature]>img{height:100%;max-height:none;min-height:380px;aspect-ratio:1/1;object-fit:cover;border-radius:0}
${c}[data-flow=feature]>.card-meta{padding:clamp(28px,4vw,64px);align-self:center}
${c}[data-flow=feature]>.section-gallery{padding:24px}
${c}[data-flow=feature][data-flow-side="1"]{background:var(--accent);color:var(--signature-accent-ink)}
${c}[data-flow=showcase][data-flow-position]{grid-column:span 6;gap:20px;padding:24px!important;border-radius:24px;background:var(--signature-soft)}
${c}[data-flow=showcase][data-flow-position="1"],${c}[data-flow=showcase][data-flow-position="3"]{background:var(--accent);color:var(--signature-accent-ink)}
${c}[data-flow=showcase] img{border-radius:16px;aspect-ratio:5/4}
${c}[data-flow=showcase] :is(h2,h3){font-size:clamp(28px,3.4vw,48px)}
${c}[data-flow=summary]{padding:32px 24px!important;border-block:1px solid var(--signature-line)}
${c}[data-flow=index]{grid-column:span 4;padding:28px!important;border-radius:24px;background:var(--signature-ink);color:var(--signature-paper)}
${c}[data-flow=collection]{padding:32px!important;border-radius:24px;background:var(--signature-ink);color:var(--signature-paper)}
${c}[data-flow=collection]>.section-gallery{padding:0;background:transparent}
${contact},${f}{background:var(--signature-ink);color:var(--signature-paper);--ending-paper:var(--signature-ink);--ending-ink:var(--signature-paper);--ending-line:color-mix(in srgb,var(--signature-paper) 22%,transparent)}
${contact}{padding:48px 40px;border-radius:24px 24px 0 0;gap:48px;border:0}
${contact} h2{font-size:clamp(48px,6vw,88px);font-weight:800}
${f}{padding:32px 40px;border-radius:0 0 24px 24px;margin-bottom:24px}
${f} .ending-index{margin-bottom:48px}
${f} .ending-wordmark{font-weight:800;font-size:clamp(48px,8vw,120px)}
`;
  const gallery=`
${s} .nav[data-header]{padding:20px 0;margin:0;border:0;background:${b.headerBackground};color:${b.headerText}}
${s} .nav[data-header] .nav-links{font-size:11px;letter-spacing:.04em}
${s} .nav[data-header] .nav-action{border:0;border-bottom:1px solid currentColor;padding:8px 0}
${s} .hero-layout{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr);gap:clamp(40px,7vw,112px);align-items:center;padding:32px 0 88px}
${s} .visual{order:-1}
${s} .hero-image{height:auto;aspect-ratio:5/6;max-height:740px;border-radius:0;object-fit:cover}
${s} .hero-copy h1{font:400 clamp(44px,4.5vw,72px)/1.06 Georgia,serif;letter-spacing:-.055em;max-width:14ch}
${s} .hero-copy>p{font-size:15px;line-height:1.8;margin:28px 0;max-width:36ch}
${s} .eyebrow{font-size:9px;letter-spacing:.16em;justify-content:start;margin-bottom:24px}
${s} .button{background:transparent;color:inherit;padding:12px 0;border:0;border-bottom:1px solid currentColor;border-radius:0;gap:40px;font-size:12px}
${s} .cards{column-gap:40px;row-gap:88px;border-top:1px solid var(--signature-line)}
${c} :is(h2,h3){font-family:Georgia,serif;font-weight:400;letter-spacing:-.035em}
${c}[data-flow=chapter]{border:0;padding:0!important}
${c}[data-flow=chapter] :is(h2,h3){font-size:clamp(36px,4vw,60px)}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr);gap:clamp(32px,7vw,112px);align-items:center}
${c}[data-flow=feature]>img{aspect-ratio:5/4;object-fit:cover;max-height:660px}
${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr)}
${c}[data-flow=feature][data-flow-side="1"]>img{aspect-ratio:5/6}
${c}[data-flow=showcase]{grid-column:span 4;gap:24px}
${c}[data-flow=showcase] img{aspect-ratio:4/5;object-fit:cover}
${c}[data-flow=showcase][data-flow-position="1"],${c}[data-flow=showcase][data-flow-position="4"]{padding-top:64px!important}
${c}[data-flow=showcase] :is(h2,h3){font-size:clamp(24px,2.2vw,32px)}
${c}[data-flow=collection]{grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr);gap:64px}
${c}[data-flow=collection]>.section-gallery{padding:0;background:transparent}
${contact}{border-top:1px solid var(--signature-line);padding:64px 0;gap:64px}
${contact} h2{font-family:Georgia,serif;font-weight:400;letter-spacing:-.05em;font-size:clamp(40px,5vw,72px)}
${f}{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px;padding:32px 0}
${f} .ending-index{grid-column:1;grid-row:1;display:grid;grid-template-columns:1fr 1fr;margin:0;gap:32px}
${f} .ending-wordmark{grid-column:2;grid-row:1;text-align:right;margin:0;font:400 clamp(36px,4vw,64px)/1.1 Georgia,serif;letter-spacing:-.04em}
${f} .ending-colophon{grid-column:1/-1}
`;
  const poster=`
${s} .shell{max-width:1600px;padding-inline:clamp(20px,4vw,64px)}
${s} .nav[data-header]{padding:18px 0;margin:0;border-bottom:2px solid var(--signature-ink);background:${b.headerBackground};color:${b.headerText}}
${s} .nav[data-header] .nav-links{font:500 11px/1.3 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.04em}
${s} .nav[data-header] .nav-action{background:var(--signature-ink);color:var(--signature-paper);border:0;padding:12px 18px}
${s} .hero-layout{display:grid;grid-template-columns:1fr;gap:40px;padding:48px 0 0}
${s} .hero-copy{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr);gap:24px 48px;align-items:start}
${s} .eyebrow{grid-column:1/-1;justify-content:start;margin:0;font:500 10px/1.5 ui-monospace,monospace;letter-spacing:.08em}
${s} .hero-copy h1{grid-column:1/-1;max-width:none;font-size:clamp(56px,8.8vw,132px);font-weight:850;line-height:.98;letter-spacing:-.04em;text-transform:uppercase}
${s} .hero-copy>p{grid-column:1;margin:0;max-width:54ch;font-size:16px;line-height:1.7}
${s} .hero-copy>.button{grid-column:2;justify-self:end;margin:0}
${s} .hero-image{height:auto;aspect-ratio:2.8/1;max-height:580px;border-radius:0;object-fit:cover}
${s} .button{border-radius:0;border:1px solid currentColor;background:transparent;color:inherit;padding:16px 20px;gap:32px;font-size:12px}
${s} .cards{column-gap:24px;row-gap:64px}
${c} :is(h2,h3){font-family:inherit;font-weight:750;letter-spacing:-.045em}
${c}[data-flow=chapter]{border-top:2px solid var(--signature-ink);padding:28px 0 0!important}
${c}[data-flow=chapter] :is(h2,h3){font-size:clamp(44px,6vw,88px);font-weight:750;letter-spacing:-.06em;text-transform:uppercase}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1.4fr) minmax(0,.6fr);gap:32px;align-items:start;border-block:1px solid var(--signature-line);padding:32px 0!important}
${c}[data-flow=feature]>img{aspect-ratio:3/2;object-fit:cover;max-height:660px}
${c}[data-flow=feature][data-flow-side="1"]>.card-meta{order:0}
${c}[data-flow=feature] :is(h2,h3){font-size:clamp(30px,3vw,44px)}
${c}[data-flow=showcase]{grid-column:span 6;gap:24px;border-top:2px solid var(--signature-ink);padding-top:24px!important}
${c}[data-flow=showcase] img{aspect-ratio:3/2}
${c}[data-flow=collection]{background:var(--signature-ink);color:var(--signature-paper);padding:40px!important;gap:40px}
${c}[data-flow=collection]>.section-gallery{background:transparent;padding:0}
${c}[data-flow=index]{border-top:2px solid var(--signature-ink);padding:24px 0!important}
${contact},${f}{background:var(--accent);color:var(--signature-accent-ink);--ending-paper:var(--accent);--ending-ink:var(--signature-accent-ink);--ending-line:color-mix(in srgb,var(--signature-accent-ink) 25%,transparent)}
${contact}{border:0;padding:48px 40px;margin:32px 0 0;gap:48px}
${contact} h2{font-family:inherit;font-weight:750;font-size:clamp(48px,6vw,88px);letter-spacing:-.065em}
${f}{padding:32px 40px;margin-bottom:24px}
${f} .ending-index{margin-bottom:48px;gap:40px}
${f} .ending-wordmark{font-weight:750;letter-spacing:-.065em;font-size:clamp(48px,7vw,104px)}
`;
  const responsive=`
@media(max-width:900px){
${s} .nav[data-header]{padding:16px 0;min-height:76px;gap:20px}
${s} .hero-layout{gap:32px}
${s} .hero-copy{column-gap:28px}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"]{column-gap:32px}
${f} .ending-index{gap:20px}
}
@media(max-width:760px){
${s} .shell{padding-inline:20px}
${s} .hero-layout{display:flex;flex-direction:column;align-items:stretch;padding:36px 0 48px;gap:32px;margin:0;min-height:0}
${s} .hero-copy{display:block;width:100%;padding:0!important}
${s} .hero-copy h1,${s} .hero-copy h1[data-length]{font-size:clamp(38px,10.5vw,62px);max-width:100%;line-height:1.07}
${s} .hero-copy>p{font-size:15px;margin:24px 0;max-width:none}
${s} .eyebrow{margin-bottom:22px;font-size:10px}
${s} .hero-copy .profile-name{font-size:clamp(40px,11vw,66px)}
${s} .hero-layout[data-profile=person] h1{font-size:28px;line-height:1.2}
${s} .hero-layout[data-profile=person]{display:flex;grid-template-columns:none;gap:32px;padding:36px 0 48px}
${s} .visual{width:100%;order:0}
${s} .hero-image{height:auto;min-height:0;max-height:520px;aspect-ratio:${id==='story'?'4/5':id==='studio'||id==='editorial'?'4/3':'4/5'}}
${s} .hero-layout[data-hero=text]{padding-bottom:32px}
${s} .cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:${id==='pop'?'16px':'48px 20px'};padding:48px 0}
${c}[data-flow],${c}[data-flow][data-flow-position],${c}[data-flow][data-flow-side]{grid-column:1/-1;display:flex;flex-direction:column;gap:24px;padding:0!important;border-radius:0;min-width:0;margin:0!important}
${c} .card-meta>div,${c}[data-flow] .card-meta>div{display:block}
${c}[data-flow] :is(h2,h3){font-size:30px;line-height:1.18;max-width:none}
${c}[data-flow=chapter] :is(h2,h3){font-size:38px}
${c}[data-flow]>.card-meta{order:0!important;padding:0}
${c}[data-flow=feature]>img{height:auto;min-height:0;max-height:520px;aspect-ratio:4/3;object-fit:cover}
${c}[data-flow=feature]>.section-gallery{padding:0}
${c}[data-flow=showcase] img{aspect-ratio:${id==='editorial'?'4/5':'4/3'}}
${c}[data-flow=collection][data-flow-position]{padding:24px!important}
${c}[data-flow=collection]>.section-gallery{padding:0}
${c}[data-flow=logos][data-flow-position]{padding:28px 0!important}
${c}[data-flow=summary][data-flow-position],${c}[data-flow=index][data-flow-position]{padding:24px 0!important}
${c}.section-testimonial{padding:28px!important}
${c}.section-testimonial blockquote{font-size:25px}
${s} .benefits{grid-template-columns:1fr;gap:24px;padding:28px 0}
${s} .about{padding:48px 0;gap:24px}
${contact}{grid-template-columns:1fr;padding:40px 0;gap:32px;margin-top:20px}
${contact} h2{font-size:48px}
${contact}[data-contact=empty],${contact}[data-contact=website]{padding:28px 0;gap:20px}
${contact}[data-contact=empty] h2,${contact}[data-contact=website] h2{font-size:24px}
${f}{display:block;padding:28px 0}
${f} .ending-index{margin-bottom:32px;display:grid}
${f} .ending-wordmark,${f} .ending-wordmark[data-name-length]{font-size:clamp(32px,10vw,52px);text-align:left;margin:0 0 28px}
${f} .ending-colophon{padding-top:20px}
${id==='story'?`${contact}{padding:32px 24px;background:var(--signature-soft)}`:''}
${id==='studio'?`${c}[data-flow]{padding-top:28px!important}`:''}
${id==='cinema'?`${s} .hero-layout:has(>.visual>.hero-image):not(:has(.hero-copy[data-density=long])):not([data-profile=person]){min-height:600px;padding:36px 24px;justify-content:end}${s} .hero-layout:has(>.visual>.hero-image):not(:has(.hero-copy[data-density=long])):not([data-profile=person]) .hero-image{height:100%;max-height:none;aspect-ratio:auto}`:''}
${id==='pop'?`${s} .hero-layout{padding:12px 0 32px;gap:12px}${s} .hero-copy{padding:32px 24px!important;border-radius:24px}${s} .visual{border-radius:24px 80px 24px 24px}${s} .cards{gap:16px}${c}[data-flow=feature][data-flow-side],${c}[data-flow=showcase][data-flow-position]{border-radius:24px;overflow:hidden;background:var(--signature-soft);color:var(--signature-ink)}${c}[data-flow=feature]>.card-meta{padding:24px}${c}[data-flow=showcase][data-flow-position],${c}[data-flow=index]{padding:24px!important;border-radius:24px}${contact},${f}{padding:32px 24px}${contact} h2{font-size:48px}`:''}
${id==='gallery'?`${s} .hero-layout:not([data-profile=person]) .visual{order:-1}${s} .hero-image{aspect-ratio:5/4}${s} .cards{border-top:1px solid var(--signature-line)}`:''}
${id==='poster'?`${s} .hero-copy h1{font-weight:850;line-height:.98}${s} .hero-layout{padding-bottom:0}${s} .hero-image{aspect-ratio:4/3}${c}[data-flow=feature][data-flow-side],${c}[data-flow=showcase][data-flow-position]{padding-top:24px!important}${contact},${f}{padding:32px 24px}`:''}
}
@media(hover:hover) and (pointer:fine){${s} .button:hover{opacity:.8}${c}[data-flow=showcase] a:hover{text-decoration:underline;text-underline-offset:6px}}
@media(prefers-reduced-motion:reduce){${s} .button:active{transform:none}}
@media print{${s} .hero-layout{min-height:0!important;padding:32px 0!important}${c}[data-flow=showcase][data-flow-position]{padding-top:0!important}${s} .hero-image{max-height:320px}${contact},${f}{break-inside:avoid}}
`;
  return common+({story,studio,editorial,cinema,pop,gallery,poster}[id])+responsive;
}
