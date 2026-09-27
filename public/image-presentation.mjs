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
