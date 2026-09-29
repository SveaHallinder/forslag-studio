const text=value=>String(value||'').replace(/\s+/g,' ').trim();
const fold=value=>text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const ignored='nav,footer,form,aside,[data-import-legacy-footer],.preload_images';
// Muse exports visual text frames and several complete responsive copies, without
// semantic headings. Interpret only that explicit format; ordinary pages keep the
// semantic importer. The chosen breakpoint also determines applicable image CSS.
export function prepareLegacyContent(doc,styleSources,source) {
  const discarded='[hidden],[inert],form,dialog:not([open]),[style*="display:none"],[style*="display: none"],#cookie-banner,#cookie-consent,#onetrust-banner-sdk,[class*="cookie-banner"],[class*="cookie-consent"],[id*="CookieConsent"]';
  if([...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')].some(el=>!el.closest(discarded))||!doc.querySelector('[data-muse-type="txt_frame"],.breakpoint [data-IBE-flags="txtStyleSrc"]'))return null;
  const breakpoints=[...doc.querySelectorAll('.breakpoint')];
  const score=el=>[...el.querySelectorAll('p')].reduce((sum,p)=>sum+text(p.textContent).length,0);
  const active=breakpoints.filter(el=>el.classList.contains('active')).sort((a,b)=>score(b)-score(a))[0];
  const selected=active&&score(active)?active:breakpoints.sort((a,b)=>score(b)-score(a))[0];
  for(const el of breakpoints)if(el!==selected)el.remove();
  selected?.classList.add('active');
  const min=Number(selected?.getAttribute('data-min-width'))||0,max=Number(selected?.getAttribute('data-max-width'))||Infinity,width=Math.min(max,Math.max(1280,min));
  const applies=query=>query.split(',').some(part=>{
    if(/\b(?:print|not)\b/i.test(part))return false;
    let supported=true,matched=true;
    const rest=part.replace(/\(\s*(min|max)-width\s*:\s*([\d.]+)px\s*\)/gi,(_,bound,value)=>{matched&&=bound.toLowerCase()==='min'?width>=Number(value):width<=Number(value);return '';}).replace(/\b(?:screen|all|and)\b/gi,'').trim();
    if(rest)supported=false;return supported&&matched;
  });
  const rules=[];
  const sources=styleSources.map(source=>{
    if(typeof CSSStyleSheet==='undefined')return source;
    const sheet=new CSSStyleSheet();try{sheet.replaceSync(source.css);}catch{return source;}
    const flatten=entries=>[...entries].map(rule=>{
      if(rule.type===4)return applies(rule.conditionText)?flatten(rule.cssRules):'';
      if(rule.selectorText&&rule.style&&!/::|:(?:hover|active|focus|visited)\b/i.test(rule.selectorText))for(const selector of rule.selectorText.split(','))rules.push({selector:selector.trim(),style:rule.style,score:(selector.match(/#/g)||[]).length*100+(selector.match(/[.:\[]/g)||[]).length*10});
      return rule.cssText;
    }).join('\n');
    return {...source,css:flatten(sheet.cssRules)};
  });
  const raw=(el,key)=>{
    if(el.style?.getPropertyValue(key))return el.style.getPropertyValue(key);
    let value='',strength=-1;for(const rule of rules)try{if(rule.style.getPropertyValue(key)&&rule.score>=strength&&el.matches(rule.selector)){value=rule.style.getPropertyValue(key);strength=rule.score;}}catch{}
    return value;
  };
  const inherited=(el,key)=>{for(let node=el;node;node=node.parentElement){const value=raw(node,key);if(value&&!/^(?:inherit|transparent|rgba\(0, 0, 0, 0\))$/.test(value))return value;}return '';};
  const color=value=>{const probe=doc.createElement('span');probe.style.color=value;const rgb=probe.style.color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);return rgb?'#'+rgb.slice(1).map(c=>Number(c).toString(16).padStart(2,'0')).join(''):'';};
  for(const spacer of doc.querySelectorAll('.verticalspacer'))for(let sibling=spacer.nextElementSibling;sibling;sibling=sibling.nextElementSibling)sibling.setAttribute('data-import-legacy-footer','');
  for(const img of doc.querySelectorAll('img')){
    const lazy=img.getAttribute('data-orig-src')||img.getAttribute('data-muse-src');if(lazy)img.setAttribute('src',lazy);
    if(/(?:^|\/)blank\.gif(?:[?#]|$)/i.test(img.getAttribute('src')||''))img.remove();
  }
  // CSS dimensions identify tiny repeating separators before background discovery.
  for(const el of doc.querySelectorAll('[id]'))for(const dimension of ['width','height']){
    const value=raw(el,dimension)||raw(el,'min-'+dimension);if(/^\d+(?:\.\d+)?px$/.test(value)&&parseFloat(value)>0)el.setAttribute('data-import-'+dimension,String(parseFloat(value)));
  }
  const hostname=new URL(source).hostname.replace(/^www\./,''),stem=hostname.split('.')[0];
  const logo=[...doc.querySelectorAll('img')].find(el=>!el.closest(ignored)&&/logo|logotyp|wordmark/i.test(el.getAttribute('src')+' '+el.getAttribute('alt'))&&(Number(el.getAttribute('width'))||100)>=64);
  const footerLine=[...doc.querySelectorAll('[data-import-legacy-footer] p,footer p')].map(p=>text(p.textContent)).find(line=>line.includes('•')&&fold(line.split('•')[0])===fold(stem));
  const logoName=text(logo?.getAttribute('alt')),titleName=doc.title.split(/\s+[|–—-]\s+/)[0],generic=/^(?:logo(?:typ)?|home|hem|start|startsida)$/i;
  const name=footerLine?.split('•')[0].trim()||doc.querySelector('meta[property="og:site_name"]')?.content||(!generic.test(logoName)&&logoName)||(!generic.test(titleName)&&titleName)||hostname;
  const address=footerLine?.split('•').slice(1).map(text).find(part=>/[A-Za-zÅÄÖåäö]{3,}.*\d/.test(part)&&!/@|https?:/.test(part))||'';
  const logoKey=el=>(el?.getAttribute('src')||'').split('?')[0].replace(/\d+x\d+(?=\.)/,'');
  const repeatedLogo=logo&&[...doc.querySelectorAll('[data-import-legacy-footer] img,footer img')].find(el=>logoKey(el)===logoKey(logo));
  const headerBackground=repeatedLogo?color(inherited(repeatedLogo,'background-color')):'',headerText=repeatedLogo?color(inherited(repeatedLogo.closest('[data-import-legacy-footer]')?.querySelector('p')||repeatedLogo,'color')):'';
  let headings=[];
  const structure=()=>{
    for(const p of [...doc.querySelectorAll('[data-muse-type="txt_frame"] p,[data-IBE-flags="txtStyleSrc"] p')]){
      if(p.closest(ignored))continue;
      const value=text(p.textContent),frame=p.closest('[data-muse-type="txt_frame"],[data-IBE-flags="txtStyleSrc"]');
      if(!value||value.length>70||/[\d:;.!?@•]/.test(value)||value.split(/\s+/).length>8)continue;
      const capitals=value===value.toUpperCase()&&value!==value.toLowerCase();
      const paragraphs=[...frame.querySelectorAll('p')].filter(el=>text(el.textContent)),first=paragraphs[0]===p;
      const size=parseFloat(inherited(p,'font-size'))||0,weight=inherited(p.querySelector('span,strong,b')||p,'font-weight');
      const emphasized=size>=20||/^(?:bold|[6-9]00)$/.test(weight);
      if(!(capitals&&(first||emphasized||paragraphs.length>1)))continue;
      const heading=doc.createElement('h2');for(const attr of p.attributes)heading.setAttribute(attr.name,attr.value);heading.innerHTML=p.innerHTML;p.replaceWith(heading);headings.push(heading);
    }
    if(!headings.length)return;
    // A real text heading naming the business already supplies its cover. Only
    // logo-only covers need a title from the site's own name.
    if(fold(headings[0].textContent)===fold(name))return;
    const hero=doc.createElement('h1');hero.textContent=name;hero.setAttribute('data-import-legacy-hero','');(selected||doc.body).prepend(hero);headings.unshift(hero);
  };
  const scopeFor=heading=>{
    const index=headings.indexOf(heading),next=headings[index+1],range=doc.createRange();range.selectNodeContents(doc.body);range.setStartAfter(heading);if(next)range.setEndBefore(next);
    const owner=el=>{
      if(el.closest(ignored))return null;
      if(el===logo)return headings[0];
      if(logo&&el.contains(logo))return headings[0];
      // A photo behind several text frames belongs to the first frame on it.
      const background=el.closest('[data-import-background]');
      const within=background&&headings.find(h=>background.contains(h));if(within)return within;
      for(let parent=el.parentElement;parent&&parent!==doc.body&&parent!==selected;parent=parent.parentElement){const inside=headings.filter(h=>parent.contains(h));if(inside.length>1)break;if(inside.length===1)return inside[0];}
      return headings.find(h=>el.compareDocumentPosition(h)&4)||headings.at(-1);
    };
    const contains=el=>el.nodeType===1&&el.matches('img,[data-import-background],[data-background],[data-bg-image]')?owner(el)===heading:range.intersectsNode(el);
    return {contains,querySelectorAll:selector=>[...doc.body.querySelectorAll(selector)].filter(el=>!el.closest(ignored)&&contains(el))};
  };
  const decoration=el=>{const width=Number(el.getAttribute('width')||el.getAttribute('data-import-width')),height=Number(el.getAttribute('height')||el.getAttribute('data-import-height'));return width>0&&height>0&&height<120&&width/height>=5;};
  const presentationFor=el=>{
    if(el.hasAttribute('data-import-background')){
      const position=raw(el,'background-position').trim().toLowerCase(),parts=position.split(/\s+/),values={left:0,top:0,center:50,right:100,bottom:100};
      const coordinate=value=>value in values?values[value]:/^\d+(?:\.\d+)?%$/.test(value)?Math.max(0,Math.min(100,parseFloat(value))):null;
      const x=coordinate(parts[0]),y=coordinate(parts[1]||'center');
      if(x!==null&&y!==null)return {fit:'cover',ratio:'original',x,y};
    }
    const width=Number(el.getAttribute('width')),height=Number(el.getAttribute('height'));
    return el.matches('img')&&width>=64&&height>=64&&width<240&&height<240?{fit:'contain',ratio:'original',x:50,y:50}:null;
  };
  const resolveAnchors=(anchors,renderedHeadings)=>{
    for(const anchor of doc.querySelectorAll('.anchor_item[id]')){
      const link=[...doc.querySelectorAll('nav a[href]')].find(el=>{try{return new URL(el.getAttribute('href'),source).hash==='#'+anchor.id;}catch{return false;}});
      const label=fold(link?.textContent),matching=label&&headings.find(h=>fold(h.textContent)===label);
      const cover=logo&&anchor.closest('[data-import-background]')?.contains(logo);
      const heading=matching||(cover?headings[0]:headings.find(h=>anchor.contains(h)||(anchor.compareDocumentPosition(h)&4)))||headings[0];
      const target=renderedHeadings.get(heading);if(target)anchors.set(anchor.id,target);
    }
  };
  return {sources,name,address,logo,structure,scopeFor,presentationFor,decoration,resolveAnchors,heading:()=>headings.find(h=>!h.hasAttribute('data-import-legacy-hero')),accent:color(inherited(doc.body,'color'))||'#111111',branding:{...(headerBackground?{headerBackground}:{}),...(headerText?{headerText}: {})}};
}
