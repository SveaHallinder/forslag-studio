import {createEditorNavigation} from './editor-navigation.mjs';
import {createSocialStudio} from './social-studio.mjs';
import {socialProfileURL} from './social-content.mjs';
import {sectionKinds,detectSectionKind} from './section-design.mjs';
import {createDesignWorkbench} from './design-workbench.mjs';
import {createTemplatePicker} from './template-picker.mjs';
import {brandRoles,brandPalette,selectBrandLogo} from './branding.mjs';
import { browserAPI, trimLogo, probeLaunchImage, probeLaunchForm } from './browser-api.mjs';
import { normalizeProject, normalizeGallery, renderDemo, installDemoNavigation, escapeHTML as e } from './render.mjs';
import { encodeProject } from './share.mjs';
import { templates, getTemplate } from './templates.mjs';
import { assessProject, searchProjects, restoreProject, prepareNavigation, requestFormIssue, detachRequestForm } from './project-tools.mjs';
import { createStudioImageOptions } from './studio-images.mjs';
import {importQualityIssues} from './import-quality.mjs';
import {checkLaunchAssets,importLaunchChecks,launchSignature,launchReportCurrent} from './launch-checks.mjs';
import {createImportStudio} from './import-studio.mjs';
import {createConnectionsStudio} from './connections-studio.mjs';
import {createCustomerFunctions} from './customer-functions.mjs';
import {cloudContext,selectCloudWorkspace,cloudRequest,refreshCloudSession,cloudDraftRevision,restoreCloudDraft} from './cloud-api.mjs';
import {createCloudStudio} from './cloud-studio.mjs';
import {createPilotSetup} from './pilot-setup.mjs';

const $ = id => document.getElementById(id);
const imageChoices = createStudioImageOptions(e);
let project, config = {}, dirty = false, device = 'desktop', toastTimer, previewTimer, importBusy = false;
let activePage = -1, editingSite, previewSource;
let pendingImportQualityAction;
let launchReport,launchSequence=0,launchController;
const editorNavigation=createEditorNavigation();
const expandedCards=new WeakSet();
const workbench=createDesignWorkbench({getProject:()=>project,getPage:()=>currentContent(),changed:()=>{markDirty();fillEditor();},previewTemplate:id=>templatePicker.open(id),navigate:editorNavigation.reveal,editNavigation:()=>$('editNavigation').click(),notify:toast});
function currentContent() { return project.pages?.[activePage] || project; }
function fieldOwner(field) { return ['name','accent'].includes(field) ? project : currentContent(); }
let draftKey = 'forslag-studio-draft-v1',selectionKey='forslag-studio-selected-project';
let projectIndex = [], archiveIndex = [], projectLoadSequence = 0, libraryLoadSequence = 0, libraryView = 'active', archiveBusy = false, archiveTarget = '';
const customerFunctions=createCustomerFunctions({getProject:()=>project,onApply:next=>{Object.assign(project,next);markDirty();fillEditor();toast('Kundfunktionerna är uppdaterade. Spara utkastet och kontrollera länkarna före kunddelning.');}});
const socialStudio=createSocialStudio({getProject:()=>project,readImage,notify:toast,onCreate:async(next,previous,snapshot)=>{
  if(project!==previous||JSON.stringify(project)!==snapshot)throw new Error('Det öppna förslaget har ändrats. Stäng och öppna social-flödet igen; dina ändringar finns kvar.');
  if(importBusy)throw new Error('En webbplatsimport pågår. Vänta tills den är klar innan du skapar ett nytt förslag.');
  if(dirty){
    await save(false);
    if(project!==previous||dirty)throw new Error('Förslaget ändrades under sparningen. Dina senaste ändringar finns kvar. Öppna social-flödet igen.');
  }
  ++projectLoadSequence;project=next;dirty=true;fillEditor();markDirty();showEditor();refreshProjects().catch(()=>{});
}});
$('fromSocial').addEventListener('click',()=>{if(project)socialStudio.open();});
const importStudio=createImportStudio({getProject:()=>project,getSource:()=>$('sourceUrl').value,notify:toast,onCreate:async(next,previous,snapshot,isCurrent)=>{
  if(!isCurrent())throw new Error('Importen stängdes. Ditt öppna förslag är kvar.');
  if(project!==previous||JSON.stringify(project)!==snapshot)throw new Error('Det öppna förslaget har ändrats. Dina ändringar finns kvar. Öppna importen igen.');
  if(importBusy)throw new Error('En import pågår. Vänta tills den är klar.');
  if(dirty){await save(false);if(!isCurrent())throw new Error('Importen stängdes. Ditt öppna förslag är sparat.');if(project!==previous||dirty)throw new Error('Förslaget ändrades under sparningen. Dina senaste ändringar finns kvar. Öppna importen igen.');}
  ++projectLoadSequence;project=next;workbench.captureOriginal(project);dirty=true;fillEditor();markDirty();showEditor();refreshProjects().catch(()=>{});
}});
const connectionsStudio=createConnectionsStudio({getProject:()=>project,openPilot:()=>pilotSetup.open(),editFunctions:()=>customerFunctions.open(),review:()=>reviewBeforeShare(),navigate:editorNavigation.reveal});
const cloudStudio=createCloudStudio({getProject:()=>project,save,notify:toast,onForm:form=>{
  const old=project.requestForm;if(form){project.requestForm=form;project.ctaHref=form.url;project.cta=form.kind==='booking'?'Skicka bokningsförfrågan':'Kontakta oss';}
  else{delete project.requestForm;if(project.ctaHref===old?.url){project.ctaHref=project.email?'mailto:'+project.email:project.phone?'tel:'+project.phone.replace(/[^+\d]/g,''):'#kontakt';project.cta='Kontakta oss';}}
  for(const page of project.pages||[]){if(form||page.ctaHref===old?.url){page.cta=project.cta;page.ctaHref=project.ctaHref;}delete page.requestForm;}
  if(!form&&old)project.navigation=project.navigation.map(item=>item.href===old.url?{...item,href:project.ctaHref}:item);
  markDirty();fillEditor();
},onSelect:async(workspace,copy)=>{
  if(!copy&&workspace===cloudContext().workspace)return;
  if(importBusy||$('saveButton').disabled||archiveBusy)throw new Error('Vänta tills import, sparning eller arkivering är klar innan du byter arbetsyta.');
  const previous=project,previousWorkspace=cloudContext().workspace,previousDirty=dirty;
  const next=copy?detachRequestForm({...project,id:''}):null;
  ++projectLoadSequence;++libraryLoadSequence;
  if(dirty)localStorage.setItem(draftKey,serializeDraft());
  selectCloudWorkspace(workspace);updateStorageUI();
  try{
    dirty=false;project=next||await loadInitialProject();dirty=copy||dirty;fillEditor();if(copy){markDirty();await save(false);}await refreshProjects();showEditor();
  }catch(error){selectCloudWorkspace(previousWorkspace);updateStorageUI();project=previous;dirty=previousDirty;fillEditor();await refreshProjects().catch(()=>{});throw error;}
}});
const pilotSetup=createPilotSetup({getProject:()=>project,save,notify:toast,openWorkspace:()=>cloudStudio.open(),editFunctions:()=>customerFunctions.open(),onApply:setup=>{project.customerSetup=setup;markDirty();fillEditor();},onForm:form=>{project.requestForm=form;project.ctaHref=form.url;project.cta='Boka besök';for(const page of project.pages||[]){page.cta=project.cta;page.ctaHref=project.ctaHref;}markDirty();fillEditor();}});
$('showCloud').addEventListener('click',()=>cloudStudio.open());
function updateStorageUI(){
  const c=cloudContext(),workspace=c.workspaces.find(w=>w.id===c.workspace),scope=c.workspace?'-'+c.workspace:'';
  draftKey='forslag-studio-draft-v1'+scope;selectionKey='forslag-studio-selected-project'+scope;
  $('storageLabel').textContent=workspace?'Arbetsyta: '+workspace.name:'Sparas i din webbläsare';
  $('storageNote').textContent=workspace?'Sparas i '+workspace.name+' · Gemensamt för medlemmar':'Projekt sparas i din webbläsare · Ta en projektkopia som backup';
  $('libraryStorageNote').textContent=workspace?'Projekten sparas i '+workspace.name+' och kan öppnas av arbetsytans medlemmar. Osparade utkast finns bara i den här webbläsaren. Ladda ner Projektkopia som backup.':'Dina projekt sparas bara i den här webbläsaren och delas inte med andra säljare. Ladda ner Projektkopia som backup. Rensad webbplatsdata eller privat läge kan ta bort projekten.';
  $('archiveDialog').querySelector('.dialog-intro').textContent='Förslaget flyttas från Aktiva till Arkiverade. Du kan återställa det när som helst. Dina delade kundlänkar fortsätter fungera.'+(workspace?' Formuläret tar inte emot nya förfrågningar medan projektet är arkiverat.':'');
}
$('editCustomerFunctions').addEventListener('click',()=>customerFunctions.open());
$('importFiles').addEventListener('click',()=>{if(project)importStudio.open();});
$('showConnections').addEventListener('click',()=>{if(project)connectionsStudio.open();});
$('browserImport').addEventListener('click',()=>importCompany({renderFirst:true}));

