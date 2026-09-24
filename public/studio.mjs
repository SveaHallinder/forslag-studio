import { browserAPI } from './browser-api.mjs';
import { normalizeProject, normalizeGallery, renderDemo, installDemoNavigation, escapeHTML as e } from './render.mjs';
import { encodeProject } from './share.mjs';
import { templates, getTemplate } from './templates.mjs';
import { assessProject, searchProjects, restoreProject, prepareNavigation } from './project-tools.mjs';

const $ = id => document.getElementById(id);
let project, config = {}, dirty = false, device = 'desktop', toastTimer, previewTimer, importBusy = false;
let activePage = -1, editingSite, previewSource;
function currentContent() { return project.pages?.[activePage] || project; }
function fieldOwner(field) { return ['name','accent'].includes(field) ? project : currentContent(); }
const draftKey = 'forslag-studio-draft-v1';
let projectIndex = [], archiveIndex = [], projectLoadSequence = 0, libraryLoadSequence = 0, libraryView = 'active', archiveBusy = false, archiveTarget = '';

async function loadInitialProject() {
  let draft, selected;
  try { selected = localStorage.getItem('forslag-studio-selected-project'); draft = JSON.parse(localStorage.getItem(draftKey)); } catch {}
  if(draft && typeof draft === 'object' && !Array.isArray(draft)) { dirty = true; return normalizeProject(draft); }
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
function markDirty() {
  dirty = true; $('savedState').textContent = 'OSPARAT';
  try { localStorage.setItem(draftKey, JSON.stringify(project)); } catch { $('savedState').textContent = 'SPARA MANUELLT'; }
}
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
        const previewDocument=frame.contentDocument;
        previewDocument.fonts.ready.then(()=>{
          if(frame.contentDocument!==previewDocument)return;
          if([...previewDocument.fonts].some(face=>face.status==='error'))$('typographyStatus').textContent='Minst en originalfont kunde inte laddas. Förhandsvisningen använder en reservfont. Välj ett annat typsnitt eller försök igen före delning.';
          else if([...previewDocument.fonts].some(face=>face.status==='loaded'))$('typographyStatus').textContent='Fontfiler för förhandsvisningen är laddade. Rubriker: '+(project.typography?.heading||'mallens font')+'. Brödtext: '+(project.typography?.body||'mallens font')+'.';
        });
        frame.contentDocument.addEventListener('demo-page-change',event=>{
          const index=(project.pages||[]).findIndex(page=>page.source===event.detail.source);
          if(index===activePage)return;
          activePage=index;previewSource=currentContent().source;fillEditor(true);
        });
      } catch {}
    };
    frame.srcdoc = renderDemo(project,{pageSource:currentContent().source});
    updateTitle();
  }, 160);
}
function imageOptions(selected) {
  const images = [...currentContent().images];
  if (selected && !images.some(i=>i.url===selected)) images.unshift({url:selected,label:'Vald bild'});
  return '<option value="">Ingen bild</option>' + images.map((image, i) => `<option value="${e(image.url)}" ${image.url===selected?'selected':''}>${e(image.label || 'Bild ' + (i+1))}</option>`).join('');
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
  return `<div class="gallery-editor"><p class="field-help">${items.length} av 12 bilder. Ordning och bildtexter följer med till kunddemon.</p>${items.map((item,i)=>`<div class="gallery-row"><img src="${e(item.url)}" alt="${e(item.label||'Bild '+(i+1))}" loading="lazy" referrerpolicy="no-referrer"><div><label for="gallery-${scope}-${i}">Bildtext ${i+1}</label><input id="gallery-${scope}-${i}" data-gallery-caption="${i}" data-gallery-scope="${scope}" value="${e(item.caption)}" maxlength="600"><div class="gallery-actions"><button type="button" data-gallery-scope="${scope}" data-gallery-index="${i}" data-gallery-action="up" aria-label="${label}: flytta bild ${i+1} upp" ${i===0?'disabled':''}>↑</button><button type="button" data-gallery-scope="${scope}" data-gallery-index="${i}" data-gallery-action="down" aria-label="${label}: flytta bild ${i+1} ned" ${i===items.length-1?'disabled':''}>↓</button><button type="button" data-gallery-scope="${scope}" data-gallery-index="${i}" data-gallery-action="remove" aria-label="${label}: ta bort bild ${i+1}">Ta bort</button></div></div></div>`).join('')}<label for="gallery-add-${scope}">Lägg till bild i ${label.toLowerCase()}</label><select id="gallery-add-${scope}" data-gallery-add="${scope}" ${items.length>=12?'disabled':''}><option value="">Välj bild…</option>${currentContent().images.filter(item=>!items.some(used=>used.url===item.url)).map(item=>`<option value="${e(item.url)}">${e(item.label||item.url.split('/').at(-1))}</option>`).join('')}</select></div>`;
}
function handleGallery(event) {
  const button=event.target.closest('[data-gallery-action]'),add=event.target.dataset.galleryAdd,caption=event.target.dataset.galleryCaption;
  if(button&&event.type!=='click'||add!==undefined&&event.type!=='change'||caption!==undefined&&event.type!=='input')return;
  if(!button&&add===undefined&&caption===undefined)return;
  const scope=button?.dataset.galleryScope??add??event.target.dataset.galleryScope,{owner,key,primary}=galleryTarget(scope),items=galleryItems(scope);
  if(button){const i=Number(button.dataset.galleryIndex),action=button.dataset.galleryAction;if(action==='remove')items.splice(i,1);else{const next=i+(action==='up'?-1:1);if(next<0||next>=items.length)return;[items[i],items[next]]=[items[next],items[i]];}}
  else if(add!==undefined){const image=currentContent().images.find(item=>item.url===event.target.value);if(!image||items.length>=12||items.some(item=>item.url===image.url))return;items.push({...image,caption:''});}
  else items[Number(caption)].caption=event.target.value;
  owner[key]=items;owner[primary]=items[0]?.url||'';markDirty();updatePreview();
  if(caption===undefined){if(scope==='hero')renderImages();else renderCards();}
}
for(const container of ['cardsEditor','heroGalleryEditor'])for(const type of ['click','change','input'])$(container).addEventListener(type,handleGallery);
function renderCards() {
  $('cardsEditor').innerHTML = currentContent().cards.map((card, i) => `<div class="card-editor"><div class="card-editor-header"><span>BLOCK ${String(i+1).padStart(2,'0')}</span><div class="card-actions"><button data-move-card="${i}" data-direction="-1" aria-label="Flytta block ${i+1} upp" ${i===0?'disabled':''}>↑</button><button data-move-card="${i}" data-direction="1" aria-label="Flytta block ${i+1} ned" ${i===currentContent().cards.length-1?'disabled':''}>↓</button><button data-remove-card="${i}" aria-label="Ta bort block ${i+1}">×</button></div></div><label for="card-title-${i}">Rubrik</label><input id="card-title-${i}" data-card="${i}" data-property="title" maxlength="300" value="${e(card.title)}"><label for="card-description-${i}">Beskrivning</label><textarea id="card-description-${i}" data-card="${i}" data-property="description" rows="2" maxlength="6000">${e(card.description)}</textarea><label for="card-image-${i}">Bild</label><select id="card-image-${i}" data-card="${i}" data-property="image">${imageOptions(card.image)}</select>${galleryEditor(String(i))}<label for="card-href-${i}">Länk <span>Valfri, på rubriken</span></label><input id="card-href-${i}" data-card="${i}" data-property="href" value="${e(card.href||'')}" maxlength="2000" placeholder="https://företaget.se/tjänst"></div>`).join('') || '<p class="empty-state">Inga bildkort ännu. Lägg till ett kort för en tjänst, produkt eller plats.</p>';
  $('addCard').disabled = currentContent().cards.length >= 40;
}
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
function renderImages() {
  $('logoThumbnail').hidden = !project.logo;
  $('logoEmpty').hidden = !!project.logo;
  if(project.logo)$('logoThumbnail').src = project.logo;
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
function fitTemplatePreviews() {
  document.querySelectorAll('.template-sample').forEach(sample=>{
    sample.querySelector('iframe').style.transform = `scale(${sample.clientWidth/1100})`;
  });
}
function showTemplates() {
  $('templateGallery').innerHTML = templates.map(template=>`<article class="template-option ${project.templateId===template.id?'is-selected':''}"><div class="template-sample" aria-hidden="true"><iframe title="${e(template.name)} miniatyr" tabindex="-1" inert sandbox srcdoc="${e(renderDemo({...project,templateId:template.id}))}"></iframe></div><div class="template-option-copy"><p class="overline">${e(template.reference)}</p><h3>${e(template.name)}</h3><p>${e(template.description)}</p><button class="button ${project.templateId===template.id?'primary':'secondary'}" data-template="${template.id}" aria-pressed="${project.templateId===template.id}">${project.templateId===template.id?'Vald mall':'Använd '+e(template.name)}</button></div></article>`).join('');
  $('templateDialog').showModal();
  fitTemplatePreviews();
}
$('chooseTemplate').addEventListener('click',showTemplates);
$('templateGallery').addEventListener('click',event=>{
  const button = event.target.closest('[data-template]');
  if(!button)return;
  if(project.templateId!==button.dataset.template){
    project.templateId = getTemplate(button.dataset.template).id;
    markDirty(); updateTemplateLabel(); updatePreview();
    toast(getTemplate(project.templateId).name + ' är vald. Ditt innehåll finns kvar.');
  }
  $('templateDialog').close();
});
new ResizeObserver(fitTemplatePreviews).observe($('templateGallery'));
function fillEditor(keepPreview = false) {
  if(editingSite!==project){activePage=-1;editingSite=project;}
  if(activePage>=(project.pages?.length||0))activePage=-1;
  updateTemplateLabel();
  $('pageSelect').innerHTML='<option value="-1">Startsida</option>'+(project.pages||[]).map((p,i)=>`<option value="${i}">${e(p.name||'Sida '+(i+2))}</option>`).join('');
  $('pageSelect').value=String(activePage);
  $('pageHelp').textContent=activePage<0?'Du redigerar startsidan. Namn, meny, logotyp och design gäller hela webbplatsen.':'Du redigerar '+currentContent().name+'. Namn, meny, logotyp och design gäller hela webbplatsen.';
  $('pageOriginal').hidden=!currentContent().source;
  $('pageOriginal').href=currentContent().source||'#';
  document.querySelectorAll('[data-field]').forEach(input => input.value = fieldOwner(input.dataset.field)[input.dataset.field] ?? '');
  $('sourceUrl').value = project.source;
  $('warnings').textContent = currentContent().warnings.join(' ');
  $('warnings').hidden = !currentContent().warnings.length;
  $('savedState').textContent = dirty ? 'OSPARAT' : 'SPARAT';
  $('importStatus').className = 'import-status';
  $('importStatus').textContent = project.id === 'vegavista' ? 'Vegavista-pilot. Granska eventuella ändringar innan du delar.' : project.importedAt ? 'Importerat innehåll. Granska text och bildval innan du delar.' : 'Klistra in en företagslänk eller fyll i innehållet själv.';
  renderNavigationSummary(); renderCards(); renderImages(); renderBenefits(); renderTypography(); if(!keepPreview)updatePreview();else updateTitle();
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
  $('libraryHelp').textContent = archived ? 'Arkiverade förslag finns kvar i den här webbläsaren. Återställ ett förslag för att redigera det igen. Delade kundlänkar påverkas inte.' : 'Dina aktiva kundförslag, senast ändrade först.';
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
    if(!restore)try{if(localStorage.getItem('forslag-studio-selected-project')===id)localStorage.removeItem('forslag-studio-selected-project');}catch{}
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
  if(dirty && !confirm('Lämna det osparade utkastet och öppna ett annat förslag?'))return;
  const sequence = ++projectLoadSequence;
  const previous = project, snapshot = JSON.stringify(project);
  try {
    const loaded = normalizeProject(await(await api('/api/projects/' + encodeURIComponent(id))).json());
    if(sequence !== projectLoadSequence || previous !== project || snapshot !== JSON.stringify(project))return toast('Projektbytet avbröts eftersom du ändrade förslaget. Dina ändringar finns kvar.');
    project = duplicate ? normalizeProject({...loaded,id:'',name:loaded.name.slice(0,90)+' – kopia'}) : loaded;
    dirty = duplicate;
    if(duplicate)markDirty();
    else { try { localStorage.removeItem(draftKey); localStorage.setItem('forslag-studio-selected-project',project.id); } catch {} }
    fillEditor(); showEditor(); await refreshProjects();
    toast(duplicate ? 'Kopian är öppnad. Spara den som ett nytt förslag.' : 'Förslaget är öppnat.');
  } catch(error) { toast(error.message); }
}
function reviewBeforeShare() {
  $('reviewTemplate').textContent = 'Vald design: ' + getTemplate(project.templateId).name;
  const checks = assessProject(project);
  $('reviewChecks').innerHTML = checks.map(c=>`<div class="review-check ${c.ok?'complete':'needs-review'}"><span role="img" aria-label="${c.ok?'Klart':'Behöver granskas'}">${c.ok?'✓':'○'}</span><div><strong>${e(c.label)}</strong>${!c.ok?`<p>${e(c.help)}</p>`:''}</div>${!c.ok?`<button class="text-button" data-review-field="${c.field}" data-review-tab="${c.tab}" data-review-page="${c.pageIndex??-1}">Rätta</button>`:''}</div>`).join('');
  const blocked = checks.some(c=>c.blocking&&!c.ok);
  $('confirmShare').disabled = blocked;
  $('reviewBlocker').textContent = blocked ? 'Rätta de markerade uppgifterna och länkarna innan du skapar en kundlänk.' : 'Du kan dela även utan bilder eller kontaktväg. Granska påminnelserna först.';
  $('reviewDialog').showModal();
}
$('reviewChecks').addEventListener('click',event=>{
  const button=event.target.closest('[data-review-field]');if(!button)return;
  $('reviewDialog').close();showEditor();activePage=Number(button.dataset.reviewPage??-1);fillEditor();
  document.querySelector(`[data-tab="${button.dataset.reviewTab}"]`).click();
  const field=$(button.dataset.reviewField);
  (field.hidden ? field.previousElementSibling : field).scrollIntoView({behavior:'smooth',block:'center'});
  if(!field.hidden)field.focus({preventScroll:true});
});
$('confirmShare').addEventListener('click',()=>{
  if(assessProject(project).some(c=>c.blocking&&!c.ok))return reviewBeforeShare();
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
    if(dirty&&!confirm('Öppna projektkopian och lämna osparade ändringar?'))return;
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
    if(project === savedProject)try { localStorage.setItem('forslag-studio-selected-project', result.id); } catch {}
    if (unchanged) {
      dirty = false; $('savedState').textContent = 'SPARAT';
      localStorage.removeItem(draftKey);
    }
    await refreshProjects();
    if (notify) toast('Utkastet är sparat i den här webbläsaren.');
    return result;
  } finally { $('saveButton').disabled = false; }
}
async function downloadDemo() {
  const button = $('downloadButton');
  button.disabled = true; button.textContent = 'Bäddar in bilder…';
  try {
    const response = await api('/api/export', project, 120000);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = (project.name.toLowerCase().replace(/[^a-z0-9åäö-]/g,'-') || 'foretag') + '-designforslag.html';
    a.click(); setTimeout(()=>URL.revokeObjectURL(url),60000);
    toast('Demosidan har laddats ner med bilderna inbäddade.');
  } catch(error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = 'Ladda ner demosida ↓'; }
}
async function share() {
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
    $('shareIntro').textContent = publicReady ? 'Öppna länken på mobilen eller skicka den inför nästa samtal.' : 'Förhandsvisningen fungerar på den här datorn. Publik hosting är ännu inte ansluten.';
    $('shareWarning').hidden = publicReady;
    $('shareWarning').textContent = 'Detta är en lokal länk. Skicka den inte till kunden ännu. Ladda ner en fristående demosida eller anslut den publika visningssidan.';
    $('shareHelp').textContent = 'Länken visar den här versionen och ändras inte när du redigerar. ' + ([shareSnapshot,...(shareSnapshot.pages||[])].some(p=>[p.hero,p.logo,...p.cards.map(c=>c.image)].some(url=>/^https?:/.test(url))) ? 'Bilder från andra sajter måste vara fortsatt tillgängliga. HTML-exporten sparar egna kopior.' : 'Spara hela länken, inklusive delen efter #.');
    $('shareDialog').showModal();
  } catch(error) { toast(error.message); }
  finally { $('shareButton').disabled = false; }
}

