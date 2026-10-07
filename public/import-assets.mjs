// Rank identity assets separately from editorial photography. A home link alone
// does not prove that its image is a logo (many sites link their hero to home).
export function logoScore(image,source,heading) {
  const el=image.el,label=(image.label+' '+el.getAttribute('class')+' '+el.id+' '+image.url).toLowerCase();
  const header=!!el.closest('header,[data-elementor-type="header"],[role="banner"]');
  if(el.closest('footer,[data-elementor-type="footer"],[aria-hidden="true"]')||!header&&el.closest('aside,main,[role="main"]')||/favicon|sprite|tracking|partner|client|customer|certificat|social-icon/.test(label))return 0;
  if(heading&&!(el.compareDocumentPosition(heading)&4))return 0;
  let home=false;
  try{const link=el.closest('a[href]');if(link){const target=new URL(link.getAttribute('href'),source),base=new URL(source);home=target.origin===base.origin&&['',base.pathname.replace(/\/$/,'')].includes(target.pathname.replace(/\/$/,''));}}catch{}
  const explicit=el.matches('[itemprop="logo"]')||!!el.closest('.logo,.ed-logo,[class*="header-logo"],[class*="site-logo"],[class*="brand-logo"]')||/(?:^|[\s/_.-])(?:logo|wordmark|logotype)(?:$|[\s/_.-])/.test(label);
  if(!explicit&&(!home||!header))return 0;
  if(!explicit&&image.width>=500&&image.height>=250&&image.width/image.height<2.5)return 0;
  if(image.width&&image.height&&Math.max(image.width,image.height)<32)return 0;
  return (explicit?60:0)+(home?35:0)+(header?25:0)+(image.width>image.height*2?5:0);
}

export function structuredLogo(doc,source) {
  const base=new URL(source),matches=[];let visits=0;
  const absolute=value=>{try{const u=new URL(value,source);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password&&!u.port?u.href:'';}catch{return '';}};
  const walk=(value,depth=0)=>{
    if(!value||typeof value!=='object'||depth>12||++visits>500)return;
    const types=[value['@type']].flat();
    if(types.some(type=>/^(?:Organization|LocalBusiness|CafeOrCoffeeShop|Restaurant|Store|ProfessionalService|MedicalBusiness|Hotel)$/.test(type))){
      const site=absolute(value.url),logo=absolute(typeof value.logo==='string'?value.logo:value.logo?.url||value.logo?.contentUrl);
      // Require an explicit organization URL matching this site, not a publisher
      // or a related organization merely present in a JSON-LD graph.
      if(site&&logo&&new URL(site).origin===base.origin)matches.push(logo);
    }
    for(const child of Object.values(value))if(typeof child==='object')walk(child,depth+1);
  };
  for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){if(script.textContent.length>200000)continue;try{walk(JSON.parse(script.textContent));}catch{}}
  const unique=[...new Set(matches)];return unique.length===1?unique[0]:'';
}
