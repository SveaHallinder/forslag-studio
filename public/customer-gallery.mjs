// Progressive enhancement: original images and captions remain readable without JS.
export function installCustomerGallery(doc=document) {
  doc.__disposeCustomerGallery?.();
  const win=doc.defaultView,dialog=doc.createElement('dialog');
  if(!win||typeof dialog.showModal!=='function')return;
  const translations={
    sv:{title:'Bildvisning',open:'Öppna bild',close:'Stäng bildvisning',previous:'Föregående bild',next:'Nästa bild',loading:'Laddar bilden…',error:'Bilden kunde inte laddas. Prova nästa bild eller stäng bildvisningen.',of:'av'},
    en:{title:'Photos',open:'Open photo',close:'Close photos',previous:'Previous photo',next:'Next photo',loading:'Loading photo…',error:'This photo could not be loaded. Try the next photo or close the viewer.',of:'of'},
    ro:{title:'Fotografii',open:'Deschide fotografia',close:'Închide fotografiile',previous:'Fotografia anterioară',next:'Fotografia următoare',loading:'Se încarcă fotografia…',error:'Fotografia nu a putut fi încărcată. Încearcă următoarea fotografie sau închide fereastra.',of:'din'},
  };
  const t=translations[doc.documentElement.lang]||translations.sv,preference=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  dialog.className='customer-image-dialog';dialog.setAttribute('aria-label',t.title);
  dialog.innerHTML='<header class="customer-image-header"><h2></h2><button type="button" data-image-close autofocus><span aria-hidden="true">×</span></button></header><div class="customer-image-stage"><p role="status"></p></div><footer class="customer-image-footer"><div class="customer-image-description"><p data-image-caption></p><span data-image-count aria-live="polite" aria-atomic="true"></span></div><nav><button type="button" data-image-previous><span aria-hidden="true">←</span></button><button type="button" data-image-next><span aria-hidden="true">→</span></button></nav></footer>';
  const title=dialog.querySelector('h2'),stage=dialog.querySelector('.customer-image-stage'),status=stage.querySelector('p'),caption=dialog.querySelector('[data-image-caption]'),count=dialog.querySelector('[data-image-count]'),previous=dialog.querySelector('[data-image-previous]'),next=dialog.querySelector('[data-image-next]'),closeButton=dialog.querySelector('[data-image-close]');
  for(const [node,label]of [[previous,t.previous],[next,t.next],[closeButton,t.close]])node.setAttribute('aria-label',label);
  dialog.querySelector('nav').setAttribute('aria-label',t.title);doc.body.append(dialog);
  let entries=[],index=0,opener,currentImage,scrollStyle='',keyboard=false,opened=false;const triggers=new Map(),animations=new Set();
  const settle=()=>{for(const animation of animations)animation.cancel();animations.clear();};
  const animate=(node,opening=false)=>{
    if(keyboard||preference?.matches||doc.body.dataset.motion==='static'||typeof node.animate!=='function')return;
    const animation=node.animate(opening?[{opacity:0,transform:'scale(.985)'},{opacity:1,transform:'scale(1)'}]:[{opacity:.5},{opacity:1}],{duration:opening?200:120,easing:'cubic-bezier(0.23,1,0.32,1)'});
    animations.add(animation);animation.onfinish=animation.oncancel=()=>animations.delete(animation);
  };
  function showImage() {
    settle();const entry=entries[index];if(!entry)return;
    currentImage?.remove();const image=doc.createElement('img');currentImage=image;
    image.alt=entry.image.alt;image.referrerPolicy='no-referrer';image.decoding='async';image.hidden=true;
    status.hidden=false;status.textContent=t.loading;
    caption.textContent=entry.caption;caption.hidden=!entry.caption;count.textContent=`${index+1} ${t.of} ${entries.length}`;
    previous.hidden=next.hidden=entries.length<2;
    image.addEventListener('load',()=>{if(currentImage!==image)return;status.hidden=true;image.hidden=false;animate(image);});
    image.addEventListener('error',()=>{if(currentImage!==image)return;status.hidden=false;status.textContent=t.error;image.hidden=true;});
    stage.prepend(image);image.src=entry.image.getAttribute('src');
  }
  function closed() {
    if(dialog.open||!opened)return;opened=false;
    settle();doc.documentElement.style.overflow=scrollStyle;
    currentImage?.remove();currentImage=undefined;entries=[];
    if(opener?.isConnected)opener.focus({preventScroll:true});opener=undefined;
  }
  const close=()=>{if(dialog.open){dialog.close();closed();}};
  const step=direction=>{if(entries.length<2)return;index=(index+direction+entries.length)%entries.length;showImage();};
  function positionButtons() {
    for(const [button,entry]of triggers){
      const image=entry.image.getBoundingClientRect(),host=entry.host.getBoundingClientRect();
      button.style.left=Math.max(0,image.right-host.left-entry.host.clientLeft-56)+'px';
      button.style.top=Math.max(0,image.top-host.top-entry.host.clientTop+12)+'px';
    }
  }
  function refresh() {
    close();observer?.disconnect();for(const button of triggers.keys())button.remove();triggers.clear();
    for(const group of doc.querySelectorAll('.section-gallery,.cafe-hero-visual,.visual:not(:has(.section-gallery))')){
      if(group.closest('[data-composition="logos"],.section-logos'))continue;
      const hosts=group.matches('.section-gallery')?[...group.querySelectorAll(':scope>figure')]:[group];
      const items=hosts.flatMap(host=>{const image=host.querySelector(':scope>img');return image?[{host,image,caption:host.querySelector('figcaption')?.textContent.trim()||''}]:[];});
      for(const entry of items){
        const button=doc.createElement('button');button.type='button';button.className='customer-image-open';button.setAttribute('aria-label',t.open+': '+(entry.image.alt||t.title));button.setAttribute('aria-haspopup','dialog');button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/></svg>';
        entry.host.append(button);triggers.set(button,{...entry,items,title:group.dataset.galleryTitle||entry.image.alt||t.title});observer?.observe(entry.host);
      }
    }
    positionButtons();
  }
  const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(positionButtons):null;
  const click=event=>{
    if(event.defaultPrevented||doc.querySelector('[data-studio-edit]'))return;
    const button=event.target.closest?.('.customer-image-open'),entry=triggers.get(button);
    if(entry){keyboard=event.detail===0;entries=entry.items;index=entries.findIndex(item=>item.image===entry.image);opener=button;title.textContent=entry.title;scrollStyle=doc.documentElement.style.overflow;dialog.showModal();opened=true;doc.documentElement.style.overflow='hidden';showImage();animate(dialog,true);return;}
    if(event.target.closest?.('[data-image-close]'))close();
    else if(event.target.closest?.('[data-image-previous]')){keyboard=event.detail===0;step(-1);}
    else if(event.target.closest?.('[data-image-next]')){keyboard=event.detail===0;step(1);}
    else if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();}
  };
  const key=event=>{if(!dialog.open)return;keyboard=true;settle();if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();step(event.key==='ArrowLeft'?-1:1);}};
  const changed=()=>settle();
  doc.addEventListener('click',click);doc.addEventListener('keydown',key);doc.addEventListener('demo-page-change',refresh);dialog.addEventListener('close',closed);win.addEventListener('resize',positionButtons);win.addEventListener('beforeprint',close);preference?.addEventListener?.('change',changed);
  doc.__disposeCustomerGallery=()=>{close();settle();observer?.disconnect();for(const button of triggers.keys())button.remove();doc.removeEventListener('click',click);doc.removeEventListener('keydown',key);doc.removeEventListener('demo-page-change',refresh);dialog.removeEventListener('close',closed);win.removeEventListener('resize',positionButtons);win.removeEventListener('beforeprint',close);preference?.removeEventListener?.('change',changed);dialog.remove();};
  refresh();
}

