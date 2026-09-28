import {detectSectionKind} from './section-design.mjs';
// Presentation is derived at render time. Saved source content stays unchanged.
export function sectionComposition(card) {
  if(!card.description&&!card.image&&!card.gallery?.length)return card.href?'link':'heading';
  if(card.gallery?.length>1&&(!card.kind||card.kind==='generic')&&/\bpartners\b|samarbetspartners|samarbetspartner/i.test(card.title))return 'logos';
  if(card.gallery?.length>1)return 'collection';
  return card.image||card.gallery?.length?'feature':'text';
}
export function compactCardIndices(cards) {
  const result=new Set(),eligible=card=>!!(card.image||card.gallery?.length)&&(!card.gallery||card.gallery.length<=1)&&card.description.length<=180&&['generic','service','product','case'].includes(detectSectionKind(card));
  for(let start=0;start<cards.length;){
    if(!eligible(cards[start])){start++;continue;}
    let end=start+1;while(end<cards.length&&eligible(cards[end]))end++;
    if(end-start>=2)for(let i=start;i<end;i++)result.add(i);
    start=end;
  }
  return result;
}
export function paragraphContent(value,escape) {
  if(!/\n\s*\n/.test(value))return escape(value);
  return String(value).split(/(\n\s*\n)/).map((part,i)=>i%2?part:`<span class="copy-part">${escape(part)}</span>`).join('');
}