async function loadInitialProject() {
  let draft, selected;
  try { selected = localStorage.getItem(selectionKey); draft = JSON.parse(localStorage.getItem(draftKey)); } catch {}
  if(draft && typeof draft === 'object' && !Array.isArray(draft)) { if(draft._baseRevision!==undefined)restoreCloudDraft(draft.id,draft._baseRevision);dirty = true; return normalizeProject(draft); }
  const id = /^[a-z0-9-]{1,70}$/.test(selected ?? '') ? selected : 'vegavista';
  try { return normalizeProject(await(await api('/api/projects/' + id)).json()); }
  catch(error) {
    if(error.status !== 404) throw error;
    const active = await(await api('/api/projects')).json();
    if(active.length){
      toast('Det senaste projektet är inte aktivt. Ett annat sparat förslag visas.');
      return normalizeProject(await(await api('/api/projects/' + active[0].id)).json());
    }
    return normalizeProject({name:'Nytt förslag',headline:'Här börjar nästa kunds hemsida.'});
  }
}

function toast(message) {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 4500);
}
async function api(path, body, timeout = 90000) {
  const response = await browserAPI(path, body);
  if (!response.ok) {
    let data; try { data = await response.json(); } catch { data = {}; }
    throw Object.assign(new Error(data.error || 'Anropet misslyckades. Ladda om sidan och försök igen.'),{status:response.status});
  }
  return response;
}
function serializeDraft(){return JSON.stringify({...project,...(cloudContext().workspace?{_baseRevision:cloudDraftRevision(project.id)}:{})});}
function markDirty() {
  dirty = true; $('savedState').textContent = 'OSPARAT';
  try { localStorage.setItem(draftKey, serializeDraft()); } catch { $('savedState').textContent = 'SPARA MANUELLT'; }
  renderImportQuality();
}
let pendingDraftConfirmation;
function confirmDraftChange(message) {
  if(pendingDraftConfirmation)return Promise.resolve(false);
  const current=project,snapshot=JSON.stringify(project);
  $('draftChangeMessage').textContent=message;
  $('draftChangeDialog').returnValue='';
  return new Promise(resolve=>{
    pendingDraftConfirmation={resolve,current,snapshot};
    $('draftChangeDialog').showModal();
  });
}
$('confirmDraftChange').addEventListener('click',()=>$('draftChangeDialog').close('continue'));
$('draftChangeDialog').addEventListener('close',()=>{
  const pending=pendingDraftConfirmation;pendingDraftConfirmation=null;if(!pending)return;
  const accepted=$('draftChangeDialog').returnValue==='continue';
  const unchanged=project===pending.current&&JSON.stringify(project)===pending.snapshot;
  if(accepted&&!unchanged)toast('Förslaget har ändrats. Dina senaste ändringar finns kvar; försök igen.');
  pending.resolve(accepted&&unchanged);
});
function importQualitySummary(issues) {
  return issues.map(issue=>(issue.pageIndex<0?'Startsidan':issue.name)+' har '+issue.characters+' tecken i introduktionen men inga innehållsblock.').join(' ');
}
function renderImportQuality() {
  const issues=importQualityIssues(project);
  $('importQuality').hidden=!issues.length;
  $('importQualityMessage').textContent=importQualitySummary(issues);
  $('recoverImport').disabled=importBusy;
}
function requestImportQualityReview(action,kind) {
  const issues=importQualityIssues(project);if(!issues.length)return false;
  const current=project,snapshot=JSON.stringify(project);
  pendingImportQualityAction=()=>{
    if(project!==current||JSON.stringify(project)!==snapshot)return toast('Förslaget har ändrats. Granska den senaste versionen igen.');
    return action();
  };
  $('importQualityDetails').textContent=importQualitySummary(issues);
  $('continueImportQuality').textContent=kind==='download'?'Ladda ner ändå · ej färdiggranskad':'Skapa länk ändå · ej färdiggranskad';
  for(const id of ['reviewDialog','shareDialog'])if($(id).open)$(id).close();
  $('importQualityDialog').showModal();return true;
}
$('continueImportQuality').addEventListener('click',()=>{const action=pendingImportQualityAction;pendingImportQualityAction=null;$('importQualityDialog').close();action?.();});
$('importQualityDialog').addEventListener('close',()=>{pendingImportQualityAction=null;});
$('inspectImportQuality').addEventListener('click',()=>{
  const issue=importQualityIssues(project)[0];$('importQualityDialog').close();showEditor();activePage=issue?.pageIndex??-1;fillEditor();
  editorNavigation.reveal('content','description');
});
$('recoverImport').addEventListener('click',()=>importCompany({recover:true}));
$('recoverImportDialog').addEventListener('click',()=>{$('importQualityDialog').close();importCompany({recover:true});});
function updateTitle() {
  $('projectTitle').textContent = project.name;
  $('breadcrumbName').textContent = project.name;
  try { $('previewDomain').textContent = new URL(project.source).hostname + ' · designförslag'; } catch { $('previewDomain').textContent = 'Ditt designförslag'; }
  $('colorValue').textContent = project.accent;
}
function fitPreview() {
  const stage = $('previewStage');
  const availableWidth = stage.clientWidth - (window.innerWidth <= 1100 ? 26 : 46);
  const width = device === 'mobile' ? 390 : 1100;
  const scale = Math.min(1, availableWidth / width);
  $('previewFrameWrap').style.width = width + 'px';
  $('previewFrameWrap').style.transform = `scale(${scale})`;
  $('preview').style.height = Math.max(400, (stage.clientHeight - 40) / scale - 34) + 'px';
}
function updatePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const frame = $('preview');
    let top = 0; try { if(previewSource===currentContent().source)top = frame.contentWindow.scrollY; } catch {}
    previewSource=currentContent().source;
    frame.onload = () => {
      try {
        frame.contentWindow.scrollTo(0, top);
        installDemoNavigation(frame.contentDocument,frame.contentWindow);
        const previewDocument=frame.contentDocument;workbench.attach(previewDocument);
        previewDocument.addEventListener('keydown',exitFocusedPreview);
        previewDocument.fonts.ready.then(()=>{
          if(frame.contentDocument!==previewDocument)return;
          if([...previewDocument.fonts].some(face=>face.status==='error'))$('typographyStatus').textContent='Minst en originalfont kunde inte laddas. Förhandsvisningen använder en reservfont. Välj ett annat typsnitt eller försök igen före delning.';
          else if([...previewDocument.fonts].some(face=>face.status==='loaded'))$('typographyStatus').textContent='Fontfiler för förhandsvisningen är laddade. Rubriker: '+(project.typography?.heading||'mallens font')+'. Brödtext: '+(project.typography?.body||'mallens font')+'.';
        });
        frame.contentDocument.addEventListener('demo-page-change',event=>{
          const index=(project.pages||[]).findIndex(page=>page.source===event.detail.source);
          if(index===activePage)return;
          activePage=index;previewSource=currentContent().source;fillEditor(true);workbench.attach(frame.contentDocument);
        });
      } catch {}
    };
    frame.srcdoc = renderDemo(project,{pageSource:currentContent().source});
    updateTitle();
  }, 160);
}
function imageOptions(selected) {
  return '<option value="">Ingen bild</option>' + imageChoices.options(currentContent().images,selected);
}
let navigationDraft=[], navigationProject;
function renderNavigationSummary() {
  $('navigationSummary').textContent=project.navigation.length?`${project.navigation.length} menylänkar · ${project.navigation.map(n=>n.label).join(' / ')}`:'Ingen egen meny ännu. Lägg till länkar till företagets sidor eller förslagets innehåll.';
}
function renderNavigationRows(focusIndex, focusField='label') {
  const targets=[{label:'Överst på sidan',href:'#start'},...project.cards.filter(c=>c.anchor).map(c=>({label:c.title||'Innehållsblock',href:'#'+c.anchor})),{label:'Kontaktuppgifter',href:'#kontakt'}];
  $('navigationRows').innerHTML=navigationDraft.map((item,i)=>`<fieldset class="navigation-row"><legend>Menylänk ${i+1}</legend><div class="navigation-actions"><button type="button" data-nav-move="${i}" data-direction="-1" aria-label="Flytta menylänk ${i+1} upp" ${i===0?'disabled':''}>↑</button><button type="button" data-nav-move="${i}" data-direction="1" aria-label="Flytta menylänk ${i+1} ned" ${i===navigationDraft.length-1?'disabled':''}>↓</button><button type="button" data-nav-remove="${i}" aria-label="Ta bort menylänk ${i+1}">Ta bort</button></div><label for="nav-label-${i}">Menytext</label><input id="nav-label-${i}" data-nav-index="${i}" data-nav-field="label" maxlength="70" value="${e(item.label)}"><label for="nav-href-${i}">Destination</label><input id="nav-href-${i}" data-nav-index="${i}" data-nav-field="href" maxlength="2000" value="${e(item.href)}" placeholder="https://foretaget.se/kontakt"><label for="nav-target-${i}">Eller länka inom förslaget</label><select id="nav-target-${i}" data-nav-target="${i}"><option value="">Välj innehållsblock…</option>${targets.map(t=>`<option value="${e(t.href)}">${e(t.label)}</option>`).join('')}</select><p id="nav-error-${i}" class="navigation-error" hidden></p></fieldset>`).join('')||'<p class="empty-state">Menyn är tom. Lägg till en länk för att hjälpa besökaren hitta rätt.</p>';
  $('addNavigation').disabled=navigationDraft.length>=12;
  $('navigationError').hidden=true;
  if(focusIndex!==undefined)$(`nav-${focusField}-${focusIndex}`)?.focus();
}
$('editNavigation').addEventListener('click',()=>{
  if(!project)return;
  navigationProject=project;navigationDraft=project.navigation.map(n=>({...n}));renderNavigationRows();$('navigationDialog').showModal();
});
$('cancelNavigation').addEventListener('click',()=>$('navigationDialog').close());
$('navigationRows').addEventListener('input',event=>{
  const {navIndex,navField}=event.target.dataset;
  if(navIndex!==undefined){navigationDraft[Number(navIndex)][navField]=event.target.value;event.target.removeAttribute('aria-invalid');$(`nav-error-${navIndex}`).hidden=true;$('navigationError').hidden=true;}
});
$('navigationRows').addEventListener('change',event=>{
  const index=event.target.dataset.navTarget;
  if(index!==undefined&&event.target.value){navigationDraft[Number(index)].href=event.target.value;renderNavigationRows(Number(index),'href');}
});
$('navigationRows').addEventListener('click',event=>{
  const button=event.target.closest('[data-nav-remove],[data-nav-move]');if(!button)return;
  const index=Number(button.dataset.navRemove??button.dataset.navMove);
  if(button.dataset.navRemove!==undefined)navigationDraft.splice(index,1);
  else {const next=index+Number(button.dataset.direction);if(next<0||next>=navigationDraft.length)return;[navigationDraft[index],navigationDraft[next]]=[navigationDraft[next],navigationDraft[index]];renderNavigationRows(next);return;}
  renderNavigationRows(navigationDraft.length?Math.min(index,navigationDraft.length-1):undefined);
  if(!navigationDraft.length)$('addNavigation').focus();
});
$('addNavigation').addEventListener('click',()=>{if(navigationDraft.length>=12)return;navigationDraft.push({label:'',href:''});renderNavigationRows(navigationDraft.length-1);});
$('navigationForm').addEventListener('submit',event=>{
  event.preventDefault();
  if(project!==navigationProject){$('navigationDialog').close();return toast('Förslaget har bytts. Öppna menyn igen för rätt företag.');}
  try {project.navigation=prepareNavigation(navigationDraft,project);renderNavigationSummary();markDirty();updatePreview();$('navigationDialog').close();toast('Menyn är uppdaterad. Spara utkastet för att behålla den.');}
  catch(error){$('navigationError').textContent=error.message;$('navigationError').hidden=false;
    if(error.index!==undefined){const field=$(`nav-${error.field}-${error.index}`),message=$(`nav-error-${error.index}`);message.textContent=error.message;message.hidden=false;field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',message.id);field.focus();}
  }
});
function galleryTarget(scope) {return scope==='hero'?{owner:currentContent(),key:'heroGallery',primary:'hero'}:{owner:currentContent().cards[Number(scope)],key:'gallery',primary:'image'};}
function galleryItems(scope) {const {owner,key,primary}=galleryTarget(scope);return normalizeGallery(owner[key]||[],owner[primary]);}
function setPrimaryImage(owner,key,primary,url) {
  const old=owner[primary];owner[primary]=url;
  if(Array.isArray(owner[key]))owner[key]=url?normalizeGallery(owner[key].filter(item=>item.url!==old||item.url===url),url):[];
}
function galleryEditor(scope) {
  const items=galleryItems(scope),label=scope==='hero'?'Huvudsektion':'Block '+(Number(scope)+1);
  return `<div class="gallery-editor"><p class="field-help">${items.length} av 12 bilder. Ordning och bildtexter följer med till kunddemon.</p>${items.map((item,i)=>`<div class="gallery-row"><img src="${e(item.url)}" alt="${e(item.label||'Bild '+(i+1))}" loading="lazy" referrerpolicy="no-referrer"><div><label for="gallery-${scope}-${i}">Bildtext ${i+1}</label><input id="gallery-${scope}-${i}" data-gallery-caption="${i}" data-gallery-scope="${scope}" value="${e(item.caption)}" maxlength="600"><div class="gallery-actions"><button type="button" data-open-media="${scope}" data-media-index="${i}">Välj bild</button><button type="button" data-gallery-scope="${scope}" data-gallery-index="${i}" data-gallery-action="up" aria-label="${label}: flytta bild ${i+1} upp" ${i===0?'disabled':''}>↑</button><button type="button" data-gallery-scope="${scope}" data-gallery-index="${i}" data-gallery-action="down" aria-label="${label}: flytta bild ${i+1} ned" ${i===items.length-1?'disabled':''}>↓</button><button type="button" data-gallery-scope="${scope}" data-gallery-index="${i}" data-gallery-action="remove" aria-label="${label}: ta bort bild ${i+1}">Ta bort</button></div></div></div>`).join('')}<label for="gallery-add-${scope}">Lägg till bild i ${label.toLowerCase()}</label><select id="gallery-add-${scope}" data-gallery-add="${scope}" ${items.length>=12?'disabled':''}><option value="">Välj bild…</option>${imageChoices.options(currentContent().images.filter(item=>!items.some(used=>used.url===item.url)))}</select></div>`;
}
function handleGallery(event) {
  const button=event.target.closest('[data-gallery-action]'),add=event.target.dataset.galleryAdd,caption=event.target.dataset.galleryCaption;
  if(button&&event.type!=='click'||add!==undefined&&event.type!=='change'||caption!==undefined&&event.type!=='input')return;
  if(!button&&add===undefined&&caption===undefined)return;
  const scope=button?.dataset.galleryScope??add??event.target.dataset.galleryScope,{owner,key,primary}=galleryTarget(scope),items=galleryItems(scope);
  if(button){const i=Number(button.dataset.galleryIndex),action=button.dataset.galleryAction;if(action==='remove')items.splice(i,1);else{const next=i+(action==='up'?-1:1);if(next<0||next>=items.length)return;[items[i],items[next]]=[items[next],items[i]];}}
  else if(add!==undefined){const url=imageChoices.resolve(event.target.value),image=currentContent().images.find(item=>item.url===url);if(!image||items.length>=12||items.some(item=>item.url===image.url))return;items.push({...image,caption:''});}
  else items[Number(caption)].caption=event.target.value;
  owner[key]=items;owner[primary]=items[0]?.url||'';markDirty();updatePreview();
  if(caption===undefined){if(scope==='hero')renderImages();else renderCards();}
}
for(const container of ['cardsEditor','heroGalleryEditor'])for(const type of ['click','change','input'])$(container).addEventListener(type,handleGallery);
function renderCards() {
  $('cardsEditor').innerHTML = currentContent().cards.map((card, i) => `<details class="card-editor" data-card-panel="${i}" ${expandedCards.has(card)?'open':''}><summary id="card-summary-${i}"><span class="section-number">${String(i+1).padStart(2,'0')}</span><span class="section-copy"><strong id="card-summary-title-${i}">${e(card.title||'Namnlös sektion')}</strong><small id="card-summary-kind-${i}">${e(sectionKinds[detectSectionKind(card)])}</small></span><span class="disclosure-arrow" aria-hidden="true">⌄</span></summary><div class="card-editor-body"><div class="card-editor-header"><span>SEKTION ${String(i+1).padStart(2,'0')}</span><div class="card-actions"><button data-move-card="${i}" data-direction="-1" aria-label="Flytta block ${i+1} upp" ${i===0?'disabled':''}>↑</button><button data-move-card="${i}" data-direction="1" aria-label="Flytta block ${i+1} ned" ${i===currentContent().cards.length-1?'disabled':''}>↓</button><button data-remove-card="${i}" aria-label="Ta bort block ${i+1}">×</button></div></div><label for="card-title-${i}">Rubrik</label><input id="card-title-${i}" data-card="${i}" data-property="title" maxlength="300" value="${e(card.title)}"><label for="card-kind-${i}">Sektionstyp</label><select id="card-kind-${i}" data-card="${i}" data-property="kind"><option value="">Automatiskt · ${e(sectionKinds[detectSectionKind({...card,kind:undefined})])}</option>${Object.entries(sectionKinds).map(([kind,label])=>`<option value="${kind}" ${card.kind===kind?'selected':''}>${e(label)}</option>`).join('')}</select><label for="card-description-${i}">Beskrivning</label><textarea id="card-description-${i}" data-card="${i}" data-property="description" rows="2" maxlength="6000">${e(card.description)}</textarea><div class="field-heading">Bild <button type="button" class="text-button" data-open-media="${i}">Välj visuellt</button></div><label for="card-image-${i}" class="field-help">Vald bild</label><select id="card-image-${i}" data-card="${i}" data-property="image">${imageOptions(card.image)}</select>${galleryEditor(String(i))}<label for="card-href-${i}">Länk <span>Valfri, på rubriken</span></label><input id="card-href-${i}" data-card="${i}" data-property="href" value="${e(card.href||'')}" maxlength="2000" placeholder="https://företaget.se/tjänst"></div></details>`).join('') || '<div class="empty-state section-empty"><strong>Ge sidan mer innehåll.</strong><p>Lägg till en tjänst, produkt, meny eller kundberättelse med ＋ Lägg till.</p></div>';
  $('addCard').disabled = currentContent().cards.length >= 40;
  $('sectionCount').textContent=currentContent().cards.length+' av 40 sektioner · Öppna för att redigera eller ändra ordning.';
}
$('cardsEditor').addEventListener('toggle',event=>{
  const index=event.target.dataset.cardPanel,card=currentContent().cards[Number(index)];
  if(index===undefined||!event.target.isConnected||!card)return;
  if(event.target.open)expandedCards.add(card);else expandedCards.delete(card);
},true);
function renderTypography() {
  const t=project.typography||{},names=[...new Set([t.heading,t.body,...(t.faces||[]).map(f=>f.family),'Arial','Georgia','Verdana'].filter(Boolean))];
  for(const [id,key] of [['headingFont','heading'],['bodyFont','body']]){
    $(id).innerHTML='<option value="">Mallens typsnitt</option>'+names.map(name=>`<option value="${e(name)}">${e(name)}</option>`).join('');$(id).value=t[key]||'';
  }
  $('typographyStatus').textContent=t.heading||t.body?'Valda typsnitt: '+(t.heading||'mallens rubriker')+' / '+(t.body||'mallens brödtext')+'. '+(t.faces?.length?'Fontfiler hämtas från originalet.':'Ingen extern fontfil hittades; kontrollera utseendet eller välj en systemfont.'):'Mallens typsnitt används. Originalets font kan identifieras vid ny import.';
}
for(const [id,key] of [['headingFont','heading'],['bodyFont','body']])$(id).addEventListener('change',()=>{
  project.typography={heading:'',body:'',faces:[],...project.typography,[key]:$(id).value};renderTypography();markDirty();updatePreview();
});
function renderBranding() {
  const profile=project.branding||{},palette=brandPalette(profile);
  $('brandColors').innerHTML=Object.entries(brandRoles).map(([key,label])=>`<div class="brand-color"><div><label for="brand-${key}">${e(label)}</label><span id="brand-value-${key}" class="field-help">${e(profile[key]||'Ej identifierad · automatiskt val')}</span></div><input type="color" id="brand-${key}" data-brand="${key}" value="${palette[key]}"><button type="button" data-clear-brand="${key}" aria-label="Återställ ${e(label.toLowerCase())}" title="Ta bort eget färgval">↺</button></div>`).join('');
  updateBrandingStatus();
}
function updateBrandingStatus() {
  const profile=project.branding||{},count=Object.keys(brandRoles).filter(key=>profile[key]).length,palette=brandPalette(profile);
  const adjusted=['text','mutedText','headerText'].filter(key=>profile[key]&&profile[key]!==palette[key]);
  $('brandingStatus').textContent=(count?`${count} av 7 färgroller är angivna. Färgerna gäller hela förslaget.`:'Ingen färgprofil sparad. Hämta företaget igen eller välj färger här.')+(adjusted.length?' För läsbarhet används ljusare eller mörkare text för: '+adjusted.map(key=>brandRoles[key].toLowerCase()).join(', ')+'.':'');
}
$('brandColors').addEventListener('input',event=>{
  const key=event.target.dataset.brand;if(!Object.hasOwn(brandRoles,key))return;
  project.branding={...project.branding,[key]:event.target.value};$('brand-value-'+key).textContent=event.target.value;
  updateBrandingStatus();renderImages();markDirty();updatePreview();
});
$('brandColors').addEventListener('click',event=>{
  const key=event.target.closest('[data-clear-brand]')?.dataset.clearBrand;if(!Object.hasOwn(brandRoles,key))return;
  delete project.branding?.[key];renderBranding();renderImages();markDirty();updatePreview();
});
$('logoVariants').addEventListener('change',event=>{
  const key=event.target.dataset.logoVariant;if(!['logoLight','logoDark'].includes(key))return;
  const url=imageChoices.resolve(event.target.value);if(url===null)return;
  project.branding={...project.branding,[key]:url};renderImages();markDirty();updatePreview();
});
function renderImages() {
  const shownLogo=selectBrandLogo(project);
  $('logoVariants').innerHTML=['logoDark','logoLight'].map(key=>`<label for="${key}">${key==='logoDark'?'Mörk logotyp · på ljus meny':'Ljus logotyp · på mörk meny'}</label><select id="${key}" data-logo-variant="${key}">${imageOptions(project.branding?.[key]||'')}</select>`).join('');
  const logoPreview=$('logoThumbnail').closest('.logo-preview'),palette=brandPalette(project.branding||{});
  logoPreview.style.background=palette.headerBackground;logoPreview.style.color=palette.headerText;
  $('trimLogo').disabled=!shownLogo;
  $('logoThumbnail').hidden = !shownLogo;
  $('logoEmpty').hidden = !!shownLogo;
  if(shownLogo)$('logoThumbnail').src = shownLogo;
  else $('logoThumbnail').removeAttribute('src');
  $('heroGalleryEditor').innerHTML=galleryEditor('hero');
  $('heroThumbnail').hidden = !currentContent().hero;
  if (currentContent().hero) $('heroThumbnail').src = currentContent().hero;
  $('imageGrid').innerHTML = currentContent().images.map((image, i) => `<button class="image-choice ${currentContent().hero===image.url?'selected':''}" data-image="${i}" aria-label="Välj ${e(image.label || 'bild '+(i+1))}" title="${e(image.label || 'Bild '+(i+1))}"><img src="${e(image.url)}" alt="${e(image.label)}" loading="lazy" referrerpolicy="no-referrer"></button>`).join('');
  $('imagesEmpty').hidden = !!currentContent().images.length;
}
function renderBenefits() {
  $('benefitsEditor').innerHTML = Array.from({length:4}, (_,i) => {
    const b = currentContent().benefits[i] || {title:'',description:''};
    return `<div class="benefit-editor"><label for="benefit-${i}">Fördel ${i+1}</label><input id="benefit-${i}" data-benefit="${i}" data-property="title" value="${e(b.title)}" placeholder="Lämna tomt för att dölja" maxlength="100"><textarea data-benefit="${i}" data-property="description" aria-label="Beskrivning av fördel ${i+1}" rows="2" maxlength="350">${e(b.description)}</textarea></div>`;
  }).join('');
}
function updateTemplateLabel() {
  const template = getTemplate(project.templateId);
  $('selectedTemplate').textContent = template.name;
  $('sidebarTemplate').textContent = template.name;
  $('templateCount').textContent = templates.length + ' valbara designer';
  $('previewTemplate').textContent = template.name;
  $('templateDescription').textContent = template.description;
}
const templatePicker=createTemplatePicker({getProject:()=>project,getPage:()=>currentContent(),onApply:templateId=>{
  if(project.templateId!==templateId){
    project.templateId=templateId;
    markDirty(); updateTemplateLabel(); updatePreview();
    toast(getTemplate(project.templateId).name + ' är vald. Ditt innehåll finns kvar.');
  }
}});
$('chooseTemplate').addEventListener('click',()=>templatePicker.open());
function fillEditor(keepPreview = false) {
  $('chooseTemplate').disabled=false;$('designDirections').disabled=false;
  if(editingSite!==project){activePage=-1;editingSite=project;$('importDisclosure').open=!project.id&&!project.importedAt&&!project.source;}
  if(activePage>=(project.pages?.length||0))activePage=-1;
  let socialSource=false;try{socialProfileURL(project.source);socialSource=true;}catch{}
  updateTemplateLabel();
  $('pageSelect').innerHTML='<option value="-1">Startsida</option>'+(project.pages||[]).map((p,i)=>`<option value="${i}">${e(p.name||'Sida '+(i+2))}</option>`).join('');
  $('pageSelect').value=String(activePage);
  $('pageHelp').textContent=activePage<0?'Du redigerar startsidan. Namn, meny, logotyp och design gäller hela webbplatsen.':'Du redigerar '+currentContent().name+'. Namn, meny, logotyp och design gäller hela webbplatsen.';
  $('pageOriginal').hidden=!currentContent().source;
  $('pageOriginal').href=currentContent().source||'#';
  $('pageOriginal').textContent=socialSource?'Visa profil ↗':'Visa original ↗';
  $('compareDesign').hidden=socialSource;
  document.querySelectorAll('[data-field]').forEach(input => input.value = fieldOwner(input.dataset.field)[input.dataset.field] ?? '');
  $('sourceUrl').value = project.source;
  document.querySelector('label[for="sourceUrl"]').textContent=socialSource?'Företagets profil':'Företagets hemsida';
  $('includePages').closest('label').hidden=socialSource;
  $('importButton').innerHTML=socialSource?'Nytt förslag från profil <span>→</span>':'Hämta innehåll <span>→</span>';
  $('warnings').textContent = currentContent().warnings.join(' ');
  $('warnings').hidden = !currentContent().warnings.length;
  $('importSummary').textContent=currentContent().warnings.length?currentContent().warnings.length+' importnotiser att granska':project.source?'Visa källa eller hämta nytt innehåll':'Hämta från hemsida eller sociala medier';
  $('savedState').textContent = dirty ? 'OSPARAT' : 'SPARAT';
  $('importStatus').className = 'import-status';
  $('importStatus').textContent = socialSource ? 'Ny hemsida från sociala medier. Redigera innehåll och design nedan; faktauppgifter behöver granskas före delning.' : project.id === 'vegavista' ? 'Vegavista-pilot. Granska eventuella ändringar innan du delar.' : project.importedAt ? 'Importerat innehåll. Granska text och bildval innan du delar.' : 'Klistra in en företagslänk eller fyll i innehållet själv.';
  renderImportQuality();
  imageChoices.clear();renderNavigationSummary(); renderCards(); renderImages(); renderBenefits(); renderTypography(); renderBranding(); workbench.sync(); if(!keepPreview)updatePreview();else updateTitle();
}
$('pageSelect').addEventListener('change',()=>{activePage=Number($('pageSelect').value);fillEditor();});
async function refreshProjects() {
  const sequence = ++libraryLoadSequence;
  const responses = await Promise.all([api('/api/projects'),api('/api/archived')]);
  const [list,archived] = await Promise.all(responses.map(response=>response.json()));
  if(sequence!==libraryLoadSequence)return;
  const skipped = responses.reduce((count,response)=>count+(Number(response.headers.get('X-Studio-Skipped-Projects'))||0),0);
  $('projectReadWarning').hidden = skipped === 0;
  $('projectReadWarning').textContent = skipped ? `${skipped} projektfil(er) kunde inte läsas. Övriga förslag visas nedan. Originalfilerna finns kvar; du kan återställa en nedladdad projektkopia via Öppna projektkopia.` : '';
  projectIndex = list; archiveIndex = archived;
  renderProjectCards();
  $('projectCount').textContent = list.length;
  $('activeCount').textContent = list.length;
  $('archiveCount').textContent = archived.length;
  $('projectList').innerHTML = list.map(p => `<button class="project-item ${project?.id===p.id?'active':''}" data-project="${e(p.id)}"><span class="project-avatar">${e(p.name.slice(0,1).toUpperCase())}</span><span class="project-name">${e(p.name)}</span></button>`).join('') || '<p class="field-help">Sparade förslag visas här.</p>';
}
function showEditor() {
  $('projectsView').hidden = true; $('editorView').hidden = false;
  $('showProjects').classList.remove('side-active');
  requestAnimationFrame(fitPreview);
}
function renderProjectCards() {
  const archived = libraryView === 'archived';
  const list = archived ? archiveIndex : projectIndex;
  const found = searchProjects(list, $('projectSearch').value);
  $('activeProjects').setAttribute('aria-pressed',String(!archived));
  $('archivedProjects').setAttribute('aria-pressed',String(archived));
  $('libraryHelp').textContent = archived ? 'Arkiverade förslag finns kvar '+(cloudContext().workspace?'i arbetsytan':'i den här webbläsaren')+'. Återställ ett förslag för att redigera det igen. Delade kundlänkar påverkas inte.' : 'Dina aktiva kundförslag, senast ändrade först.';
  $('projectCards').innerHTML = found.map(p => {
    const date = new Date(p.updatedAt);
    const edited = Number.isNaN(date.getTime()) ? 'Sparat i den här webbläsaren' : 'Ändrat ' + date.toLocaleDateString('sv-SE');
    const summary = `<span class="project-monogram">${e(p.name.slice(0,1).toUpperCase())}</span><span class="tile-label">${archived?'ARKIVERAT':'WEBBFÖRSLAG'}</span><h2>${e(p.name)}</h2><span class="tile-date">${e(edited)}</span>`;
    return archived ? `<article class="project-tile archived-tile"><div class="project-tile-open">${summary}</div><button class="tile-restore" data-restore="${e(p.id)}" ${archiveBusy?'disabled':''} aria-label="Återställ ${e(p.name)}">Återställ förslag ↗</button></article>` : `<article class="project-tile"><button class="project-tile-open" data-project="${e(p.id)}">${summary}<span class="tile-open">Öppna förslag ↗</span></button><div class="tile-actions"><button class="tile-duplicate" data-duplicate="${e(p.id)}" aria-label="Duplicera ${e(p.name)}">Duplicera</button><button class="tile-archive" data-archive="${e(p.id)}" ${archiveBusy?'disabled':''} aria-label="Arkivera ${e(p.name)}">Arkivera</button></div></article>`;
  }).join('') || `<div class="projects-empty"><h2>${list.length ? 'Inga matchande förslag.' : archived ? 'Inget arkiverat ännu.' : 'Här finns plats för nästa kund.'}</h2><p>${list.length ? 'Prova ett annat företagsnamn eller töm sökningen.' : archived ? 'Avslutade förslag kan flyttas hit och återställas när du behöver dem.' : 'Skapa ditt första förslag från en företagslänk eller öppna en projektkopia.'}</p></div>`;
}
async function changeArchive(id, restore = false) {
  if(archiveBusy)return;
  if(!restore&&project.id===id&&(dirty||$('saveButton').disabled))return toast('Spara ditt öppna utkast innan du arkiverar det.');
  const original = project, snapshot = JSON.stringify(project);
  archiveBusy = true; $('confirmArchive').disabled = true; renderProjectCards();
  try {
    await api(restore?'/api/restore':'/api/archive',{id});
    ++projectLoadSequence;
    let keptDraft = false;
    if(!restore&&project.id===id){
      if(project!==original||dirty||JSON.stringify(project)!==snapshot){
        project={...project,id:''};markDirty();keptDraft=true;
      } else {
        project=normalizeProject({name:'Nytt förslag',headline:'Här börjar nästa kunds hemsida.'});dirty=false;
        try{localStorage.removeItem(draftKey);}catch{}
      }
      fillEditor();
    }
    if(!restore)try{if(localStorage.getItem(selectionKey)===id)localStorage.removeItem(selectionKey);}catch{}
    $('archiveDialog').close();
    $('dashboardResume').textContent=dirty?'Fortsätt med utkastet':'Fortsätt redigera';
    toast(restore?'Förslaget är återställt under Aktiva.':keptDraft?'Den sparade versionen är arkiverad. Dina senaste ändringar finns kvar som en osparad kopia.':'Förslaget är arkiverat. Du kan återställa det under Arkiverade.');
    try{await refreshProjects();}catch{toast('Förslaget har flyttats, men listan kunde inte uppdateras. Öppna Mina förslag igen.');}
  } catch(error) { toast(error.message); }
  finally { archiveBusy=false; $('confirmArchive').disabled=false; renderProjectCards(); }
}
function requestArchive(id) {
  if(archiveBusy)return;
  if(project.id===id&&(dirty||$('saveButton').disabled))return toast('Spara ditt öppna utkast innan du arkiverar det.');
  const entry=projectIndex.find(p=>p.id===id);if(!entry)return;
  archiveTarget=id;$('archiveName').textContent=entry.name;$('archiveDialog').showModal();
}
$('confirmArchive').addEventListener('click',()=>changeArchive(archiveTarget));
$('activeProjects').addEventListener('click',()=>{libraryView='active';renderProjectCards();});
$('archivedProjects').addEventListener('click',()=>{libraryView='archived';renderProjectCards();});
async function openSavedProject(id, duplicate = false) {
  if(dirty && !await confirmDraftChange('Öppna det valda förslaget? De osparade ändringarna i ditt nuvarande utkast försvinner.'))return;
  const sequence = ++projectLoadSequence;
  const previous = project, snapshot = JSON.stringify(project);
  try {
    const loaded = normalizeProject(await(await api('/api/projects/' + encodeURIComponent(id))).json());
    if(sequence !== projectLoadSequence || previous !== project || snapshot !== JSON.stringify(project))return toast('Projektbytet avbröts eftersom du ändrade förslaget. Dina ändringar finns kvar.');
    project = duplicate ? detachRequestForm({...loaded,id:'',name:loaded.name.slice(0,90)+' – kopia'}) : loaded;
    dirty = duplicate;
    if(duplicate)markDirty();
    else { try { localStorage.removeItem(draftKey); localStorage.setItem(selectionKey,project.id); } catch {} }
    fillEditor(); showEditor(); await refreshProjects();
    toast(duplicate ? 'Kopian är öppnad. Spara den som ett nytt förslag.' : 'Förslaget är öppnat.');
  } catch(error) { toast(error.message); }
}
function renderLaunchReview(checks,checking=false) {
  const blocked=checking||checks.some(c=>c.blocking&&!c.ok);
  $('reviewTitle').textContent=checking?'Kontrollerar förslaget.':blocked?'Rätta före kundvisning.':'Teknisk kontroll klar.';
  $('reviewChecks').innerHTML=checks.map(c=>`<div class="review-check ${c.ok?'complete':'needs-review'}"><span role="img" aria-label="${c.ok?'Klart':'Behöver rättas'}">${c.ok?'✓':'○'}</span><div><strong>${e(c.label)}</strong>${!c.ok?`<p>${e(c.help)}</p>`:''}</div>${!c.ok?`<button class="text-button" data-review-field="${c.field}" data-review-tab="${c.tab}" data-review-page="${c.pageIndex??-1}">Rätta</button>`:''}</div>`).join('');
  $('confirmShare').disabled=blocked;
  $('reviewDialog').setAttribute('aria-busy',String(checking));
  const remaining=checks.filter(c=>!c.ok).length;
  $('reviewProgress').textContent=checking?'Kontrollerar valda bilder och logotyp på alla sidor…':launchReport?`${launchReport.checked} av ${launchReport.total} bildfiler kontrollerade. ${remaining} ${remaining===1?'punkt':'punkter'} återstår.`:'';
  $('reviewBlocker').textContent=checking?'Du kan fortsätta redigera efter kontrollen.':blocked?'Rätta de markerade uppgifterna och otillgängliga bilderna innan du skapar en kundlänk.':'De tekniska kontrollerna är klara. Eventuella påminnelser om fakta och varumärkesunderlag visas ovan.';
}
async function reviewBeforeShare() {
  launchController?.abort();const sequence=++launchSequence,current=project,signature=launchSignature(current);
  launchController=new AbortController();const controller=launchController,timer=setTimeout(()=>controller.abort(),25000);
  $('reviewTemplate').textContent = 'Vald design: ' + getTemplate(project.templateId).name;
  launchReport=null;const checks=[...importLaunchChecks(current),...assessProject(current)];
  renderLaunchReview(checks,true);
  if(!$('reviewDialog').open)$('reviewDialog').showModal();
  try{
    const [report,forms]=await Promise.all([checkLaunchAssets(current,probeLaunchImage,{signal:controller.signal}),probeLaunchForm(current,controller.signal)]);report.checks.push(...forms);
    if(sequence!==launchSequence||!$('reviewDialog').open)return;
    if(project!==current||launchSignature(current)!==signature){renderLaunchReview(checks,false);$('confirmShare').disabled=true;$('reviewProgress').textContent='Förslaget ändrades under kontrollen. Kör kontrollen igen för den nya versionen.';return;}
    launchReport={...report,checkedAt:Date.now()};renderLaunchReview([...checks,...report.checks],false);
  }catch(error){if(sequence===launchSequence&&$('reviewDialog').open){$('reviewProgress').textContent='Kontrollen kunde inte slutföras: '+error.message;$('confirmShare').disabled=true;}}
  finally{clearTimeout(timer);}
}
$('recheckLaunch').addEventListener('click',reviewBeforeShare);
$('reviewDialog').addEventListener('close',()=>{launchController?.abort();++launchSequence;});
$('reviewChecks').addEventListener('click',event=>{
  const button=event.target.closest('[data-review-field]');if(!button)return;
  $('reviewDialog').close();showEditor();activePage=Number(button.dataset.reviewPage??-1);fillEditor();
  if(button.dataset.reviewField==='showCloud'){cloudStudio.open();return;}
  editorNavigation.reveal(button.dataset.reviewTab,button.dataset.reviewField);
});
$('confirmShare').addEventListener('click',()=>{
  if(assessProject(project).some(c=>c.blocking&&!c.ok))return reviewBeforeShare();
  if(!launchReportCurrent(project,launchReport))return reviewBeforeShare();
  $('reviewDialog').close();share();
});
$('backupButton').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=(project.name.replace(/[^a-zA-Z0-9åäöÅÄÖ-]/g,'-')||'foretag')+'.forslag.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),60000);toast('En redigerbar projektkopia har laddats ner.');
});
$('projectUpload').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  const previous=project,snapshot=JSON.stringify(project);
  try {
    if(file.size>18000000)throw new Error('Projektkopian är för stor. Välj en fil under 18 MB.');
    const restored=restoreProject(await file.text());
    if(project!==previous||JSON.stringify(project)!==snapshot)return toast('Återställningen avbröts eftersom du ändrade förslaget.');
    if(dirty&&!await confirmDraftChange('Öppna projektkopian? De osparade ändringarna i ditt nuvarande utkast försvinner.'))return;
    project=restored;markDirty();fillEditor();showEditor();toast('Projektkopian är öppnad. Spara för att lägga till den bland dina förslag.');
  }catch(error){toast(error.message);}finally{event.target.value='';}
});
$('projectSearch').addEventListener('input',renderProjectCards);
$('projectCards').addEventListener('click',event=>{
  const button=event.target.closest('[data-project],[data-duplicate],[data-archive],[data-restore]');
  if(button?.dataset.archive)return requestArchive(button.dataset.archive);
  if(button?.dataset.restore)return changeArchive(button.dataset.restore,true);
  if(button)openSavedProject(button.dataset.project||button.dataset.duplicate,!!button.dataset.duplicate);
});
$('dashboardResume').addEventListener('click',showEditor);
$('dashboardNew').addEventListener('click',()=>$('newProject').click());

