export function extractContent(html, source) {
  const doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('script,style,noscript,svg,template,iframe,object,embed').forEach(el=>el.remove());
  const meta=name=>doc.querySelector(`meta[property="${name}"],meta[name="${name}"]`)?.getAttribute('content')||'';
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  const absolute=value=>{try{const u=new URL(value,source);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  const blocks=[],images=[],links=[];let logo='',email='',phone='';
  for(const el of doc.querySelectorAll('h1,h2,h3,p,li,title,img,a')) {
    const tag=el.tagName.toLowerCase(), text=clean(el.textContent);
    if(['h1','h2','h3','p','li','title'].includes(tag)&&text&&blocks.length<300)blocks.push({tag,text:text.slice(0,2000)});
    if(tag==='img'&&images.length<40){
      const raw=el.getAttribute('data-src')||el.getAttribute('data-lazy-src')||el.getAttribute('src');
      const url=raw&&!raw.startsWith('data:')?absolute(raw):'';if(!url||images.some(i=>i.url===url))continue;
      const label=clean(el.getAttribute('alt')).slice(0,160);
      const isLogo=/logo|brand/i.test(label+' '+el.className+' '+raw)||(!images.length&&!!label&&label.toLowerCase()===meta('og:site_name').toLowerCase());
      const dimensions=(el.getAttribute('data-image-dimensions')||'').match(/^(\d+)x(\d+)$/);
      if(isLogo&&!logo)logo=url;
      images.push({url,label,position:blocks.length,logo:isLogo,partner:/partners|samarbetspart|trusted by|våra kunder/i.test(blocks.at(-1)?.text||''),width:Number(dimensions?.[1]||el.getAttribute('width'))||0,height:Number(dimensions?.[2]||el.getAttribute('height'))||0});
    }
    if(tag==='a'){
      const href=el.getAttribute('href')||'';
      try{if(href.startsWith('mailto:')&&!email)email=decodeURIComponent(href.slice(7).split('?')[0]);else if(href.startsWith('tel:')&&!phone)phone=decodeURIComponent(href.slice(4));else if(links.length<150&&href)links.push(absolute(href));}catch{}
    }
  }
  const heading=blocks.find(b=>b.tag==='h1')?.text||'';
  const name=(meta('og:site_name')||doc.title.split(/\s+[|–—-]\s+/)[0]||new URL(source).hostname).slice(0,100);
  const description=(meta('og:description')||meta('description')||blocks.find(b=>b.tag==='p'&&b.text.length>35&&!/cookie|javascript|integritetspolicy/i.test(b.text))?.text||'').slice(0,1200);
  const photos=images.filter(i=>!i.logo&&!i.partner&&(!i.height||i.height>=280)&&(!i.width||i.width>=400));
  const used=new Set(),cards=[];
  for(const [i,block] of blocks.entries()){
    if(!['h2','h3'].includes(block.tag)||/cookie|kontakt|contact|menu|meny|partners|logga in/i.test(block.text)||cards.length>=6)continue;
    if(photos.length&&i<photos[0].position-1)continue;
    const image=[...photos].sort((a,b)=>Math.abs(a.position-i)-Math.abs(b.position-i)).find(im=>!used.has(im.url)&&Math.abs(im.position-i)<=2)?.url||'';
    if(image)used.add(image);
    cards.push({title:block.text.slice(0,140),description:(blocks.slice(i+1,i+3).find(b=>b.tag==='p')?.text||'').slice(0,600),image});
  }
  email ||= blocks.map(b=>b.text).join(' ').match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/)?.[0]||'';
  const warnings=['Kontrollera bildval, rubriker och kontaktuppgifter innan du delar. Innehållet är hämtat automatiskt; ingen AI-omskrivning har gjorts.'];
  if(!heading&&!description)warnings.push('Lite läsbart innehåll hittades. Sidan kan kräva JavaScript. Fyll i texten manuellt.');
  if(!photos.length)warnings.push('Inga användbara bilder hittades. Ladda upp egna bilder under Bilder.');
  if(!email&&!phone)warnings.push('Kontaktuppgifter saknas. Lägg till dem under Detaljer.');
  return {name,source,headline:heading||name,description,logo,hero:photos[0]?.url||'',email,phone,accent:/^#[a-f\d]{6}$/i.test(meta('theme-color'))?meta('theme-color'):'#cdeb60',cards,images:images.map(({url,label})=>({url,label})),warnings,links,sectionTitle:'Upptäck vad vi erbjuder',cta:'Kontakta oss',importedAt:new Date().toISOString()};
}
