const clean=value=>String(value||'').replace(/\s+/g,' ').replace(/([.!?])(?=[A-ZÅÄÖ])/g,'$1 ').trim();
const headings='h1,h2,h3,h4';
const imageSelector='img,[data-background],[style*="background-image"],[data-current-styles],video[poster]';
function removeCSSHidden(doc,css) {
  // Parse without attaching source CSS or fetching its URLs. Ambiguous responsive
  // overrides are kept: this is deliberately not a full browser layout engine.
  if(typeof CSSStyleSheet==='undefined')return;
  const sheet=new CSSStyleSheet(),hidden=new Set(),visible=new Set();
  try{sheet.replaceSync(css);}catch{return;}
  const visit=(rules,conditional=false)=>{
    for(const rule of rules){
      if(!rule.selectorText&&rule.cssRules){visit(rule.cssRules,true);continue;}
      const display=rule.style?.display;if(!display||!rule.selectorText)continue;
      let nodes;try{nodes=doc.querySelectorAll(rule.selectorText);}catch{continue;}
      for(const node of nodes){if(display!=='none')visible.add(node);else if(!conditional)hidden.add(node);}
    }
  };
  visit(sheet.cssRules);
  for(const node of hidden)if(!visible.has(node)&&(!node.style.display||node.style.display==='none'))node.remove();
}
export function brandColor(css) {
  // Only explicit brand variables, never the most frequent arbitrary CSS colour.
  const match=String(css).match(/--(?:[\w-]*-)?(?:brand(?:-primary|-color)?|primary(?:-color)?|accent(?:-color)?|color-primary)\s*:\s*(#[a-f\d]{6}|#[a-f\d]{3})(?![a-f\d])/i);
  if(!match){
    const hsl=String(css).match(/--(?:brand|primary|accent)-hsl\s*:\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
    if(!hsl)return '';
    const h=Number(hsl[1])%360,s=Number(hsl[2])/100,l=Number(hsl[3])/100;
    if(s>1||l>1)return '';
    const a=s*Math.min(l,1-l),channel=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');};
    return '#'+channel(0)+channel(8)+channel(4);
  }
  const hex=match[1].toLowerCase();return hex.length===4?'#'+[...hex.slice(1)].map(x=>x+x).join(''):hex;
}
export function extractContent(html, source, styles='') {
  const doc=new DOMParser().parseFromString(html,'text/html');
  const meta=name=>doc.querySelector(`meta[property="${name}"],meta[name="${name}"]`)?.getAttribute('content')||'';
  const absolute=value=>{try{const u=new URL(value,source);return ['http:','https:','mailto:','tel:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
  const unconditional=n=>!n.getAttribute('media')||/^(all|screen)$/i.test(n.getAttribute('media').trim());
  const css=[...doc.querySelectorAll('style')].map(n=>unconditional(n)?n.textContent:`@media ${n.getAttribute('media')}{${n.textContent}}`).join('\n')+'\n'+styles;
  const stylesheets=[...doc.querySelectorAll('link[rel="stylesheet"][href]')].filter(unconditional).map(n=>absolute(n.getAttribute('href'))).filter(u=>/^https?:/.test(u)).sort((a,b)=>{const score=u=>/site\.css|custom|theme/i.test(u)?2:new URL(u).origin===new URL(source).origin?1:0;return score(b)-score(a);}).slice(0,2);
  const hasForms=!!doc.querySelector('form');
  removeCSSHidden(doc,css);
  doc.querySelectorAll('form,dialog:not([open]),[inert],[data-state="closed"],script,style,noscript,svg,template,iframe,object,embed,[hidden],[class~="hide-lg"],[class~="hidden-lg"],[class~="d-lg-none"],[style*="display:none"],[style*="display: none"],#cookie-banner,#cookie-consent,#onetrust-banner-sdk,[class*="cookie-banner"],[class*="cookie-consent"],[id*="CookieConsent"]').forEach(el=>el.remove());
  doc.querySelectorAll('br').forEach(el=>el.replaceWith(' '));
  const primaryNav=[...doc.querySelectorAll('header nav,header [role="navigation"],.ed-menu,nav,[role="navigation"],header [class*="menu"]')].find(el=>!el.closest('footer,aside'));
  const originalNav=[...(primaryNav?.querySelectorAll('a[href]')||[])];
  const navigation=[],seenNav=new Set();
  for(const link of originalNav){const label=clean(link.textContent),href=absolute(link.getAttribute('href')),toggle=link.matches('[role="button"],[aria-controls]')&&(link.getAttribute('href')||'').startsWith('#');if(toggle||link.closest('.skip-link,.screen-reader-text,.menu-toggle,.search-toggle,.mobile-menu-anchor')||!label||label.length>70||!href||seenNav.has(label.toLowerCase())||navigation.length>=12)continue;seenNav.add(label.toLowerCase());navigation.push({label,href});}
  const main=doc.querySelector('main,[role="main"]')||doc.body;
  const excluded=el=>!!el.closest('nav,footer,.ed-menu,[role="navigation"],[role="dialog"],aside')||!!el.closest('header')?.querySelector('nav,[role="navigation"]');
  const contentHeadings=[...main.querySelectorAll(headings)].filter(el=>!excluded(el)&&clean(el.textContent)&&!/^cookie|^kakor|^privacy preferences/i.test(clean(el.textContent)));
  const heroHeading=contentHeadings[0];
  const wrapperFor=heading=>{
    let best=null;
    for(let parent=heading.parentElement;parent&&parent!==main&&parent!==doc.body;parent=parent.parentElement){
      if(parent.querySelectorAll(headings).length>1)break;
      best=parent;
      if(parent.matches('section,article'))break;
    }
    return best;
  };
  const scopeFor=heading=>{
    const best=wrapperFor(heading);
    if(best?.matches('section,article')||best?.querySelector('p,li,a[href],'+imageSelector))return best;
    // Flat markup has no exclusive wrapper. Keep only nodes before the next heading.
    const range=doc.createRange(),next=contentHeadings[contentHeadings.indexOf(heading)+1];
    const boundary=heading.closest('section,article')||main,nextWrapper=next&&wrapperFor(next);
    range.selectNodeContents(boundary);range.setStartAfter(heading);
    if(next&&boundary.contains(next))range.setEndBefore(nextWrapper&&!nextWrapper.contains(heading)?nextWrapper:next);
    return {contains:el=>range.intersectsNode(el),querySelectorAll:selector=>[...main.querySelectorAll(selector)].filter(el=>range.intersectsNode(el))};
  };
  const imageData=el=>{
    let configured='';try{configured=JSON.parse(el.getAttribute('data-current-styles')||'{}').backgroundImage?.assetUrl||'';}catch{}
    const raw=configured||el.getAttribute('poster')||(el.tagName==='IMG'?(el.getAttribute('data-src')||el.getAttribute('data-lazy-src')||el.getAttribute('src')||el.getAttribute('srcset')?.split(',').at(-1)?.trim().split(/\s+/)[0]):(el.getAttribute('data-background')||el.getAttribute('style')||'').match(/url\(\s*(['"]?)(.*?)\1\s*\)/i)?.[2]);
    const url=raw&&!raw.startsWith('data:')?absolute(raw):'';
    if(!/^https?:/.test(url))return null;
    const label=clean(el.getAttribute('alt')),dimensions=(el.getAttribute('data-image-dimensions')||'').match(/^(\d+)x(\d+)$/)||new URL(url).pathname.match(/-(\d+)x(\d+)\.[a-z]+$/i);
    return {url,label,el,width:Number(dimensions?.[1]||el.getAttribute('width'))||0,height:Number(dimensions?.[2]||el.getAttribute('height'))||0};
  };
  const imageNodes=[...doc.querySelectorAll(imageSelector)].map(imageData).filter(Boolean);
  const headerImage=imageNodes.find(i=>{
    if(heroHeading&&!(i.el.compareDocumentPosition(heroHeading)&4))return false;
    const anchor=i.el.closest('a[href]');if(!anchor)return false;
    try{
      const link=new URL(anchor.getAttribute('href'),source),base=new URL(source);
      const home=link.origin===base.origin&&['',base.pathname.replace(/\/$/,'')].includes(link.pathname.replace(/\/$/,''));
      return home&&!!(i.el.closest('header,.logo,.ed-logo,[class*="header-logo"],[data-elementor-type="header"],[class*="theme-site-logo"]')||i.label.toLowerCase()===base.hostname.replace(/^www\./,''));
    }catch{return false;}
  });
  const logo=headerImage?.url||'';
  const photos=imageNodes.filter(i=>i.url!==logo&&!excluded(i.el)&&!(/logo|icon|favicon|sprite/i.test(i.label+' '+i.url))&&(!i.width||i.width>=300)&&(!i.height||i.height>=180));
  const scope=heroHeading?scopeFor(heroHeading):main;
  const textIn=node=>{
    const nodes=[...node.querySelectorAll('p,li')].filter(el=>!excluded(el));
    return nodes.filter(el=>!nodes.some(parent=>parent!==el&&parent.contains(el))).map(el=>clean(el.textContent)).filter(v=>v&&!/^(loading|laddar|please wait)(?:\b|…)/i.test(v)).filter((v,i,a)=>a.indexOf(v)===i).join('\n\n');
  };
  const headline=clean(heroHeading?.textContent);
  const description=textIn(scope)||(!headline?(meta('og:description')||meta('description')):'');
  const hero=photos.find(i=>scope.contains(i.el))?.url||'';
  const titleName=doc.title.split(/\s+[|–—-]\s+/)[0];
  const name=(meta('og:site_name')||clean(doc.querySelector('header a[href="/"]')?.textContent)||titleName||headerImage?.label||new URL(source).hostname.replace(/^www\./,'')).slice(0,100);
  const cards=[],seenCards=new Set(),anchors=new Map();
  if(heroHeading){for(let el=heroHeading;el&&el!==doc.body;el=el.parentElement)if(el.id)anchors.set(el.id,'start');}
  for(const heading of contentHeadings){
    if(heading===heroHeading||cards.length>=40)continue;
    const title=clean(heading.textContent),block=scopeFor(heading),description=textIn(block);
    const key=title+'|'+description;if(seenCards.has(key))continue;seenCards.add(key);
    const image=photos.find(i=>i.url!==hero&&block.contains(i.el))?.url||'';
    const anchor='section-'+(cards.length+1);
    for(let el=heading;el&&el!==main&&el!==doc.body;el=el.parentElement){if(el.id&&!anchors.has(el.id))anchors.set(el.id,anchor);}
    const action=heading.closest('a[href]')||block.querySelectorAll('a[href]')[0];
    cards.push({title,description,image,anchor,...(action?{href:absolute(action.getAttribute('href'))}:{})});
  }
  const mapLink=href=>{
    try{const u=new URL(href,source),base=new URL(source);if(u.origin===base.origin&&u.pathname.replace(/\/$/,'')===base.pathname.replace(/\/$/,'')){if(!u.hash)return '#start';const target=anchors.get(decodeURIComponent(u.hash.slice(1)));if(target)return '#'+target;}}catch{}
    return href;
  };
  navigation.forEach(link=>link.href=mapLink(link.href));
  cards.forEach(card=>{if(card.href)card.href=mapLink(card.href);});
  const heroLink=[...scope.querySelectorAll('a[href]')].find(el=>!excluded(el)&&clean(el.textContent)&&!el.querySelector('img')&&absolute(el.getAttribute('href')));
  const cta=clean(heroLink?.textContent),ctaHref=heroLink?mapLink(absolute(heroLink.getAttribute('href'))):'';
  const links=[...doc.querySelectorAll('a[href]')].map(el=>absolute(el.getAttribute('href'))).filter(Boolean);
  const decodeContact=value=>{try{return decodeURIComponent(value||'');}catch{return '';}};
  const email=decodeContact(links.find(u=>u.startsWith('mailto:'))?.slice(7).split('?')[0]);
  const phone=decodeContact(links.find(u=>u.startsWith('tel:'))?.slice(4));
  const inlineStyles=[...doc.querySelectorAll('[style]')].map(el=>el.getAttribute('style')).join('\n');
  const brand=brandColor(css+'\n'+inlineStyles),theme=meta('theme-color');
  const buttonStyle=heroLink?.getAttribute('style')||'';
  const buttonRGB=buttonStyle.match(/background(?:-color)?\s*:\s*rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  const buttonHex=buttonStyle.match(/background(?:-color)?\s*:\s*(#[a-f\d]{6})(?![a-f\d])/i)?.[1];
  const buttonColor=buttonHex||(buttonRGB&&buttonRGB.slice(1).every(x=>Number(x)<=255)?'#'+buttonRGB.slice(1).map(x=>Number(x).toString(16).padStart(2,'0')).join(''):'');
  const accent=brand||buttonColor||(/^#[a-f\d]{6}$/i.test(theme)?theme:'#cdeb60');
  const warnings=['Texten är hämtad från originalets innehållsblock. Kontrollera innehåll och bildkopplingar före delning.'];
  if(scope.querySelectorAll('video,[data-current-styles]').length&&hero)warnings.push('Rörligt eller konfigurerat bakgrundsmaterial visas som originalets stillbild i förslaget.');
  if(hasForms)warnings.push('Originalets formulär har inte återskapats. Använd en knapp till originalet för anmälan, bokning eller köp.');
  if(navigation.some(n=>/^https?:/.test(n.href)))warnings.push('Menylänkar till undersidor öppnar företagets original. Bara startsidan har fått ny design.');
  if(!brand)warnings.push(buttonColor?'Färgen kommer från originalets huvudknapp. Kontrollera den före delning.':/^#[a-f\d]{6}$/i.test(theme)?'Färgen kommer från sidans tema. Kontrollera att den stämmer med varumärket.':'Ingen säker varumärkesfärg hittades. Välj rätt färg under Detaljer.');
  if(!logo)warnings.push('Logotyp kunde inte identifieras säkert. Lägg till den under Bilder.');
  if(!hero)warnings.push('Ingen säker huvudbild hittades vid huvudrubriken. Välj huvudbild under Bilder.');
  if(!email&&!phone)warnings.push('Kontaktuppgifter saknas. Lägg till dem under Detaljer.');
  if(!headline&&!description&&!cards.length&&!email&&!phone)throw new Error('Hemsidan gav inget läsbart innehåll. Den kan kräva JavaScript eller blockera hämtning. Prova adressen till själva innehållssidan. Ditt öppna förslag är kvar.');
  if(contentHeadings.length>41||description.length>6000||cards.some(c=>c.description.length>6000))warnings.push('Startsidan är mycket lång. Delar har kortats; jämför med originalet före delning.');
  return {name,source,headline:headline||name,description,logo,hero,email,phone,accent,cards,navigation,cta:cta||'Kontakta oss',ctaHref,images:[...new Map(imageNodes.map(i=>[i.url,{url:i.url,label:i.label}])).values()].slice(0,80),warnings,links,stylesheets,sectionTitle:'',importedAt:new Date().toISOString()};
}
