export const imageRatios={template:'Mallens format',original:'Originalets proportioner',landscape:'Liggande · 3:2',square:'Kvadrat · 1:1',portrait:'Stående · 3:4'};
export function normalizePresentation(raw) {
  if(!raw||typeof raw!=='object'||!['cover','contain'].includes(raw.fit))return;
  const percent=value=>typeof value==='number'&&Number.isFinite(value)?Math.round(Math.max(0,Math.min(100,value))*10)/10:50;
  return {fit:raw.fit,x:percent(raw.x),y:percent(raw.y),ratio:Object.hasOwn(imageRatios,raw.ratio)?raw.ratio:'template'};
}
export function presentationStyle(raw) {
  const p=normalizePresentation(raw);if(!p)return '';
  const ratios={landscape:'3/2',square:'1/1',portrait:'3/4',original:'auto'};
  return `object-fit:${p.fit}!important;object-position:${p.x}% ${p.y}%!important;`+(p.ratio!=='template'?`width:100%!important;height:auto!important;max-height:none!important;aspect-ratio:${ratios[p.ratio]}!important;`:'');
}
// Explicit source framing is evidence; never infer a person's face location.
// Products and portraits default to the whole image instead of a guessed crop.
export function sourceImagePresentation({fit='',position='',width=0,height=0}={},context='') {
  if(fit||position){
    if(fit&&!['cover','contain'].includes(fit))return;
    const tokens=position.trim().split(/\s+/),point=token=>token==='center'?50:/^(?:left|top)$/.test(token)?0:/^(?:right|bottom)$/.test(token)?100:/^\d+(?:\.\d+)?%$/.test(token)?Number(token.slice(0,-1)):null;
    if(position&&tokens.some(token=>point(token)===null))return;
    let x=50,y=50;
    if(position){if(tokens.length>2)return;if(tokens.length===1){if(/top|bottom/.test(tokens[0]))y=point(tokens[0]);else x=point(tokens[0]);}else if(/top|bottom/.test(tokens[0])){y=point(tokens[0]);x=point(tokens[1]);}else{x=point(tokens[0]);y=point(tokens[1]);}}
    return normalizePresentation({fit:fit||'cover',x,y,ratio:'template'});
  }
  const words=String(context).toLowerCase();
  if(/produkt|product|papperspås|pizzakartong|porträtt|portrait|team|medarbetare/.test(words)||width>0&&height>width*1.2)return {fit:'contain',x:50,y:50,ratio:'original'};
}
