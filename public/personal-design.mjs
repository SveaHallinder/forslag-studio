// Derived presentation only: no project fields or source copy are rewritten.
export function personalProfile(p) {
  const name=String(p.name||'').trim(),parts=name.split(/\s+/),description=String(p.description||'');
  return parts.length>=2&&parts.length<=4&&!/\b(?:AB|Ltd|Inc|byrå|förlag|studio|agency)\b/i.test(name)&&/journalist|författare|author|novelist|poet|dramatiker|fotograf|photographer|konstnär/i.test(p.headline||'')&&description.toLocaleLowerCase().startsWith(parts[0].toLocaleLowerCase()+' ');
}
export function publicationCard(card) {
  return (card.gallery?.length===1)&&/bokomslag|book cover/i.test(card.gallery[0].label||'');
}
export const personalDesignCSS=`
/* Distinct visual hierarchy for a biography and its portrait. */
html body[data-template][data-imported="true"] .hero-layout[data-profile="person"]{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr);align-items:center;gap:clamp(32px,5vw,72px);padding:clamp(28px,4vw,56px);margin:28px 0 64px;background:var(--brand-surface,transparent)}
html body[data-template][data-imported="true"] .hero-layout[data-profile="person"][data-hero="text"]{grid-template-columns:minmax(0,1fr)}
html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .no-image{display:none}
html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .hero-copy{width:auto;display:block;margin:0;position:static;order:0;background:transparent}
html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .profile-name{font-size:clamp(58px,7vw,104px);font-weight:500;line-height:.98;letter-spacing:-.06em;max-width:10ch;color:inherit;margin:0 0 28px;text-wrap:balance;white-space:normal}
html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] h1{font-size:clamp(22px,2.1vw,30px);line-height:1.3;letter-spacing:-.025em;max-width:32ch;font-weight:500;margin:0 0 24px}
html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .hero-copy>p:not(.profile-name){font-size:15px;line-height:1.75;max-width:58ch;margin:0 0 26px}
html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .visual{order:0;position:relative;inset:auto;width:100%;margin:0;padding:0}
html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .hero-image{aspect-ratio:4/5;height:auto;max-height:720px;border-radius:0;object-fit:cover;object-position:50% var(--hero-position)}
html body[data-template][data-imported="true"] .card[data-publication="true"],html body[data-template][data-imported="true"] .card[data-publication="true"]:nth-of-type(even){grid-column:span 3;display:flex;flex-direction:column;align-items:stretch;gap:28px;padding:40px 0 64px!important}
html body[data-template][data-imported="true"] .card[data-publication="true"]>.section-gallery{order:0!important;display:block;padding:36px;background:color-mix(in srgb,var(--accent) 6%,var(--brand-background,#fff))}
html body[data-template][data-imported="true"] .card[data-publication="true"] .card-meta{order:1}
html body[data-template][data-imported="true"] .card[data-publication="true"] .card-meta>div{display:block}
html body[data-template][data-imported="true"] .card[data-publication="true"] img{width:100%;height:340px;max-height:none;object-fit:contain;border-radius:0;background:transparent}
html body[data-template][data-imported="true"] .card[data-publication="true"] h2{font-size:clamp(26px,2.7vw,38px);max-width:none;margin:0 0 18px}
html body[data-template][data-imported="true"] .card[data-publication="true"] p{font-size:15px;line-height:1.75}
@media(max-width:760px){
 html body[data-template][data-imported="true"] .hero-layout[data-profile="person"]{display:flex;flex-direction:column;gap:32px;padding:28px 18px;margin:16px -8px 48px}
 html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .profile-name{order:0;font-size:clamp(52px,14vw,84px);max-width:12ch;margin-bottom:24px}
 html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] h1{order:1;font-size:24px}
 html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .hero-copy{display:contents}
 html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .visual{order:2}
 html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .hero-copy>p:not(.profile-name){order:3}
 html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .button{order:4}
 html body[data-template][data-imported="true"] .hero-layout[data-profile="person"] .eyebrow{order:-1}
 html body[data-template][data-imported="true"] .card[data-publication="true"],html body[data-template][data-imported="true"] .card[data-publication="true"]:nth-of-type(even){grid-column:1/-1;gap:24px;padding:32px 0 48px!important}
 html body[data-template][data-imported="true"] .card[data-publication="true"] img{height:300px}
}
`;
