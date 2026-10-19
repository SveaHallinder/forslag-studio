import {norrivaFontCSS} from './norriva-fonts.mjs';

// Norriva composition: the reference's visual language, with the active company's content.
export function norrivaDesignCSS(p) {
  if(p.templateId!=='norriva')return '';
  const family=p.typography?.body?JSON.stringify(p.typography.body)+',sans-serif':"'Norriva Sans',sans-serif";
  const heading=p.typography?.heading?JSON.stringify(p.typography.heading)+(/serif|georgia|times|fraunces|playfair/i.test(p.typography.heading)&&!/sans/i.test(p.typography.heading)?',serif':',sans-serif'):"'Norriva Sans',sans-serif";
  const s='html body[data-template="norriva"][data-imported][data-page-design][data-website-design]',c=s+' .cards>.card[data-redesign-role]';
  return `${norrivaFontCSS}
/* Norriva composition */
${s}{--rd-heading:${heading};font-family:${family};font-weight:400;letter-spacing:-.022em}
${s} .shell{max-width:1440px;padding-inline:clamp(22px,4vw,56px)}
${s} :is(h1,h2,h3){font-weight:300;line-height:1.093;letter-spacing:-.05em}
${s} .nav[data-header]{min-height:104px;padding:22px 0;border:0}
${s} .nav[data-header] .brand{font-weight:400;letter-spacing:-.045em;font-size:27px}
${s} .nav[data-header] .brand-mark img{max-width:min(228px,100%);max-height:42px}
${s} .nav[data-header] .nav-links{font-size:14px;gap:28px}
${s} .nav[data-header] .nav-action{max-width:none;white-space:nowrap;gap:14px;padding:13px 22px;border:0;border-radius:999px;background:var(--rd-accent);color:var(--rd-accent-ink);font-size:15px}
${s} .hero-layout,${s} .hero-layout[data-hero=text]{display:flex;flex-direction:column;align-items:stretch;gap:58px;padding:60px 0 76px;max-width:none;margin:0;border:0}
${s} .hero-layout .hero-copy,${s} .hero-layout[data-hero=text] .hero-copy{display:block;max-width:1000px;width:100%;margin-inline:auto;text-align:center;padding:0}
${s} .hero-layout .eyebrow{justify-content:center;letter-spacing:.08em;margin-bottom:24px}
${s} .hero-layout h1,${s} .hero-layout[data-hero=text] h1{font-size:clamp(48px,7.3vw,94px);font-weight:300;line-height:1.093;letter-spacing:-.05em;max-width:19ch;margin:0 auto 30px;white-space:pre-line;text-align:center}
${s} .hero-layout h1[data-length=long]{font-size:clamp(40px,5.2vw,72px);max-width:24ch}
${s} .hero-layout h1[data-length=extended]{font-size:clamp(34px,4.2vw,58px);max-width:30ch}
${s} .hero-layout .rd-lead{font-size:17px;line-height:1.65;max-width:515px;margin-inline:auto;opacity:.76}
${s} .hero-layout .rd-more{margin-inline:auto;text-align:left}
${s} .hero-layout .rd-more summary{justify-content:center}
${s} .rd-actions{justify-content:center;gap:12px;margin-top:30px}
${s} .button.rd-primary{border-radius:999px;font-size:17px;font-weight:300;padding:16px 27px;gap:18px}
${s} .rd-secondary{background:var(--rd-soft);border:0;border-radius:999px;padding:14px 24px;min-height:52px;font-size:16px;gap:16px}
${s} .hero-layout .rd-image-frame{border-radius:28px;background:transparent}
${s} .hero-layout .rd-image-frame[data-image-count="1"]{width:min(100%,var(--rd-frame-width,100%));margin-inline:auto}
${s} .hero-layout .hero-image{width:100%;max-height:none;aspect-ratio:1.78;object-fit:cover;border-radius:28px}
${s} .hero-layout .hero-image[data-rd-shape=portrait]:not([style*="object-fit"]){aspect-ratio:auto;max-height:680px;object-fit:contain}
${s} .hero-layout .rd-image-frame:has(figure+figure){padding:0;gap:20px;align-items:start}
${s} .hero-layout .rd-image-frame:has(figure+figure) img{aspect-ratio:4/3}
${s} .hero-layout figcaption{font-size:12px;padding:14px 4px;align-self:stretch;color:inherit;opacity:.75}
${s} .benefits{padding:28px 0;margin-bottom:64px}
${s} .cards{gap:24px}
${c}{padding-block:64px!important}
${c} :is(h2,h3){font-size:clamp(32px,4.2vw,58px);font-weight:300;line-height:1.1;letter-spacing:-.05em}
${c}[data-redesign-role=project],${c}[data-redesign-role=project][data-redesign-side="1"]{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(32px,7vw,90px);border:0;padding-block:42px!important}
${c} .rd-project-image{border:0;border-radius:28px;background:var(--rd-soft);padding:0}
${c} .rd-project-image>img{width:100%;height:auto;max-height:560px;object-fit:contain;border-radius:28px}
${c}[data-redesign-role=text] .card-meta>div{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(32px,7vw,90px)}
${c}[data-redesign-role=collection]{background:var(--rd-soft);border:0;border-radius:28px;padding:44px!important;margin-block:24px!important}
${c}[data-redesign-role=collection] .section-gallery{gap:24px}
${c}[data-redesign-role=collection] .section-gallery img{border-radius:22px;max-height:520px}
${c}:is([data-redesign-role=product],[data-redesign-role=team]){grid-column:span 6;border:1px solid var(--rd-line);border-radius:24px;padding:28px!important;background:var(--rd-paper)}
${c}:is([data-redesign-role=product],[data-redesign-role=team]) .rd-project-image{margin:0 0 26px;border-radius:18px;padding:20px}
${c}:is([data-redesign-role=product],[data-redesign-role=team]) :is(h2,h3){font-size:30px}
${c}:is([data-redesign-role=product],[data-redesign-role=team])[data-redesign-group-count="1"]{grid-column:1/-1}
${c}[data-redesign-role=faq]{padding:44px!important;border-radius:28px;background:var(--rd-soft);border:0;margin-top:24px!important}
${c}[data-redesign-role=faq] summary{font-family:inherit;font-weight:400}
${s} .about{padding-block:72px;gap:clamp(32px,7vw,90px)}
${s} .about h2{font-size:clamp(36px,4vw,58px);font-weight:300}
${s} .contact.site-contact{background:var(--rd-soft);color:var(--rd-ink);border-radius:28px;gap:clamp(32px,6vw,80px);padding:52px!important;margin-top:64px}
${s} .contact.site-contact .ending-invitation{flex-direction:column;align-items:start;gap:28px}
${s} .contact.site-contact h2{font-weight:300;font-size:clamp(40px,5vw,70px)}
${s} .contact.site-contact .ending-action{border:0;border-radius:999px;background:var(--rd-accent);color:var(--rd-accent-ink);padding:16px 24px;min-height:52px}
${s} .contact.site-contact .ending-label{opacity:1}
${s} .contact.site-contact .ending-detail{border-color:var(--rd-line)}
${s} .site-footer .ending-wordmark{font-weight:300;font-size:clamp(42px,7vw,96px);max-width:22ch}
@media(max-width:760px){
 ${s} .nav[data-header]{min-height:80px;padding-block:16px}
 ${s} .nav[data-header] .brand{max-width:calc(100% - 95px)}
 ${s} .nav[data-header] .brand-mark img{max-width:min(170px,100%);max-height:36px}
 ${s} .hero-layout,${s} .hero-layout[data-hero=text]{padding:38px 0 46px;gap:36px}
 ${s} .hero-layout h1,${s} .hero-layout[data-hero=text] h1{font-size:clamp(42px,10.8vw,68px);max-width:18ch;margin-bottom:24px}
 ${s} .hero-layout h1[data-length=long]{font-size:clamp(34px,8vw,48px)}
 ${s} .hero-layout h1[data-length=extended]{font-size:clamp(30px,7vw,40px)}
 ${s} .hero-layout .rd-lead{font-size:15px;max-width:36ch}
 ${s} .rd-actions{flex-wrap:wrap;gap:10px;margin-top:24px}
 ${s} .button.rd-primary,${s} .rd-secondary{font-size:14px;min-height:48px;padding:14px 20px;gap:14px}
 ${s} .hero-layout .hero-image,${s} .hero-layout .rd-image-frame{border-radius:20px}
 ${s} .hero-layout .rd-image-frame:has(figure+figure){grid-template-columns:1fr}
 ${s} .benefits{margin-bottom:32px}
 ${c}[data-redesign-role=project],${c}[data-redesign-role=project][data-redesign-side="1"],${c}[data-redesign-role=text] .card-meta>div{grid-template-columns:1fr;gap:28px}
 ${c}[data-redesign-role=project][data-redesign-side="1"] .card-meta{order:0}
 ${c}{padding-block:36px!important}
 ${c}:is([data-redesign-role=product],[data-redesign-role=team]){grid-column:1/-1;padding:22px!important}
 ${c}[data-redesign-role=collection],${c}[data-redesign-role=faq]{padding:26px 22px!important;border-radius:22px}
 ${c} :is(h2,h3){font-size:36px}
 ${s} .contact.site-contact{grid-template-columns:1fr;padding:32px 24px!important;gap:32px;margin-top:40px}
 ${s} .site-footer .ending-wordmark{font-size:clamp(38px,11vw,60px)}
}
`;
}
