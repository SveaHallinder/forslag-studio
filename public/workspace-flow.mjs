import {normalizeProject} from './render.mjs';

// A brand, image or manual text change makes the draft worth preserving.
export function isStarterDraft(project) {
  return JSON.stringify(normalizeProject(project))===JSON.stringify(normalizeProject({name:'Nytt förslag',headline:'Här börjar nästa kunds hemsida.'}));
}

export function createWorkspaceFlow({root=document,onFit=()=>{},onReview=()=>{}}={}) {
  const $=id=>root.getElementById(id),editor=$('editorView'),steps=[...root.querySelectorAll('[data-workflow-step]')];
  function view(name) {
    if(!['edit','preview'].includes(name))return false;
    editor.dataset.view=name;
    const workspace=root.querySelector('.workspace');
    if(name==='edit'&&workspace?.classList.contains('preview-focus')){workspace.classList.remove('preview-focus');$('focusPreview').setAttribute('aria-pressed','false');$('focusPreview').textContent='Utöka vyn';}
    $('editorViewButton').setAttribute('aria-pressed',String(name==='edit'));
    $('previewViewButton').setAttribute('aria-pressed',String(name==='preview'));
    onFit();return true;
  }
  function select(name,focus=false) {
    if(!['source','design'].includes(name))return false;
    editor.dataset.step=name;
    for(const step of steps){if(step.dataset.workflowStep===name)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');}
    $('workflowHelp').textContent=name==='source'?'Lägg till företagets hemsida eller profil. Du kan också börja med en tom sida.':'Välj design och justera text, bilder och kontakt. Förhandsvisningen följer med.';
    $('importDisclosure').open=name==='source';$('importDisclosure').querySelector('summary').tabIndex=-1;view('edit');
    if(focus)$(name==='source'?'sourceUrl':'name').focus({preventScroll:true});
    return true;
  }
  for(const step of steps)step.addEventListener('click',()=>step.dataset.workflowStep==='review'?onReview():select(step.dataset.workflowStep,true));
  $('importDisclosure').querySelector('summary').addEventListener('click',event=>{if(editor.dataset.step==='source')event.preventDefault();});
  $('sourceContinue').addEventListener('click',()=>select('design',true));
  $('editorViewButton').addEventListener('click',()=>view('edit'));
  $('previewViewButton').addEventListener('click',()=>view('preview'));
  const menuSelector='.project-menu, .workspace-settings';
  const closeMenus=except=>{for(const menu of root.querySelectorAll(menuSelector))if(menu!==except)menu.open=false;};
  root.addEventListener('click',event=>{
    const menu=event.target.closest?.(menuSelector);
    if(!menu||event.target.closest?.('button'))closeMenus();
    else if(event.target.closest?.('summary'))closeMenus(menu);
  });
  root.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||root.querySelector('dialog[open]'))return;
    const menu=root.querySelector('.project-menu[open], .workspace-settings[open]');
    if(menu){event.preventDefault();closeMenus();menu.querySelector('summary').focus();}
  });
  return {select,view};
}
