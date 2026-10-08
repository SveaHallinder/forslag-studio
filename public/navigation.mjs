// Presentation only: source labels, destinations and brand artwork stay intact.
export function renderHeader(project,imported,escape,picture) {
  const p=project,e=escape;
  const items=p.navigation.length?p.navigation:imported?[]:[...(p.cards.length?[{label:'Utforska',href:'#erbjudande'}]:[]),...(p.about?[{label:'Om oss',href:'#om'}]:[]),{label:p.cta,href:'#kontakt'}];
  const selectedAction=p.ctaHref?items.findIndex(item=>item.href===p.ctaHref):-1;
  const action=selectedAction>=0?selectedAction:items.findIndex(item=>/^(kontakt|kontakta oss|contact|contact us|boka|boka bord|boka tid|book|book now)$/i.test(item.label.trim()));
  let remaining=42,visible=0;
  const links=items.map((item,i)=>{
    const priority=i===selectedAction||visible<(selectedAction>=0?2:3)&&item.label.length<=Math.min(30,remaining);if(priority&&i!==selectedAction){remaining-=item.label.length;visible++;}
    return `<a${i===action?' class="nav-action"':''} href="${e(item.href)}"${priority?' data-nav-priority="true"':''} ${/^https?:/.test(item.href)?'target="_blank" rel="noopener noreferrer" title="Öppnar företagets original"':''}>${e(item.label)}${i===action?'<span aria-hidden="true">↗</span>':''}</a>`;
  }).join('');
  const menuLinks=items.map((item,i)=>`<a href="${e(item.href)}" ${/^https?:/.test(item.href)?'target="_blank" rel="noopener noreferrer" title="Öppnar företagets original"':''}><span class="menu-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="menu-label">${e(item.label)}</span><span class="menu-arrow" aria-hidden="true">↗</span></a>`).join('');
  const variant=['cinema','studio'].includes(p.templateId)?'immersive':p.templateId==='pop'?'playful':p.templateId==='precision'?'technical':['story','wellness','retail'].includes(p.templateId)?'floating':['atelier','editorial','dining'].includes(p.templateId)?'editorial':'structured';
  const density=items.length>5||items.reduce((sum,item)=>sum+item.label.length,0)>64?'overflow':'regular';
  const sourceColor=!!(p.branding?.headerBackground||p.branding?.background||p.branding?.logoLight);
  return `<header class="nav" data-header="${variant}" data-menu-density="${density}" data-header-color="${sourceColor?'source':'default'}" data-brand="${p.logo?'image':'text'}"><a class="brand" href="#" aria-label="${e(p.name)} startsida">${p.logo?`<span class="brand-mark">${picture(p.logo,p.name,'',false)}</span>`:e(p.name)}</a><nav class="nav-links" aria-label="Huvudmeny">${links}</nav>${links?`<details class="mobile-menu"><summary aria-label="Öppna eller stäng menyn" aria-expanded="false"><span>Meny</span><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg></summary><button class="menu-backdrop" type="button" tabindex="-1" aria-label="Stäng menyn"></button><nav class="mobile-links" aria-label="Alla menylänkar">${menuLinks}</nav></details>`:''}</header>`;
}

export function installHeaderNavigation(doc=document) {
  if(doc.__headerNavigation)return;doc.__headerNavigation=true;
  const close=(menu,focus=false)=>{menu.open=false;const summary=menu.querySelector('summary');summary?.setAttribute('aria-expanded','false');if(focus)summary?.focus();};
  doc.addEventListener('toggle',event=>{
    const menu=event.target;if(!menu.matches?.('.mobile-menu'))return;
    menu.querySelector('summary')?.setAttribute('aria-expanded',String(menu.open));
    if(menu.open)for(const other of doc.querySelectorAll('.mobile-menu[open]'))if(other!==menu)close(other);
  },true);
  doc.addEventListener('click',event=>{
    if(event.defaultPrevented)return;
    const target=event.target;
    for(const menu of doc.querySelectorAll('.mobile-menu[open]')){
      if(target.closest?.('.menu-backdrop'))close(menu,true);
      else if(target.closest?.('.mobile-links a')||!menu.contains(target))close(menu);
    }
  });
  doc.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||event.defaultPrevented)return;
    const menu=doc.querySelector('.mobile-menu[open]');
    if(menu){close(menu,true);event.preventDefault();}
  });
  doc.addEventListener('focusin',event=>{
    for(const menu of doc.querySelectorAll('.mobile-menu[open]'))if(!menu.contains(event.target))close(menu);
  });
}

