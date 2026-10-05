import {brandPalette} from './branding.mjs';
import {normalizeTypography} from './typography.mjs';

// Two complete compositions; all content, assets and anchors remain source-owned.
export function tradeAdviceDesignCSS(p) {
  if(!['construction','consulting'].includes(p.templateId))return '';
  const trade=p.templateId==='construction',b=brandPalette(p.branding);
  const s=`html body[data-template="${p.templateId}"][data-imported][data-page-design]`,c=`${s} .cards>.card[data-flow]`;
  const typography=normalizeTypography(p.typography);
  const heading=typography?.heading?`${JSON.stringify(typography.heading).replace(/</g,'\\3c ').replace(/>/g,'\\3e ')},${trade?'sans-serif':'serif'}`:trade?'"Avenir Next",Avenir,"Segoe UI",sans-serif':'Georgia,"Times New Roman",serif';
  const rows=`${c}:is([data-flow=index],[data-flow=summary],.section-service[data-composition=text])`;
  return `/* Whole-page direction: ${p.templateId}. */
${s}{--trade-paper:${b.background};--trade-ink:${b.text};--trade-surface:${b.surface};--trade-surface-ink:${b.surfaceText};--trade-line:color-mix(in srgb,var(--trade-ink) 24%,transparent);--trade-soft:color-mix(in srgb,var(--trade-ink) 5%,var(--trade-paper));--page-gutter:clamp(20px,4.5vw,72px);background:var(--trade-paper);color:var(--trade-ink)}
${s} .shell{max-width:${trade?'1600':'1320'}px}
${s} .nav[data-header]{min-height:88px;padding-block:18px;border-bottom:${trade?'2':'1'}px solid color-mix(in srgb,currentColor 28%,transparent)}
${s} .nav[data-header] .nav-links{font-size:12px;letter-spacing:${trade?'.055':'.015'}em}
${s} .nav[data-header] .nav-links .nav-action{border-radius:0;gap:20px;padding:12px 18px}
${s} .nav[data-header] .mobile-links{border-radius:0}
${s} .hero-layout{position:relative;background:var(--trade-paper);color:var(--trade-ink);min-width:0}
${s} .hero-copy{min-width:0;background:transparent;color:inherit;margin:0}
${s} .hero-copy h1{font-family:${heading};margin:0;line-height:1.06;letter-spacing:-.05em;overflow-wrap:anywhere;text-wrap:balance}
${s} .hero-copy h1[data-length=long]{font-size:clamp(38px,4.6vw,70px)}
${s} .hero-copy h1[data-length=extended]{font-size:clamp(32px,3.6vw,54px)}
${s} .hero-copy>p{font-size:16px;line-height:1.8;color:inherit;max-width:52ch;margin:26px 0}
${s} .eyebrow{justify-content:flex-start;font-size:11px;line-height:1.5;letter-spacing:.12em;margin-bottom:24px;color:inherit}
${s} .visual{min-width:0;max-width:100%;margin:0}
${s} .hero-image{height:auto;object-fit:cover;border-radius:0}
${s} .visual>.section-gallery{gap:16px}
${s} .visual>.section-gallery img{height:auto;max-height:580px;border-radius:0}
${s} .image-label{display:none}
${s} .button{border-radius:0;min-height:48px;padding:15px 22px;gap:32px;font-size:12px;line-height:1.5;letter-spacing:.03em;max-width:100%;overflow-wrap:anywhere}
${s} .hero-layout[data-hero=text]{display:block;min-height:0;padding:clamp(48px,7vw,96px) 0}
${s} .hero-layout[data-hero=text] .hero-copy{max-width:1000px;margin:0}
${s} .hero-layout[data-hero=text] .visual{display:none}
${s} .cards{grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(40px,5vw,72px) clamp(28px,4vw,64px);padding:clamp(48px,5vw,76px) 0;counter-reset:trade-services}
${c}{padding:0!important;margin:0!important;background:transparent;color:inherit;border-radius:0;border:0;box-shadow:none;min-width:0}
${c} :is(h2,h3){font-family:${heading};font-size:clamp(28px,3.2vw,46px);font-weight:${trade?'650':'400'};line-height:1.15;letter-spacing:-.04em;max-width:25ch}
${c} :is(p,blockquote){font-size:16px;line-height:1.8;color:inherit;max-width:65ch}
${c} .card-meta{max-width:none!important}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"]{background:transparent;color:inherit;border-radius:0;padding:0!important;gap:clamp(28px,5vw,72px)}
${c}[data-flow=showcase]{grid-column:span 6;gap:22px;background:transparent;border-radius:0;padding:0!important}
${c}[data-flow=showcase]>.card-meta{padding:0}
${c}[data-flow=showcase] img{aspect-ratio:4/3;max-height:560px;border-radius:0}
${c}[data-flow=showcase] h2{font-size:clamp(24px,2.4vw,36px)}
${c}[data-flow=showcase] p{font-size:15px}
${c}[data-flow=chapter]{grid-column:1/-1;border-top:${trade?'3':'1'}px solid var(--trade-line);padding-top:26px!important}
${c}[data-flow=chapter] .card-meta>div{align-items:baseline;gap:26px}
${c}[data-flow=chapter] h2{font-size:clamp(36px,4.4vw,64px);max-width:none;line-height:1.12}
${c}[data-flow=text]{border-top:1px solid var(--trade-line);padding-top:30px!important}
${c}[data-flow=collection]>.section-gallery{background:transparent;padding:0;border-radius:0;align-items:start}
${c}[data-flow=collection] .section-gallery img{height:auto;max-height:560px;padding:0;background:transparent;border-radius:0}
${c}[data-flow=logos]{padding:30px 0!important;border-block:1px solid var(--trade-line)}
${c}[data-flow=logos] h2{font-family:inherit;font-size:14px;line-height:1.5;letter-spacing:.01em}
${c}[data-flow=logos] img{object-fit:contain;aspect-ratio:auto;height:56px;border-radius:0}
${c}.section-testimonial{border-block:1px solid var(--trade-line);background:var(--trade-soft);color:inherit;padding:clamp(32px,5vw,72px)!important}
${c}.section-testimonial .card-meta>div{max-width:900px;margin:0}
${c}.section-testimonial h2{font-family:inherit;font-size:12px!important;font-weight:500;letter-spacing:.08em;max-width:none}
${c}.section-testimonial blockquote{font-family:${heading};font-size:clamp(25px,3.1vw,44px);line-height:1.45;max-width:38ch}
${c}.content-faq{border-top:1px solid var(--trade-line);padding-top:30px!important}
${c} .faq-item{padding:22px 0;border-bottom:1px solid var(--trade-line)}
${c} .faq-item summary{font-family:${heading};font-size:22px;line-height:1.45;min-height:44px;overflow-wrap:anywhere}
${c} .faq-item p{font-size:15px;line-height:1.85;margin-top:18px}
${s} .about{gap:clamp(28px,6vw,88px);padding:56px 0;border-top:1px solid var(--trade-line)}
${s} .about h2{font-family:${heading};font-size:clamp(30px,3.5vw,48px)}
${s} .contact.site-contact{border-radius:0;margin-top:32px;gap:clamp(32px,7vw,100px)}
${s} .contact.site-contact h2{font-family:${heading};font-weight:${trade?'650':'400'};letter-spacing:-.05em}
${s} .contact.site-contact .ending-action{border-radius:0}
${s} .footer.site-footer .ending-wordmark{font-family:${heading};font-weight:${trade?'650':'400'};letter-spacing:-.055em}
${trade?`
${s} .hero-layout{display:flex;flex-direction:column;align-items:stretch;padding:clamp(40px,5vw,72px) 0 40px;gap:40px;border-bottom:3px solid var(--trade-ink)}
${s} .hero-copy{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:0 clamp(40px,6vw,96px);align-items:start}
${s} .hero-copy h1{font-size:clamp(48px,6.4vw,98px);font-weight:750;max-width:17ch;grid-column:1;grid-row:2/4}
${s} .hero-copy .eyebrow{grid-column:1/-1}
${s} .hero-copy>p{grid-column:2;grid-row:2;margin:4px 0 26px}
${s} .hero-copy>.button{grid-column:2;grid-row:3;justify-self:start;align-self:start}
${s} .hero-image{width:100%;aspect-ratio:2.35/1;max-height:650px}
${s} .hero-layout[data-hero=text] h1{font-size:clamp(52px,7.2vw,106px);max-width:18ch}
${s} .hero-layout[data-hero=text] .hero-copy>p{margin:28px 0}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);align-items:center}
${c}[data-flow=feature][data-flow-side="1"]>.card-meta{order:0}
${c}[data-flow=feature]>img{aspect-ratio:4/3;object-fit:cover}
${c}[data-flow=collection]{grid-template-columns:minmax(0,1fr);gap:30px}
${c}[data-flow=collection] .card-meta>div{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:40px}
${c}[data-flow=collection]>.section-gallery{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
${c}[data-flow=collection]>.section-gallery[data-image-count="1"]{display:block}
${rows}{position:relative;grid-column:1/-1;display:grid;grid-template-columns:52px minmax(0,1fr);gap:24px;counter-increment:trade-services;border-top:1px solid var(--trade-line);padding:26px 0!important;align-self:start}
${rows}::before{content:counter(trade-services,decimal-leading-zero);position:static;font:500 12px/1.6 ui-monospace,monospace;letter-spacing:.03em;opacity:.65;align-self:start;padding-top:7px}
${rows} .card-meta>div{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:20px 40px}
${rows} h2{font-size:clamp(25px,2.8vw,40px);margin:0;max-width:none}
${rows} .flow-index{display:none}
${rows} p{font-size:15px}
${s} .contact.site-contact[data-contact=available]{padding:clamp(32px,5vw,64px);background:var(--trade-ink);color:var(--trade-paper);border-top:6px solid var(--accent);--ending-paper:var(--trade-ink);--ending-ink:var(--trade-paper);--ending-line:color-mix(in srgb,var(--trade-paper) 28%,transparent)}
${s} .contact.site-contact[data-contact=available] h2{font-size:clamp(44px,6vw,86px)}
${s} .footer.site-footer{border-top:3px solid var(--trade-ink);padding-top:28px}
${s} .footer.site-footer .ending-index{margin-bottom:40px}
${s} .footer.site-footer .ending-wordmark{font-size:clamp(42px,8.4vw,128px);max-width:24ch;line-height:1.04}
`:``}
${!trade?`
${s} .nav[data-header] .nav-links .nav-action{border:0;border-bottom:1px solid currentColor;padding:8px 0;min-height:44px}
${s} .hero-layout{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(220px,.8fr);gap:clamp(48px,8vw,112px);align-items:center;padding:clamp(56px,7vw,96px) 0;border-bottom:1px solid var(--trade-line)}
${s} .hero-copy h1{font-size:clamp(48px,5.8vw,82px);font-weight:400;max-width:18ch}
${s} .hero-copy>p{max-width:50ch;margin:30px 0}
${s} .hero-copy>.button{border:0;border-bottom:1px solid currentColor;padding:12px 0;background:transparent;color:inherit;gap:40px}
${s} .visual{width:100%;max-width:350px;justify-self:end}
${s} .hero-image{aspect-ratio:4/5;max-height:460px;object-fit:contain}
${s} .hero-layout[data-hero=text] .hero-copy{max-width:900px}
${s} .hero-layout[data-hero=text] h1{font-size:clamp(48px,6.4vw,88px);max-width:20ch}
${s} .cards{gap:52px 48px}
${c}[data-flow=introduction] .card-meta>div{grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:36px}
${c}[data-flow=introduction] p{font-size:19px;line-height:1.75}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,.8fr) minmax(0,1.35fr);align-items:center}
${c}[data-flow=feature]>.card-meta,${c}[data-flow=feature][data-flow-side="1"]>.card-meta{order:0}
${c}[data-flow=feature]>img{max-height:460px;aspect-ratio:4/5;object-fit:contain}
${c}[data-flow=feature] .section-gallery img{max-height:430px;object-fit:contain}
${c}[data-flow=collection]{grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:48px}
${c}[data-flow=showcase]{border-top:1px solid var(--trade-line);padding-top:22px!important}
${c}[data-flow=showcase] img{max-height:380px;aspect-ratio:4/3;object-fit:contain}
${rows}{grid-column:1/-1;border-top:1px solid var(--trade-line);padding:26px 0!important;background:transparent;display:block;align-self:start}
${rows} .card-meta>div{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:20px 48px}
${rows} h2{font-size:clamp(26px,2.8vw,38px);margin:0;max-width:none}
${rows} .flow-index{grid-column:1/-1;font-size:10px;margin:0}
${rows} p{font-size:16px}
${c}.content-faq .card-meta>div{grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:48px}
${c}.content-faq h2{font-size:clamp(30px,3.4vw,46px)}
${s} .contact.site-contact[data-contact=available]{padding:48px 0;border-top:1px solid var(--trade-ink);grid-template-columns:minmax(0,1fr) minmax(0,1.3fr)}
${s} .contact.site-contact[data-contact=available] h2{font-size:clamp(44px,5.7vw,76px)}
${s} .contact.site-contact .ending-action{border:0;border-bottom:1px solid currentColor;min-height:52px;min-width:52px;padding:10px}
${s} .contact.site-contact .ending-detail>a{font-size:clamp(18px,2.1vw,28px)}
${s} .footer.site-footer{padding:28px 0 24px}
${s} .footer.site-footer .ending-index{margin-bottom:36px}
${s} .footer.site-footer .ending-wordmark{font-size:clamp(40px,6.2vw,84px);line-height:1.12;max-width:25ch;letter-spacing:-.04em;margin-bottom:32px}
`:``}
@media(max-width:900px){
${s} .nav[data-header]{min-height:74px;padding-block:14px}
${s} .hero-layout{gap:32px}
${s} .hero-copy h1{font-size:clamp(44px,6.6vw,68px)}
${s} .hero-copy{column-gap:36px}
${c}[data-flow=feature],${c}[data-flow=feature][data-flow-side="1"],${c}[data-flow=collection]{gap:30px;padding:0!important}
${rows} .card-meta>div{column-gap:28px}
}
@media(max-width:760px){
${s}{--page-gutter:20px}
${s} .hero-layout,${s} .hero-layout[data-hero=text]{display:flex;flex-direction:column;align-items:stretch;padding:40px 0;gap:28px}
${s} .hero-copy,${s} .hero-layout[data-hero=text] .hero-copy{display:block;width:100%;max-width:none}
${s} .hero-copy h1,${s} .hero-layout[data-hero=text] h1{font-size:clamp(38px,9.5vw,64px);max-width:19ch;line-height:1.09}
${s} .hero-copy h1[data-length=long]{font-size:clamp(34px,8.5vw,54px)}
${s} .hero-copy h1[data-length=extended]{font-size:clamp(30px,7vw,44px)}
${s} .hero-copy>p,${s} .hero-layout[data-hero=text] .hero-copy>p{font-size:15px;margin:24px 0;max-width:none}
${s} .visual{max-width:${trade?'none':'330px'};width:100%;align-self:${trade?'stretch':'flex-start'}}
${s} .hero-image{aspect-ratio:${trade?'4/3':'4/5'};max-height:420px}
${s} .cards{display:grid;grid-template-columns:minmax(0,1fr);gap:36px;padding:40px 0}
${c}[data-flow],${c}[data-flow]:nth-child(even),${c}[data-flow=showcase][data-flow-position]{grid-column:1/-1;display:flex;flex-direction:column;gap:22px;padding:0!important;margin:0!important;background:transparent;color:inherit}
${c}[data-flow] .card-meta>div,${c}[data-flow].content-faq .card-meta>div{display:block}
${c} :is(h2,h3){font-size:30px;max-width:none;margin-bottom:18px}
${c} :is(p,blockquote){font-size:15px;max-width:none;line-height:1.8}
${c}[data-flow=chapter]{padding-top:24px!important;gap:0}
${c}[data-flow=chapter] .card-meta>div{display:flex;gap:20px;align-items:baseline}
${c}[data-flow=chapter] h2{font-size:clamp(32px,8vw,44px);margin-bottom:0}
${c}[data-flow=text],${c}.content-faq{padding-top:24px!important}
${c}[data-flow=feature]>.card-meta,${c}[data-flow=feature][data-flow-side="1"]>.card-meta{order:0!important}
${c}[data-flow=feature]>img,${c}[data-flow=showcase] img{height:auto;max-height:420px;aspect-ratio:auto;object-fit:contain}
${c}[data-flow=collection]>.section-gallery{grid-template-columns:minmax(0,1fr);gap:24px;padding:0}
${c}[data-flow=collection] .section-gallery img{height:auto;max-height:420px}
${rows}[data-flow]{display:${trade?'grid':'block'};${trade?'grid-template-columns:30px minmax(0,1fr);gap:16px;':''}padding:22px 0!important}
${rows}[data-flow] .card-meta>div{display:block}
${rows} h2{font-size:27px}
${rows} p{font-size:15px}
${rows} .flow-index{margin-bottom:14px}
${c}.section-testimonial{padding:28px!important;background:var(--trade-soft)}
${c}.section-testimonial blockquote{font-size:25px}
${c}[data-flow=logos]{padding:24px 0!important}
${c}[data-flow=logos] h2{font-size:14px}
${c}[data-flow=logos] img{height:52px;aspect-ratio:auto}
${c} .faq-item summary{font-size:20px}
${s} .about{grid-template-columns:minmax(0,1fr);gap:24px;padding:36px 0}
${s} .contact.site-contact[data-contact=available]{grid-template-columns:minmax(0,1fr);gap:32px;padding:${trade?'28px':'36px 0'};margin-top:24px}
${s} .contact.site-contact[data-contact=available] .ending-invitation{flex-direction:row;align-items:center;gap:16px}
${s} .contact.site-contact[data-contact=available] h2{font-size:clamp(38px,10vw,56px)}
${s} .contact.site-contact .ending-action{min-width:48px;min-height:48px;padding:10px}
${s} .contact.site-contact .ending-detail>a{font-size:20px}
${s} .footer.site-footer .ending-index{margin-bottom:30px;gap:22px}
${s} .footer.site-footer .ending-wordmark,${s} .footer.site-footer .ending-wordmark[data-name-length]{font-size:clamp(32px,9vw,60px);line-height:1.1;margin-bottom:24px}
}
`;
}
