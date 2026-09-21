import { browserAPI } from './browser-api.mjs';
import { normalizeProject, renderDemo, escapeHTML as e } from './render.mjs';
import { encodeProject } from './share.mjs';
import { templates, getTemplate } from './templates.mjs';
import { assessProject, searchProjects, restoreProject } from './project-tools.mjs';

const $ = id => document.getElementById(id);
let project, config = {}, dirty = false, device = 'desktop', toastTimer, previewTimer, importBusy = false;
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
    let top = 0; try { top = frame.contentWindow.scrollY; } catch {}
    frame.onload = () => {
      try {
        frame.contentWindow.scrollTo(0, top);
        frame.contentDocument.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
          event.preventDefault();
          const id=link.getAttribute('href').slice(1);
          if(id)frame.contentDocument.getElementById(id)?.scrollIntoView({behavior:'smooth'});
          else frame.contentWindow.scrollTo({top:0,behavior:'smooth'});
        }));
      } catch {}
    };
    frame.srcdoc = renderDemo(project);
    updateTitle();
  }, 160);
}
function imageOptions(selected) {
  const images = [...project.images];
  if (selected && !images.some(i=>i.url===selected)) images.unshift({url:selected,label:'Vald bild'});
  return '<option value="">Ingen bild</option>' + images.map((image, i) => `<option value="${e(image.url)}" ${image.url===selected?'selected':''}>${e(image.label || 'Bild ' + (i+1))}</option>`).join('');
}
function renderCards() {
  $('cardsEditor').innerHTML = project.cards.map((card, i) => `<div class="card-editor"><div class="card-editor-header"><span>KORT ${String(i+1).padStart(2,'0')}</span><button data-remove-card="${i}" aria-label="Ta bort kort ${i+1}">×</button></div><label for="card-title-${i}">Rubrik</label><input id="card-title-${i}" data-card="${i}" data-property="title" maxlength="300" value="${e(card.title)}"><label for="card-description-${i}">Beskrivning</label><textarea id="card-description-${i}" data-card="${i}" data-property="description" rows="2" maxlength="6000">${e(card.description)}</textarea><label for="card-image-${i}">Bild</label><select id="card-image-${i}" data-card="${i}" data-property="image">${imageOptions(card.image)}</select></div>`).join('') || '<p class="empty-state">Inga bildkort ännu. Lägg till ett kort för en tjänst, produkt eller plats.</p>';
  $('addCard').disabled = project.cards.length >= 40;
}
function renderImages() {
  $('heroThumbnail').hidden = !project.hero;
  if (project.hero) $('heroThumbnail').src = project.hero;
  $('imageGrid').innerHTML = project.images.map((image, i) => `<button class="image-choice ${project.hero===image.url?'selected':''}" data-image="${i}" aria-label="Välj ${e(image.label || 'bild '+(i+1))}" title="${e(image.label || 'Bild '+(i+1))}"><img src="${e(image.url)}" alt="${e(image.label)}" loading="lazy" referrerpolicy="no-referrer"></button>`).join('');
  $('imagesEmpty').hidden = !!project.images.length;
}
function renderBenefits() {
  $('benefitsEditor').innerHTML = Array.from({length:4}, (_,i) => {
    const b = project.benefits[i] || {title:'',description:''};
    return `<div class="benefit-editor"><label for="benefit-${i}">Fördel ${i+1}</label><input id="benefit-${i}" data-benefit="${i}" data-property="title" value="${e(b.title)}" placeholder="Lämna tomt för att dölja" maxlength="100"><textarea data-benefit="${i}" data-property="description" aria-label="Beskrivning av fördel ${i+1}" rows="2" maxlength="350">${e(b.description)}</textarea></div>`;
  }).join('');
}
function updateTemplateLabel() {
  const template = getTemplate(project.templateId);
  $('selectedTemplate').textContent = template.name;
  $('sidebarTemplate').textContent = template.name;
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
function fillEditor() {
  updateTemplateLabel();
  document.querySelectorAll('[data-field]').forEach(input => input.value = project[input.dataset.field] ?? '');
  $('sourceUrl').value = project.source;
  $('warnings').textContent = project.warnings.join(' ');
  $('warnings').hidden = !project.warnings.length;
  $('savedState').textContent = dirty ? 'OSPARAT' : 'SPARAT';
  $('importStatus').className = 'import-status';
  $('importStatus').textContent = project.id === 'vegavista' ? 'Vegavista-pilot. Granska eventuella ändringar innan du delar.' : project.importedAt ? 'Importerat innehåll. Granska text och bildval innan du delar.' : 'Klistra in en företagslänk eller fyll i innehållet själv.';
  renderCards(); renderImages(); renderBenefits(); updatePreview();
}
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
  $('reviewChecks').innerHTML = checks.map(c=>`<div class="review-check ${c.ok?'complete':'needs-review'}"><span role="img" aria-label="${c.ok?'Klart':'Behöver granskas'}">${c.ok?'✓':'○'}</span><div><strong>${e(c.label)}</strong>${!c.ok?`<p>${e(c.help)}</p>`:''}</div>${!c.ok?`<button class="text-button" data-review-field="${c.field}" data-review-tab="${c.tab}">Rätta</button>`:''}</div>`).join('');
  const blocked = checks.some(c=>c.blocking&&!c.ok);
  $('confirmShare').disabled = blocked;
  $('reviewBlocker').textContent = blocked ? 'Fyll i företagsnamn och en egen huvudrubrik innan du skapar en kundlänk.' : 'Du kan dela även utan bilder eller kontaktväg. Granska påminnelserna först.';
  $('reviewDialog').showModal();
}
$('reviewChecks').addEventListener('click',event=>{
  const button=event.target.closest('[data-review-field]');if(!button)return;
  $('reviewDialog').close();showEditor();
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
    if(assessProject(project).some(c=>c.blocking&&!c.ok))throw new Error('Fyll i företagsnamn och huvudrubrik innan du delar.');
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
    $('shareHelp').textContent = 'Länken visar den här versionen och ändras inte när du redigerar. ' + (shareSnapshot.images.some(i=>/^https?:/.test(i.url)) ? 'Bilder från andra sajter måste vara fortsatt tillgängliga. HTML-exporten sparar egna kopior.' : 'Spara hela länken, inklusive delen efter #.');
    $('shareDialog').showModal();
  } catch(error) { toast(error.message); }
  finally { $('shareButton').disabled = false; }
}

