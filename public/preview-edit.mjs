// Editor-only decoration. Customer HTML never includes these controls.
export function installPreviewEditing(doc,{onSelect,onExit=()=>{},cardIndexes=[]}) {
  const nodes=new Map(),style=doc.createElement('style');
  style.textContent='[data-studio-edit]{cursor:pointer!important;position:relative;outline:1px dashed #437446;outline-offset:5px}[data-studio-edit]:hover,[data-studio-edit]:focus-visible{outline:3px solid #437446;outline-offset:5px;background-color:#cdeb6022}[data-studio-edit] a{pointer-events:none}';doc.head.append(style);
  const add=(element,target,label)=>{if(!element)return;const attrs={};for(const key of ['tabindex','role','aria-label','title'])attrs[key]=element.getAttribute(key);nodes.set(element,{target,attrs});element.dataset.studioEdit='';element.tabIndex=0;element.setAttribute('role','button');element.setAttribute('aria-label','Redigera '+label);element.title='Redigera '+label;};
  const one=(selector,target,label)=>add(doc.querySelector(selector),target,label);
  one('.nav .brand',{type:'logo'},'logotyp');one('.nav-links',{type:'navigation'},'menyn');
  for(const [selector,field,label] of [['h1','headline','huvudrubrik'],[':scope>p','description','introduktion'],['.eyebrow','eyebrow','liten rubrik'],['.button','cta','huvudknapp']])add(doc.querySelector('.hero-copy')?.querySelector(selector),{type:'field',field},label);
  doc.querySelectorAll('.visual img').forEach((img,index)=>add(img,{type:'image',scope:'hero',index},'huvudbild '+(index+1)));
  doc.querySelectorAll('.cards>.card').forEach((card,renderedIndex)=>{
    const index=cardIndexes[renderedIndex]??renderedIndex;
    add(card.querySelector('h2,h3'),{type:'card',index,field:'title'},'sektionsrubrik');
    add(card.querySelector('.card-meta p,.card-meta blockquote,.faq-list'),{type:'card',index,field:'description'},'sektionstext');
    card.querySelectorAll('img').forEach((img,imageIndex)=>add(img,{type:'image',scope:String(index),index:imageIndex},'sektionsbild '+(imageIndex+1)));
    if(!card.querySelector('[data-studio-edit]'))add(card,{type:'card',index,field:'description'},'sektion');
  });
  one('.about h2',{type:'field',field:'aboutTitle'},'rubrik om företaget');one('.about>p',{type:'field',field:'about'},'text om företaget');
  one('.contact-links',{type:'contact'},'kontaktuppgifter');
  const select=event=>{
    if(event.type==='keydown'&&event.key==='Escape'){event.preventDefault();onExit();return;}
    if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
    const element=event.target.closest?.('[data-studio-edit]');
    if(element&&nodes.has(element)){event.preventDefault();event.stopImmediatePropagation();onSelect(nodes.get(element).target);}
    else if(event.type==='click'&&event.target.closest?.('a')){event.preventDefault();event.stopImmediatePropagation();}
  };
  doc.addEventListener('click',select,true);doc.addEventListener('keydown',select,true);
  return ()=>{doc.removeEventListener('click',select,true);doc.removeEventListener('keydown',select,true);style.remove();for(const [node,{attrs}] of nodes){delete node.dataset.studioEdit;for(const [key,value] of Object.entries(attrs))if(value===null)node.removeAttribute(key);else node.setAttribute(key,value);}};
}