export const compositionCSS=`
/* One composition layer after semantic sections; customer color/font rules follow. */
html body[data-template][data-imported="true"]{--page-gutter:clamp(24px,5.2vw,88px);--section-space:clamp(64px,8vw,120px);--rule:color-mix(in srgb,currentColor 18%,transparent);-webkit-font-smoothing:antialiased}
html body[data-template][data-imported="true"] .shell{max-width:1600px;padding:0 var(--page-gutter)}
html body[data-template][data-imported="true"] .demo-note{font-size:10px;letter-spacing:.12em;padding:8px 20px}
html body[data-template][data-imported="true"] .nav{min-height:100px;height:auto;gap:32px;padding-block:24px;border-bottom:1px solid var(--rule);background:transparent;color:inherit}
html body[data-template][data-imported="true"] .brand{font-size:28px;letter-spacing:-.055em}
html body[data-template][data-imported="true"] .brand-mark img{max-width:180px;max-height:64px;object-fit:contain}
html body[data-template][data-imported="true"] .nav-links{gap:clamp(20px,2.8vw,44px);font-size:13px;font-weight:500;letter-spacing:0}
html body[data-template][data-imported="true"] .nav-links a{padding:10px 0;min-height:44px;display:inline-flex;align-items:center;text-decoration:none}
html body[data-template][data-imported="true"] .nav-links a:hover{text-decoration:underline;text-underline-offset:7px}
html body[data-template][data-imported="true"] .hero-layout{padding:72px 0 80px;gap:clamp(40px,6vw,96px)}
html body[data-template][data-imported="true"] .hero-copy{max-width:none;margin:0;text-align:left;padding:0!important}
html body[data-template][data-imported="true"] .hero-copy h1{font-size:clamp(48px,6.5vw,100px);line-height:1.02;letter-spacing:-.065em;font-weight:500;max-width:17ch;margin:0;text-wrap:balance;overflow-wrap:anywhere}
html body[data-template][data-imported="true"] .eyebrow{justify-content:flex-start;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;margin-bottom:28px;gap:12px}
html body[data-template][data-imported="true"] .eyebrow::before{content:'';width:24px;height:1px;background:currentColor}
html body[data-template][data-imported="true"] .hero-copy>p{font-size:16px;line-height:1.8;max-width:51ch;margin:30px 0 32px;white-space:pre-line;text-wrap:pretty}
html body[data-template][data-imported="true"] .hero-copy[data-density="long"]>p{font-size:15px;line-height:1.75}
html body[data-template][data-imported="true"] .button{min-height:52px;border-radius:0;padding:15px 24px;gap:30px;font-size:13px;font-weight:500;letter-spacing:0;transition:transform .2s ease,opacity .2s ease;text-decoration:none}
html body[data-template][data-imported="true"] .button:hover{transform:translateY(-2px);opacity:.88}
html body[data-template][data-imported="true"] .button span{font-size:21px;font-weight:400}
html body[data-template][data-imported="true"] .visual{min-width:0;margin:0;position:relative}
html body[data-template][data-imported="true"] .hero-image{display:block;width:100%;height:auto;max-height:none;aspect-ratio:1/1;object-fit:cover;object-position:50% var(--hero-position);border-radius:0}
html body[data-template][data-imported="true"] .image-label{display:none}
html body[data-template][data-imported="true"] .section{padding:0;margin:0}
html body[data-template][data-imported="true"] .cards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0 32px;margin:0}
html body[data-template][data-imported="true"] .card{margin:0!important;border:0;border-top:1px solid var(--rule);border-radius:0;padding:var(--section-space) 0!important;background:transparent;min-width:0;position:relative}
html body[data-template][data-imported="true"] .card::before{content:none}
html body[data-template][data-imported="true"] .card .card-meta{max-width:none;margin:0;padding:0;border:0;min-width:0}
html body[data-template][data-imported="true"] .card h2{font-size:clamp(30px,3.4vw,52px);font-weight:500;line-height:1.13;letter-spacing:-.045em;max-width:22ch;margin:0 0 24px;text-wrap:balance}
html body[data-template][data-imported="true"] .card h2 a{text-decoration:none}
html body[data-template][data-imported="true"] .card h2 a:hover{text-decoration:underline;text-underline-offset:6px;text-decoration-thickness:1px}
html body[data-template][data-imported="true"] .card p{font-size:16px;line-height:1.85;max-width:62ch;white-space:pre-line;text-wrap:pretty}
html body[data-template][data-imported="true"] .copy-part{display:block;white-space:pre-line}
html body[data-template][data-imported="true"] p:has(>.copy-part){white-space:normal}
html body[data-template][data-imported="true"] .copy-part+.copy-part{margin-top:1.2em}
html body[data-template][data-imported="true"] .card[data-composition="text"]{grid-column:1/-1;display:block}
html body[data-template][data-imported="true"] .card[data-composition="text"] .card-meta>div{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,6vw,96px)}
html body[data-template][data-imported="true"] .card[data-composition="heading"]{grid-column:1/-1;padding:64px 0 28px!important;border:0}
html body[data-template][data-imported="true"] .card[data-composition="heading"] h2{font-size:clamp(40px,5vw,72px);max-width:none;margin:0}
html body[data-template][data-imported="true"] .card[data-composition="link"]{grid-column:span 2;display:block;padding:22px 0 42px!important;border-top:1px solid var(--rule);background:transparent}
html body[data-template][data-imported="true"] .card[data-composition="link"] h2{font-size:19px;line-height:1.35;letter-spacing:-.02em;margin:0;max-width:none}
html body[data-template][data-imported="true"] .card[data-composition="link"] h2 a{display:block;min-height:44px}
html body[data-template][data-imported="true"] .card[data-composition="feature"]{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);align-items:center;gap:clamp(32px,7vw,108px)}
html body[data-template][data-imported="true"] .card[data-composition="feature"]:nth-of-type(even){grid-template-columns:minmax(0,1fr) minmax(0,1.15fr)}
html body[data-template]:not([data-template="retail"])[data-imported="true"] .card[data-composition="feature"]:nth-of-type(even)>.section-gallery,html body[data-template]:not([data-template="retail"])[data-imported="true"] .card[data-composition="feature"]:nth-of-type(even)>img{order:2}
html body[data-template][data-imported="true"] .card img{display:block;width:100%;height:auto;aspect-ratio:auto;max-height:640px;object-fit:contain;border-radius:0;background:transparent}
html body[data-template][data-imported="true"] .card[data-composition="feature"] .section-gallery{display:block}
html body[data-template][data-imported="true"] .section-gallery{gap:24px;width:100%;min-width:0}
html body[data-template][data-imported="true"] .section-gallery figure{min-width:0;margin:0}
html body[data-template][data-imported="true"] .section-gallery figcaption{font-size:12px;letter-spacing:.01em;line-height:1.5;margin-top:14px;padding-top:12px;border-top:1px solid var(--rule)}
html body[data-template][data-imported="true"] .card[data-composition="collection"]{grid-column:1/-1;display:flex;flex-direction:column;align-items:stretch;gap:40px}
html body[data-template][data-imported="true"] .card[data-composition="collection"] .card-meta{order:-1}
html body[data-template][data-imported="true"] .card[data-composition="collection"] .card-meta>div{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start}
html body[data-template][data-imported="true"] .card[data-composition="collection"] img{height:360px;max-height:none;object-fit:contain}
html body[data-template][data-imported="true"] .section-gallery[data-image-count="1"]{grid-template-columns:minmax(0,1fr)}
html body[data-template][data-imported="true"] .section-gallery[data-image-count="3"],html body[data-template][data-imported="true"] .section-gallery[data-image-count="6"]{grid-template-columns:repeat(3,minmax(0,1fr))}
html body[data-template][data-imported="true"] .section-team .section-gallery{grid-template-columns:repeat(3,minmax(0,1fr))}
html body[data-template][data-imported="true"] .section-team .section-gallery[data-image-count="2"],html body[data-template][data-imported="true"] .section-team .section-gallery[data-image-count="4"]{grid-template-columns:repeat(2,minmax(0,1fr))}
html body[data-template][data-imported="true"] .section-team .section-gallery[data-image-count="5"]{grid-template-columns:repeat(5,minmax(0,1fr));gap:20px}
html body[data-template][data-imported="true"] .section-team[data-composition="collection"] img{height:240px;object-fit:contain;border-radius:0}
html body[data-template][data-imported="true"] .section-product[data-composition="collection"] img{height:300px}
html body[data-template][data-imported="true"] .card.section-testimonial .card-meta>div{display:block;max-width:980px;margin:auto}
html body[data-template][data-imported="true"] .section-testimonial h2{font-size:12px;text-transform:uppercase;letter-spacing:.12em;margin-bottom:36px}
html body[data-template][data-imported="true"] .section-testimonial blockquote{font-size:clamp(25px,3vw,42px);line-height:1.4;letter-spacing:-.025em;white-space:pre-line;margin:0;padding:0;border:0}
html body[data-template][data-imported="true"] .card.content-faq .card-meta>div{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:64px}
html body[data-template][data-imported="true"] .faq-list:only-child{grid-column:1/-1}
html body[data-template][data-imported="true"] .faq-list{min-width:0}
html body[data-template][data-imported="true"] .faq-item{border:0;border-bottom:1px solid var(--rule);border-radius:0;padding:0 0 24px;margin:0 0 24px;background:transparent}
html body[data-template][data-imported="true"] .faq-item summary{font-size:19px;line-height:1.45;letter-spacing:-.025em;padding:0;min-height:44px}
html body[data-template][data-imported="true"] .faq-item p{font-size:15px;margin-top:12px}
html body[data-template][data-imported="true"] .contact{margin:24px 0 0;padding:clamp(36px,6vw,88px);border-radius:0;gap:48px;min-width:0}
html body[data-template][data-imported="true"] .contact h2{font-size:clamp(42px,6vw,88px);line-height:1.05;font-weight:500;letter-spacing:-.055em;margin:12px 0 28px}
html body[data-template][data-imported="true"] .contact:has(.contact-empty){padding:32px 0;background:transparent!important;color:inherit!important;border-top:1px solid var(--rule);margin:32px 0 0}
html body[data-template][data-imported="true"] .contact:has(.contact-empty) :is(.contact-empty,.contact-links){color:inherit}
html body[data-template][data-imported="true"] .contact:has(.contact-empty) h2{font-size:28px;margin:0 0 12px}
html body[data-template][data-imported="true"] .contact:has(.contact-empty) .section-kicker{display:none}
html body[data-template][data-imported="true"] .footer{padding:36px 0;font-size:11px;line-height:1.7;border:0;gap:32px}
/* Ten compositions, using the same source order and customer palette. */
html body[data-template="story"][data-imported="true"]{background:#fff;color:#202420}
html body[data-template="story"][data-imported="true"] .hero-layout{display:grid;grid-template-columns:1.05fr 1fr;align-items:center}
html body[data-template="story"][data-imported="true"] .hero-image{aspect-ratio:4/5;max-height:620px}
html body[data-template="story"][data-imported="true"] .hero-copy h1{font-size:clamp(48px,5.9vw,88px)}
html body[data-template="studio"][data-imported="true"] .hero-layout{display:grid;grid-template-columns:1fr;padding-top:80px;gap:64px}
html body[data-template="studio"][data-imported="true"] .hero-copy{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:0 80px;align-items:end}
html body[data-template="studio"][data-imported="true"] .hero-copy h1{grid-column:1;grid-row:2/4;font-size:clamp(60px,8vw,128px);font-weight:400;max-width:14ch}
html body[data-template="studio"][data-imported="true"] .eyebrow{grid-column:1/-1}
html body[data-template="studio"][data-imported="true"] .hero-copy>p{grid-column:2;grid-row:2;margin:0 0 24px}
html body[data-template="studio"][data-imported="true"] .hero-copy>.button{grid-column:2;grid-row:3;justify-self:start;align-self:start}
html body[data-template="studio"][data-imported="true"] .hero-image{aspect-ratio:2.2/1;max-height:650px}
html body[data-template="services"][data-imported="true"] .hero-layout{display:grid;grid-template-columns:1.1fr 1fr;align-items:center;border-bottom:1px solid var(--rule)}
html body[data-template="services"][data-imported="true"] .hero-copy h1{font-size:clamp(46px,5.6vw,84px);letter-spacing:-.055em}
html body[data-template="services"][data-imported="true"] .hero-image{aspect-ratio:1/1;border-radius:50% 50% 0 0}
html body[data-template="dining"][data-imported="true"] .hero-layout{display:flex;flex-direction:column;gap:52px}
html body[data-template="dining"][data-imported="true"] .hero-copy{text-align:center;max-width:1020px;margin:0 auto}
html body[data-template="dining"][data-imported="true"] .hero-copy h1{font-family:Georgia,serif;font-weight:400;font-style:italic;max-width:18ch;margin:auto;font-size:clamp(54px,7vw,108px);letter-spacing:-.05em}
html body[data-template="dining"][data-imported="true"] .hero-copy>p{margin:28px auto;max-width:64ch}
html body[data-template="dining"][data-imported="true"] .eyebrow{justify-content:center}
html body[data-template="dining"][data-imported="true"] .visual{width:100%}
html body[data-template="dining"][data-imported="true"] .hero-image{aspect-ratio:2.3/1}
html body[data-template="wellness"][data-imported="true"] .hero-layout{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:80px}
html body[data-template="wellness"][data-imported="true"] .hero-copy h1{font-family:Georgia,serif;font-weight:400;letter-spacing:-.055em;font-size:clamp(52px,6vw,92px)}
html body[data-template="wellness"][data-imported="true"] .hero-image{aspect-ratio:4/5;border-radius:48% 48% 4px 4px}
html body[data-template="wellness"][data-imported="true"] .button{border-radius:40px}
html body[data-template="editorial"][data-imported="true"] .hero-layout{display:flex;flex-direction:column;gap:56px}
html body[data-template="editorial"][data-imported="true"] .hero-copy{display:grid;grid-template-columns:1.5fr 1fr;gap:0 80px;width:100%}
html body[data-template="editorial"][data-imported="true"] .hero-copy h1{font-size:clamp(60px,8vw,120px);font-family:Georgia,serif;font-weight:400;grid-row:2/4}
html body[data-template="editorial"][data-imported="true"] .hero-copy>p{margin:0 0 28px}
html body[data-template="editorial"][data-imported="true"] .visual{width:100%}
html body[data-template="editorial"][data-imported="true"] .hero-image{aspect-ratio:2.4/1}
html body[data-template="construction"][data-imported="true"] .hero-layout{display:grid;grid-template-columns:1.15fr 1fr;align-items:center;border-bottom:6px solid var(--accent)}
html body[data-template="construction"][data-imported="true"] .hero-image{aspect-ratio:5/6}
html body[data-template="construction"][data-imported="true"] .hero-copy h1{font-size:clamp(48px,5.5vw,84px);font-weight:750;letter-spacing:-.045em}
html body[data-template="hospitality"][data-imported="true"] .hero-layout{display:flex;flex-direction:column;gap:0;padding-top:28px}
html body[data-template="hospitality"][data-imported="true"] .visual{order:-1;width:100%}
html body[data-template="hospitality"][data-imported="true"] .hero-image{aspect-ratio:2.25/1;border-radius:0}
html body[data-template="hospitality"][data-imported="true"] .hero-copy{width:calc(100% - 120px);max-width:1100px;margin:-60px auto 0;padding:52px 64px!important;position:relative;border:0;display:grid;grid-template-columns:1.2fr 1fr;gap:0 56px}
html body[data-template="hospitality"][data-imported="true"] .hero-copy h1{font-family:Georgia,serif;font-size:clamp(40px,5vw,72px);font-weight:400;grid-column:1;grid-row:2/4}
html body[data-template="hospitality"][data-imported="true"] .hero-copy .eyebrow{grid-column:1/-1}
html body[data-template="hospitality"][data-imported="true"] .hero-copy>p{grid-column:2;grid-row:2;margin:0 0 24px}
html body[data-template="hospitality"][data-imported="true"] .hero-copy>.button{grid-column:2;grid-row:3;justify-self:start}
html body[data-template="consulting"][data-imported="true"] .hero-layout{display:grid;grid-template-columns:1.5fr 1fr;align-items:center;padding:96px 0}
html body[data-template="consulting"][data-imported="true"] .hero-copy h1{font-size:clamp(50px,5.7vw,86px);font-family:Georgia,serif;font-weight:400}
html body[data-template="consulting"][data-imported="true"] .hero-image{aspect-ratio:3/4;max-height:510px;border-radius:0}
html body[data-template="retail"][data-imported="true"] .hero-layout{display:grid;grid-template-columns:1fr 1.15fr;align-items:center;gap:56px}
html body[data-template="retail"][data-imported="true"] .hero-copy h1{font-size:clamp(52px,6.5vw,100px);font-weight:600}
html body[data-template="retail"][data-imported="true"] .hero-image{object-fit:contain;aspect-ratio:1/1}
html body[data-template="retail"][data-imported="true"] .card[data-composition="feature"]{grid-column:span 3;display:flex;flex-direction:column;align-items:stretch;gap:28px;padding:48px 0!important}
html body[data-template="retail"][data-imported="true"] .card[data-composition="feature"]>.section-gallery,html body[data-template="retail"][data-imported="true"] .card[data-composition="feature"]>img{order:0}
html body[data-template="retail"][data-imported="true"] .card[data-composition="feature"] img{height:380px;object-fit:contain}
html body[data-template="retail"][data-imported="true"] .card[data-composition="feature"] h2{font-size:30px}
html body[data-template="studio"][data-imported="true"] .card[data-composition="feature"],html body[data-template="studio"][data-imported="true"] .card[data-composition="feature"]:nth-of-type(even){display:flex;flex-direction:column;align-items:stretch;gap:40px}
html body[data-template="studio"][data-imported="true"] .card[data-composition="feature"] .card-meta{order:-1}
html body[data-template="studio"][data-imported="true"] .card[data-composition="feature"] .card-meta>div{display:grid;grid-template-columns:1fr 1fr;gap:64px}
html body[data-template="studio"][data-imported="true"] .card[data-composition="feature"] img{width:100%;max-height:560px;object-fit:contain}
html body[data-template="editorial"][data-imported="true"] .card h2,html body[data-template="dining"][data-imported="true"] .card h2,html body[data-template="hospitality"][data-imported="true"] .card h2{font-family:Georgia,serif;font-weight:400}
html body[data-template="dining"][data-imported="true"] .card[data-composition="feature"] h2{font-style:italic;font-size:clamp(36px,4vw,60px)}
html body[data-template="wellness"][data-imported="true"] .card[data-composition="feature"] img{border-radius:80px 80px 0 0}
html body[data-template="construction"][data-imported="true"] .card[data-composition="text"]{border-top-width:3px}
html body[data-template][data-imported="true"] .hero-layout[data-hero="text"]{display:block;padding:88px 0}
html body[data-template][data-imported="true"] .hero-layout[data-hero="text"] .hero-copy{display:block;max-width:1040px;width:100%;margin:0;padding:0!important}
html body[data-template][data-imported="true"] .hero-layout[data-hero="text"] h1{max-width:20ch;font-size:clamp(54px,8vw,120px)}
html body[data-template][data-imported="true"] .hero-layout[data-hero="text"] .hero-copy>p{max-width:65ch;margin:32px 0}
/* Consecutive short image entries share a portfolio rhythm; source order stays intact. */
html body[data-template][data-imported="true"] .hero-copy:not(:has(p)):not(:has(.button)){display:block;width:100%}
html body[data-template][data-imported="true"] .hero-copy:not(:has(p)):not(:has(.button)) h1{max-width:none}
html body[data-template][data-imported="true"] .card[data-density="compact"],html body[data-template][data-imported="true"] .card[data-density="compact"]:nth-of-type(even){grid-column:span 3;display:flex;flex-direction:column;align-items:stretch;gap:24px;padding:40px 0 48px!important}
html body[data-template][data-imported="true"] .card[data-density="compact"]>.section-gallery,html body[data-template][data-imported="true"] .card[data-density="compact"]>img{order:0!important;width:100%}
html body[data-template][data-imported="true"] .card[data-density="compact"] .card-meta{order:1}
html body[data-template][data-imported="true"] .card[data-density="compact"] .card-meta>div{display:block}
html body[data-template][data-imported="true"] .card[data-density="compact"] img{height:clamp(240px,28vw,380px);max-height:none;object-fit:contain;border-radius:0}
html body[data-template][data-imported="true"] .card[data-density="compact"] h2{font-size:clamp(24px,2.4vw,34px);line-height:1.2;letter-spacing:-.025em;max-width:none;margin-bottom:12px}
html body[data-template][data-imported="true"] .card[data-density="compact"] p{font-size:15px;line-height:1.7;max-width:48ch}
@media(min-width:761px){
 html body[data-template][data-imported="true"] .card[data-density="compact"]:first-child,html body[data-template][data-imported="true"] .card:not([data-density="compact"])+.card[data-density="compact"]{grid-column:1/span 3}
 html body[data-template][data-imported="true"] .card[data-density="compact"]+.card[data-composition="link"]{grid-column:1/span 2}
}
html body[data-template][data-imported="true"] .card[data-composition="logos"]{grid-column:1/-1;display:flex;flex-direction:column;gap:36px;padding:48px 0!important}
html body[data-template][data-imported="true"] .card[data-composition="logos"] .card-meta{order:-1}
html body[data-template][data-imported="true"] .card[data-composition="logos"] h2{font:inherit;font-size:14px;letter-spacing:.04em;margin:0;max-width:none}
html body[data-template][data-imported="true"] .card[data-composition="logos"] .section-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:32px;align-items:center}
html body[data-template][data-imported="true"] .card[data-composition="logos"] img{width:100%;height:80px;max-height:none;object-fit:contain;border-radius:0;background:transparent}
html body[data-template][data-imported="true"] .card[data-composition="logos"] figcaption{font-size:12px;text-align:center}
@media(max-width:1000px){
 html body[data-template][data-imported="true"] .hero-layout{gap:36px}
 html body[data-template][data-imported="true"] .hero-copy h1{font-size:clamp(42px,6vw,70px)}
 html body[data-template][data-imported="true"] .section-team .section-gallery[data-image-count="5"]{grid-template-columns:repeat(3,minmax(0,1fr))}
 html body[data-template="hospitality"][data-imported="true"] .hero-copy{width:calc(100% - 48px);padding:36px!important;gap:32px}
}
@media(max-width:760px){
 html body[data-template][data-imported="true"]{--page-gutter:24px;--section-space:56px}
 html body[data-template][data-imported="true"] .nav{min-height:80px;padding:20px 0;gap:20px;flex-wrap:wrap}
 html body[data-template][data-imported="true"] .brand-mark img{max-width:150px;max-height:48px}
 html body[data-template][data-imported="true"] .nav-links{display:flex;gap:6px 22px;flex-wrap:wrap;width:100%;justify-content:flex-start;font-size:12px}
 html body[data-template][data-imported="true"] .nav-links a{padding:4px 0}
 html body[data-template][data-imported="true"] .hero-layout{display:flex;flex-direction:column;gap:36px;padding:44px 0 56px}
 html body[data-template][data-imported="true"] .hero-copy{display:block;width:100%;text-align:left}
 html body[data-template][data-imported="true"] .hero-copy h1,html body[data-template][data-imported="true"] .hero-layout[data-hero="text"] h1{font-size:clamp(42px,10.8vw,66px);line-height:1.06;letter-spacing:-.055em;margin:0;max-width:18ch}
 html body[data-template][data-imported="true"] .hero-copy>p{font-size:15px;line-height:1.75;margin:24px 0}
 html body[data-template][data-imported="true"] .eyebrow{margin-bottom:22px;justify-content:flex-start}
 html body[data-template][data-imported="true"] .visual{width:100%;order:0}
 html body[data-template][data-imported="true"] .hero-image{aspect-ratio:5/4;max-height:500px;height:auto}
 html body[data-template="wellness"][data-imported="true"] .hero-image{aspect-ratio:1/1}
 html body[data-template="hospitality"][data-imported="true"] .visual{order:-1}
 html body[data-template="hospitality"][data-imported="true"] .hero-copy{width:calc(100% - 24px);margin:-60px auto 0;padding:28px 20px!important}
 html body[data-template][data-imported="true"] .cards{grid-template-columns:minmax(0,1fr);gap:0}
 html body[data-template][data-imported="true"] .card[data-composition],html body[data-template][data-imported="true"] .card[data-composition]:nth-of-type(even){grid-column:1/-1;display:flex;flex-direction:column;align-items:stretch;gap:28px;grid-template-columns:minmax(0,1fr)}
 html body[data-template][data-imported="true"] .card[data-composition]>.section-gallery,html body[data-template][data-imported="true"] .card[data-composition]>img{order:0!important}
 html body[data-template][data-imported="true"] .card[data-density="compact"],html body[data-template][data-imported="true"] .card[data-density="compact"]:nth-of-type(even){grid-column:1/-1;padding:32px 0!important;gap:20px}
 html body[data-template][data-imported="true"] .card[data-density="compact"] img{height:auto;max-height:420px}
 html body[data-template][data-imported="true"] .card[data-composition="link"]{padding:20px 0!important;display:block}
 html body[data-template][data-imported="true"] .card[data-composition="heading"]{padding:48px 0 24px!important}
 html body[data-template][data-imported="true"] .card[data-composition] .card-meta>div,html body[data-template][data-imported="true"] .card.content-faq .card-meta>div{display:block}
 html body[data-template][data-imported="true"] .card h2{font-size:32px;line-height:1.16;margin-bottom:20px}
 html body[data-template][data-imported="true"] .card[data-composition="link"] h2{font-size:19px;margin:0}
 html body[data-template][data-imported="true"] .card p{font-size:15px;line-height:1.8}
 html body[data-template][data-imported="true"] .visual .section-gallery[data-image-count]{grid-template-columns:minmax(0,1fr)}
 html body[data-template][data-imported="true"] .card .section-gallery,html body[data-template][data-imported="true"] .section-team .section-gallery[data-image-count]{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 16px}
 html body[data-template][data-imported="true"] .card .section-gallery[data-image-count="1"],html body[data-template][data-imported="true"] .card[data-composition="feature"] .section-gallery{grid-template-columns:minmax(0,1fr)}
 html body[data-template][data-imported="true"] .card[data-composition="collection"] img{height:220px}
 html body[data-template][data-imported="true"] .section-team[data-composition="collection"] img{height:170px}
 html body[data-template][data-imported="true"] .card[data-composition="logos"] .section-gallery{grid-template-columns:repeat(3,minmax(0,1fr));gap:24px 16px}
 html body[data-template][data-imported="true"] .card[data-composition="logos"] img{height:60px}
 html body[data-template][data-imported="true"] .contact{padding:32px 24px;display:block;margin-top:16px}
 html body[data-template][data-imported="true"] .contact h2{font-size:48px}
 html body[data-template][data-imported="true"] .contact .button{margin-top:28px}
 html body[data-template][data-imported="true"] .footer{align-items:flex-start}
}
@media(prefers-reduced-motion:reduce){html body[data-template][data-imported="true"] .button,html body[data-template][data-imported="true"] .button:hover{transition:none;transform:none}}
`;
