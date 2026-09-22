const clean=value=>String(value||'').replace(/\s+/g,' ').replace(/([.!?])(?=[A-ZÅÄÖ])/g,'$1 ').trim();
const headings='h1,h2,h3,h4';
const imageSelector='img,[data-background],[data-bg-image],[style*="background"],[data-current-styles],video[poster],[data-import-background]';
function collectBackgrounds(doc,sources) {
  doc.querySelectorAll('[data-import-background]').forEach(el=>el.removeAttribute('data-import-background'));
  if(typeof CSSStyleSheet==='undefined')return;
  const candidates=new Map(),uncertain=new Set();
  for(const source of sources){
    const sheet=new CSSStyleSheet();try{sheet.replaceSync(source.css);}catch{continue;}
    const visit=(rules,conditional=false)=>{
      for(const rule of rules){
        if(!rule.selectorText&&rule.cssRules){visit(rule.cssRules,true);continue;}
        const value=rule.style?.backgroundImage;if(!value||!rule.selectorText)continue;
        // Never turn a hover state or a pseudo-element decoration into a photo.
        if(/::|:(?:hover|focus|active|visited|before|after)\b/i.test(rule.selectorText))continue;
        let nodes;try{nodes=doc.querySelectorAll(rule.selectorText);}catch{continue;}
        const matches=[...value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)];let url='';
        if(matches.length===1)try{const u=new URL(matches[0][2],source.url);if(/^https?:$/.test(u.protocol)&&!u.username&&!u.password)url=u.href;}catch{}
        for(const node of nodes){
          if(conditional||!url){uncertain.add(node);continue;}
          if(!candidates.has(node))candidates.set(node,new Set());candidates.get(node).add(url);
        }
      }
    };visit(sheet.cssRules);
  }
  // Conflicting declarations need manual selection, not a guessed CSS cascade.
  for(const [node,urls] of candidates)if(urls.size===1&&!uncertain.has(node)&&!node.matches('html,body')&&node.querySelectorAll(headings).length<=1&&!node.style.backgroundImage)node.setAttribute('data-import-background',[...urls][0]);
}
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
function stylesheetButtonColor(element,css) {
  if(!element||typeof CSSStyleSheet==='undefined')return '';
  const sheet=new CSSStyleSheet(),colors=new Set();let uncertain=false;
  try{sheet.replaceSync(css);}catch{return '';}
  const visit=(rules,conditional=false)=>{
    for(const rule of rules){
      if(!rule.selectorText&&rule.cssRules){visit(rule.cssRules,true);continue;}
      if(!rule.selectorText||/::|:(?:hover|focus|active|visited|before|after)\b/i.test(rule.selectorText))continue;
      let matches=false;try{matches=element.matches(rule.selectorText);}catch{}if(!matches)continue;
      const color=rule.style?.backgroundColor;if(!color)continue;
      // Only opaque, unambiguous default colours. Never infer from a mobile,
      // hover, transparent, inherited or conflicting declaration.
      const rgb=color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
      if(conditional||!rgb||rgb.slice(1).some(channel=>Number(channel)>255)){uncertain=true;continue;}
      colors.add('#'+rgb.slice(1).map(channel=>Number(channel).toString(16).padStart(2,'0')).join(''));
    }
  };
  visit(sheet.cssRules);return !uncertain&&colors.size===1?[...colors][0]:'';
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
  const styleSources=[...doc.querySelectorAll('style')].map(n=>({css:unconditional(n)?n.textContent:`@media ${n.getAttribute('media')}{${n.textContent}}`,url:source}));
  styleSources.push(...(Array.isArray(styles)?styles:[{css:styles,url:source}]));
  const css=styleSources.map(s=>s.css).join('\n');
  collectBackgrounds(doc,styleSources);
  const kitId=doc.body.className.match(/\belementor-kit-(\d+)\b/)?.[1],pageId=doc.querySelector('[data-elementor-type="wp-page"]')?.getAttribute('data-elementor-id');
  const stylesheetScore=n=>kitId&&n.id===`elementor-post-${kitId}-css`?4:pageId&&n.id===`elementor-post-${pageId}-css`?3:/site\.css|custom|theme/i.test(n.url)?2:new URL(n.url).origin===new URL(source).origin?1:0;
  const stylesheets=[...new Set([...doc.querySelectorAll('link[rel="stylesheet"][href]')].filter(unconditional).map(n=>({id:n.id,url:absolute(n.getAttribute('href'))})).filter(n=>/^https?:/.test(n.url)).sort((a,b)=>stylesheetScore(b)-stylesheetScore(a)).map(n=>n.url))].slice(0,2);
  const hasForms=!!doc.querySelector('form');
  removeCSSHidden(doc,css);
  doc.querySelectorAll('form,dialog:not([open]),[inert],[data-state="closed"],script,style,noscript,svg,template,iframe,object,embed,[hidden],[class~="hide-lg"],[class~="hidden-lg"],[class~="d-lg-none"],[style*="display:none"],[style*="display: none"],#cookie-banner,#cookie-consent,#onetrust-banner-sdk,[class*="cookie-banner"],[class*="cookie-consent"],[id*="CookieConsent"]').forEach(el=>el.remove());
  doc.querySelectorAll('br').forEach(el=>el.replaceWith('\n'));
  const navScore=el=>/^(?:huvudmeny|huvudnavigation|main(?: navigation| menu)?|primary(?: navigation| menu)?)$/i.test(el.getAttribute('aria-label')||'')?100:el.matches('.max-mega-menu')?80:/(?:^|[\s_-])primary(?:$|[\s_-])/i.test(el.className+' '+el.id)?60:/footer|social|breadcrumb|utility/i.test(el.className+' '+el.id+' '+el.getAttribute('aria-label'))?-50:el.closest('header,[data-elementor-type="header"]')?10:0;
  const primaryNav=[...doc.querySelectorAll('.max-mega-menu,header nav,header [role="navigation"],.ed-menu,nav,[role="navigation"],header [class*="menu"]')].filter(el=>!el.closest('footer,aside,[data-elementor-type="footer"],[aria-hidden="true"]')&&[...el.querySelectorAll('a[href]')].some(link=>clean(link.textContent)&&absolute(link.getAttribute('href')))).sort((a,b)=>navScore(b)-navScore(a))[0];
  const menuDestination=link=>!!link&&!!absolute(link.getAttribute('href'))&&!['','#'].includes((link.getAttribute('href')||'').trim())&&!(link.matches('[role="button"],[aria-controls]')&&(link.getAttribute('href')||'').startsWith('#'));
  const originalNav=[...(primaryNav?.querySelectorAll('a[href]')||[])].filter(link=>{
    if(!menuDestination(link))return false;
    for(let parentItem=link.closest('li')?.parentElement?.closest('li');parentItem&&primaryNav.contains(parentItem);parentItem=parentItem.parentElement?.closest('li'))if(menuDestination([...parentItem.querySelectorAll('a[href]')].find(anchor=>anchor.closest('li')===parentItem)))return false;
    return true;
  });
  const navigation=[],seenNav=new Set();
  for(const link of originalNav){const label=clean(link.textContent),href=absolute(link.getAttribute('href')),toggle=link.matches('[role="button"],[aria-controls]')&&(link.getAttribute('href')||'').startsWith('#');if(toggle||link.closest('.skip-link,.screen-reader-text,.menu-toggle,.search-toggle,.mobile-menu-anchor')||!label||label.length>70||!href||seenNav.has(label.toLowerCase())||navigation.length>=12)continue;seenNav.add(label.toLowerCase());navigation.push({label,href});}
  const main=doc.querySelector('main,[role="main"]')||doc.body;
  const excluded=el=>!!el.closest('nav,footer,.ed-menu,.max-mega-menu,[role="navigation"],[role="dialog"],aside,[data-elementor-type="header"],[data-elementor-type="footer"]')||!!el.closest('header')?.querySelector('nav,[role="navigation"]');
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
    const background=el.getAttribute('data-bg-image')||el.getAttribute('data-background')||'',backgroundURL=(background||el.getAttribute('style')||'').match(/url\(\s*(['"]?)(.*?)\1\s*\)/i)?.[2];
    const plainBackground=/^(?:https?:\/\/|\/|\.{1,2}\/|[^\s:()#?]+\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$))/i.test(background)?background:'';
    const picture=el.tagName==='IMG'&&el.parentElement?.tagName==='PICTURE'?el.parentElement:null;
    const pictureSet=[...(picture?.children||[])].find(node=>node.tagName==='SOURCE'&&unconditional(node)&&(!node.type||/^image\/(?:avif|webp|png|jpeg)$/i.test(node.type))&&(node.getAttribute('data-srcset')||node.getAttribute('srcset')));
    const srcset=(pictureSet?.getAttribute('data-srcset')||pictureSet?.getAttribute('srcset')||el.getAttribute('data-srcset')||el.getAttribute('srcset')||'').trim();
    const responsive=!/data:/i.test(srcset)&&([...srcset.matchAll(/(?:^|\s|,)([^\s]+?)\s+(\d+(?:\.\d+)?)[wx](?=\s*(?:,|$))/g)].map(match=>({url:match[1],size:Number(match[2])})).filter(i=>i.size&&/^https?:/.test(absolute(i.url))).sort((a,b)=>b.size-a.size)[0]?.url||(/^\S+$/.test(srcset)?srcset.replace(/,+$/,''):''));
    const lazy=[el.getAttribute('data-src'),el.getAttribute('data-lazy-src')].find(value=>value&&/^https?:/.test(absolute(value)));
    const direct=el.getAttribute('src');
    const raw=configured||el.getAttribute('poster')||(el.tagName==='IMG'?((pictureSet||el.getAttribute('data-srcset'))&&responsive)||lazy||responsive||direct:backgroundURL||plainBackground||el.getAttribute('data-import-background'));
    const url=raw&&!raw.startsWith('data:')?absolute(raw):'';
    if(!/^https?:/.test(url))return null;
    const label=clean(el.getAttribute('alt')||el.getAttribute('aria-label')),dimensions=(el.getAttribute('data-image-dimensions')||'').match(/^(\d+)x(\d+)$/)||new URL(url).pathname.match(/-(\d+)x(\d+)\.[a-z]+$/i);
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
  const pictures=imageNodes.filter(i=>i.url!==logo&&!excluded(i.el)&&!(/logo|icon|favicon|sprite/i.test(i.label+' '+i.url))&&(!i.width||i.width>=64)&&(!i.height||i.height>=64)).sort((a,b)=>Number(a.el.hasAttribute('data-import-background'))-Number(b.el.hasAttribute('data-import-background')));
  const photos=pictures.filter(i=>(!i.width||i.width>=300)&&(!i.height||i.height>=180));
  const scope=heroHeading?scopeFor(heroHeading):main;
  const textIn=node=>{
    const nodes=[...node.querySelectorAll('p,li,div,summary')].filter(el=>!excluded(el)&&!el.closest('button,[role="button"]')&&(el.tagName!=='DIV'||(!el.closest('a')&&!el.querySelector('h1,h2,h3,h4,h5,h6,p,li,div,summary,section,article,a,button,img'))));
    return nodes.filter(el=>!nodes.some(parent=>parent!==el&&parent.contains(el))).map(el=>clean(el.textContent)).filter(v=>v&&!/^(loading|laddar|please wait)(?:\b|…)/i.test(v)).filter((v,i,a)=>a.indexOf(v)===i).join('\n\n');
  };
  const headline=clean(heroHeading?.textContent);
  const description=textIn(scope)||(!headline?(meta('og:description')||meta('description')):'');
  const leadingSlide=heroHeading&&photos.find(i=>main.contains(i.el)&&i.el.closest('.carousel .active')&&(i.el.compareDocumentPosition(heroHeading)&4));
  const hero=photos.find(i=>scope.contains(i.el))?.url||leadingSlide?.url||'';
  const titleName=doc.title.split(/\s+[|–—-]\s+/)[0];
  const hostname=new URL(source).hostname.replace(/^www\./,''),fold=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  // Shorten an SEO label only with corroboration from the company's own hostname.
  const nameSignals=meta('og:site_name')?[meta('og:site_name')]:[headerImage?.label,headline,doc.title];
  const matchedName=hostname.split('.').length===2&&nameSignals.flatMap(value=>clean(value).split(/\s+[–—-]\s+|\s*\|\s*/)).find(value=>value&&fold(value)===fold(hostname.split('.')[0]));
  const logoName=headerImage?.label&&!/^(?:logo(?:typ)?|home|hem|startsida)$/i.test(headerImage.label)?headerImage.label:'';
  const name=(matchedName||meta('og:site_name')||logoName||clean(doc.querySelector('header a[href="/"]')?.textContent)||titleName||hostname).slice(0,100);
  const cards=[],seenCards=new Set(),anchors=new Map();
  if(heroHeading){for(let el=heroHeading;el&&el!==doc.body;el=el.parentElement)if(el.id)anchors.set(el.id,'start');}
  for(const heading of contentHeadings){
    if(heading===heroHeading||cards.length>=40)continue;
    const title=clean(heading.textContent),block=scopeFor(heading),description=textIn(block);
    const key=title+'|'+description;if(seenCards.has(key))continue;seenCards.add(key);
    const image=(photos.find(i=>i.url!==hero&&!i.el.hasAttribute('data-import-background')&&block.contains(i.el))||pictures.find(i=>i.url!==hero&&block.contains(i.el)))?.url||'';
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
  const contactRegion='footer,aside,address,[id*="kontakt"],[id*="contact"],[id*="adress"],[class*="contact"]';
  const contactBlocks=[...doc.querySelectorAll('p,li,address')].sort((a,b)=>Number(!!b.closest(contactRegion))-Number(!!a.closest(contactRegion))),contactLines=contactBlocks.flatMap(el=>el.textContent.split('\n').map(clean));
  const textPhone=contactLines.map(line=>line.match(/^(?:telefon|tel\.?|phone|mobil|ring(?: för [^:]{1,35})?)\s*:\s*([+\d][\d ()-]{5,34})/i)?.[1]?.trim()).find(value=>value&&value.replace(/\D/g,'').length>=7&&value.replace(/\D/g,'').length<=15)||'';
  const textEmail=contactLines.map(line=>line.match(/^(?:e-?post|e-?mail|mejl)\s*:\s*([\w.+-]+@[\w.-]+\.[a-z]{2,})/i)?.[1]).find(Boolean)||'';
  const email=decodeContact(links.find(u=>u.startsWith('mailto:'))?.slice(7).split('?')[0])||textEmail;
  const phone=decodeContact(links.find(u=>u.startsWith('tel:'))?.slice(4))||textPhone;
  const postal=contactBlocks.filter(el=>el.closest(contactRegion)).map(el=>el.textContent.match(/([^\n]{3,80}\d[^\n]{0,10})\n\s*(\d{3}\s?\d{2}\s+[^\n]{2,60})/)).find(Boolean);
  const address=postal?[clean(postal[1]),clean(postal[2])].join(', '):'';
  const inlineStyles=[...doc.querySelectorAll('[style]')].map(el=>el.getAttribute('style')).join('\n');
  const brand=brandColor(css+'\n'+inlineStyles),theme=meta('theme-color');
  const buttonStyle=heroLink?.getAttribute('style')||'';
  const buttonRGB=buttonStyle.match(/background(?:-color)?\s*:\s*rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  const buttonHex=buttonStyle.match(/background(?:-color)?\s*:\s*(#[a-f\d]{6})(?![a-f\d])/i)?.[1];
  const buttonColor=buttonHex||(buttonRGB&&buttonRGB.slice(1).every(x=>Number(x)<=255)?'#'+buttonRGB.slice(1).map(x=>Number(x).toString(16).padStart(2,'0')).join(''):'')||stylesheetButtonColor(heroLink,css);
  const accent=brand||buttonColor||(/^#[a-f\d]{6}$/i.test(theme)?theme:'#cdeb60');
  const warnings=['Texten är hämtad från originalets innehållsblock. Kontrollera innehåll och bildkopplingar före delning.'];
  if(scope.querySelectorAll('video,[data-current-styles]').length&&hero)warnings.push('Rörligt eller konfigurerat bakgrundsmaterial visas som originalets stillbild i förslaget.');
  if(hasForms)warnings.push('Originalets formulär har inte återskapats. Använd en knapp till originalet för anmälan, bokning eller köp.');
  if(navigation.some(n=>/^https?:/.test(n.href)))warnings.push('Menylänkar till undersidor öppnar företagets original. Bara startsidan har fått ny design.');
  if(!brand)warnings.push(buttonColor?'Färgen kommer från originalets huvudknapp. Kontrollera den före delning.':/^#[a-f\d]{6}$/i.test(theme)?'Färgen kommer från sidans tema. Kontrollera att den stämmer med varumärket.':'Ingen säker varumärkesfärg hittades. Välj rätt accentfärg under Innehåll.');
  if(!logo)warnings.push('Logotyp kunde inte identifieras säkert. Lägg till den under Bilder.');
  if(!hero)warnings.push('Ingen säker huvudbild hittades vid huvudrubriken. Välj huvudbild under Bilder.');
  if(!email&&!phone)warnings.push('Kontaktuppgifter saknas. Lägg till dem under Detaljer.');
  if(!headline&&!description&&!cards.length&&!email&&!phone)throw new Error('Hemsidan gav inget läsbart innehåll. Den kan kräva JavaScript eller blockera hämtning. Prova adressen till själva innehållssidan. Ditt öppna förslag är kvar.');
  if(contentHeadings.length>41||description.length>6000||cards.some(c=>c.description.length>6000))warnings.push('Startsidan är mycket lång. Delar har kortats; jämför med originalet före delning.');
  return {sourceAnchors:Object.fromEntries(anchors),name,source,headline:headline||name,description,logo,hero,email,phone,address,accent,cards,navigation,cta:cta||'Kontakta oss',ctaHref,images:[...new Map(imageNodes.map(i=>[i.url,{url:i.url,label:i.label}])).values()].slice(0,80),warnings,links,stylesheets,sectionTitle:'',importedAt:new Date().toISOString()};
}
