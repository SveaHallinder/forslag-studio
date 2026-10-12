// Customer-facing marketing pages. The editor stays still while content changes.
export function installSiteMotion(doc=document) {
  doc.__disposeSiteMotion?.();
  const win=doc.defaultView;
  if(!win||doc.body?.dataset.motion==='static'||typeof win.Element?.prototype.animate!=='function')return;
  const preference=win.matchMedia?.('(prefers-reduced-motion: reduce)'),print=win.matchMedia?.('print');
  const mode=doc.body.dataset.template,quiet=['gallery','story','wellness','cafe'].includes(mode),film=mode==='cinema';
  const easing='cubic-bezier(0.23, 1, 0.32, 1)',duration=film?600:quiet?500:400;
  let observer,keyboard=false,seen=new WeakSet();const active=new Set();
  const settle=()=>{for(const animation of active)animation.cancel();active.clear();};
  const stop=()=>{observer?.disconnect();settle();};
  function enter(node,delay=0,visual=false) {
    if(seen.has(node)||!node.isConnected||node.contains(doc.activeElement)||print?.matches)return;
    seen.add(node);
    const reduce=preference?.matches,distance=reduce||film&&visual?0:quiet?8:16;
    const transform=mode==='pop'&&visual&&!reduce?'translateY(8px) scale(.985)':`translateY(${distance}px)`;
    const frames=reduce?[{opacity:.65},{opacity:1}]:[{opacity:0,transform},{opacity:1,transform:'translateY(0) scale(1)'}];
    const animation=node.animate(frames,{duration:reduce?120:duration,delay:reduce?0:delay,easing,fill:'none'});
    active.add(animation);const finished=()=>active.delete(animation);animation.onfinish=finished;animation.oncancel=finished;
  }
  function start() {
    stop();seen=new WeakSet();if(keyboard||print?.matches)return;
    const hero=doc.querySelector('.hero-copy'),visual=doc.querySelector('.hero-layout>.visual,.cafe-hero-photo');
    for(const [index,node]of [hero,visual].filter(Boolean).entries()){
      const rect=node.getBoundingClientRect();if(rect.bottom>0&&rect.top<win.innerHeight)enter(node,index*60,node===visual);
    }
    if(preference?.matches||typeof win.IntersectionObserver!=='function')return;
    observer=new win.IntersectionObserver(entries=>{
      let stagger=0;
      for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);enter(entry.target,Math.min(stagger++,2)*60);}
    },{threshold:0,rootMargin:'0px 0px -40px 0px'});
    for(const node of doc.querySelectorAll('.cards>.card,.cafe-sections>.cafe-block,.cafe-about,.about,.site-contact,.cafe-visit,.cafe-social,.site-footer,.cafe-footer'))observer.observe(node);
  }
  const key=()=>{keyboard=true;stop();};
  const click=event=>{if(event.target.closest?.('a[href]'))stop();};
  const focus=event=>{for(const animation of active)if(animation.effect?.target?.contains(event.target))animation.cancel();};
  const change=()=>stop();
  doc.addEventListener('keydown',key,true);doc.addEventListener('click',click,true);doc.addEventListener('focusin',focus,true);
  doc.addEventListener('demo-page-change',start);preference?.addEventListener?.('change',change);win.addEventListener('beforeprint',stop);
  doc.__disposeSiteMotion=()=>{
    stop();doc.removeEventListener('keydown',key,true);doc.removeEventListener('click',click,true);doc.removeEventListener('focusin',focus,true);
    doc.removeEventListener('demo-page-change',start);preference?.removeEventListener?.('change',change);win.removeEventListener('beforeprint',stop);
  };
  start();
}

export const siteMotionCSS=`
/* Small feedback on customer calls to action; content is visible without JS. */
html body[data-template] :is(.button,.cafe-button,.cafe-link){transition:opacity 160ms ease,background-color 160ms ease}
html body[data-template] :is(.button,.cafe-button,.cafe-link):hover{transform:none}
html body[data-template] :is(.button,.cafe-button,.cafe-link):active{transform:translateY(1px)}
html body[data-template] :is(.button,.cafe-button,.cafe-link):focus-visible{transform:none}
html body[data-template] .nav[data-header] .mobile-menu svg{transition:none}
@media(hover:hover) and (pointer:fine){
 html body[data-template] :is(.button,.cafe-button,.cafe-link)>span[aria-hidden]{display:inline-block;transition:transform 160ms cubic-bezier(0.23,1,0.32,1)}
 html body[data-template] :is(.button,.cafe-button,.cafe-link):hover>span[aria-hidden]{transform:translateX(3px)}
 html body[data-template] :is(.button,.cafe-button,.cafe-link):focus-visible>span[aria-hidden]{transform:none;transition:none}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}html body[data-template] :is(.button,.cafe-button,.cafe-link),html body[data-template] :is(.button,.cafe-button,.cafe-link)>span[aria-hidden]{transition:none;transform:none!important}}
html body[data-motion=static] :is(.button,.cafe-button,.cafe-link),html body[data-motion=static] :is(.button,.cafe-button,.cafe-link)>span[aria-hidden]{transition:none;transform:none!important}
@media print{html body[data-template] :is(.button,.cafe-button,.cafe-link){transform:none;transition:none}}
`;
