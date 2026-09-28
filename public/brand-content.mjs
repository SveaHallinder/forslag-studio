const stateSelector=/::|:(?:hover|focus(?:-visible|-within)?|active|visited|before|after|checked|disabled|target)\b/i;
const familyName=value=>String(value||'').split(',')[0].trim().replace(/^(['"])(.*?)\1$/,'$2');
const safeFamily=value=>value&&value.length<=100&&!/[<>;{}\\\r\n]/.test(value)&&! /^(?:inherit|initial|unset|revert|revert-layer)$/i.test(value);
// This is a conservative static cascade, not a viewport or layout engine.
function specificity(selector) {
  let value=selector.replace(/"[^"]*"|'[^']*'/g,''),functional=0,match;
  while((match=/:((?:is|not|has|where))\(/i.exec(value))){
    let end=match.index+match[0].length,depth=1;
    for(;end<value.length&&depth;end++){if(value[end]==='(')depth++;if(value[end]===')')depth--;}
    const argumentsText=value.slice(match.index+match[0].length,end-1);
    if(match[1].toLowerCase()!=='where')functional+=Math.max(0,...splitSelectors(argumentsText).map(specificity));
    value=value.slice(0,match.index)+' '+value.slice(end);
  }
  return functional+(value.match(/#[\w-]+/g)||[]).length*10000+(value.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g)||[]).length*100+(value.replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]|:{1,2}[\w-]+(?:\([^)]*\))?/g,' ').match(/(?:^|[\s>+~,(])[a-z][\w-]*/gi)||[]).length;
}
function splitSelectors(value) {
  const parts=[];let start=0,depth=0,quote='';
  for(let i=0;i<value.length;i++){const c=value[i];if(quote){if(c===quote&&value[i-1]!=='\\')quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='('||c==='[')depth++;if(c===')'||c===']')depth--;if(c===','&&!depth){parts.push(value.slice(start,i));start=i+1;}}
  parts.push(value.slice(start));return parts;
}
function colorHex(doc,value,neutral=false) {
  if(!value||/var\(|currentcolor|inherit|initial|unset|transparent|revert/i.test(value))return '';
  const canvas=doc.createElement('canvas'),context=canvas.getContext('2d');if(!context)return '';
  context.fillStyle='#010203';context.fillStyle=value;const first=context.fillStyle;
  context.fillStyle='#040506';context.fillStyle=value;if(context.fillStyle!==first)return '';
  const rgb=first.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  const hex=/^#[a-f\d]{6}$/i.test(first)?first.toLowerCase():rgb?'#'+rgb.slice(1).map(c=>Number(c).toString(16).padStart(2,'0')).join(''):'';
  if(!hex)return '';if(neutral)return hex;const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  return Math.max(...channels)-Math.min(...channels)>=18&&Math.max(...channels)>35&&Math.min(...channels)<235?hex:'';
}
export function extractBrand(doc,styleSources,{heading,button,logo}={}) {
  const warnings=[],rules=[],fontRules=[],layers=new Map();let order=0;
  const layerIndex=name=>{if(!layers.has(name))layers.set(name,layers.size);return layers.get(name);};
  if(typeof CSSStyleSheet==='undefined')return {accent:'',warnings:['Typsnitt och varumärkesfärg kunde inte läsas i denna webbläsare.']};
  for(const source of styleSources){
    const sheet=new CSSStyleSheet();try{sheet.replaceSync(source.css||'');}catch{continue;}
    const visit=(items,conditional=false,layer=-1,path='')=>{for(const rule of items){
      if(/^@layer\b/i.test(rule.cssText)){
        if(rule.cssRules){const name=path+(rule.name||`anonymous-${order++}`);visit(rule.cssRules,conditional,layerIndex(name),name+'.');}
        else for(const name of rule.cssText.replace(/^@layer\s+|;$/g,'').split(','))layerIndex(path+name.trim());
        continue;
      }
      if(rule.type===5){if(!conditional)fontRules.push({style:rule.style,url:source.url});continue;}
      if(rule.selectorText&&rule.style){for(const selector of splitSelectors(rule.selectorText)){if(stateSelector.test(selector))continue;rules.push({selector,style:rule.style,conditional,layer,order:order++,specificity:specificity(selector)});}continue;}
      if(rule.cssRules)visit(rule.cssRules,true,layer,path);
    }};visit(sheet.cssRules);
  }
  const cache=new WeakMap();
  const declarations=element=>{
    if(cache.has(element))return cache.get(element);const matching=[];
    for(const rule of rules)try{if(element.matches(rule.selector))matching.push(rule);}catch{}
    if(element.style?.length)matching.push({style:element.style,conditional:false,layer:-1,inline:true,order:order+1,specificity:1000000});cache.set(element,matching);return matching;
  };
  function raw(element,property) {
    const entries=declarations(element).map(rule=>{const name=property==='background-color'&&!rule.style.getPropertyValue(property)?'background':property==='font-family'&&!rule.style.getPropertyValue(property)?'font':property;return {...rule,shorthand:name==='font',value:rule.style.getPropertyValue(name).trim(),priority:Number(rule.style.getPropertyPriority(name)==='important')};}).filter(rule=>rule.value);
    const layerStrength=rule=>rule.inline?2000000:rule.priority?(rule.layer<0?0:1000000-rule.layer):(rule.layer<0?1000000:rule.layer);
    const base=entries.filter(rule=>!rule.conditional).sort((a,b)=>b.priority-a.priority||layerStrength(b)-layerStrength(a)||b.specificity-a.specificity||b.order-a.order)[0];
    const conflicts=entries.filter(rule=>rule.conditional&&(!base||rule.value!==base.value));
    return {value:base?.value||'',shorthand:base?.shorthand,uncertain:conflicts.length>0};
  }
  function resolved(element,property,seen=new Set()) {
    if(!element||seen.size>24||seen.has(property))return {value:'',uncertain:false};
    const next=new Set(seen);next.add(property);
    for(let node=element;node;node=node.parentElement){
      const entry=raw(node,property);if(entry.uncertain)return {value:'',uncertain:true};
      if(!entry.value||/^(?:inherit|unset)$/i.test(entry.value)){if(property==='background-color')return {value:'',uncertain:false};continue;}
      if(/^(?:initial|revert(?:-layer)?)$/i.test(entry.value))return {value:'',uncertain:true};
      let uncertain=false,value=entry.value;
      for(let count=0;count<12&&value.includes('var(');count++){
        const previous=value;value=value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g,(_,name,fallback)=>{const variable=resolved(node,name,next);uncertain ||= variable.uncertain;return variable.value||fallback||'';});if(value===previous)break;
      }
      if(property==='font-family'&&entry.shorthand){const probe=doc.createElement('span');probe.style.font=value;value=probe.style.fontFamily;}
      return {value:/var\(/.test(value)?'':value,uncertain};
    }
    return {value:'',uncertain:false};
  }
  const fontFor=element=>{
    if(!element)return '';const parents=new Set(),walker=doc.createTreeWalker(element,4);let textNode;
    while((textNode=walker.nextNode())&&parents.size<40)if(textNode.textContent.trim())parents.add(textNode.parentElement);
    if(!parents.size)parents.add(element);
    const values=[...parents].map(parent=>resolved(parent,'font-family')),families=new Set(values.map(result=>familyName(result.value)).filter(safeFamily));
    if(values.some(result=>result.uncertain)||families.size>1){warnings.push('Typsnitt varierar inom texten eller mellan sidans CSS-regler. Välj typsnitt manuellt.');return '';}
    return [...families][0]||'';
  };
  const headingFamily=fontFor(heading||doc.querySelector('main h1,h1,main h2,h2')),bodyFamily=fontFor(doc.querySelector('main p,[role="main"] p,p')||doc.body);
  const faces=[];
  for(const {style,url:base} of fontRules){
    const family=familyName(style.getPropertyValue('font-family'));if(![headingFamily,bodyFamily].includes(family))continue;
    const urls=[...style.getPropertyValue('src').matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)].map(match=>{try{const url=new URL(match[2],base);return /^https?:$/.test(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}}).filter(Boolean);
    const url=urls.find(value=>/\.woff2(?:[?#]|$)/i.test(value))||urls[0];if(!url)continue;
    const rawWeight=style.getPropertyValue('font-weight').trim()||'400',weight=rawWeight==='normal'?'400':rawWeight==='bold'?'700':rawWeight;
    const rawStyle=style.getPropertyValue('font-style').trim()||'normal',unicodeRange=style.getPropertyValue('unicode-range').trim();
    if(!/^(?:[1-9]\d{0,2}|1000)(?:\s+(?:[1-9]\d{0,2}|1000))?$/.test(weight)||! /^(?:normal|italic|oblique(?:\s+-?[\d.]+deg){0,2})$/.test(rawStyle))continue;
    const face={family,url,weight,style:rawStyle,...(unicodeRange&&/^(?:U\+[\dA-F?]+(?:-[\dA-F]+)?)(?:\s*,\s*U\+[\dA-F?]+(?:-[\dA-F]+)?)*$/i.test(unicodeRange)?{unicodeRange}:{})};
    if(!faces.some(existing=>JSON.stringify(existing)===JSON.stringify(face)))faces.push(face);
    if(faces.length===32){warnings.push('Sidan har många fontvarianter. Högst 32 fontfiler sparas; granska textens utseende.');break;}
  }
  const buttonColor=button?resolved(button,'background-color'):{value:'',uncertain:false};let accent=buttonColor.uncertain?'':colorHex(doc,buttonColor.value,true);
  if(buttonColor.uncertain)warnings.push('Knappfärgen varierar mellan sidans CSS-regler. Varumärkesfärgen behöver granskas.');
  if(!accent&&!buttonColor.uncertain){
    const colors=new Set();let uncertain=false;
    for(const element of [doc.documentElement,doc.body]){
      const names=new Set(declarations(element).flatMap(rule=>[...rule.style]).filter(name=>/^--(?:[\w-]*-)?(?:brand(?:-primary|-color)?|primary(?:-color)?|accent(?:-color)?|color-primary)(?:-hsl)?$/i.test(name)));
      for(const name of names){const value=resolved(element,name);uncertain ||= value.uncertain;const color=colorHex(doc,/-hsl$/i.test(name)?`hsl(${value.value})`:value.value);if(color)colors.add(color);}
    }
    const foreground=button?resolved(button,'color'):{value:'',uncertain:false},ink=foreground.uncertain?'':colorHex(doc,foreground.value);
    if(!uncertain&&ink&&colors.has(ink)){accent=ink;warnings.push('Färgen stöds av både huvudlänkens text och en global varumärkesvariabel. Kontrollera färgvalet före delning.');}
    else if(!uncertain&&colors.size===1)accent=[...colors][0];else if(uncertain||colors.size>1)warnings.push('Flera möjliga varumärkesfärger hittades. Välj färg manuellt.');
  }
  if(!accent&&!buttonColor.uncertain){
    // Legacy themes often repeat their brand ink on real content links instead
    // of declaring a CSS variable. Require agreement across distinct targets.
    const colors=new Map();let uncertain=false;
    for(const link of [...doc.querySelectorAll('main a[href],[role="main"] a[href]')].slice(0,100)){
      if(link.closest('nav,aside,footer')||!link.textContent.trim())continue;
      const entry=resolved(link,'color');uncertain ||= entry.uncertain;
      const color=entry.uncertain?'':colorHex(doc,entry.value);if(!color)continue;
      if(!colors.has(color))colors.set(color,new Set());colors.get(color).add(link.getAttribute('href'));
    }
    const ranked=[...colors].sort((a,b)=>b[1].size-a[1].size),candidate=ranked[0]?.[0];
    const agrees=candidate&&ranked.every(([color])=>[1,3,5].every(i=>Math.abs(parseInt(color.slice(i,i+2),16)-parseInt(candidate.slice(i,i+2),16))<=3));
    if(!uncertain&&agrees&&new Set(ranked.flatMap(([,targets])=>[...targets])).size>=3){accent=candidate;warnings.push('Profilfärgen är hämtad från återkommande länkar i originalets innehåll. Kontrollera färgvalet före delning.');}
  }
  if(!accent&&!warnings.some(warning=>/färg/.test(warning)))warnings.push('Ingen säker varumärkesfärg hittades. Mallens färg används tills du väljer en egen.');
  for(const family of new Set([headingFamily,bodyFamily].filter(Boolean)))if(!/^(?:serif|sans-serif|monospace|cursive|fantasy|system-ui|Arial|Verdana|Georgia|Times New Roman|Helvetica|Tahoma|Trebuchet MS|Courier New)$/i.test(family)&&!faces.some(face=>face.family===family))warnings.push(`Typsnittet ${family} hittades men ingen tillgänglig fontfil. Webbläsarens reservfont kan användas.`);
  const colorFor=(element,property)=>{if(!element)return '';const entry=resolved(element,property);return entry.uncertain?'':colorHex(doc,entry.value,true);};
  const backgroundFor=element=>{
    for(let node=element;node;node=node.parentElement){
      const entry=resolved(node,'background-color');if(entry.uncertain)return '';
      if(!entry.value||/^(?:transparent|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\))$/i.test(entry.value))continue;
      return colorHex(doc,entry.value,true);
    }
    return '';
  };
  const header=logo?.closest('header,[data-elementor-type="header"]')||doc.querySelector('header,[data-elementor-type="header"]');
  const paragraph=doc.querySelector('main p,[role="main"] p,p'),background=backgroundFor(doc.body);
  const surface=[...doc.querySelectorAll('main section,main article,main .has-background,[role="main"] section')].map(el=>colorFor(el,'background-color')).find(value=>value&&value!==background)||'';
  const secondaryButton=doc.querySelector('main a[class*="secondary"],main button[class*="secondary"]');
  let secondary=colorFor(secondaryButton,'background-color');
  if(!secondary){const values=new Set();for(const el of [doc.documentElement,doc.body])for(const name of new Set(declarations(el).flatMap(rule=>[...rule.style]).filter(name=>/^--(?:brand-|color-)?secondary(?:-color)?$/i.test(name)))){const entry=resolved(el,name);if(!entry.uncertain){const color=colorHex(doc,entry.value,true);if(color)values.add(color);}}if(values.size===1)secondary=[...values][0];}
  const branding=Object.fromEntries(Object.entries({background,surface,text:colorFor(doc.body,'color'),mutedText:colorFor(paragraph,'color'),secondary,headerBackground:backgroundFor(logo||header),headerText:colorFor(header?.querySelector('nav a,a')||header,'color')}).filter(([,value])=>value));
  if(Object.keys(branding).length<7)warnings.push('Färgprofilen är delvis identifierad. Saknade eller villkorliga färger kan kompletteras under Varumärke.');
  return {...(Object.keys(branding).length?{branding}:{}),...(headingFamily||bodyFamily?{typography:{heading:headingFamily,body:bodyFamily,faces}}:{}),accent,warnings:[...new Set(warnings)]};
}
