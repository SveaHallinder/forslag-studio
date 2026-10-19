import {templates,getTemplate} from './templates.mjs';
import {recommendDirections} from './design-directions.mjs';
import {renderDemo,installDemoNavigation,escapeHTML as e} from './render.mjs';

export const templateGroups=Object.freeze([
  {id:'all',label:'Alla designer'},
  {id:'recommended',label:'För ditt företag'},
  {id:'hospitality',label:'Mat & resor',ids:['cafe','dining','cinema','pop','hospitality']},
  {id:'services',label:'Tjänster & hälsa',ids:['norriva','precision','services','wellness','construction','consulting','story']},
  {id:'creative',label:'Butik & kreativa',ids:['norriva','gallery','poster','atelier','retail','editorial','studio','pop','story']},
]);
const searchText=value=>String(value||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
export function findTemplates({query='',group='all',project={}}={}) {
  const ids=group==='recommended'?[...new Set([project.templateId,...recommendDirections(project).map(direction=>direction.templateId)].filter(Boolean))]:templateGroups.find(item=>item.id===group)?.ids;
  const words=searchText(query).trim().split(/\s+/).filter(Boolean);
  const choices=templates.filter(template=>(!ids||ids.includes(template.id))&&words.every(word=>searchText([template.name,template.description,template.reference].join(' ')).includes(word)));
  return group==='recommended'?ids.map(id=>choices.find(template=>template.id===id)).filter(Boolean):choices;
}

// A quiet, inert crop of the actual design, using this customer's content.
export function templateProject(project,id,useTemplateFonts=false) {
  return {...project,templateId:id,...(useTemplateFonts?{typography:undefined}:{}),...(project.pages?{pages:project.pages.map(page=>({...page,...(useTemplateFonts?{typography:undefined}:{})}))}:{})};
}
export function templateThumbnail(project,id,pageSource,useTemplateFonts=false) {
  return renderDemo(templateProject(project,id,useTemplateFonts),{pageSource}).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('</head>','<style>html{overflow:hidden}*{animation:none!important;transition:none!important}.demo-note{display:none!important}</style></head>').replace(/<body\b/,'<body inert');
}

export function createTemplatePicker({getProject,getPage,onApply}) {
  const $=id=>document.getElementById(id),dialog=$('templateDialog'),frame=$('templatePreview');
  let candidate,original,page,snapshot,device='desktop';
  const samples=new Map();
  const thumbnailObserver=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting||!dialog.open||!original||!entry.target.isConnected)continue;
      const thumb=entry.target.querySelector('iframe'),id=entry.target.dataset.templatePreview;
      if(!samples.has(id))samples.set(id,templateThumbnail(original,id,page.source,$('templateFonts').checked));
      thumb.srcdoc=samples.get(id);thumbnailObserver.unobserve(entry.target);
    }
  },{root:$('templateGallery'),rootMargin:'100px'});
  $('templateGroup').innerHTML=templateGroups.map(group=>`<option value="${group.id}">${e(group.label)}</option>`).join('');
  function fit() {
    if(!dialog.open)return;
    const stage=$('templatePreviewStage'),width=device==='mobile'?390:1100;
    const scale=Math.min(1,Math.max(1,stage.clientWidth-32)/width);
    $('templatePreviewWrap').style.width=width+'px';
    $('templatePreviewWrap').style.transform=`scale(${scale})`;
    frame.style.height=Math.max(240,(stage.clientHeight-32)/scale)+'px';
    for(const thumb of $('templateGallery').querySelectorAll('iframe'))thumb.style.transform=`scale(${thumb.parentElement.clientWidth/1100})`;
  }
  function selection(){for(const choice of $('templateGallery').querySelectorAll('[data-template-preview]')){const id=choice.dataset.templatePreview;choice.setAttribute('aria-pressed',String(candidate===id));choice.querySelector('.template-choice-check').textContent=candidate===id?'✓':original.templateId===id?'•':'';}}
  function list() {
    thumbnailObserver.disconnect();
    const choices=findTemplates({query:$('templateSearch').value,group:$('templateGroup').value,project:original});
    $('templateResults').textContent=choices.length+' av '+templates.length+' designer';
    $('templateEmpty').hidden=!!choices.length;
    $('showAllTemplates').hidden=$('templateGroup').value==='all';
    $('showAllTemplates').textContent='Visa alla '+templates.length+' designer →';
    $('templateGallery').innerHTML=choices.map(template=>`<button type="button" class="template-choice" data-template-preview="${template.id}" aria-label="Förhandsvisa ${e(template.name)}" aria-pressed="${candidate===template.id}"><span class="template-thumbnail" aria-hidden="true"><iframe title="" tabindex="-1" sandbox></iframe></span><span class="template-choice-info"><span class="template-choice-copy"><strong>${e(template.name)}</strong><small>${e(template.reference==='Mall 17'?'Ljust · luftigt':template.reference)}${original.templateId===template.id?' · Nuvarande':''}</small></span><span class="template-choice-check" aria-hidden="true">${candidate===template.id?'✓':original.templateId===template.id?'•':''}</span></span></button>`).join('');
    for(const choice of $('templateGallery').querySelectorAll('[data-template-preview]'))thumbnailObserver.observe(choice);
    fit();
  }
  function preview(id) {
    candidate=getTemplate(id).id;
    const template=getTemplate(candidate);
    $('templatePreviewName').textContent=template.name;
    $('templatePreviewDescription').textContent=template.description;
    const unchanged=candidate===original.templateId&&!($('templateFonts').checked&&original.typography);
    $('applyTemplate').textContent=unchanged?'Behåll denna design':'Använd '+template.name;
    $('templatePreviewStatus').textContent=unchanged?'Nuvarande design':'Förhandsval · utkastet är oförändrat';
    $('templatePickerError').hidden=true;
    frame.srcdoc=renderDemo(templateProject(original,candidate,$('templateFonts').checked),{pageSource:page.source});
    selection();fit();
  }
  frame.addEventListener('load',()=>{
    if(!dialog.open)return;
    try{
      installDemoNavigation(frame.contentDocument,frame.contentWindow);
      frame.contentDocument.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});
    }catch{}
  });
  $('templateGallery').addEventListener('click',event=>{
    const choice=event.target.closest('[data-template-preview]');
    if(choice)preview(choice.dataset.templatePreview);
  });
  $('templateSearch').addEventListener('input',list);
  $('templateGroup').addEventListener('change',list);
  $('resetTemplateSearch').addEventListener('click',()=>{$('templateSearch').value='';$('templateGroup').value='all';list();$('templateSearch').focus();});
  $('showAllTemplates').addEventListener('click',()=>{$('templateSearch').value='';$('templateGroup').value='all';list();$('templateGallery').scrollTop=0;});
  for(const mode of ['desktop','mobile'])$('template'+(mode==='desktop'?'Desktop':'Mobile')).addEventListener('click',()=>{
    device=mode;
    $('templateDesktop').setAttribute('aria-pressed',String(mode==='desktop'));
    $('templateMobile').setAttribute('aria-pressed',String(mode==='mobile'));
    fit();
  });
  $('applyTemplate').addEventListener('click',()=>{
    if(getProject()!==original||getPage()!==page||JSON.stringify(original)!==snapshot){
      $('templatePickerError').textContent='Förslaget har ändrats medan du jämförde. Stäng designväljaren och öppna den igen. Dina ändringar finns kvar.';
      $('templatePickerError').hidden=false;return;
    }
    onApply(candidate,{useTemplateFonts:$('templateFonts').checked});dialog.close();
  });
  $('cancelTemplate').addEventListener('click',()=>dialog.close());
  $('templateFonts').addEventListener('change',()=>{samples.clear();list();preview(candidate);});
  dialog.addEventListener('close',()=>{thumbnailObserver.disconnect();frame.removeAttribute('srcdoc');$('templateGallery').innerHTML='';samples.clear();original=page=null;});
  new ResizeObserver(fit).observe($('templatePreviewStage'));
  return {open(id){
    original=getProject();if(!original)return;
    page=getPage();snapshot=JSON.stringify(original);
    $('templateFonts').checked=true;
    $('templateSearch').value='';$('templateGroup').value='recommended';
    $('templateCompany').textContent=original.name+' · '+templates.length+' designer med ditt innehåll';
    candidate=getTemplate(id||original.templateId).id;dialog.showModal();dialog.scrollTop=0;list();preview(candidate);
  }};
}