export const navigationCSS=`
/* A compact masthead, then a generous index. Artwork and source colors are authoritative. */
html body[data-template][data-imported] .nav[data-header]{position:relative;z-index:30;isolation:isolate;display:flex;align-items:center;justify-content:space-between;min-height:88px;height:auto;gap:clamp(20px,3vw,44px);margin:0;padding:20px 0;background:var(--brand-header-background,#fff);color:var(--brand-header-text,#202420);border:0;border-bottom:1px solid color-mix(in srgb,currentColor 17%,transparent);border-radius:0;box-shadow:none}
html body[data-template][data-imported] .nav[data-header] .brand{display:block;flex:0 1 auto;min-width:0;max-width:35%;font-size:24px;font-weight:650;line-height:1.12;letter-spacing:-.045em;overflow-wrap:anywhere;text-decoration:none}
html body[data-template][data-imported] .nav[data-header] .brand-mark{display:block;min-width:0;width:100%;padding:0;background:none;border:0}
html body[data-template][data-imported] .nav[data-header] .brand-mark img{display:block;width:auto;height:auto;max-width:min(180px,100%);max-height:42px;object-fit:contain;border:0;border-radius:0;background:none;padding:0;filter:none;box-shadow:none}
html body[data-template][data-imported] .nav[data-header] .nav-links{display:flex;align-items:center;justify-content:flex-end;flex-wrap:nowrap;gap:clamp(18px,2.3vw,36px);width:auto;min-width:0;margin-left:auto;font-size:13px;font-weight:500;line-height:1.3;letter-spacing:.005em}
html body[data-template][data-imported] .nav[data-header] .nav-links a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 0;max-width:180px;text-align:center;color:inherit;text-decoration:none;text-underline-offset:7px;overflow-wrap:anywhere;transition:opacity .18s}
html body[data-template][data-imported] .nav[data-header] .nav-links a:hover{text-decoration:underline;text-decoration-thickness:1px}
html body[data-template][data-imported] .nav[data-header] .nav-links .nav-action{gap:20px;padding:10px 18px;border:1px solid currentColor;border-radius:0;background:transparent;color:inherit;text-decoration:none;line-height:1.25}
html body[data-template][data-imported] .nav[data-header] .nav-action span{font-size:18px;line-height:1}
html body[data-template][data-imported] .nav[data-header="floating"]{margin:20px 0 12px;padding:14px 22px;min-height:76px;border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:999px}
html body[data-template][data-imported] .nav[data-header="floating"] .nav-links .nav-action{border-radius:999px}
html body[data-template][data-imported] .nav[data-header="editorial"] .nav-links .nav-action{padding:8px 0;border:0;border-bottom:1px solid currentColor;min-height:36px}
html body[data-template][data-imported] .nav[data-header="immersive"]{padding-inline:24px;border-color:color-mix(in srgb,currentColor 22%,transparent)}
html body[data-template][data-imported] .nav[data-header="immersive"][data-header-color="default"][data-brand="text"]{--brand-header-background:#181b17;--brand-header-text:#fffaf1}
html body[data-template][data-imported] .nav[data-header="immersive"] .nav-links{font-size:12px;letter-spacing:.055em}
html body[data-template][data-imported] .nav[data-header="playful"]{margin:18px 0;padding:14px 24px;border:0;border-radius:999px;min-height:80px}
html body[data-template][data-imported] .nav[data-header="playful"] .nav-links .nav-action{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);border-radius:999px;padding-inline:24px}
html body[data-template][data-imported] .nav[data-header="technical"]{padding:16px 22px;min-height:76px;margin:16px 0;border:1px solid color-mix(in srgb,currentColor 12%,transparent);border-radius:16px}
html body[data-template][data-imported] .nav[data-header="technical"] .nav-links .nav-action{background:var(--brand-header-text,#202420);color:var(--brand-header-background,#fff);border-radius:8px}
html body[data-template][data-imported] .nav[data-header] .mobile-menu{display:none;flex:none;margin:0}
html body[data-template][data-imported] .nav[data-header] .mobile-menu summary{position:relative;z-index:3;display:flex;align-items:center;justify-content:center;gap:16px;min-height:44px;padding:10px 0 10px 18px;border:0;border-left:1px solid color-mix(in srgb,currentColor 22%,transparent);border-radius:0;cursor:pointer;font-size:13px;font-weight:500;list-style:none;line-height:1;color:inherit}
html body[data-template][data-imported] .mobile-menu summary::-webkit-details-marker{display:none}
html body[data-template][data-imported] .mobile-menu svg{fill:none;stroke:currentColor;stroke-width:1.3;flex:none;transition:transform .2s}
html body[data-template][data-imported] .mobile-menu[open] summary svg{transform:rotate(90deg)}
html body[data-template][data-imported] .nav[data-header] .menu-backdrop{position:fixed;z-index:-1;inset:0;width:100%;height:100%;border:0;margin:0;padding:0;background:#00000035;cursor:default}
html body[data-template][data-imported] .nav[data-header] .mobile-links{position:absolute;z-index:2;top:calc(100% + 1px);right:0;left:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 40px;width:min(800px,100%);max-height:min(680px,76dvh);overflow:auto;overscroll-behavior:contain;padding:22px 36px 30px;border:1px solid color-mix(in srgb,currentColor 17%,transparent);border-radius:0;background:var(--brand-header-background,#fff);color:var(--brand-header-text,#202420);box-shadow:0 24px 50px #00000018}
html body[data-template][data-imported] .nav[data-header] .mobile-links a{display:grid;grid-template-columns:22px minmax(0,1fr) 18px;align-items:center;gap:16px;min-height:76px;margin:0;padding:19px 0;color:inherit;background:transparent;border:0;border-bottom:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:0;font-size:clamp(18px,2.3vw,27px);font-weight:400;letter-spacing:-.035em;line-height:1.2;text-align:left;text-decoration:none;overflow-wrap:anywhere}
html body[data-template][data-imported] .nav[data-header] .mobile-links a:hover .menu-label{text-decoration:underline;text-underline-offset:6px;text-decoration-thickness:1px}
html body[data-template][data-imported] .nav[data-header] .menu-index{align-self:start;padding-top:5px;font-size:10px;line-height:1.4;letter-spacing:.04em;opacity:.55}
html body[data-template][data-imported] .nav[data-header] .menu-arrow{font-size:20px;font-weight:400;opacity:.65}
html body[data-template][data-imported] .nav[data-header="playful"] .mobile-links,html body[data-template][data-imported] .nav[data-header="floating"] .mobile-links{border-radius:24px}
html body[data-template][data-imported] .nav[data-menu-density="overflow"] .nav-links a:not([data-nav-priority]){display:none}
html body[data-template][data-imported] .nav[data-menu-density="overflow"] .mobile-menu{display:block}
html body[data-template][data-imported] .nav[data-header] :is(a,summary):focus-visible{outline:2px solid currentColor;outline-offset:5px}
@media(max-width:900px){
 html body[data-template][data-imported] .nav[data-header]{min-height:76px;padding:16px 0;gap:20px;margin-top:0;flex-wrap:nowrap}
 html body[data-template][data-imported] .nav[data-header="floating"],html body[data-template][data-imported] .nav[data-header="playful"],html body[data-template][data-imported] .nav[data-header="technical"]{padding:12px 18px;min-height:72px;margin:12px 0}
 html body[data-template][data-imported] .nav[data-header="immersive"]{padding-inline:18px}
 html body[data-template][data-imported] .nav[data-header] .brand{max-width:calc(100% - 100px);font-size:22px}
 html body[data-template][data-imported] .nav[data-header] .brand-mark img{max-width:min(160px,100%);max-height:38px}
 html body[data-template][data-imported] .nav[data-header] .nav-links{display:none}
 html body[data-template][data-imported] .nav[data-header] .mobile-menu{display:block;margin-left:auto}
 html body[data-template][data-imported] .nav[data-header] .mobile-menu summary{gap:10px;padding-left:14px}
 html body[data-template][data-imported] .nav[data-header] .mobile-links{width:100%;grid-template-columns:minmax(0,1fr);padding:12px 22px 20px;gap:0;max-height:72dvh}
 html body[data-template][data-imported] .nav[data-header] .mobile-links a{min-height:62px;font-size:23px;gap:12px;padding:17px 0}
}
@media(prefers-reduced-motion:reduce){html body[data-template][data-imported] .nav[data-header] *{transition:none}}
@media print{html body[data-template][data-imported] .nav[data-header] .mobile-menu{display:none}}
`;