export const customerGalleryCSS=`
html body[data-template] :is(.section-gallery figure,.cafe-hero-visual){position:relative}
html body[data-template] .customer-image-open{position:absolute;z-index:2;width:44px;height:44px;display:grid;place-items:center;border:1px solid #ffffff70;border-radius:50%;padding:0;background:#18211cdb;color:#fff;cursor:zoom-in;transition:background-color 160ms ease}
html body[data-template] .customer-image-open:focus-visible{outline:3px solid #fff;outline-offset:3px;box-shadow:0 0 0 6px #18211c}
.customer-image-dialog:not([open]){display:none}
html body[data-template] .customer-image-dialog{width:calc(100% - 32px);max-width:1200px;height:min(90dvh,900px);max-height:calc(100dvh - 32px);padding:24px;margin:auto;border:1px solid #ffffff24;border-radius:20px;background:#121713;color:#f8f8f2;box-shadow:0 24px 80px #0005;font:14px/1.5 'Avenir Next',Avenir,'Segoe UI',sans-serif;overflow:hidden;overscroll-behavior:contain}
.customer-image-dialog[open]{display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:20px}
.customer-image-dialog::backdrop{background:#0b100de8}
.customer-image-header,.customer-image-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;min-width:0}
html body[data-template] .customer-image-header h2{margin:0;font:500 16px/1.4 'Avenir Next',Avenir,'Segoe UI',sans-serif;letter-spacing:0;overflow-wrap:anywhere;max-width:calc(100% - 68px);max-height:4.2em;overflow:auto;text-wrap:pretty;color:inherit}
.customer-image-dialog button{display:grid;place-items:center;flex-shrink:0;width:48px;height:48px;border:1px solid #ffffff40;border-radius:50%;padding:0;background:transparent;color:inherit;font:24px/1 sans-serif;cursor:pointer;transition:background-color 160ms ease}
.customer-image-dialog button:focus-visible{outline:3px solid #f8f8f2;outline-offset:3px}
.customer-image-stage{display:grid;place-items:center;min-height:0;min-width:0;position:relative}
html body[data-template] .customer-image-stage img{height:100%;width:100%;min-height:0;max-height:100%;max-width:100%;object-fit:contain;object-position:center;aspect-ratio:auto;border-radius:0;background:none}
.customer-image-stage [role=status]{max-width:38ch;margin:0;text-align:center;color:#d3dbd4;line-height:1.6}
.customer-image-description{min-width:0;max-height:20dvh;overflow:auto;overflow-wrap:anywhere}
.customer-image-description p{margin:0 0 6px;white-space:pre-line}
.customer-image-description span{font-size:12px;color:#b7c5b9}
.customer-image-footer nav{display:flex;gap:10px;flex-shrink:0}
.customer-image-dialog [hidden]{display:none!important}
@media(hover:hover) and (pointer:fine){.customer-image-dialog button:hover,html body[data-template] .customer-image-open:hover{background:#36463b}}
@media(max-width:620px){html body[data-template] .customer-image-dialog{width:100%;max-width:none;height:100dvh;max-height:100dvh;margin:0;padding:calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom));border:0;border-radius:0;gap:16px}.customer-image-footer{gap:12px}.customer-image-description{max-height:24dvh}}
@media(prefers-reduced-motion:reduce){.customer-image-dialog button,html body[data-template] .customer-image-open{transition:none}}
@media print{.customer-image-open,.customer-image-dialog{display:none!important}}
`;