async function save(notify = true) {
  if (!project.name.trim()) throw new Error('Fyll i företagsnamnet först.');
  $('saveButton').disabled = true;
  const savedProject = project;
  const snapshot = JSON.stringify(savedProject);
  try {
    const result = await (await api('/api/save', savedProject)).json();
    const unchanged = project === savedProject && JSON.stringify(savedProject) === snapshot;
    savedProject.id = result.id;
    if(project === savedProject)try { localStorage.setItem(selectionKey, result.id); } catch {}
    if (unchanged) {
      dirty = false; $('savedState').textContent = 'SPARAT';
      localStorage.removeItem(draftKey);
    }
    await refreshProjects();
    if (notify) toast(cloudContext().workspace?'Utkastet är sparat i arbetsytan.':'Utkastet är sparat i den här webbläsaren.');
    return result;
  } finally { $('saveButton').disabled = false; }
}
async function downloadDemo(allowIncomplete=false) {
  const formIssue=requestFormIssue(project);if(formIssue)return toast(formIssue);
  if(allowIncomplete!==true&&requestImportQualityReview(()=>downloadDemo(true),'download'))return;
  const incomplete=importQualityIssues(project).length>0;
  const button = $('downloadButton');
  button.disabled = true; button.textContent = 'Bäddar in bilder…';
  try {
    const response = await api('/api/export', project, 120000);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = (project.name.toLowerCase().replace(/[^a-z0-9åäö-]/g,'-') || 'foretag') + (incomplete?'-ogranskad':'')+'-designforslag.html';
    a.click(); setTimeout(()=>URL.revokeObjectURL(url),60000);
    toast(incomplete?'Ej färdiggranskad demo nedladdad. Kontrollera innehållet innan du visar den för kunden.':'Demosidan har laddats ner med bilderna inbäddade.');
  } catch(error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = 'Ladda ner demosida ↓'; }
}
async function share(allowIncomplete=false) {
  if(!launchReportCurrent(project,launchReport))return reviewBeforeShare();
  const reviewed=launchReport;
  if(allowIncomplete!==true&&requestImportQualityReview(()=>share(true),'share'))return;
  $('shareButton').disabled = true;
  try {
    const sharingProject = project;
    if(assessProject(project).some(c=>c.blocking&&!c.ok))throw new Error('Rätta markerade uppgifter och länkar på webbplatsens sidor innan du delar.');
    const shareSnapshot = normalizeProject(project);
    await save(false);
    if(project !== sharingProject) return toast('Projektet byttes under sparningen. Skapa en länk från det projekt du vill visa.');
    config = await (await api('/api/config')).json();
    const publicReady = config.publicBase && config.hostingStatus === 'public';
    const base = publicReady ? config.publicBase : location.origin + '/viewer';
    const url = await encodeProject(shareSnapshot, base);
    $('shareUrl').value = url; $('shareUrl').dataset.companyName = shareSnapshot.name; $('visitLink').href = url;
    const incomplete=importQualityIssues(shareSnapshot).length>0,reminders=[...importLaunchChecks(shareSnapshot),...assessProject(shareSnapshot),...reviewed.checks].some(check=>!check.ok);
    $('shareReadiness').textContent=incomplete||reminders?'KONTROLLERA MARKERADE PUNKTER':'TEKNISKT KONTROLLERAD';
    $('shareIntro').textContent = incomplete||reminders?'Bild- och länkkontrollen är klar. Kontrollera återstående påminnelser om fakta, bildkvalitet och varumärke innan kundvisning.':publicReady ? 'Öppna länken på mobilen eller skicka den inför nästa samtal.' : 'Förhandsvisningen fungerar på den här datorn. Publik hosting är ännu inte ansluten.';
    $('shareWarning').hidden = publicReady;
    $('shareWarning').textContent = 'Detta är en lokal länk. Skicka den inte till kunden ännu. Ladda ner en fristående demosida eller anslut den publika visningssidan.';
    $('shareHelp').textContent = 'Länken visar den här versionen och ändras inte när du redigerar. ' + ([shareSnapshot,...(shareSnapshot.pages||[])].some(p=>[p.hero,p.logo,...p.cards.map(c=>c.image)].some(url=>/^https?:/.test(url))) ? 'Bilder från andra sajter måste vara fortsatt tillgängliga. HTML-exporten sparar egna kopior.' : 'Spara hela länken, inklusive delen efter #.');
    $('shareDialog').showModal();
  } catch(error) { toast(error.message); }
  finally { $('shareButton').disabled = false; }
}

