// Presentation only: source labels, destinations and brand artwork stay intact.
export function renderHeader(project,imported,escape,picture) {
  const p=project,e=escape;
  const items=p.navigation.length?p.navigation:imported?[]:[...(p.cards.length?[{label:'Utforska',href:'#erbjudande'}]:[]),...(p.about?[{label:'Om oss',href:'#om'}]:[]),{label:p.cta,href:'#kontakt'}];
  const action=items.findIndex(item=>/^(kontakt|kontakta oss|contact|contact us|boka|boka bord|boka tid|book|book now)$/i.test(item.label.trim()));
  const links=items.map((item,i)=>`<a${i===action?' class="nav-action"':''} href="${e(item.href)}" ${/^https?:/.test(item.href)?'target="_blank" rel="noopener noreferrer" title="Öppnar företagets original"':''}>${e(item.label)}${i===action?'<span aria-hidden="true">↗</span>':''}</a>`).join('');
  const variant=['story','wellness','retail'].includes(p.templateId)?'floating':['editorial','studio','dining'].includes(p.templateId)?'editorial':'structured';
  const density=items.length>5||items.reduce((sum,item)=>sum+item.label.length,0)>64?'overflow':'regular';
  return `<header class="nav" data-header="${variant}" data-menu-density="${density}"><a class="brand" href="#" aria-label="${e(p.name)} startsida">${p.logo?`<span class="brand-mark">${picture(p.logo,p.name,'',false)}</span>`:e(p.name)}</a><nav class="nav-links" aria-label="Huvudmeny">${links}</nav>${links?`<details class="mobile-menu"><summary aria-label="Öppna eller stäng menyn"><span>Meny</span><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg></summary><nav class="mobile-links" aria-label="Mobilmeny">${links}</nav></details>`:''}</header>`;
}

export function installHeaderNavigation(doc=document) {
  if(doc.__headerNavigation)return;doc.__headerNavigation=true;
  doc.addEventListener('click',event=>{
    if(event.defaultPrevented)return;
    const link=event.target.closest?.('.mobile-links a');
    if(link)link.closest('details').open=false;
  });
  doc.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||event.defaultPrevented)return;
    const menu=doc.querySelector('.mobile-menu[open]');
    if(menu){menu.open=false;menu.querySelector('summary').focus();event.preventDefault();}
  });
}

export const navigationCSS=`
/* Header styling owns spacing/shape; imported colors and logo variants remain authoritative. */
html body[data-template][data-imported] .nav{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;min-height:76px;height:auto;gap:24px;margin:18px 0 0;padding:14px 24px;background:var(--brand-header-background,#fff);color:var(--brand-header-text,#202420);border:1px solid color-mix(in srgb,currentColor 12%,transparent);border-radius:0}
html body[data-template][data-imported] .nav .brand{flex:0 1 auto;min-width:0;max-width:34%;font-size:23px;font-weight:650;line-height:1.15;letter-spacing:-.035em;overflow-wrap:anywhere;text-decoration:none}
html body[data-template][data-imported] .nav .brand-mark{min-width:0;width:100%;padding:0;background:none;border:0}
html body[data-template][data-imported] .nav .brand-mark img{display:block;width:auto;height:auto;max-width:min(180px,100%);max-height:40px;object-fit:contain;border:0;border-radius:0;background:none;padding:0}
html body[data-template][data-imported] .nav-links{display:flex;align-items:center;justify-content:flex-end;flex-wrap:nowrap;gap:clamp(14px,2.2vw,32px);width:auto;min-width:0;font-size:13px;font-weight:500;line-height:1.3;letter-spacing:0}
html body[data-template][data-imported] .nav-links a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 0;max-width:180px;text-align:center;color:inherit;text-decoration:none;text-underline-offset:6px;overflow-wrap:anywhere}
html body[data-template][data-imported] .nav-links a:hover{text-decoration:underline}
html body[data-template][data-imported] .nav :is(.nav-links,.mobile-links) .nav-action{gap:20px;padding:12px 18px;background:var(--accent);color:var(--accent-ink);border:1px solid transparent;border-radius:8px;text-decoration:none;line-height:1.25}
html body[data-template][data-imported] .nav-action span{font-size:18px;line-height:1}
html body[data-template][data-imported] .nav[data-header="floating"]{border-radius:18px;box-shadow:0 8px 28px #00000008}
html body[data-template][data-imported] .nav[data-header="floating"] .nav-action{border-radius:999px}
html body[data-template][data-imported] .nav[data-header="editorial"]{margin-top:0;border-width:0 0 1px;padding:18px 0;background:var(--brand-header-background,transparent);border-radius:0;min-height:80px}
html body[data-template][data-imported] .nav[data-header="editorial"] .nav-action{border-radius:0;background:transparent;color:inherit;border-color:color-mix(in srgb,currentColor 35%,transparent)}
html body[data-template][data-imported] .nav[data-header="structured"]{border-radius:10px;border-left:3px solid var(--accent);box-shadow:0 4px 18px #00000004}
html body[data-template][data-imported] .mobile-menu{display:none;margin-left:auto}
html body[data-template][data-imported] .mobile-menu summary{display:flex;align-items:center;justify-content:center;gap:12px;min-height:44px;padding:10px 14px;border:1px solid color-mix(in srgb,currentColor 24%,transparent);border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;list-style:none;line-height:1;color:inherit}
.mobile-menu summary::-webkit-details-marker{display:none}.mobile-menu svg{fill:none;stroke:currentColor;stroke-width:1.5;flex:none}.mobile-menu[open] summary svg{transform:rotate(90deg)}
html body[data-template][data-imported] .mobile-links{position:absolute;top:calc(100% + 10px);right:0;left:0;display:grid;gap:4px;max-height:70vh;overflow:auto;overscroll-behavior:contain;padding:14px;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:14px;background:var(--brand-header-background,#fff);color:var(--brand-header-text,#202420);box-shadow:0 18px 50px #00000018}
html body[data-template][data-imported] .mobile-links a{display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:12px 14px;color:inherit;font-size:16px;line-height:1.4;text-decoration:none;overflow-wrap:anywhere}
html body[data-template][data-imported] .mobile-links a:hover{background:color-mix(in srgb,currentColor 7%,transparent)}
html body[data-template][data-imported] .nav[data-menu-density="overflow"] .nav-links{display:none}
html body[data-template][data-imported] .nav[data-menu-density="overflow"] .mobile-menu{display:block}
html body[data-template][data-imported] .nav[data-menu-density="overflow"] .brand{max-width:calc(100% - 120px)}
html body[data-template][data-imported] .nav :is(a,summary):focus-visible{outline:2px solid currentColor;outline-offset:4px}
@media(max-width:900px){
 html body[data-template][data-imported] .nav{min-height:68px;padding:12px 16px;gap:16px;margin-top:12px;flex-wrap:nowrap}
 html body[data-template][data-imported] .nav[data-header="editorial"]{margin-top:0;padding:16px 0}
 html body[data-template][data-imported] .nav .brand{max-width:calc(100% - 112px);font-size:20px}
 html body[data-template][data-imported] .nav .brand-mark img{max-width:min(150px,100%);max-height:34px}
 html body[data-template][data-imported] .nav .nav-links{display:none}
 html body[data-template][data-imported] .mobile-menu{display:block;flex:none}
}
@media print{html body[data-template][data-imported] .mobile-menu{display:none}}
`;
