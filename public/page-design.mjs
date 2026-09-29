import {sectionComposition,compactCardIndices,compactTextIndices} from './composition.mjs';
import {publicationCard} from './personal-design.mjs';
import {brandPalette,bestInk} from './branding.mjs';

// Derived presentation only: articles, source order and editable card indices stay intact.
export function pageSectionPlan(cards) {
  const compact=compactCardIndices(cards),textCompact=compactTextIndices(cards);
  let feature=0,showcase=0,chapter=0,index=0;
  return cards.map((card,i)=>{
    const composition=sectionComposition(card);
    let role=composition;
    if(publicationCard(card))role='publication';
    else if(composition==='heading')role='chapter';
    else if(composition==='link')role='index';
    else if(composition==='text'&&(!card.kind||card.kind==='generic')&&(i===0||publicationCard(cards[i+1]||{})))role='introduction';
    else if(composition==='text'&&i>0&&sectionComposition(cards[i-1])==='heading'&&sectionComposition(cards[i+1]||{})==='feature'&&card.description.length<350)role='dispatch';
    else if(composition==='feature'&&i>1&&sectionComposition(cards[i-2])==='heading'&&sectionComposition(cards[i-1])==='text'&&cards[i-1].description.length<350)role='news';
    else if(compact.has(i))role='showcase';
    else if(textCompact.has(i))role='summary';
    if(role!=='showcase')showcase=0;
    if(role!=='index')index=0;
    return {role,position:role==='showcase'?showcase++%4:role==='index'?index++:0,side:role==='feature'?feature++%2:0,chapter:role==='chapter'||role==='introduction'?++chapter:0};
  });
}

export function pageDesignFamily(id) {
  if(['atelier','editorial','retail'].includes(id))return 'editorial';
  if(['cinema','dining','hospitality'].includes(id))return 'cinematic';
  if(id==='pop')return 'playful';
  if(['precision','services','construction','consulting'].includes(id))return 'structured';
  return 'gallery';
}

