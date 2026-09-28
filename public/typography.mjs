const family=value=>typeof value==='string'&&/^[\p{L}\p{M}\d _.-]{1,100}$/u.test(value.trim())?value.trim():'';
export function normalizeTypography(raw) {
  if(!raw||typeof raw!=='object')return;
  const heading=family(raw.heading),body=family(raw.body);if(!heading&&!body)return;
  const names=new Set([heading,body].map(n=>n.toLowerCase())),seen=new Set();
  const faces=(Array.isArray(raw.faces)?raw.faces:[]).flatMap(face=>{
    if(!face||!names.has(family(face.family).toLowerCase()))return [];
    let url=String(face.url||'');
    if(!/^data:font\/(?:woff2?|ttf|otf);base64,[a-zA-Z0-9+/=]+$/.test(url))try{const parsed=new URL(url);if(!/^https?:$/.test(parsed.protocol)||parsed.username||parsed.password||url.length>2000)return [];url=parsed.href;}catch{return [];}
    if(url.length>3_000_000)return [];
    const weight=/^(?:normal|bold|[1-9]\d{0,2}|1000)(?: (?:[1-9]\d{0,2}|1000))?$/.test(face.weight||'')?face.weight:'400';
    const style=['normal','italic','oblique'].includes(face.style)?face.style:'normal';
    const unicodeRange=/^U\+[\da-f?]{1,6}(?:-[\da-f]{1,6})?(?:,\s*U\+[\da-f?]{1,6}(?:-[\da-f]{1,6})?)*$/i.test(face.unicodeRange||'')&&face.unicodeRange.length<1000?face.unicodeRange:'';
    const item={family:family(face.family),url,weight,style,...(unicodeRange?{unicodeRange}:{})},key=JSON.stringify(item);if(seen.has(key))return [];seen.add(key);return [item];
  }).slice(0,32);
  return {heading,body,faces};
}
export function typographyCSS(raw) {
  const t=normalizeTypography(raw);if(!t)return '';
  const quote=value=>JSON.stringify(value).replace(/</g,'\\3c ').replace(/>/g,'\\3e ');
  const css=t.faces.map(f=>`@font-face{font-family:${quote(f.family)};src:url(${quote(f.url.startsWith('data:')?f.url:'/api/font?url='+encodeURIComponent(f.url))});font-weight:${f.weight};font-style:${f.style};font-display:swap;${f.unicodeRange?'unicode-range:'+f.unicodeRange+';':''}}`).join('');
  const fallback=name=>(/serif/i.test(name)&&!/sans/i.test(name))||/^Playfair Display$/i.test(name)?'serif':'sans-serif';
  return css+(t.body?`html body[data-template]{font-family:${quote(t.body)},${fallback(t.body)}}`:'')+(t.heading?`html body[data-template][data-imported] :is(h1,h2,h3,h4,.card h2,.card h3,.profile-name){font-family:${quote(t.heading)},${fallback(t.heading)}}`:'');
}
