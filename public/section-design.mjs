export const sectionKinds={generic:'Standard',service:'Tjänster',product:'Produkter',team:'Team',case:'Kundcase',pricing:'Prislista',testimonial:'Omdömen',faq:'Frågor & svar'};
export function detectSectionKind(card={}) {
  if(Object.hasOwn(sectionKinds,card.kind))return card.kind;
  const title=String(card.title||'').trim().toLowerCase();
  if(/\b(faq|frequently asked|questions|testimonials|reviews)\b|vanliga frågor|frågor och svar|kundomdömen|kundrecensioner|vad .*kunder säger/.test(title))return /faq|frågor|questions|frequently/.test(title)?'faq':'testimonial';
  if(/\b(pricing|prices|price list|priser|prislista|prisplaner|abonnemang)\b/.test(title))return 'pricing';
  if(/\b(team|personal|medarbetare|kollegor|our people|meet the|möt oss)\b/.test(title))return 'team';
  if(/\b(kundcase|kundprojekt|referensprojekt|case stud(?:y|ies)|customer stor(?:y|ies))\b/.test(title))return 'case';
  if(/\b(produkter|sortiment|kollektion|products|collection|shop)\b/.test(title))return 'product';
  if(/tjänster|behandlingar|services|treatment/.test(title))return 'service';
  return 'generic';
}
export const sectionDesignCSS=`
html body[data-template] .card.section-product{display:flex;flex-direction:column;align-items:stretch;grid-column:1/-1;gap:24px;padding:28px!important}
html body[data-template] .section-product img{height:320px;object-fit:contain;border-radius:4px}
html body[data-template] .card.section-team{display:grid;grid-template-columns:minmax(0,.65fr) minmax(0,1fr);gap:40px;align-items:center}
html body[data-template] .section-team img{max-height:400px;height:400px;object-fit:contain;border-radius:120px 120px 12px 12px}
html body[data-template] .card.section-case{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:48px;padding-block:48px!important}
html body[data-template] .card.section-service{padding:32px!important;border-left:4px solid var(--accent);border-radius:0}
html body[data-template] .card.section-pricing{display:block;grid-column:1/-1;padding:40px!important;border-top:3px solid currentColor}
html body[data-template] .section-pricing .card-meta{max-width:none}.section-pricing p{font-variant-numeric:tabular-nums;line-height:2.2!important;max-width:none!important}
html body[data-template] .card.section-testimonial{display:block;grid-column:1/-1;text-align:left;padding:48px!important;border-left:4px solid var(--accent)}
.section-testimonial blockquote{margin:0;padding:0;white-space:pre-line;font-size:clamp(22px,3vw,34px);line-height:1.6;overflow-wrap:anywhere}.section-testimonial .card-meta{max-width:900px!important}.section-testimonial h2{font-size:18px!important;margin-bottom:28px!important}.section-testimonial img{max-height:180px!important;width:auto;margin-bottom:28px}
html body[data-template] .card.section-faq{grid-column:1/-1}
@media(max-width:760px){html body[data-template] .card:is(.section-product,.section-team,.section-case){grid-column:1/-1;grid-template-columns:minmax(0,1fr);gap:24px}html body[data-template] .card:is(.section-pricing,.section-service,.section-testimonial){padding:24px!important}.section-team img{height:auto!important;max-height:360px!important}}
`;
