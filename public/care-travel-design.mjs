import {brandPalette} from './branding.mjs';
import {normalizeTypography} from './typography.mjs';

// Presentation only: source sections, image choices and editable indices stay intact.
export function careTravelDesignCSS(p) {
  if(!['wellness','hospitality'].includes(p.templateId))return '';
  const b=brandPalette(p.branding),wellness=p.templateId==='wellness';
  const heading=normalizeTypography(p.typography)?.heading;
  const display=heading?`${JSON.stringify(heading).replace(/</g,'\\3c ').replace(/>/g,'\\3e ')},serif`:"Georgia,'Times New Roman',serif";
  const s=`html body[data-template="${p.templateId}"][data-imported][data-page-design]`;
  const c=`${s} .cards>.card[data-flow]`,contact=`${s} .contact.site-contact`,footer=`${s} .footer.site-footer`;
  return `/* Care and travel: distinct whole-page compositions with original brand colors. */
${s}{--care-paper:${b.background};--care-ink:${b.text};--care-surface:${b.surface};--care-surface-ink:${b.surfaceText};--care-soft:color-mix(in srgb,var(--care-ink) 5%,var(--care-paper));--care-line:color-mix(in srgb,var(--care-ink) 18%,transparent);--care-display:${display};background:var(--care-paper);color:var(--care-ink)}
${s} .shell{max-width:${wellness?'1380':'1520'}px;padding-inline:clamp(22px,4.2vw,64px)}
${s} .section#erbjudande{padding:0}
${s} .hero-layout{background:transparent;color:inherit}
${s} .hero-copy{background:transparent;color:inherit;border:0;min-width:0}
${s} .hero-copy h1{font-family:var(--care-display);font-weight:400;text-transform:none;line-height:1.03;letter-spacing:-.045em;text-wrap:balance}
${s} .hero-copy>p{color:inherit;line-height:1.8;max-width:48ch;font-size:16px}
${s} .hero-copy h1[data-length=long]{font-size:clamp(42px,4.7vw,68px)}
${s} .hero-copy h1[data-length=extended]{font-size:clamp(36px,3.8vw,54px)}
${s} .eyebrow{font-size:11px;letter-spacing:.15em;font-weight:500;color:inherit}
${s} .button{min-height:48px;padding:14px 24px;gap:32px;font-size:13px;font-weight:500;line-height:1.4;border-radius:${wellness?'999px':'0'};max-width:100%;text-align:center}
${s} .visual{min-width:0;width:100%;margin:0}
${s} .visual.no-image{display:none}
${s} .image-label{display:none}
${s} .visual .section-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
${s} .visual .section-gallery[data-image-count="1"]{grid-template-columns:minmax(0,1fr)}
${s} .visual .section-gallery img{height:auto;max-height:620px;object-fit:contain;border-radius:0}
${s} .visual .section-gallery figcaption{font-size:12px;line-height:1.6;border:0;padding:0;margin-top:10px;color:inherit}
${s} .nav[data-header]{min-height:94px;margin:0;padding:20px 24px;border-radius:0;box-shadow:none;border:0;border-bottom:1px solid color-mix(in srgb,var(--brand-header-text,${b.headerText}) 18%,transparent)}
${s} .nav[data-header] .nav-links{font-size:12px;letter-spacing:.035em;gap:28px}
${s} .nav[data-header] .nav-links .nav-action{border-radius:${wellness?'999px':'0'};padding:12px 20px;min-height:46px}
${s} .cards{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(48px,6vw,88px) clamp(24px,4vw,56px);padding:clamp(48px,6vw,80px) 0;margin:0}
${c}{padding:0!important;margin:0!important;border:0;border-radius:0;box-shadow:none;background:transparent;color:inherit}
${c} :is(h2,h3){font-family:var(--care-display);font-weight:400;font-size:clamp(30px,3.3vw,48px);line-height:1.15;letter-spacing:-.035em;margin-bottom:20px;max-width:23ch}
${c} :is(p,blockquote){font-size:16px;line-height:1.8;max-width:62ch;color:inherit}
${c} img{margin:0;padding:0;border-radius:0;background:transparent;max-height:620px}
${c} .section-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;padding:0;background:transparent}
${c} .section-gallery[data-image-count="1"]{grid-template-columns:minmax(0,1fr)}
${c} .section-gallery img{height:auto;max-height:500px;aspect-ratio:auto;object-fit:contain}
${c} figcaption{font-size:12px;line-height:1.6;margin-top:10px;padding:0;border:0}
${c}[data-flow=chapter]{border-top:1px solid var(--care-line);padding-top:30px!important}
${c}[data-flow=chapter] .card-meta>div{display:flex;align-items:baseline;justify-content:flex-start;text-align:left;gap:20px}
${c}[data-flow=chapter] h2{font-size:clamp(40px,5.8vw,76px);max-width:none;margin:0}
${c}[data-flow=chapter] .flow-index{margin:0;flex:none;letter-spacing:.08em}
${c}[data-flow=introduction] .card-meta>div{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}
${c}[data-flow=introduction] p{font-size:clamp(18px,1.8vw,23px);line-height:1.65}
${c}[data-flow=text],${c}[data-flow=index],${c}[data-flow=summary],${c}[data-flow=dispatch]{border-top:1px solid var(--care-line);padding-top:26px!important}
${c}[data-flow=text] .card-meta>div{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}
${c}[data-flow=index] h2,${c}[data-flow=summary] h2{font-size:27px;max-width:none}
${c}[data-flow=summary] p{font-size:15px}
${c}[data-flow=feature]{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);align-items:center;gap:clamp(28px,5vw,72px);padding:0!important;background:transparent}
${c}[data-flow=feature]>.card-meta{order:0!important}
${c}[data-flow=feature] .card-meta>div{display:block}
${c}[data-flow=feature]>img{height:auto;aspect-ratio:5/6;max-height:620px;object-fit:cover}
${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);background:var(--care-soft);padding:clamp(24px,4vw,48px)!important}
${c}[data-flow=feature][data-flow-side="1"]>.card-meta{order:-1!important}
${c}[data-flow=showcase]{grid-column:span 6;text-align:left;gap:24px;padding:0!important}
${c}[data-flow=showcase] h2,${c}[data-flow=showcase] p{margin-inline:0}
${c}[data-flow=showcase] h2{font-size:clamp(27px,3vw,40px)}
${c}[data-flow=showcase] p{font-size:15px}
${c}[data-flow=showcase]>img{aspect-ratio:4/3;height:auto;max-height:none;object-fit:cover}
${c}[data-flow=collection]{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(28px,4vw,56px)}
${c}[data-flow=collection]>.section-gallery{padding:0;background:transparent}
${c}[data-flow=collection]>.card-meta{order:0}
${c}[data-flow=collection] .card-meta>div{display:block}
${c}[data-flow=publication] img{height:360px;object-fit:contain;background:var(--care-soft);padding:24px}
${c}[data-flow=logos]{padding:28px 0!important;border-block:1px solid var(--care-line)}
${c}[data-flow=logos] img{height:56px;object-fit:contain}
${c}[data-flow=logos] h2{font-size:20px;letter-spacing:0}
${c}.section-testimonial{padding:clamp(28px,5vw,64px)!important;background:var(--care-soft);border:0}
${c}.section-testimonial h2{font-family:inherit;font-size:12px;letter-spacing:.1em;max-width:none}
${c}.section-testimonial blockquote{font-family:var(--care-display);font-size:clamp(26px,3vw,40px);line-height:1.5;max-width:32ch}
${c} .faq-item summary{font-size:19px;line-height:1.5}
${s} .about{padding:48px 0;gap:48px;border-color:var(--care-line)}
${s} .about h2{font-family:var(--care-display);font-weight:400}
${contact}{--ending-paper:var(--care-paper);--ending-ink:var(--care-ink);display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:48px;margin:40px 0 0;padding:48px 0;border-top:1px solid var(--care-line);border-radius:0}
${contact} h2{font-family:var(--care-display);font-size:clamp(44px,5vw,70px);letter-spacing:-.04em}
${contact} .ending-invitation{align-items:center;flex-direction:row}
${contact} .ending-action{min-width:52px;min-height:52px;padding:12px}
${contact} .ending-action svg{width:26px;height:26px}
${contact} .ending-detail>a{font-size:clamp(18px,1.7vw,24px)}
${footer}{--ending-paper:var(--care-paper);--ending-ink:var(--care-ink);padding:30px 0 24px}
${footer} .ending-index{margin-bottom:40px}
${footer} .ending-wordmark{font-family:var(--care-display);font-size:clamp(48px,8.5vw,116px);font-weight:400;letter-spacing:-.05em;margin-bottom:32px}
${footer} .ending-wordmark[data-name-length=long]{font-size:clamp(42px,7vw,96px)}
${footer} .ending-wordmark[data-name-length=extended]{font-size:clamp(32px,5vw,70px)}
${wellness?`
${s} .hero-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.98fr);gap:clamp(32px,5vw,76px);align-items:center;padding:50px 0 30px}
${s} .hero-copy{margin:0;padding:0!important;text-align:left;max-width:none;width:auto}
${s} .hero-copy h1{font-size:clamp(48px,6.2vw,88px);max-width:13ch;margin:0 0 28px}
${s} .hero-copy>p{margin:0 0 28px}
${s} .eyebrow{justify-content:flex-start;margin-bottom:28px}
${s} .hero-image{height:clamp(440px,48vw,610px);width:100%;object-fit:cover;border-radius:45% 45% 4px 4px}
${s} .hero-layout[data-hero=text]{display:block;padding:64px 0 40px;max-width:960px}
${s} .hero-layout[data-hero=text] h1{max-width:20ch}
${c}[data-flow=feature]>img{border-radius:4px 28% 4px 4px}
${c}[data-flow=feature][data-flow-side="1"]{border-radius:4px 4px 72px 4px}
${c}[data-flow=feature][data-flow-side="1"]>img{border-radius:4px}
${c}[data-flow=showcase][data-flow-position="1"],${c}[data-flow=showcase][data-flow-position="3"]{padding-top:48px!important}
${c}[data-flow=showcase]>img{border-radius:4px 4px 44px 4px}
${c}[data-flow=showcase][data-flow-position="1"]>img{border-radius:44px 4px 4px 4px}
${c}[data-flow=index]{grid-column:1/-1;padding:22px 0!important}
${c}[data-flow=index] h2{font-size:clamp(26px,3vw,38px)}
${c}[data-flow=index] h2 a{display:flex;align-items:baseline;justify-content:space-between;gap:20px}
${contact}{background:var(--care-soft);padding:40px;border-radius:4px 56px 4px 4px;border:0}
${footer} .ending-links{grid-template-columns:repeat(2,minmax(0,1fr));max-width:500px}
`:``}
${!wellness?`
${s} .hero-layout{display:flex;flex-direction:column;padding:24px 0 0;gap:0}
${s} .visual{order:-1}
${s} .hero-image{height:clamp(400px,49vw,650px);border-radius:0;object-fit:cover}
${s} .hero-copy{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:20px 56px;text-align:left;padding:44px 0 36px!important;margin:0;width:100%;max-width:none;border-bottom:1px solid var(--care-line)}
${s} .hero-copy h1{grid-column:1;grid-row:2/4;max-width:16ch;margin:0;font-size:clamp(48px,5.8vw,82px)}
${s} .hero-copy .eyebrow{grid-column:1/-1;justify-content:flex-start;margin:0 0 4px}
${s} .hero-copy>p{grid-column:2;grid-row:2;margin:0;align-self:start}
${s} .hero-copy .button{grid-column:2;justify-self:start;align-self:start}
${s} .hero-copy:not(:has(>.eyebrow)) h1{grid-row:1/3}
${s} .hero-copy:not(:has(>.eyebrow))>p{grid-row:1}
${s} .hero-copy:not(:has(>p)){display:block}
${s} .hero-copy:not(:has(>p)) .button{margin-top:24px}
${s} .hero-copy[data-density=long]{display:block;max-width:1080px}
${s} .hero-copy[data-density=long] h1{max-width:21ch;margin:18px 0 24px}
${s} .hero-copy[data-density=long]>p{max-width:70ch;margin-bottom:24px}
${s} .hero-layout[data-hero=text]{padding-top:28px}
${c}[data-flow=feature]{grid-template-columns:1fr;gap:28px}
${c}[data-flow=feature]>img{aspect-ratio:1.9;height:auto;max-height:620px}
${c}[data-flow=feature] .card-meta>div{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:48px}
${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);padding:0!important;background:transparent}
${c}[data-flow=feature][data-flow-side="1"]>img{aspect-ratio:1;max-height:580px}
${c}[data-flow=feature][data-flow-side="1"] .card-meta>div{display:block}
${c}[data-flow=showcase]>img{aspect-ratio:3/2}
${c}[data-flow=showcase] .card-meta{padding-top:20px;border-top:1px solid var(--care-line)}
${c}[data-flow=chapter] .flow-index{letter-spacing:.2em}
${c}[data-flow=chapter] h2{font-style:italic}
${contact},${footer}{--ending-paper:${b.secondary};--ending-ink:${b.secondaryText};background:var(--ending-paper);color:var(--ending-ink);padding-inline:clamp(24px,4vw,56px)}
${contact}{grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:40px;border:0;padding-top:42px;padding-bottom:40px}
${contact} .ending-invitation{display:block}
${contact} .ending-action{margin-top:24px}
${contact} .contact-links{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 36px}
${contact} .ending-detail{margin:0;padding:0 0 20px;border-bottom:1px solid var(--ending-line)}
${contact} .ending-detail:last-child{grid-column:1/-1}
${footer} .ending-wordmark{text-align:center;font-size:clamp(44px,7.2vw,108px);margin:8px auto 36px;max-width:24ch}
${footer} .ending-index{align-items:center;margin-bottom:40px}
`:``}
${contact}[data-contact=website],${contact}[data-contact=empty]{grid-template-columns:minmax(0,1fr) minmax(0,1fr);padding:28px 0;margin-top:28px;background:transparent;color:var(--care-ink);border-radius:0}
${contact}[data-contact=website] h2,${contact}[data-contact=empty] h2{font-size:28px}
${contact}[data-contact=website] .ending-invitation{display:flex;align-items:center}
${contact}[data-contact=website] .ending-action{margin:0}
@media(max-width:900px){
${s} .hero-layout{gap:28px}
${s} .hero-copy h1{font-size:clamp(40px,6.5vw,66px)}
${s} .nav[data-header]{min-height:76px;padding:14px 18px}
${c}[data-flow=feature][data-flow-side="1"]{padding:${wellness?'28px':'0'}!important;gap:32px}
${contact}{gap:32px}
}
@media(max-width:760px){
${s} .shell{padding-inline:20px}
${s} .nav[data-header]{padding-inline:12px;gap:16px;min-height:76px}
${s} .hero-layout{display:flex;flex-direction:column;gap:28px;padding:32px 0 0}
${s} .hero-layout[data-hero=text]{padding:40px 0 16px}
${s} .hero-copy,${s} .hero-copy[data-density=long]{display:block;padding:0!important;margin:0;width:100%;border:0;text-align:left}
${s} .hero-copy h1,${s} .hero-copy h1[data-length=long]{font-size:clamp(38px,10.3vw,58px);max-width:none;margin:0 0 24px}
${s} .hero-copy h1[data-length=extended]{font-size:clamp(32px,8.2vw,44px)}
${s} .hero-copy>p{font-size:16px;margin:0 0 24px;max-width:none}
${s} .hero-copy .eyebrow{margin-bottom:20px}
${s} .hero-copy .button{margin:0}
${s} .visual{order:${wellness?'0':'-1'}}
${s} .hero-image{height:auto;aspect-ratio:${wellness?'4/5':'4/3'};max-height:540px;border-radius:${wellness?'38% 38% 4px 4px':'0'}}
${s} .visual .section-gallery img{height:auto;max-height:420px}
${s} .cards{grid-template-columns:minmax(0,1fr);gap:40px;padding:44px 0}
${c}[data-flow],${c}[data-flow]:nth-child(even),${c}[data-flow=showcase][data-flow-position]{grid-column:1/-1;display:flex;flex-direction:column;align-items:stretch;gap:22px;padding:0!important;margin:0!important}
${c}[data-flow] .card-meta>div,${c}[data-flow][data-flow-side="1"] .card-meta>div{display:block}
${c}[data-flow]>.card-meta,${c}[data-flow][data-flow-side="1"]>.card-meta{order:0!important}
${c}[data-flow=chapter],${c}[data-flow=text],${c}[data-flow=index],${c}[data-flow=summary],${c}[data-flow=dispatch]{padding-top:24px!important}
${c}[data-flow=chapter] .card-meta>div{display:flex;gap:16px;align-items:baseline}
${c}[data-flow=chapter] h2{font-size:clamp(34px,9vw,46px);margin:0}
${c} :is(h2,h3){font-size:30px;max-width:none;margin-bottom:16px}
${c} :is(p,blockquote){font-size:16px;line-height:1.75;max-width:none}
${c}[data-flow=feature][data-flow-side="1"]{padding:${wellness?'24px':'0'}!important;border-radius:${wellness?'4px 4px 40px 4px':'0'}}
${c}[data-flow=feature]>img,${c}[data-flow=feature][data-flow-side="1"]>img{aspect-ratio:auto;max-height:440px;object-fit:contain}
${c} .section-gallery img{height:auto;max-height:380px;aspect-ratio:auto;object-fit:contain}
${c}[data-flow=showcase]>img{aspect-ratio:4/3}
${c}[data-flow=logos]{padding:24px 0!important}
${c}[data-flow=logos] .section-gallery{grid-template-columns:repeat(3,minmax(0,1fr))}
${c}[data-flow=logos] img{height:48px}
${c}.section-testimonial{padding:26px!important}
${c}.section-testimonial blockquote{font-size:26px}
${contact},${contact}[data-contact=website],${contact}[data-contact=empty]{grid-template-columns:minmax(0,1fr);margin-top:24px;gap:28px;padding:${wellness?'30px 24px':'32px 24px'}}
${contact} h2{font-size:46px}
${contact} .ending-invitation{display:flex;align-items:center;flex-direction:row}
${contact} .ending-action{margin:0}
${contact} .contact-links{grid-template-columns:minmax(0,1fr);gap:18px}
${contact} .ending-detail:last-child{grid-column:auto}
${footer}{padding:28px ${wellness?'0':'24px'} 22px}
${footer} .ending-index{align-items:start;margin-bottom:32px;gap:22px}
${footer} .ending-links{grid-template-columns:repeat(2,minmax(0,1fr));max-width:none}
${footer} .ending-top{gap:12px}
${footer} .ending-wordmark{font-size:clamp(42px,11vw,70px);margin-bottom:28px}
${footer} .ending-wordmark[data-name-length=long]{font-size:clamp(34px,9vw,58px)}
${footer} .ending-wordmark[data-name-length=extended]{font-size:clamp(28px,7.5vw,46px)}
}
`;
}
