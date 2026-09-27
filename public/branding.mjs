export const brandRoles={background:'Sidbakgrund',surface:'Kort och ytor',text:'Text',mutedText:'Sekundär text',secondary:'Sekundär varumärkesfärg',headerBackground:'Menyns bakgrund',headerText:'Menyns text'};
export function normalizeBranding(raw,validateImage=()=> '') {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return;
  const result={};
  for(const key of Object.keys(brandRoles))if(/^#[a-f\d]{6}$/i.test(raw[key]||''))result[key]=raw[key].toLowerCase();
  for(const key of ['logoLight','logoDark']){const url=validateImage(raw[key]);if(url)result[key]=url;}
  return Object.keys(result).length?result:undefined;
}
function luminance(hex){const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b;}
export function contrast(a,b){return (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);}
export function bestInk(background){return contrast(background,'#000000')>=contrast(background,'#ffffff')?'#000000':'#ffffff';}
export function brandPalette(raw={}) {
  const b=normalizeBranding(raw)||{},background=b.background||'#ffffff',surface=b.surface||background;
  const readable=(value,bg)=>value&&contrast(value,bg)>=4.5?value:bestInk(bg);
  const text=readable(b.text,background),mutedText=readable(b.mutedText||text,background),secondary=b.secondary||text;
  const headerBackground=b.headerBackground||((raw.logoLight&&!raw.logoDark)?'#202420':background);
  return {background,surface,text,mutedText,secondary,headerBackground,headerText:readable(b.headerText||text,headerBackground),surfaceText:readable(b.text,surface),secondaryText:bestInk(secondary)};
}
export function selectBrandLogo(project) {
  const b=project.branding;if(!b)return project.logo;
  const dark=bestInk(brandPalette(b).headerBackground)==='#ffffff';
  return (dark?b.logoLight:b.logoDark)||project.logo||(dark?b.logoDark:b.logoLight)||'';
}
export function brandingCSS(raw) {
  if(!raw)return '';
  const p=brandPalette(raw),selector='html body[data-template][data-imported]';
  const colors=Object.keys(brandRoles).some(key=>raw[key]);
  const vars=Object.entries(p).map(([key,value])=>'--brand-'+key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+':'+value).join(';');
  const header=`${selector} .nav{background:var(--brand-header-background);color:var(--brand-header-text);padding-inline:24px;border-color:color-mix(in srgb,var(--brand-header-text) 20%,transparent)}${selector} .nav-contact{border-color:currentColor}`;
  if(!colors)return `${selector}{${vars}}${header}`;
  return `${selector}{${vars};background:var(--brand-background);color:var(--brand-text)}
${header}
${selector} .hero-layout,${selector} .hero-copy{background:var(--brand-background);color:var(--brand-text)}
${selector} :is(.hero-copy>p,.eyebrow,.section-kicker,.section-top>p,.about p,.footer,.card-number){color:var(--brand-muted-text)}
${selector} :is(.footer .brand-name,.card h2,.card h3){color:inherit}
${selector} .card p{color:inherit}
${selector} :is(.benefits,.card:not(.content-heading)){background:var(--brand-surface);color:var(--brand-surface-text)}
${selector} :is(.benefit h3,.benefit p){color:inherit}
${selector} :is(.card-placeholder,.hero-image,.card img){background:transparent}
${selector} .contact{background:var(--brand-secondary);color:var(--brand-secondary-text)}
${selector} .contact :is(.contact-links,.contact-empty,.section-kicker){color:inherit!important}
${selector} .demo-note{background:var(--brand-secondary);color:var(--brand-secondary-text)}
${selector} .button,${selector} .button:hover{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
${selector} :is(.nav,.about,.card,.card-meta,.benefits,.footer){border-color:color-mix(in srgb,currentColor 20%,transparent)}
`;
}

// Only classify clearly light/dark ink on a transparent canvas. Mixed or
// opaque artwork stays unchanged rather than guessing from a filename.
export function logoTone(pixels) {
  let transparent=0,ink=0,light=0,dark=0;
  for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<30){transparent++;continue;}if(pixels[i+3]<200)continue;ink++;const channels=[pixels[i],pixels[i+1],pixels[i+2]];if(Math.min(...channels)>190)light++;if(Math.max(...channels)<85)dark++;}
  if(!ink||transparent/(pixels.length/4)<.2)return '';
  return light/ink>.8?'light':dark/ink>.8?'dark':'';
}