document.querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', () => {
  fieldOwner(input.dataset.field)[input.dataset.field] = input.type === 'range' ? Number(input.value) : input.value;
  markDirty(); updatePreview();
}));
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
  for (const name of ['content','images','details']) $(name+'Tab').hidden = name !== button.dataset.tab;
}));
$('cardsEditor').addEventListener('input', event => {
  const {card, property} = event.target.dataset;
  if (card !== undefined) { if(property==='image')setPrimaryImage(currentContent().cards[Number(card)],'gallery','image',event.target.value);else currentContent().cards[Number(card)][property] = event.target.value; markDirty(); updatePreview(); }
});
$('cardsEditor').addEventListener('change',event=>{if(event.target.dataset.property==='image')renderCards();});
$('cardsEditor').addEventListener('click', event => {
  const move = event.target.closest('[data-move-card]');
  if(move){const index=Number(move.dataset.moveCard),next=index+Number(move.dataset.direction);if(next<0||next>=currentContent().cards.length)return;[currentContent().cards[index],currentContent().cards[next]]=[currentContent().cards[next],currentContent().cards[index]];renderCards();markDirty();updatePreview();$('card-title-'+next).focus();return;}
  const button = event.target.closest('[data-remove-card]');
  if (button) { currentContent().cards.splice(Number(button.dataset.removeCard),1); renderCards(); markDirty(); updatePreview(); }
});
$('benefitsEditor').addEventListener('input', event => {
  const {benefit, property} = event.target.dataset;
  if (benefit !== undefined) {
    while (currentContent().benefits.length <= Number(benefit)) currentContent().benefits.push({title:'',description:''});
    currentContent().benefits[Number(benefit)][property] = event.target.value; markDirty(); updatePreview();
  }
});
$('addCard').addEventListener('click', () => { if(currentContent().cards.length<40) { currentContent().cards.push({title:'',description:'',image:''}); renderCards(); markDirty(); } });
$('imageGrid').addEventListener('click', event => { const b=event.target.closest('[data-image]'); if(b){ setPrimaryImage(currentContent(),'heroGallery','hero',currentContent().images[Number(b.dataset.image)].url); renderImages(); markDirty(); updatePreview(); } });
$('clearHero').addEventListener('click', ()=>{currentContent().hero='';currentContent().heroGallery=[];renderImages();markDirty();updatePreview();});
$('clearLogo').addEventListener('click', ()=>{project.logo='';renderImages();markDirty();updatePreview();});
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
    if(id==='logoUpload')project.logo=url;
    else { setPrimaryImage(target,'heroGallery','hero',url);target.images.unshift({url,label:file.name});target.images=target.images.slice(0,40); }
    renderImages();renderCards();markDirty();updatePreview();toast('Bilden är inlagd.');
  }catch(error){toast(error.message);}finally{event.target.value='';}
});
$('desktopButton').addEventListener('click',()=>{device='desktop';$('desktopButton').classList.add('selected');$('mobileButton').classList.remove('selected');$('desktopButton').setAttribute('aria-pressed','true');$('mobileButton').setAttribute('aria-pressed','false');fitPreview();});
$('mobileButton').addEventListener('click',()=>{device='mobile';$('mobileButton').classList.add('selected');$('desktopButton').classList.remove('selected');$('mobileButton').setAttribute('aria-pressed','true');$('desktopButton').setAttribute('aria-pressed','false');fitPreview();});
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
$('newProject').addEventListener('click',()=>{
  if(dirty&&!confirm('Skapa ett nytt förslag och lämna osparade ändringar?'))return;
  ++projectLoadSequence;showEditor();project=normalizeProject({name:'Nytt förslag',headline:'Här börjar nästa kunds hemsida.'});dirty=true;fillEditor();markDirty();$('sourceUrl').value='';$('sourceUrl').focus();$('importStatus').textContent='Klistra in en företagslänk för att komma igång.';refreshProjects().catch(()=>{});
});
$('showProjects').addEventListener('click',async()=>{ $('editorView').hidden=true;$('projectsView').hidden=false;$('dashboardResume').textContent=dirty?'Fortsätt med utkastet':'Fortsätt redigera';$('showProjects').classList.add('side-active');try{await refreshProjects();}catch(error){toast(error.message);} });
$('importButton').addEventListener('click',async()=>{
  if(importBusy||!project)return;
  const url=$('sourceUrl').value.trim();if(!url){$('sourceUrl').focus();return toast('Klistra in företagets webbadress.');}
  if(dirty&&!confirm('Importera ett nytt företag och ersätta det osparade utkastet?'))return;
  const importProject = project;
  const importSnapshot = JSON.stringify(project);
  importBusy=true;$('importButton').disabled=true;$('importButton').textContent='Hämtar hemsidan…';
  $('importStatus').className='import-status loading';$('importStatus').textContent='Läser startsidan och valda undersidor. Behåll fliken öppen; det kan ta ett par minuter.';
  try{
    const imported=normalizeProject({...await(await api('/api/import',{url,includePages:$('includePages').checked!==false})).json(),templateId:importProject.templateId});
    if(project !== importProject || JSON.stringify(project) !== importSnapshot){
      $('importStatus').className='import-status';
      $('importStatus').textContent='Importen lades åt sidan eftersom du ändrade eller bytte projekt. Dina senaste ändringar finns kvar.';
      return;
    }
    project=imported;dirty=true;fillEditor();markDirty();
    $('importStatus').className='import-status';$('importStatus').textContent=`Startsida${project.pages?.length?' + '+project.pages.length+' undersidor':''} hämtad. ${project.images.length} bildkandidater och ${project.cards.length} innehållsblock på startsidan. Granska varje sida nedan.`;
    toast('Företagets innehåll är inlagt.');
  }catch(error){$('importStatus').className='import-status error';$('importStatus').textContent=error.name==='TimeoutError'?'Hämtningen tog för lång tid. Ditt utkast finns kvar; försök igen eller fortsätt manuellt.':error.message;}
  finally{importBusy=false;$('importButton').disabled=false;$('importButton').innerHTML='Hämta innehåll <span>→</span>';}
});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
new ResizeObserver(fitPreview).observe($('previewStage'));

if(location.protocol !== 'file:')try {
  config = await (await api('/api/config')).json();
  project = await loadInitialProject();
  fillEditor();await refreshProjects();fitPreview();
  $('sourceUrl').disabled=false;$('importButton').disabled=false;
  if(dirty)toast('Ditt senaste osparade utkast har återställts.');
} catch(error) {
  $('importStatus').textContent=error.message + ' Ladda om sidan eller prova en vanlig webbläsarflik.';
  $('importStatus').className='import-status error';
  document.querySelectorAll('button').forEach(b=>b.disabled=true);
  console.error('[mockup start]',error.message);
}