document.querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', () => {
  project[input.dataset.field] = input.type === 'range' ? Number(input.value) : input.value;
  markDirty(); updatePreview();
}));
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
  for (const name of ['content','images','details']) $(name+'Tab').hidden = name !== button.dataset.tab;
}));
$('cardsEditor').addEventListener('input', event => {
  const {card, property} = event.target.dataset;
  if (card !== undefined) { project.cards[Number(card)][property] = event.target.value; markDirty(); updatePreview(); }
});
$('cardsEditor').addEventListener('click', event => {
  const button = event.target.closest('[data-remove-card]');
  if (button) { project.cards.splice(Number(button.dataset.removeCard),1); renderCards(); markDirty(); updatePreview(); }
});
$('benefitsEditor').addEventListener('input', event => {
  const {benefit, property} = event.target.dataset;
  if (benefit !== undefined) {
    while (project.benefits.length <= Number(benefit)) project.benefits.push({title:'',description:''});
    project.benefits[Number(benefit)][property] = event.target.value; markDirty(); updatePreview();
  }
});
$('addCard').addEventListener('click', () => { if(project.cards.length<40) { project.cards.push({title:'',description:'',image:''}); renderCards(); markDirty(); } });
$('imageGrid').addEventListener('click', event => { const b=event.target.closest('[data-image]'); if(b){ project.hero=project.images[Number(b.dataset.image)].url; renderImages(); markDirty(); updatePreview(); } });
$('clearHero').addEventListener('click', ()=>{project.hero='';renderImages();markDirty();updatePreview();});
$('clearLogo').addEventListener('click', ()=>{project.logo='';markDirty();updatePreview();});
async function readImage(file, isLogo) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Välj en JPG-, PNG- eller WebP-bild.');
  if (file.size > 10000000) throw new Error('Bilden får vara högst 10 MB.');
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, (isLogo?500:1200)/Math.max(bitmap.width,bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
  return canvas.toDataURL('image/webp',.72);
}
for(const id of ['imageUpload','logoUpload']) $(id).addEventListener('change',async event=>{
  const file=event.target.files[0]; if(!file)return;
  try { const url=await readImage(file,id==='logoUpload');
    if(id==='logoUpload')project.logo=url;
    else { project.hero=url;project.images.unshift({url,label:file.name});project.images=project.images.slice(0,40); }
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
  if(importBusy)return;
  const url=$('sourceUrl').value.trim();if(!url){$('sourceUrl').focus();return toast('Klistra in företagets webbadress.');}
  if(dirty&&!confirm('Importera ett nytt företag och ersätta det osparade utkastet?'))return;
  const importProject = project;
  const importSnapshot = JSON.stringify(project);
  importBusy=true;$('importButton').disabled=true;$('importButton').textContent='Hämtar hemsidan…';
  $('importStatus').className='import-status loading';$('importStatus').textContent='Läser text, bilder och kontaktuppgifter. Det kan ta upp till en minut.';
  try{
    const imported=normalizeProject({...await(await api('/api/import',{url})).json(),templateId:importProject.templateId});
    if(project !== importProject || JSON.stringify(project) !== importSnapshot){
      $('importStatus').className='import-status';
      $('importStatus').textContent='Importen lades åt sidan eftersom du ändrade eller bytte projekt. Dina senaste ändringar finns kvar.';
      return;
    }
    project=imported;dirty=true;fillEditor();markDirty();
    $('importStatus').className='import-status';$('importStatus').textContent=`${project.images.length} bildkandidater och ${project.cards.length} innehållsblock hittades. Granska förslaget nedan.`;
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
  if(dirty)toast('Ditt senaste osparade utkast har återställts.');
} catch(error) {
  $('importStatus').textContent=error.message + ' Ladda om sidan eller prova en vanlig webbläsarflik.';
  $('importStatus').className='import-status error';
  document.querySelectorAll('button').forEach(b=>b.disabled=true);
  console.error('[mockup start]',error.message);
}