document.querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', () => {
  fieldOwner(input.dataset.field)[input.dataset.field] = input.type === 'range' ? Number(input.value) : input.value;
  if(input.dataset.field==='heroPosition'){const page=fieldOwner('heroPosition'),image=page.heroGallery?.find(item=>item.url===page.hero);if(image?.presentation)image.presentation.y=Number(input.value);}
  markDirty(); updatePreview();
}));
$('cardsEditor').addEventListener('input', event => {
  const {card, property} = event.target.dataset;
  if (card !== undefined) { if(property==='kind'&&!event.target.value)delete currentContent().cards[Number(card)].kind;else if(property==='image'){const url=imageChoices.resolve(event.target.value);if(url===null)return;setPrimaryImage(currentContent().cards[Number(card)],'gallery','image',url);}else currentContent().cards[Number(card)][property] = event.target.value; markDirty(); updatePreview();
    $('card-summary-title-'+card).textContent=currentContent().cards[Number(card)].title||'Namnlös sektion';
    $('card-summary-kind-'+card).textContent=sectionKinds[detectSectionKind(currentContent().cards[Number(card)])];
  }
});
$('cardsEditor').addEventListener('change',event=>{if(event.target.dataset.property==='image')renderCards();});
$('cardsEditor').addEventListener('click', event => {
  const move = event.target.closest('[data-move-card]');
  if(move){const index=Number(move.dataset.moveCard),next=index+Number(move.dataset.direction);if(next<0||next>=currentContent().cards.length)return;expandedCards.add(currentContent().cards[index]);[currentContent().cards[index],currentContent().cards[next]]=[currentContent().cards[next],currentContent().cards[index]];renderCards();markDirty();updatePreview();$('card-title-'+next).focus();return;}
  const button = event.target.closest('[data-remove-card]');
  if (button) { const index=Number(button.dataset.removeCard);currentContent().cards.splice(index,1); renderCards(); markDirty(); updatePreview();($('card-summary-'+Math.min(index,currentContent().cards.length-1))||$('addCard')).focus(); }
});
$('benefitsEditor').addEventListener('input', event => {
  const {benefit, property} = event.target.dataset;
  if (benefit !== undefined) {
    while (currentContent().benefits.length <= Number(benefit)) currentContent().benefits.push({title:'',description:''});
    currentContent().benefits[Number(benefit)][property] = event.target.value; markDirty(); updatePreview();
  }
});
$('addCard').addEventListener('click', () => { if(currentContent().cards.length<40) { const card={title:'',description:'',image:''};currentContent().cards.push(card);expandedCards.add(card);renderCards();markDirty();updatePreview();$('card-title-'+(currentContent().cards.length-1)).focus(); } });
$('imageGrid').addEventListener('click', event => { const b=event.target.closest('[data-image]'); if(b){ setPrimaryImage(currentContent(),'heroGallery','hero',currentContent().images[Number(b.dataset.image)].url); renderImages(); markDirty(); updatePreview(); } });
$('clearHero').addEventListener('click', ()=>{currentContent().hero='';currentContent().heroGallery=[];renderImages();markDirty();updatePreview();});
$('clearLogo').addEventListener('click', ()=>{project.logo='';if(project.branding){delete project.branding.logoLight;delete project.branding.logoDark;}renderImages();markDirty();updatePreview();});
$('trimLogo').addEventListener('click',async()=>{
  const site=project,original=selectBrandLogo(project);if(!original)return;
  const button=$('trimLogo');button.disabled=true;$('logoTrimStatus').textContent='Kontrollerar logotypens kanter…';
  try{
    const trimmed=await trimLogo(original);if(project!==site||selectBrandLogo(project)!==original)return;
    if(!trimmed){$('logoTrimStatus').textContent='Ingen säker tom kant hittades. Originalet behålls.';return;}
    if(project.logo===original)project.logo=trimmed;
    for(const key of ['logoLight','logoDark'])if(project.branding?.[key]===original)project.branding[key]=trimmed;
    renderImages();markDirty();updatePreview();$('logoTrimStatus').textContent='Tomma kanter är trimmade. Spara utkast för att behålla ändringen.';
  }catch(error){console.warn('[mockup logo framing]',error.message);if(project===site)$('logoTrimStatus').textContent='Logotypen kunde inte trimmas: '+error.message;}
  finally{button.disabled=!selectBrandLogo(project);}
});
async function readImage(file, isLogo) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Välj en JPG-, PNG- eller WebP-bild.');
  if (file.size > 10000000) throw new Error('Bilden får vara högst 10 MB.');
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, (isLogo?500:1200)/Math.max(bitmap.width,bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
  return isLogo?canvas.toDataURL('image/png'):canvas.toDataURL('image/webp',.72);
}
for(const id of ['imageUpload','logoUpload']) $(id).addEventListener('change',async event=>{
  const file=event.target.files[0]; if(!file)return;
  const target=currentContent(),site=project;
  try { const url=await readImage(file,id==='logoUpload');
    if(project!==site)return toast('Bilden lades åt sidan eftersom du bytte projekt.');
    if(id==='logoUpload'){project.logo=url;if(project.branding){delete project.branding.logoLight;delete project.branding.logoDark;}}
    else { setPrimaryImage(target,'heroGallery','hero',url);target.images.unshift({url,label:file.name});target.images=target.images.slice(0,40); }
    renderImages();renderCards();markDirty();updatePreview();toast('Bilden är inlagd.');
  }catch(error){toast(error.message);}finally{event.target.value='';}
});
$('desktopButton').addEventListener('click',()=>{device='desktop';$('desktopButton').classList.add('selected');$('mobileButton').classList.remove('selected');$('desktopButton').setAttribute('aria-pressed','true');$('mobileButton').setAttribute('aria-pressed','false');fitPreview();});
$('mobileButton').addEventListener('click',()=>{device='mobile';$('mobileButton').classList.add('selected');$('desktopButton').classList.remove('selected');$('mobileButton').setAttribute('aria-pressed','true');$('desktopButton').setAttribute('aria-pressed','false');fitPreview();});
function focusPreview(focused) {
  document.querySelector('.workspace').classList.toggle('preview-focus',focused);
  $('focusPreview').setAttribute('aria-pressed',String(focused));
  $('focusPreview').textContent=focused?'Tillbaka till redigering':'Utöka vyn';
  $('previewStage').scrollIntoView({block:'nearest'});fitPreview();
}
$('focusPreview').addEventListener('click',()=>focusPreview($('focusPreview').getAttribute('aria-pressed')!=='true'));
function exitFocusedPreview(event) {
  if(event.key==='Escape'&&!document.querySelector('dialog[open]')&&$('focusPreview').getAttribute('aria-pressed')==='true'){
    focusPreview(false);$('focusPreview').focus();
  }
}
document.addEventListener('keydown',exitFocusedPreview);
$('saveButton').addEventListener('click',()=>save().catch(error=>toast(error.message)));
$('shareButton').addEventListener('click',reviewBeforeShare);
$('downloadButton').addEventListener('click',downloadDemo);
$('downloadFromDialog').addEventListener('click',downloadDemo);
$('copyLink').addEventListener('click',async()=>{
  try {
    const url=$('shareUrl').value;
    if (typeof ClipboardItem!=='undefined') await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([url],{type:'text/plain'}),'text/html':new Blob([`<a href="${e(url)}">${e($('shareUrl').dataset.companyName || project.name)} – designförslag</a>`],{type:'text/html'})})]);
    else await navigator.clipboard.writeText(url);
    toast('Länken är kopierad.');$('copyLink').textContent='Kopierad';setTimeout(()=>$('copyLink').textContent='Kopiera',2000);
  }catch{$('shareUrl').focus();$('shareUrl').select();toast('Markera och kopiera länken med ⌘C eller Ctrl+C.');}
});
$('openPreview').addEventListener('click',async()=>{
  const win=window.open('about:blank','_blank');
  try{const result=await save(false);if(win)win.location.href=result.url;else toast('Tillåt popupfönster för att öppna förhandsvisningen.');}
  catch(error){if(win)win.close();toast(error.message);}
});
$('projectList').addEventListener('click',event=>{const button=event.target.closest('[data-project]');if(button)openSavedProject(button.dataset.project);});
$('newProject').addEventListener('click',async()=>{
  if(!project)return toast('Dina förslag öppnas. Försök igen om ett ögonblick.');
  if(dirty&&!await confirmDraftChange('Skapa ett nytt förslag? De osparade ändringarna i ditt nuvarande utkast försvinner.'))return;
  ++projectLoadSequence;showEditor();project=normalizeProject({name:'Nytt förslag',headline:'Här börjar nästa kunds hemsida.'});dirty=true;fillEditor();markDirty();$('sourceUrl').value='';$('sourceUrl').focus();$('importStatus').textContent='Klistra in en företagslänk för att komma igång.';refreshProjects().catch(()=>{});
});
$('showProjects').addEventListener('click',async()=>{ $('editorView').hidden=true;$('projectsView').hidden=false;$('dashboardResume').textContent=dirty?'Fortsätt med utkastet':'Fortsätt redigera';$('showProjects').classList.add('side-active');try{await refreshProjects();}catch(error){toast(error.message);} });
$('importButton').addEventListener('click',()=>importCompany());
async function importCompany({recover=false,renderFirst=false}={}) {
  if(importBusy||!project)return;
  const url=(recover?project.source:$('sourceUrl').value).trim();if(!url){$('sourceUrl').focus();return toast('Klistra in företagets webbadress.');}
  let social;try{social=socialProfileURL(url);}catch{}
  if(social){socialStudio.open(social.url);return;}
  if(!recover&&dirty&&!await confirmDraftChange('Hämta ett nytt företag? Det ersätter ditt utkast och de osparade ändringarna försvinner.'))return;
  const importProject = project;
  importBusy=true;$('importButton').disabled=true;$('importButton').textContent='Hämtar hemsidan…';
  renderImportQuality();
  $('importStatus').className='import-status loading';$('importStatus').textContent='Läser startsidan och valda undersidor. Behåll fliken öppen; det kan ta ett par minuter.';
  try{
    if(recover){
      $('importStatus').textContent='Sparar din nuvarande version innan en ny import skapas…';
      await save(false);
      if(project!==importProject||dirty){$('importStatus').className='import-status';$('importStatus').textContent='Hämtningen avbröts eftersom du ändrade eller bytte förslag. Dina ändringar finns kvar.';return;}
      $('importStatus').textContent='Nuvarande version är sparad i Mina förslag. Hämtar innehållet som ett nytt förslag med samma design…';
    }
    const importSnapshot = JSON.stringify(project);
    const imported=normalizeProject({...await(await api('/api/import',{url,includePages:$('includePages').checked!==false,renderFirst})).json(),...(recover?{id:''}:{}),templateId:importProject.templateId});
    if(project !== importProject || JSON.stringify(project) !== importSnapshot){
      $('importStatus').className='import-status';
      $('importStatus').textContent='Importen lades åt sidan eftersom du ändrade eller bytte projekt. Dina senaste ändringar finns kvar.';
      return;
    }
    project=imported;workbench.captureOriginal(project);dirty=true;fillEditor();markDirty();
    const quality=importQualityIssues(project);
    $('importStatus').className='import-status'+(quality.length?' error':'');$('importStatus').textContent=quality.length?'Importen behöver granskas: '+importQualitySummary(quality):`Startsida${project.pages?.length?' + '+project.pages.length+' undersidor':''} hämtad. ${project.images.length} bildkandidater och ${project.cards.length} innehållsblock på startsidan. Granska varje sida nedan.`+(recover?' Din valda design är kvar. Jämför rekommenderade mallar med Tre designförslag.':'');
    toast(quality.length?'Importen verkar ha samlat sidans innehåll i introduktionen. Granska varningen.':recover?'Ny import öppnad. Din tidigare version finns i Mina förslag.':'Företagets innehåll är inlagt.');
  }catch(error){$('importStatus').className='import-status error';$('importStatus').textContent=error.name==='TimeoutError'?'Hämtningen tog för lång tid. Ditt utkast finns kvar; försök igen eller fortsätt manuellt.':error.message;}
  finally{importBusy=false;$('importButton').disabled=false;$('importButton').innerHTML='Hämta innehåll <span>→</span>';renderImportQuality();}
}
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
new ResizeObserver(fitPreview).observe($('previewStage'));