export function pageDesignCSS(p) {
  const b=brandPalette(p.branding),family=pageDesignFamily(p.templateId),dark=p.templateId==='cinema';
  const paper=dark?'#17201c':b.background,ink=dark?'#fffaf1':b.text;
  const s='html body[data-template][data-imported][data-page-design]';
  const c=`${s} .cards>.card[data-flow]`;
  return `/* Whole-page composition, independent of persisted content. */
${s}{--flow-paper:${paper};--flow-ink:${ink};--flow-soft:color-mix(in srgb,var(--accent) 7%,var(--flow-paper));--flow-line:color-mix(in srgb,currentColor 20%,transparent);--flow-radius:0px;--flow-accent-ink:${bestInk(p.accent)};--flow-gap:clamp(28px,4vw,64px)}
${s} .cards{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(44px,6vw,92px) var(--flow-gap);padding:clamp(48px,6vw,88px) 0;margin:0;align-items:start}
${c}{grid-column:1/-1;display:block;min-width:0;max-width:none;margin:0!important;padding:0!important;border:0;border-radius:0;background:transparent;color:inherit;box-shadow:none;align-self:start}
${c}::before,${c}::after{content:none}
${c}>:first-child{order:0!important}
${c} .card-meta{display:block;max-width:none;margin:0;padding:0;border:0;min-width:0}
${c} .card-meta>div{display:block}
${c} h2,${c} h3{font-size:clamp(28px,3.4vw,50px);line-height:1.13;letter-spacing:-.04em;font-weight:500;max-width:24ch;margin:0 0 24px;overflow-wrap:anywhere;text-wrap:balance;color:inherit}
${c} h2 a,${c} h3 a{text-decoration:none;color:inherit}
${c} h2 a:hover,${c} h3 a:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:6px}
${c} .section-link-arrow{display:inline-block;font:400 .65em/1 system-ui;white-space:nowrap;vertical-align:middle}
${c} :is(p,blockquote){font-size:16px;line-height:1.8;letter-spacing:0;max-width:64ch;color:inherit;margin:0;white-space:pre-line;overflow-wrap:anywhere}
${c} .copy-part{display:block;white-space:pre-line}
${c} p:has(>.copy-part){white-space:normal}
${c} .copy-part+.copy-part{margin-top:1.2em}
${c} img{display:block;width:100%;height:auto;max-height:660px;aspect-ratio:auto;object-fit:contain;border-radius:var(--flow-radius);background:transparent;padding:0}
${c} .section-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;min-width:0;width:100%;order:0}
${c} .section-gallery[data-image-count="1"]{display:block}
${c} .section-gallery figure{min-width:0;margin:0}
${c} figcaption{font-size:11px;line-height:1.6;letter-spacing:.02em;color:inherit;opacity:.72;white-space:pre-line;margin:12px 0 0;padding:0;border:0}
${c} .flow-index{display:block;font:500 10px/1.4 system-ui;letter-spacing:.16em;margin-bottom:22px;opacity:.65}
${c}[data-flow=chapter]{padding-top:28px!important;border-top:1px solid var(--flow-line)}
${c}[data-flow=chapter]:first-child{border-top:0;padding-top:0!important}
${c}[data-flow=chapter]{margin-bottom:-16px!important}
${c}[data-flow=chapter] .card-meta>div{display:flex;align-items:baseline;gap:24px}
${c}[data-flow=chapter] .flow-index{flex:none;margin:0}
${c}[data-flow=chapter] h2{font-size:clamp(44px,6vw,88px);font-weight:400;letter-spacing:-.055em;max-width:none;margin:0}
${c}[data-flow=introduction] .card-meta>div{display:grid;grid-template-columns:1fr 1fr;gap:20px var(--flow-gap);align-items:start}
${c}[data-flow=introduction] .flow-index{grid-column:1/-1;margin:0}
${c}[data-flow=introduction] p{font-size:clamp(18px,1.8vw,24px);line-height:1.6;max-width:48ch}
${c}[data-flow=text]{border-top:1px solid var(--flow-line);padding-top:32px!important}
${c}[data-flow=text] .card-meta>div{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:var(--flow-gap)}
${c}[data-flow=text] h2{font-size:clamp(26px,2.8vw,42px)}
${c}[data-flow=index]{grid-column:span 4;border-top:1px solid var(--flow-line);padding-top:20px!important}
${c}[data-flow=index] h2{font-size:22px;max-width:none;margin:0}
${c}[data-flow=index] a{display:block;min-height:44px}
${c}[data-flow=dispatch]{grid-column:span 4;border-top:1px solid var(--flow-line);padding-top:24px!important}
${c}[data-flow=dispatch] h2{font-size:clamp(28px,3vw,42px)}
${c}[data-flow=news]{grid-column:span 8;display:flex;flex-direction:column;gap:28px}
${c}[data-flow=news] img{max-height:540px}
${c}[data-flow=news] h2{font-size:clamp(28px,3.3vw,46px)}
${c}[data-flow=feature]{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:var(--flow-gap);align-items:center}
${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1fr) minmax(0,.72fr)}
${c}[data-flow=feature][data-flow-side="1"]>.card-meta{order:-1}
${c}[data-flow=feature] .section-gallery img{max-height:580px}
${c}[data-flow=collection]{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:var(--flow-gap);align-items:center}
${c}[data-flow=collection]>.section-gallery{background:var(--flow-soft);border-radius:var(--flow-radius);padding:clamp(20px,3vw,40px);align-items:center}
${c}[data-flow=collection] .section-gallery img{height:auto;max-height:460px;object-fit:contain;background:transparent}
${c}[data-flow=collection]>.card-meta{order:0;margin:0}
${c}[data-flow=showcase]{grid-column:span 6;display:flex;flex-direction:column;gap:24px}
${c}[data-flow=showcase]>.card-meta{order:0;margin:0}
${c}[data-flow=showcase] img{aspect-ratio:4/3;max-height:none;object-fit:cover}
${c}[data-flow=showcase] h2{font-size:clamp(24px,2.8vw,40px);max-width:none;margin:0 0 12px}
${c}[data-flow=showcase] p{font-size:14px;line-height:1.65}
${c}[data-flow=publication]{grid-column:span 6;display:flex;flex-direction:column;gap:28px}
${c}[data-flow=publication] img{height:340px;max-height:none;aspect-ratio:auto;object-fit:contain;border-radius:0;padding:24px;background:var(--flow-soft)}
${c}[data-flow=publication]>.section-gallery{padding:0;background:transparent}
${c}[data-flow=publication] h2{font-size:30px;max-width:none}
${c}[data-flow=publication] p{font-size:15px}
${c}[data-flow=summary]{grid-column:span 4;border-top:1px solid var(--flow-line);padding-top:28px!important}
${c}[data-flow=summary] h2{font-size:25px}
${c}[data-flow=logos]{display:grid;grid-template-columns:minmax(140px,.3fr) minmax(0,1fr);gap:48px;align-items:center;border-block:1px solid var(--flow-line);padding:36px 0!important}
${c}[data-flow=logos]>.card-meta{order:-1}
${c}[data-flow=logos] h2{font-size:16px;letter-spacing:0;line-height:1.5;margin:0}
${c}[data-flow=logos] .section-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:24px;align-items:center;background:transparent;padding:0}
${c}[data-flow=logos] img{height:56px;max-height:56px;object-fit:contain;background:transparent;border-radius:0}
${c}[data-flow=logos] figcaption{font-size:10px}
${c}.section-testimonial{padding:clamp(32px,6vw,80px)!important;background:var(--flow-soft);color:var(--flow-ink);border:0}
${c}.section-testimonial .card-meta>div{display:block;max-width:900px;margin:auto}
${c}.section-testimonial h2{font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:32px}
${c}.section-testimonial blockquote{font-size:clamp(24px,3vw,42px);line-height:1.45;letter-spacing:-.02em}
${c}.content-faq .card-meta>div{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:var(--flow-gap)}
${c} .faq-list{min-width:0}
${c} .faq-list:only-child{grid-column:1/-1}
${c} .faq-item{padding:20px 0;margin:0;border:0;border-bottom:1px solid var(--flow-line);background:transparent;border-radius:0}
${c} .faq-item summary{font-size:20px;line-height:1.5;cursor:pointer;min-height:44px;list-style:revert}
${c} .faq-item p{margin-top:14px;font-size:15px}
${c} .card-meta>div:has(>h2:empty),${c} .card-meta>div:has(>h3:empty){display:block;max-width:900px}
${c} :is(h2,h3):empty{display:none}
${s} .about{padding:64px 0;border-top:1px solid var(--flow-line);gap:var(--flow-gap)}
${s} .about p{color:inherit;font-size:18px;line-height:1.7}
${family==='editorial'?`
${c} h2,${c} h3{font-family:Georgia,serif;font-weight:400}
${c}[data-flow=showcase]{grid-column:span 5}
${c}[data-flow=showcase][data-flow-position="0"],${c}[data-flow=showcase][data-flow-position="3"]{grid-column:span 7}
${c}[data-flow=showcase][data-flow-position="1"],${c}[data-flow=showcase][data-flow-position="2"]{padding-top:72px!important}
${c}[data-flow=showcase] img{aspect-ratio:5/4}
${c}[data-flow=showcase][data-flow-position="1"] img,${c}[data-flow=showcase][data-flow-position="2"] img{aspect-ratio:1/1}
${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:minmax(0,1fr) minmax(0,.66fr);padding:48px!important;background:var(--flow-soft)}
${c}[data-flow=chapter] h2{font-style:italic}
`:''}
${family==='cinematic'?`
${s} .cards{row-gap:clamp(64px,9vw,132px)}
${c} h2,${c} h3{font-family:Georgia,serif;font-weight:400}
${c}[data-flow=chapter] .card-meta>div{justify-content:center;text-align:center}
${c}[data-flow=chapter]{border:0}
${c}[data-flow=feature]{grid-template-columns:1fr;gap:32px}
${c}[data-flow=feature]>img,${c}[data-flow=feature]>.section-gallery{width:100%}
${c}[data-flow=feature]>img{max-height:640px;aspect-ratio:2/1;object-fit:cover}
${c}[data-flow=feature]>.card-meta{order:0!important}
${c}[data-flow=feature] .card-meta>div{display:grid;grid-template-columns:1fr 1fr;gap:var(--flow-gap)}
${c}[data-flow=feature][data-flow-side="1"]{grid-template-columns:1fr .85fr;align-items:center}
${c}[data-flow=feature][data-flow-side="1"] .card-meta>div{display:block}
${c}[data-flow=showcase]{text-align:center}
${c}[data-flow=showcase] h2,${c}[data-flow=showcase] p{margin-inline:auto}
${c}[data-flow=showcase] img{aspect-ratio:1/1}
${c}[data-flow=index] h2{font-size:28px}
`:''}
${family==='playful'?`
${s}{--flow-radius:28px}
${s} .cards{gap:24px;padding-top:24px}
${c}:not([data-flow=chapter]):not([data-flow=logos]){background:var(--flow-paper);color:var(--flow-ink);border-radius:32px;padding:36px!important;border:0}
${c} h2,${c} h3{font-family:'Arial Rounded MT Bold','Trebuchet MS',sans-serif;font-weight:800;letter-spacing:-.045em}
${c}[data-flow=chapter]{border:0;padding:40px 8px 4px!important}
${c}[data-flow=index]{background:var(--accent)!important;color:var(--flow-accent-ink)!important}
${c}[data-flow=showcase]{grid-column:span 6}
${c}[data-flow=showcase][data-flow-position="2"],${c}[data-flow=showcase][data-flow-position="3"]{background:var(--accent);color:var(--flow-accent-ink)}
${c}[data-flow=showcase] img{border-radius:20px;aspect-ratio:1/1}
${c}[data-flow=collection]{background:var(--flow-ink)!important;color:var(--flow-paper)!important}
${c}[data-flow=collection]>.section-gallery{padding:16px;background:transparent}
${c}[data-flow=introduction] .card-meta>div{display:block;max-width:900px}
`:''}
${family==='structured'?`
${s}{--flow-radius:12px}
${s} .cards{gap:28px;padding-top:24px}
${c}[data-flow=chapter],${c}[data-flow=introduction]{padding:24px 0 16px!important;border:0}
${c}[data-flow=feature]{background:var(--flow-soft);padding:clamp(28px,4vw,56px)!important;border-radius:20px}
${c}[data-flow=feature][data-flow-side="1"]{background:var(--flow-ink);color:var(--flow-paper)}
${c}[data-flow=feature][data-flow-side="1"] .card-meta h2,${c}[data-flow=feature][data-flow-side="1"] .card-meta p{color:inherit}
${c}[data-flow=summary],${c}[data-flow=index]{padding:28px!important;background:var(--flow-soft);border:0;border-radius:16px;align-self:stretch}
${c}[data-flow=showcase]{background:var(--flow-soft);padding:20px!important;border-radius:20px}
${c}[data-flow=showcase]>.card-meta{padding:4px 8px 12px}
${c}[data-flow=collection]{padding:48px 0!important}
${c}[data-flow=text]{margin:36px 0!important}
`:''}
${family==='gallery'?`
${c}[data-flow=showcase]{grid-column:span 6}
${c}[data-flow=feature][data-flow-side="1"]{padding:48px!important;background:var(--flow-soft);color:var(--flow-ink)}
${c}[data-flow=chapter] h2{font-size:clamp(48px,7vw,104px)}
${c}[data-flow=collection]{grid-template-columns:1fr}
${c}[data-flow=collection]>.card-meta{order:-1}
${c}[data-flow=collection] .card-meta>div{display:grid;grid-template-columns:1fr 1fr;gap:var(--flow-gap)}
`:''}
@media(max-width:900px){
${s} .cards{column-gap:28px}
${c}[data-flow=logos]{grid-template-columns:1fr;gap:24px}
${c}[data-flow=feature][data-flow-side="1"]{padding:28px!important}
${c}[data-flow=showcase][data-flow-position]{grid-column:span 6;padding-top:0!important}
${c}[data-flow=publication] img{height:300px}
}
@media(max-width:760px){
${s} .cards{display:grid;grid-template-columns:minmax(0,1fr);gap:40px;padding:40px 0}
${c}[data-flow],${c}[data-flow]:nth-child(even),${c}[data-flow=showcase][data-flow-position]{grid-column:1/-1;display:flex;flex-direction:column;align-items:stretch;gap:24px;padding:0!important;margin:0!important}
${c}[data-flow] .card-meta>div,${c}[data-flow].content-faq .card-meta>div{display:block}
${c}[data-flow=chapter]{padding-top:24px!important;gap:0}
${c}[data-flow=chapter] .card-meta>div{display:flex;align-items:baseline;gap:16px;text-align:left;justify-content:flex-start}
${c}[data-flow=chapter] h2{font-size:44px;letter-spacing:-.04em}
${c} h2,${c} h3{font-size:30px;max-width:none;margin-bottom:18px}
${c} p,${c} blockquote{font-size:15px;line-height:1.75;max-width:none}
${c}[data-flow=introduction] p{font-size:19px}
${c}[data-flow=text],${c}[data-flow=index],${c}[data-flow=summary]{padding-top:24px!important}
${c}[data-flow=index] h2{font-size:24px;margin:0}
${c}[data-flow=feature]>.card-meta,${c}[data-flow=feature][data-flow-side="1"]>.card-meta{order:0!important}
${c}[data-flow=feature]>img{aspect-ratio:auto;max-height:480px;object-fit:contain}
${c}[data-flow=collection]>.section-gallery{padding:20px}
${c}[data-flow=collection]>.card-meta{order:0}
${c}[data-flow=showcase] img{aspect-ratio:4/3}
${c}[data-flow=publication] img{height:320px}
${c}[data-flow=logos]{padding:28px 0!important}
${c}[data-flow=logos] .section-gallery{grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
${c}[data-flow=logos]>.card-meta{order:-1}
${c}.section-testimonial{padding:28px!important}
${c}.section-testimonial blockquote{font-size:25px}
${c} .faq-item summary{font-size:18px}
${c} .flow-index{margin-bottom:16px}
${family==='playful'||family==='structured'?`${c}[data-flow=feature],${c}[data-flow=collection],${c}[data-flow=showcase],${c}[data-flow=publication],${c}[data-flow=index],${c}[data-flow=summary]{padding:24px!important}`:''}
${family==='editorial'||family==='gallery'?`${c}[data-flow=feature][data-flow-side="1"]{padding:24px!important}`:''}
}
`;
}
