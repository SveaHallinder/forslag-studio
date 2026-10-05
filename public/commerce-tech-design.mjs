import {brandPalette} from './branding.mjs';
import {normalizeTypography} from './typography.mjs';

// Presentation only: original product copy, prices, image framing and routes stay intact.
export function commerceTechDesignCSS(p) {
  const id=p.templateId;if(!['retail','precision'].includes(id))return '';
  const b=brandPalette(p.branding),t=normalizeTypography(p.typography);
  const quote=value=>JSON.stringify(value).replace(/</g,'\\3c ').replace(/>/g,'\\3e ');
  const heading=t?.heading?quote(t.heading):id==='retail'?"Georgia,'Times New Roman',serif":"'Avenir Next','Segoe UI',sans-serif";
  const s=`html body[data-template="${id}"][data-imported][data-page-design]`,c=`${s} .cards>.card[data-flow]`,f=`${s} .footer.site-footer`,end=`${s} .contact.site-contact`;
  const common=`
/* ${id}: the complete page uses one composition, from masthead to colophon. */
${s}{--industry-paper:${b.background};--industry-ink:${b.text};--industry-surface:${b.surface};--industry-surface-ink:${b.surfaceText};--industry-soft:color-mix(in srgb,var(--industry-ink) 4%,var(--industry-paper));--industry-rule:color-mix(in srgb,var(--industry-ink) 18%,transparent);background:var(--industry-paper);color:var(--industry-ink)}
${s} .shell{max-width:1440px;padding-inline:clamp(20px,4.5vw,72px)}
${s} .hero-layout,${s} .hero-copy,${s} .visual{min-width:0;background:transparent;color:inherit}
${s} .hero-layout{margin:0;min-height:0}
${s} .hero-copy{margin:0;padding:0!important;text-align:left;max-width:none}
${s} :is(.hero-copy h1,.cards>.card[data-flow] h2,.cards>.card[data-flow] h3,.contact.site-contact h2,.footer.site-footer .ending-wordmark){font-family:${heading}}
${s} .hero-copy>p{color:inherit;font-size:16px;line-height:1.75;max-width:52ch;margin:24px 0 30px}
${s} .eyebrow{justify-content:flex-start;color:inherit;font-size:11px;letter-spacing:.14em;margin-bottom:24px}
${s} .hero-copy h1{line-height:1.04;letter-spacing:-.055em;font-weight:400;margin:0;max-width:16ch}
${s} .hero-copy h1[data-length="long"]{font-size:clamp(40px,4.6vw,66px)}
${s} .hero-copy h1[data-length="extended"]{font-size:clamp(34px,3.9vw,56px)}
${s} .hero-image{display:block;width:100%;height:auto;min-height:0;max-height:760px;object-fit:contain;background:transparent;border-radius:0}
${s} .visual .section-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:18px}
${s} .visual .section-gallery[data-image-count="1"]{grid-template-columns:minmax(0,1fr)}
${s} .visual .section-gallery img{height:auto;max-height:600px;object-fit:contain;border-radius:0;background:transparent}
${s} .visual figcaption{font-size:12px;line-height:1.5;margin-top:12px;color:inherit}
${s} .image-label{display:none}
${s} .hero-layout[data-hero="text"]{display:block}
${s} .hero-layout[data-hero="text"] .hero-copy{max-width:1000px;margin-inline:0}
${s} .hero-layout[data-hero="text"] .no-image{display:none}
${s} .button{min-height:48px;max-width:100%;white-space:normal;line-height:1.35;text-align:left;background:var(--accent);color:var(--accent-ink);border:1px solid var(--accent);padding:14px 22px;gap:22px;box-shadow:none}
${s} .button span{flex:none}
${s} #erbjudande{padding:0}
${s} .cards{grid-template-columns:repeat(12,minmax(0,1fr));align-items:start;margin:0;column-gap:32px;padding:0}
${c}{min-width:0;max-width:none;background:transparent;color:inherit;border-radius:0;box-shadow:none}
${c} .card-meta{min-width:0;max-width:none}
${c} :is(h2,h3){color:inherit;font-weight:400;line-height:1.15;letter-spacing:-.035em;margin-bottom:20px}
${c} :is(p,blockquote){color:inherit;font-size:16px;line-height:1.75;max-width:60ch}
${c} img{max-height:640px;object-fit:contain;border-radius:0;background:transparent;margin:0;padding:0}
${c} .section-gallery{gap:20px;background:transparent;padding:0}
${c} .section-gallery img{height:auto;max-height:520px;object-fit:contain}
${c}[data-flow="logos"]{padding:28px 0!important;background:transparent;color:inherit;border-block:1px solid var(--industry-rule)}
${c}[data-flow="logos"] img{max-height:56px;height:56px;object-fit:contain}
${c} .flow-index{font-size:11px;letter-spacing:.08em;opacity:.65}
${c}.content-faq{padding:32px 0!important;border-top:1px solid var(--industry-rule);background:transparent;color:inherit}
${c} .faq-item{padding-block:20px;border-color:var(--industry-rule)}
${c} .faq-item summary{font-size:19px;line-height:1.5}
${c} .faq-item p{font-size:15px}
${s} .about{padding-block:64px;margin-top:64px;border-color:var(--industry-rule)}
${end}{border-color:var(--industry-rule);margin-top:88px}
${f}{border-color:var(--industry-rule)}
${f} .ending-wordmark{font-weight:400;letter-spacing:-.05em;line-height:1.03}
`;
  const retail=`
/* Retail: an editorial lead, product shelves, then a restrained brand signature. */
${s} .nav[data-header]{min-height:80px;margin:0;padding:18px 0;border:0;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:0}
${s} .nav[data-header] .nav-links{font-size:12px;gap:28px;letter-spacing:.025em}
${s} .nav[data-header] .nav-links .nav-action{border:0;border-bottom:1px solid currentColor;border-radius:0;padding:8px 0;min-height:44px}
${s} .nav[data-header] .mobile-links{border-radius:0}
${s} .hero-layout{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);align-items:center;gap:clamp(32px,5vw,80px);padding:56px 0 88px}
${s} .hero-copy h1{font-size:clamp(48px,6.2vw,88px);max-width:13ch}
${s} .hero-copy .button{background:transparent;color:inherit;border:0;border-bottom:1px solid currentColor;border-radius:0;padding:12px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
${s} .hero-image{aspect-ratio:4/5;max-height:720px}
${s} .visual .section-gallery>figure:first-child{grid-column:1/-1}
${s} .visual .section-gallery[data-image-count="2"]{grid-template-columns:1.35fr .65fr;align-items:end}
${s} .visual .section-gallery[data-image-count="2"]>figure:first-child{grid-column:auto}
${s} .visual .section-gallery[data-image-count="2"]>figure:last-child{padding-bottom:32px}
${s} .cards{row-gap:76px}
${c}[data-flow="chapter"]{border-top:1px solid var(--industry-rule);padding-top:28px!important;margin-bottom:-40px!important}
${c}[data-flow="chapter"] .card-meta>div{justify-content:space-between;gap:24px;align-items:start}
${c}[data-flow="chapter"] h2{font-size:clamp(36px,4.4vw,62px);font-style:normal;max-width:24ch}
${c}[data-flow="chapter"] .flow-index{padding-top:10px;order:2}
${c}[data-flow="introduction"] .card-meta>div{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:48px}
${c}[data-flow="introduction"] h2{font-size:clamp(32px,4vw,54px)}
${c}[data-flow="introduction"] p{font-size:19px;line-height:1.7}
${c}[data-flow="feature"]{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:clamp(32px,6vw,88px);align-items:center;padding:0!important}
${c}[data-flow="feature"][data-flow-side="1"]{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);padding:0!important;background:transparent;color:inherit}
${c}[data-flow="feature"][data-flow-side="1"]>.card-meta{order:-1}
${c}[data-flow="feature"] h2{font-size:clamp(34px,4.2vw,62px);max-width:18ch}
${c}[data-flow="feature"]>img{height:auto;aspect-ratio:5/4;object-fit:contain}
${c}[data-flow="collection"]{grid-template-columns:minmax(0,1.5fr) minmax(0,.8fr);gap:56px;align-items:center;padding:0!important}
${c}[data-flow="collection"]>.section-gallery{padding:0;background:transparent;gap:20px}
${c}[data-flow="collection"] h2{font-size:clamp(30px,3.5vw,48px)}
${c}[data-flow="showcase"][data-flow-position],${c}[data-flow="publication"]{grid-column:span 4;display:flex;flex-direction:column;gap:20px;padding:0!important;align-self:start}
${c}[data-flow="showcase"][data-flow-position] img,${c}[data-flow="publication"] img{height:auto;max-height:none;aspect-ratio:4/5;object-fit:contain;background:var(--industry-soft);padding:18px}
${c}[data-flow="showcase"] h2,${c}[data-flow="publication"] h2{font-size:clamp(23px,2.2vw,31px);margin-bottom:12px;letter-spacing:-.025em}
${c}[data-flow="showcase"] p,${c}[data-flow="publication"] p{font-size:14px;line-height:1.7}
${c}[data-flow="text"]{padding-top:32px!important;border-top:1px solid var(--industry-rule)}
${c}[data-flow="text"] .card-meta>div{grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:56px}
${c}[data-flow="summary"],${c}[data-flow="index"]{grid-column:span 4;padding-top:24px!important;border-top:1px solid var(--industry-rule)}
${c}[data-flow="summary"] h2,${c}[data-flow="index"] h2{font-size:26px}
${c}.section-testimonial{background:var(--industry-soft);color:inherit;padding:48px!important}
${c}.section-testimonial blockquote{font-family:${heading};font-size:clamp(26px,3vw,40px);line-height:1.4}
${end}{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:80px;padding:52px 0;background:var(--industry-paper);color:var(--industry-ink)}
${end} h2{font-size:clamp(44px,6vw,84px);font-style:italic}
${end} .ending-action{border-radius:0;border:0;min-width:56px;min-height:56px;padding:10px}
${f}{padding:36px 0 24px;background:var(--industry-paper);color:var(--industry-ink)}
${f} .ending-index{margin-bottom:52px}
${f} .ending-wordmark{font-size:clamp(52px,9.5vw,144px)}
`;
  const precision=`
/* Precision: a centered product stage and an ordered, compact information system. */
${s} .shell{max-width:1344px}
${s} .nav[data-header]{margin:16px 0 0;padding:14px 20px;min-height:72px;border-radius:10px;border:1px solid color-mix(in srgb,currentColor 15%,transparent)}
${s} .nav[data-header] .brand{font-size:23px;letter-spacing:-.035em}
${s} .nav[data-header] .nav-links{font-size:12px;gap:24px}
${s} .nav[data-header] .nav-links .nav-action{border-radius:6px;min-height:44px;padding:10px 16px}
${s} .hero-layout{display:flex;flex-direction:column;align-items:center;gap:40px;padding:68px 0 64px}
${s} .hero-copy{max-width:900px;text-align:center}
${s} .hero-copy h1{font-size:clamp(44px,5.7vw,80px);max-width:19ch;font-weight:600;line-height:1.06;margin-inline:auto}
${s} .hero-copy>p{max-width:58ch;margin-inline:auto;font-size:17px}
${s} .hero-copy[data-density="long"]>p{text-align:left;max-width:70ch}
${s} .eyebrow{justify-content:center;letter-spacing:.08em;margin-bottom:22px}
${s} .eyebrow::before{width:6px;height:6px;border-radius:50%;background:var(--accent)}
${s} .button{border-radius:6px;font-size:14px}
${s} .visual{width:min(100%,1080px);border:1px solid var(--industry-rule);border-radius:14px;background:var(--industry-soft);padding:20px;overflow:visible;box-shadow:0 18px 60px color-mix(in srgb,var(--industry-ink) 5%,transparent)}
${s} .hero-image{height:auto;max-height:550px;aspect-ratio:16/9;object-fit:contain;border-radius:6px}
${s} .visual .section-gallery img{border-radius:6px;max-height:480px}
${s} .hero-layout[data-hero="text"] .hero-copy{max-width:900px;margin-inline:auto}
${s} .cards{gap:28px;padding-top:12px}
${c} :is(h2,h3){font-weight:600;letter-spacing:-.035em}
${c}[data-flow="chapter"]{border-top:1px solid var(--industry-rule);padding:40px 0 8px!important;margin:24px 0 0!important}
${c}[data-flow="chapter"] .card-meta>div{align-items:baseline;justify-content:space-between}
${c}[data-flow="chapter"] h2{font-size:clamp(34px,4.2vw,54px);max-width:26ch}
${c}[data-flow="chapter"] .flow-index{order:2;margin:0}
${c}[data-flow="introduction"]{padding:36px 0!important}
${c}[data-flow="introduction"] .card-meta>div{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:48px}
${c}[data-flow="introduction"] h2{font-size:clamp(32px,3.6vw,48px)}
${c}[data-flow="introduction"] p{font-size:18px;line-height:1.7}
${c}[data-flow="feature"],${c}[data-flow="collection"]{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:48px;border:1px solid var(--industry-rule);border-radius:12px;padding:40px!important;background:var(--industry-soft);color:var(--industry-ink)}
${c}[data-flow="feature"][data-flow-side="1"]{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);background:var(--industry-ink);color:var(--industry-paper);border-color:transparent}
${c}[data-flow="feature"][data-flow-side="1"]>.card-meta{order:-1}
${c}[data-flow="feature"] h2,${c}[data-flow="collection"] h2{font-size:clamp(28px,3.3vw,44px);max-width:22ch}
${c}[data-flow="feature"]>img{height:auto;max-height:500px;aspect-ratio:4/3;object-fit:contain;border-radius:6px}
${c}[data-flow="collection"] .section-gallery{background:transparent;padding:0}
${c}[data-flow="showcase"][data-flow-position],${c}[data-flow="publication"]{grid-column:span 6;padding:24px!important;gap:24px;background:var(--industry-soft);color:var(--industry-ink);border:1px solid var(--industry-rule);border-radius:12px}
${c}[data-flow="showcase"] img,${c}[data-flow="publication"] img{max-height:420px;height:auto;aspect-ratio:4/3;object-fit:contain;background:transparent;padding:0;border-radius:6px}
${c}[data-flow="showcase"]>.card-meta{padding:0}
${c}[data-flow="showcase"] h2,${c}[data-flow="publication"] h2{font-size:28px}
${c}[data-flow="text"],${c}[data-flow="summary"],${c}[data-flow="index"]{grid-column:1/-1;border:0;border-top:1px solid var(--industry-rule);border-radius:0;padding:28px 0!important;margin:0!important;background:transparent;color:inherit}
${c}[data-flow="text"] .card-meta>div,${c}[data-flow="summary"] .card-meta>div{display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:40px}
${c}[data-flow="text"] h2,${c}[data-flow="summary"] h2{font-size:27px;max-width:25ch;margin:0}
${c}[data-flow="index"] h2{font-size:24px;margin:0;max-width:none}
${c}[data-flow="index"] a{display:flex;justify-content:space-between;gap:24px;align-items:center}
${c}[data-flow="index"] .flow-index{margin-bottom:12px}
${c}.section-testimonial{border-radius:12px;background:var(--industry-soft);padding:48px!important}
${c}.section-testimonial blockquote{font-size:clamp(25px,3vw,38px);line-height:1.45}
${end}{background:var(--industry-ink);color:var(--industry-paper);padding:44px;border:0;border-radius:12px 12px 0 0;margin-top:72px;gap:60px}
${end} h2{font-size:clamp(40px,4.8vw,68px);font-weight:600;letter-spacing:-.045em}
${end} .ending-invitation{align-items:center}
${end} .ending-action{border-radius:6px;min-height:56px;min-width:56px;padding:12px;border-color:color-mix(in srgb,currentColor 30%,transparent)}
${end} .ending-action svg{height:28px;width:28px}
${end} .ending-detail{border-color:color-mix(in srgb,currentColor 24%,transparent)}
${end} .ending-detail>a{font-size:22px}
${f}{padding:32px 44px 24px;background:var(--industry-ink);color:var(--industry-paper);border-color:color-mix(in srgb,var(--industry-paper) 20%,transparent);border-radius:0 0 12px 12px;margin-bottom:24px}
${f} .ending-index{margin-bottom:36px;gap:36px}
${f} .ending-wordmark{font-size:clamp(36px,5.7vw,80px);font-weight:600;letter-spacing:-.04em;margin-bottom:32px}
${f} .ending-colophon{border-color:color-mix(in srgb,currentColor 22%,transparent)}
`;
  const responsive=`
@media(max-width:1000px){
 ${s} .hero-layout{gap:32px}
 ${c}[data-flow="feature"],${c}[data-flow="feature"][data-flow-side="1"],${c}[data-flow="collection"]{gap:32px}
 ${c}[data-flow="showcase"][data-flow-position],${c}[data-flow="publication"]{grid-column:span 6}
 ${end}{gap:36px}
}
@media(max-width:760px){
 ${s} .shell{padding-inline:20px}
 ${s} .nav[data-header]{padding:${id==='precision'?'12px 14px':'14px 0'};min-height:72px;gap:16px;margin-top:${id==='precision'?'12px':'0'}}
 ${s} .nav[data-header] .brand-mark img{max-height:38px}
 ${s} .hero-layout,${s} .hero-layout[data-profile="person"]{display:flex;flex-direction:column;align-items:stretch;gap:30px;padding:38px 0 48px}
 ${s} .hero-copy,${s} .hero-layout[data-profile="person"] .hero-copy{width:100%;max-width:none;margin:0;padding:0!important}
 ${s} .hero-copy h1,${s} .hero-copy h1[data-length]{font-size:clamp(38px,10vw,58px);line-height:1.08;max-width:19ch}
 ${s} .hero-copy h1[data-length="extended"]{font-size:clamp(32px,8vw,46px)}
 ${s} .hero-copy>p{font-size:15px;line-height:1.75;margin-top:22px;margin-bottom:26px}
 ${s} .eyebrow{font-size:10px;line-height:1.5;margin-bottom:18px;letter-spacing:.08em}
 ${s} .visual,${s} .hero-layout[data-profile="person"] .visual{width:100%;order:0;${id==='precision'?'padding:10px;border-radius:10px;':''}}
 ${s} .hero-image{max-height:520px;aspect-ratio:${id==='retail'?'4/5':'4/3'}}
 ${s} .visual .section-gallery{gap:12px}
 ${s} .visual .section-gallery[data-image-count="2"]>figure:last-child{padding-bottom:16px}
 ${s} .cards{grid-template-columns:minmax(0,1fr);gap:${id==='retail'?'44px':'24px'};padding:0}
 ${c}[data-flow],${c}[data-flow]:nth-child(even),${c}[data-flow="showcase"][data-flow-position]{grid-column:1/-1;display:flex;flex-direction:column;align-items:stretch;gap:22px;padding:0!important;margin:0!important}
 ${c}[data-flow] .card-meta>div,${c}[data-flow].content-faq .card-meta>div{display:block}
 ${c}[data-flow="chapter"]{padding-top:24px!important}
 ${c}[data-flow="chapter"] .card-meta>div{display:flex;gap:20px;align-items:baseline;justify-content:space-between}
 ${c}[data-flow="chapter"] h2{font-size:36px;margin:0}
 ${c}[data-flow="chapter"] .flow-index{flex:none;order:2;padding:0;margin:0}
 ${c}[data-flow] :is(h2,h3){font-size:28px;max-width:none;margin-bottom:16px}
 ${c}[data-flow] :is(p,blockquote){font-size:15px;line-height:1.75;max-width:none}
 ${c}[data-flow="introduction"] p{font-size:18px}
 ${c}[data-flow="feature"]>.card-meta,${c}[data-flow="feature"][data-flow-side="1"]>.card-meta{order:0!important}
 ${c}[data-flow="feature"]>img{max-height:520px;height:auto;aspect-ratio:4/3;object-fit:contain}
 ${c}[data-flow="collection"] .section-gallery{padding:0;gap:16px}
 ${c}[data-flow="showcase"] img,${c}[data-flow="publication"] img{max-height:none;height:auto;aspect-ratio:${id==='retail'?'4/5':'4/3'}}
 ${c}[data-flow="text"],${c}[data-flow="summary"],${c}[data-flow="index"]{padding-top:24px!important}
 ${c}[data-flow="index"] h2{font-size:23px;margin:0}
 ${c}[data-flow="logos"]{padding:24px 0!important}
 ${c}.section-testimonial{padding:28px!important}
 ${c}.section-testimonial blockquote{font-size:26px}
 ${id==='precision'?`${c}[data-flow="feature"],${c}[data-flow="feature"][data-flow-side="1"],${c}[data-flow="collection"],${c}[data-flow="showcase"][data-flow-position],${c}[data-flow="publication"]{padding:22px!important}`:''}
 ${end}{grid-template-columns:minmax(0,1fr);gap:36px;margin-top:52px;padding:${id==='precision'?'30px 22px':'36px 0'}}
 ${end} .ending-invitation{flex-direction:row;align-items:center;gap:20px}
 ${end} h2{font-size:46px}
 ${end} .ending-detail>a{font-size:20px}
 ${end}[data-contact="website"],${end}[data-contact="empty"]{grid-template-columns:minmax(0,1fr);gap:20px;padding:28px 0}
 ${f}{padding:${id==='precision'?'28px 22px 22px':'28px 0 22px'}}
 ${f} .ending-index{gap:24px;margin-bottom:36px}
 ${f} .ending-wordmark,${f} .ending-wordmark[data-name-length]{font-size:clamp(32px,10vw,62px);margin-bottom:28px}
}
`;
  return common+(id==='retail'?retail:precision)+responsive;
}
