import {templates,getTemplate} from './templates.mjs';
import {recommendDirections} from './design-directions.mjs';
import {renderDemo,installDemoNavigation,escapeHTML as e} from './render.mjs';

export const templateGroups=Object.freeze([
  {id:'all',label:'Alla designer'},
  {id:'recommended',label:'För ditt företag'},
  {id:'hospitality',label:'Mat & resor',ids:['cafe','dining','cinema','pop','hospitality']},
  {id:'services',label:'Tjänster & hälsa',ids:['precision','services','wellness','construction','consulting','story']},
  {id:'creative',label:'Butik & kreativa',ids:['atelier','retail','editorial','studio','pop','story']},
]);
const searchText=value=>String(value||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
export function findTemplates({query='',group='all',project={}}={}) {
  const ids=group==='recommended'?recommendDirections(project).map(direction=>direction.templateId):templateGroups.find(item=>item.id===group)?.ids;
  const words=searchText(query).trim().split(/\s+/).filter(Boolean);
  return templates.filter(template=>(!ids||ids.includes(template.id))&&words.every(word=>searchText([template.name,template.description,template.reference].join(' ')).includes(word)));
}

export function createTemplatePicker({getProject,getPage,onApply}) {
  const $=id=>document.getElementById(id),dialog=$('templateDialog'),frame=$('templatePreview');
  let candidate,original,page,snapshot,device='desktop';
  $('templateGroup').innerHTML=templateGroups.map(group=>`<option value="${group.id}">${e(group.label)}</option>`).join('');
  function fit() {
    if(!dialog.open)return;
    const stage=$('templatePreviewStage'),width=device==='mobile'?390:1100;
    const scale=Math.min(1,Math.max(1,stage.clientWidth-32)/width);
    $('templatePreviewWrap').style.width=width+'px';
    $('templatePreviewWrap').style.transform=`scale(${scale})`;
    frame.style.height=Math.max(240,(stage.clientHeight-32)/scale)+'px';
  }
  function list() {
    const choices=findTemplates({query:$('templateSearch').value,group:$('templateGroup').value,project:original});
    $('templateResults').textContent=choices.length+' av '+templates.length+' designer';
    $('templateEmpty').hidden=!!choices.length;
    $('templateGallery').innerHTML=choices.map(template=>`<button type="button" class="template-choice" data-template-preview="${template.id}" aria-label="Förhandsvisa ${e(template.name)}" aria-pressed="${candidate===template.id}"><span class="template-glyph glyph-${template.id}" aria-hidden="true">Aa</span><span class="template-choice-copy"><strong>${e(template.name)}</strong><small>${e(template.reference==='Mall 17'?'Ljust · luftigt':template.reference)}</small></span><span class="template-choice-check" aria-hidden="true">${candidate===template.id?'✓':original.templateId===template.id?'•':''}</span></button>`).join('');
  }
  function preview(id) {
    candidate=getTemplate(id).id;
    const template=getTemplate(candidate);
    $('templatePreviewName').textContent=template.name;
    $('templatePreviewDescription').textContent=template.description;
    $('applyTemplate').textContent=candidate===original.templateId?'Behåll denna design':'Använd '+template.name;
    $('templatePreviewStatus').textContent=candidate===original.templateId?'Nuvarande design':'Förhandsval · utkastet är oförändrat';
    $('templatePickerError').hidden=true;
    frame.srcdoc=renderDemo({...original,templateId:candidate},{pageSource:page.source});
    list();fit();
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
    onApply(candidate);dialog.close();
  });
  $('cancelTemplate').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{frame.removeAttribute('srcdoc');original=page=null;});
  new ResizeObserver(fit).observe($('templatePreviewStage'));
  return {open(id){
    original=getProject();if(!original)return;
    page=getPage();snapshot=JSON.stringify(original);
    $('templateSearch').value='';$('templateGroup').value='all';
    $('templateCompany').textContent=original.name+' · '+templates.length+' designer med ditt innehåll';
    dialog.showModal();dialog.scrollTop=0;preview(id||original.templateId);
  }};
}
