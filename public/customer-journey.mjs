import {customerText} from './customer-language.mjs';
// Choose only destinations supplied by the business. Rendering never activates
// a booking system or invents an order, price, availability or contact address.
export function customerJourney(p) {
  const anchors=new Set(['#start','#kontakt',...(p.cards?.length?['#erbjudande']:[]),...(p.about?['#om']:[]),...(p.cards||[]).filter(c=>c.anchor).map(c=>'#'+c.anchor)]);
  const valid=href=>{if(anchors.has(href))return true;try{const u=new URL(href);return ['https:','http:','mailto:','tel:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
  const navigation=(p.navigation||[]).filter(n=>valid(n.href));
  const booking=navigation.filter(n=>/^(boka(?:\s+(?:bord|tid|besök|nu))?|bokning|book(?:\s+(?:a table|a visit|now))?|reservations?|reserve(?: a table)?|rezerv[aă](?:\s+(?:o mas[aă]|acum))?|rezerv[aă]ri|programare)$/i.test(n.label.trim()));
  const menu=navigation.find(n=>/^(meny|menu|meni[uú])$/i.test(n.label.trim()));
  const profile=navigation.find(n=>/^(Instagram|Facebook|TikTok)$/i.test(n.label.trim()));
  const words=customerText(p).journey;
  const contact=p.requestForm?{href:p.requestForm.url,label:p.requestForm.kind==='booking'?(p.requestForm.url.includes('/booking.html?')?words.booking:words.request):words.enquiry}:p.email?{href:'mailto:'+p.email,label:words.email}:p.phone?{href:'tel:'+p.phone.replace(/[^+\d]/g,''),label:words.phone}:navigation.find(n=>/^(kontakt|kontakta oss|contact|contact us)$/i.test(n.label.trim())&&!n.href.startsWith('#'))||profile;
  const primary=valid(p.ctaHref)?{href:p.ctaHref,label:p.cta}:p.requestForm&&contact?contact:booking.length===1?booking[0]:['cafe','dining'].includes(p.templateId)&&menu?menu:contact;
  const directions=p.address?{href:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.address),label:words.directions}:null;
  return {primary:primary||null,contact:contact||null,directions,menu,words};
}
export function renderMobileJourney(p,escape) {
  const {primary,directions,words}=customerJourney(p),items=[primary,directions].filter((item,index,array)=>item&&!array.slice(0,index).some(previous=>previous?.href===item.href));
  if(!items.length)return '';
  return `<nav class="customer-mobile-actions" aria-label="${escape(words.next)}" data-action-count="${items.length}">${items.map(item=>`<a aria-label="${escape(item.label)}" href="${escape(item.href)}"${/^https?:/.test(item.href)?' target="_blank" rel="noopener noreferrer"':''}><span class="customer-action-label">${escape(item.label)}</span><span aria-hidden="true">↗</span></a>`).join('')}</nav>`;
}
export const customerJourneyCSS=`
/* Legible next steps, with room reserved for the mobile action bar. */
html body[data-template][data-imported] .contact.site-contact .ending-action{border-radius:0;min-height:48px;min-width:0;max-width:100%;padding:14px 18px;gap:20px}
html body[data-template][data-imported] .contact.site-contact .ending-action-label{position:static;clip-path:none;width:auto;height:auto;white-space:normal;overflow:visible;font-size:14px;line-height:1.45;overflow-wrap:anywhere}
html body[data-template][data-imported] .contact.site-contact .ending-action svg{width:20px;height:20px;flex:none}
html body[data-template][data-imported] .contact.site-contact .ending-invitation{flex-wrap:wrap}
html body[data-template] .ending-map{display:inline-flex;align-items:center;gap:16px;min-height:44px;margin-top:10px;text-decoration:underline;text-underline-offset:5px}
html body[data-template] .copy-part{display:block;white-space:pre-line}
html body[data-template] .copy-part+.copy-part{margin-top:1.2em}
html body[data-template] .customer-mobile-actions{display:none}
@media(max-width:620px){
 html body[data-template]:has(.customer-mobile-actions){padding-bottom:calc(100px + env(safe-area-inset-bottom,0px))}
 html body[data-template] .customer-mobile-actions{position:fixed;z-index:15;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.65fr);gap:8px;padding:8px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);background:var(--brand-header-background,#fff);color:var(--brand-header-text,#202420);box-shadow:0 6px 24px #00000016;border-radius:12px}
 html body[data-template] .customer-mobile-actions[data-action-count="1"]{grid-template-columns:minmax(0,1fr)}
 html body[data-template] .customer-mobile-actions a{min-width:0;min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;font-family:inherit;font-weight:600;font-size:13px;line-height:1.4;overflow-wrap:anywhere;border-radius:6px}
 html body[data-template] .customer-mobile-actions a:first-child{background:var(--accent);color:var(--accent-ink)}
 html body[data-template] .customer-action-label{min-width:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
 html body[data-template] .customer-mobile-actions a:focus-visible{outline:2px solid currentColor;outline-offset:2px}
 html body[data-template]:has(.mobile-menu[open]) .customer-mobile-actions{visibility:hidden}
 html body[data-template][data-imported] .contact.site-contact .ending-action{padding:12px 14px}
}
@media print{html body[data-template] .customer-mobile-actions{display:none}html body[data-template]:has(.customer-mobile-actions){padding-bottom:0}}
`;