if(location.protocol !== 'file:')try {
  config = await (await api('/api/config')).json();
  updateStorageUI();
  project = await loadInitialProject();
  fillEditor();await refreshProjects();fitPreview();
  $('sourceUrl').disabled=false;$('importButton').disabled=false;
  if(dirty)toast('Ditt senaste osparade utkast har återställts.');
  const invite=new URL(location.href).searchParams.get('invite');
  if(invite){
    if(!cloudContext().user){toast('Logga in med den inbjudna mejladressen för att gå med i arbetsytan.');cloudStudio.open();}
    else if(confirm('Gå med i arbetsytan som den här personliga inbjudan gäller? Du får tillgång till dess projekt och inkorg.')){try{const joined=await cloudRequest('/join',{token:invite});await refreshCloudSession();selectCloudWorkspace(joined.workspace);location.href='/?workspace-open=1';}catch(error){toast(error.message);cloudStudio.open();}}
  }else if(new URL(location.href).searchParams.has('workspace-open'))cloudStudio.open();
} catch(error) {
  $('importStatus').textContent=error.message + ' Ladda om sidan eller prova en vanlig webbläsarflik.';
  $('importStatus').className='import-status error';
  document.querySelectorAll('button').forEach(b=>b.disabled=true);
  console.error('[mockup start]',error.message);
}
