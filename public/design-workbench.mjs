import {normalizePresentation,imageRatios} from './image-presentation.mjs';
import {sectionKinds,detectSectionKind} from './section-design.mjs';
import {browserAPI} from './browser-api.mjs';
import {compareContent} from './content-comparison.mjs';
import {imageCandidates,replaceGalleryImage} from './image-selection.mjs';
import {createOriginalSnapshot,linkURL,normalizeProject,normalizeGallery,renderDemo,escapeHTML as e} from './render.mjs';
import {getTemplate} from './templates.mjs';
import {recommendDirections} from './design-directions.mjs';
import {installPreviewEditing} from './preview-edit.mjs';

// A thumbnail shows one page. Keep the site's shared identity, but do not clone
// every imported page into each of the fourteen template comparison frames.
export function renderTemplateThumbnail(project,page=project,templateId=project.templateId) {
  return renderDemo({...page,pages:undefined,templateId,name:project.name,logo:project.logo,accent:project.accent,branding:project.branding,typography:project.typography,navigation:project.navigation});
}

export function createDesignWorkbench({getProject,getPage,changed,navigate,editNavigation,notify}) {
  const $=id=>document.getElementById(id);
  let editing=false,disposePreview,previewDoc,textTarget,directionProject,mediaTarget,mediaChoice,comparisonRows=[],comparePage;

  const shell=document.createElement('div');shell.innerHTML=`
  <dialog id="directionsDialog" class="workbench-dialog" aria-labelledby="directionsTitle"><form method="dialog"><button class="dialog-close" aria-label="Stäng designförslag">×</button></form><p class="overline">DITT INNEHÅLL · TRE UTTRYCK</p><h2 id="directionsTitle">Vilket känns som företaget?</h2><p class="dialog-intro">Samma texter, bilder och branding. Jämför kompositionerna innan du väljer.</p><div id="directionsGrid" class="directions-grid"></div><p class="field-help">Förslagen väljs utifrån innehållet. Du kan också välja fritt bland alla mallar.</p></dialog>
  <dialog id="quickEditDialog" class="quick-edit-dialog" aria-labelledby="quickEditTitle"><form method="dialog"><button class="dialog-close" aria-label="Stäng snabbredigering">×</button></form><p class="overline">REDIGERA DÄR DU ÄR</p><h2 id="quickEditTitle">Ändra text</h2><form id="quickEditForm"><label for="quickEditValue">Text</label><textarea id="quickEditValue" rows="7" required></textarea><div id="quickSectionFields" hidden><label for="quickSectionKind">Sektionstyp</label><select id="quickSectionKind"></select><p class="field-help">Ändrar layouten. Text och bilder behålls.</p></div><p id="quickEditHelp" class="field-help">Originalets text behålls tills du väljer Använd.</p><p id="quickEditError" class="field-error" role="alert" hidden></p><div class="dialog-actions"><button type="button" id="quickEditCancel" class="button secondary">Avbryt</button><button class="button primary" type="submit">Använd</button></div></form></dialog>
  <dialog id="mediaDialog" class="workbench-dialog media-dialog" aria-labelledby="mediaTitle"><form method="dialog"><button class="dialog-close" aria-label="Stäng bildväljaren">×</button></form><p class="overline">RÄTT BILD PÅ RÄTT PLATS</p><h2 id="mediaTitle">Välj bild</h2><div class="media-layout"><div><label for="mediaSearch">Sök bland företagets bilder</label><input id="mediaSearch" type="search" placeholder="Bildtext eller filnamn"><p id="mediaCount" class="field-help" role="status"></p><div id="mediaCandidates" class="media-candidates"></div></div><div class="media-inspector"><div class="media-stage"><img id="mediaPreview" alt="Vald bild" hidden><p id="mediaEmpty">Välj en bild i listan.</p></div><p id="mediaLoadError" class="field-error" hidden>Bilden kunde inte visas. Välj en annan eller ladda upp en egen.</p><label for="mediaCaption">Bildtext</label><textarea id="mediaCaption" rows="3" maxlength="600"></textarea><fieldset id="mediaFraming"><legend>Bildens utsnitt</legend><label for="mediaFit">Hur bilden visas</label><select id="mediaFit"><option value="auto">Följ mallen</option><option value="contain">Visa hela bilden</option><option value="cover">Beskär till bildytan</option></select><label for="mediaRatio">Bildformat</label><select id="mediaRatio">${Object.entries(imageRatios).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select><label for="mediaX">Fokus i sidled <output id="mediaXValue">50%</output></label><input type="range" id="mediaX" min="0" max="100" step="1"><label for="mediaY">Fokus i höjdled <output id="mediaYValue">50%</output></label><input type="range" id="mediaY" min="0" max="100" step="1"><p class="field-help" id="mediaFramingHelp">Följ mallen bevarar mallens bildformat. Beskärning påverkar inte originalfilen.</p></fieldset><p id="mediaError" class="field-error" role="alert" hidden></p><div class="dialog-actions"><button id="mediaCancel" class="button secondary">Avbryt</button><button id="mediaApply" class="button primary" disabled>Använd bild</button></div><button id="mediaRemove" class="text-button">Ta bort bilden från sektionen</button></div></div></dialog>
  <dialog id="compareDialog" class="workbench-dialog compare-dialog" aria-labelledby="compareTitle"><form method="dialog"><button class="dialog-close" aria-label="Stäng jämförelse">×</button></form><p class="overline">ORIGINAL → FÖRSLAG</p><h2 id="compareTitle">Se vad som ändrats.</h2><div class="compare-actions"><a id="compareOriginalLink" class="button secondary" target="_blank" rel="noopener noreferrer">Öppna original ↗</a><button id="readComparison" class="button secondary">Läs originalet för jämförelse</button><button id="embedOriginal" class="text-button">Visa originalwebbsidan här</button></div><p id="compareStatus" class="field-help" role="status"></p><div class="comparison-columns"><section><h3 id="originalColumnTitle">Importerat originalinnehåll</h3><p id="embedHelp" class="field-help" hidden>Vissa webbplatser blockerar inbäddning. Öppna originalet i egen flik om ytan är tom.</p><div id="originalContent" class="original-content"></div><iframe id="originalWebsite" title="Företagets originalwebbsida" sandbox="allow-scripts" referrerpolicy="no-referrer" hidden></iframe></section><section><h3>Ditt designförslag</h3><iframe id="comparisonPreview" title="Designförslag att jämföra" sandbox="allow-same-origin"></iframe></section></div><h3>Skillnader och saker att granska</h3><div id="comparisonIssues" class="comparison-issues"></div></dialog>`;
  document.body.append(shell);
  const fitDirections=()=>{for(const sample of $('directionsGrid').querySelectorAll('.direction-sample')){const width=sample.clientWidth;sample.querySelector('iframe').style.transform=`scale(${width/1100})`;}};
  new ResizeObserver(fitDirections).observe($('directionsGrid'));
  $('designDirections').addEventListener('click',()=>{
    directionProject=getProject();
    $('directionsGrid').innerHTML=recommendDirections(directionProject).map(d=>`<article class="direction-option"><div class="direction-sample" aria-hidden="true"><iframe inert tabindex="-1" sandbox title="${e(d.label)}" srcdoc="${e(renderTemplateThumbnail(directionProject,getPage(),d.templateId))}"></iframe></div><div class="direction-copy"><p class="overline">${e(d.label)}</p><h3>${e(getTemplate(d.templateId).name)}</h3><p>${e(d.reason)}</p><button class="button ${directionProject.templateId===d.templateId?'primary':'secondary'}" data-direction="${e(d.templateId)}" aria-pressed="${directionProject.templateId===d.templateId}">${directionProject.templateId===d.templateId?'Behåll denna':'Välj denna design'}</button></div></article>`).join('');
    $('directionsDialog').showModal();fitDirections();
  });
  $('directionsGrid').addEventListener('click',event=>{const button=event.target.closest('[data-direction]');if(!button)return;if(getProject()!==directionProject)return $('directionsDialog').close();getProject().templateId=button.dataset.direction;changed();$('directionsDialog').close();notify('Designen är vald. Innehållet är oförändrat.');});
  function quickText(target){
    const owner=target.type==='card'?getPage().cards[target.index]:getPage();if(!owner)return;
    const labels={headline:'Huvudrubrik',description:target.type==='card'?'Sektionstext':'Introduktion',title:'Sektionsrubrik',eyebrow:'Liten rubrik',cta:'Knapptext',ctaHref:'Knappdestination',about:'Om företaget',aboutTitle:'Rubrik om företaget'};
    const limits={headline:180,description:6000,title:300,eyebrow:100,cta:100,ctaHref:2000,about:1500,aboutTitle:180};
    if(!Object.hasOwn(labels,target.field))return;
    textTarget={project:getProject(),page:getPage(),owner,field:target.field,type:target.type};$('quickEditTitle').textContent=labels[target.field];$('quickEditValue').value=owner[target.field]||'';$('quickEditValue').maxLength=limits[target.field];$('quickEditValue').required=target.field==='headline';$('quickEditError').hidden=true;
    $('quickSectionFields').hidden=target.type!=='card';$('quickSectionKind').innerHTML=`<option value="">Automatiskt · ${e(sectionKinds[detectSectionKind({...owner,kind:undefined})])}</option>`+Object.entries(sectionKinds).map(([value,label])=>`<option value="${value}" ${owner.kind===value?'selected':''}>${e(label)}</option>`).join('');
    $('quickEditDialog').showModal();$('quickEditValue').focus();
  }
  $('quickEditCancel').addEventListener('click',()=>$('quickEditDialog').close());
  $('quickEditForm').addEventListener('submit',event=>{event.preventDefault();if(!textTarget||getProject()!==textTarget.project||getPage()!==textTarget.page){$('quickEditError').textContent='Sidan har bytts. Stäng dialogen och välj texten igen.';$('quickEditError').hidden=false;return;}if(textTarget.field==='headline'&&!$('quickEditValue').value.trim()){$('quickEditError').textContent='Skriv en huvudrubrik.';$('quickEditError').hidden=false;return;}if(textTarget.field==='ctaHref'&&$('quickEditValue').value.trim()&&!linkURL($('quickEditValue').value)){$('quickEditError').textContent='Ange en fullständig webbadress eller ett #ankare.';$('quickEditError').hidden=false;return;}textTarget.owner[textTarget.field]=$('quickEditValue').value;if(textTarget.type==='card'){if($('quickSectionKind').value)textTarget.owner.kind=$('quickSectionKind').value;else delete textTarget.owner.kind;}changed();$('quickEditDialog').close();});
  function mediaList(){
    const query=$('mediaSearch').value.trim().toLocaleLowerCase('sv'),items=imageCandidates(mediaTarget.page).filter(item=>(item.label+' '+item.url.split('/').at(-1)).toLocaleLowerCase('sv').includes(query));
    $('mediaCount').textContent=items.length+' bildalternativ';
    $('mediaCandidates').innerHTML=items.length?items.map(item=>`<button type="button" class="media-choice" data-media-url="${e(item.url)}" data-media-label="${e(item.label)}" aria-pressed="${item.url===mediaChoice?.url}"><img src="${e(item.url)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span>${e(item.label)}</span></button>`).join(''):'<p class="empty-state">Inga bilder matchar. Prova en annan sökning eller ladda upp en egen under Bilder.</p>';
  }
  function showMedia(target){
    const page=getPage(),owner=target.scope==='hero'?page:page.cards[Number(target.scope)];if(!owner)return;
    const key=target.scope==='hero'?'heroGallery':'gallery',primary=target.scope==='hero'?'hero':'image',items=normalizeGallery(owner[key]||[],owner[primary])||[];
    mediaTarget={project:getProject(),page,owner,key,primary,index:target.index||0};mediaChoice=items[mediaTarget.index]?{...items[mediaTarget.index]}:null;
    $('mediaTitle').textContent=target.scope==='hero'?'Huvudbild':'Bild · '+(owner.title||'Sektion');$('mediaSearch').value='';$('mediaError').hidden=true;$('mediaCaption').value=mediaChoice?.caption||'';$('mediaRemove').hidden=!mediaChoice;mediaList();loadFraming();previewMedia();$('mediaDialog').showModal();
  }
  function readFraming(){return normalizePresentation({fit:$('mediaFit').value,ratio:$('mediaRatio').value,x:Number($('mediaX').value),y:Number($('mediaY').value)});}
  function loadFraming(){const p=normalizePresentation(mediaChoice?.presentation);$('mediaFit').value=p?.fit||'auto';$('mediaRatio').value=p?.ratio||'template';$('mediaX').value=p?.x??50;$('mediaY').value=p?.y??(mediaTarget.primary==='hero'?mediaTarget.page.heroPosition:50);updateFraming();}
  function updateFraming(){
    const p=readFraming(),stage=$('mediaPreview').parentElement,img=$('mediaPreview'),ratio=p?.ratio||'template';
    const ratios={landscape:'3 / 2',square:'1 / 1',portrait:'3 / 4'};
    img.style.objectFit=ratio==='original'?'contain':p?.fit||'contain';img.style.objectPosition=`${p?.x??50}% ${p?.y??50}%`;
    stage.style.aspectRatio=ratios[ratio]||'auto';stage.style.height=ratios[ratio]?'auto':'280px';
    $('mediaRatio').disabled=!p;$('mediaX').disabled=$('mediaY').disabled=p?.fit!=='cover'||ratio==='original';
    $('mediaXValue').textContent=$('mediaX').value+'%';$('mediaYValue').textContent=$('mediaY').value+'%';
    $('mediaFramingHelp').textContent=!p?'Mallens format används. Förhandsbilden visar hela originalet.':p.ratio==='template'?'Utsnittet beror på mallens bildyta. Välj ett bestämt bildformat för samma proportioner i alla mallar.':p.ratio==='original'?'Originalets proportioner bevaras. Välj liggande, kvadrat eller stående om du vill beskära.':'Bildformat och fokuspunkt följer med till kundlänk och HTML-export.';
  }
  for(const id of ['mediaFit','mediaRatio','mediaX','mediaY'])$(id).addEventListener('input',updateFraming);
  function previewMedia(){const image=$('mediaPreview');$('mediaLoadError').hidden=true;image.hidden=!mediaChoice;$('mediaEmpty').hidden=!!mediaChoice;$('mediaApply').disabled=!mediaChoice;if(mediaChoice)image.src=mediaChoice.url;else image.removeAttribute('src');}
  $('mediaPreview').addEventListener('error',()=>{$('mediaLoadError').hidden=false;$('mediaApply').disabled=true;});
  $('mediaPreview').addEventListener('load',()=>{$('mediaApply').disabled=!mediaChoice;});
  $('mediaSearch').addEventListener('input',mediaList);
  $('mediaCandidates').addEventListener('click',event=>{const button=event.target.closest('[data-media-url]');if(!button)return;const previous=normalizeGallery(mediaTarget.owner[mediaTarget.key]||[],mediaTarget.owner[mediaTarget.primary])?.find(item=>item.url===button.dataset.mediaUrl);mediaChoice=previous?{...previous}:{url:button.dataset.mediaUrl,label:button.dataset.mediaLabel,caption:''};$('mediaCaption').value=mediaChoice.caption||'';for(const choice of $('mediaCandidates').querySelectorAll('[data-media-url]'))choice.setAttribute('aria-pressed',String(choice.dataset.mediaUrl===mediaChoice.url));loadFraming();previewMedia();});
  $('mediaCancel').addEventListener('click',()=>$('mediaDialog').close());
  function applyMedia(remove=false){try{if(!mediaTarget||getProject()!==mediaTarget.project||getPage()!==mediaTarget.page)throw new Error('Sidan har bytts. Stäng bildväljaren och välj igen.');const item=remove?null:{...mediaChoice,caption:$('mediaCaption').value};if(item){const presentation=readFraming();if(presentation)item.presentation=presentation;else delete item.presentation;}Object.assign(mediaTarget.owner,replaceGalleryImage(mediaTarget.owner,mediaTarget.key,mediaTarget.primary,mediaTarget.index,item));if(item?.presentation&&mediaTarget.primary==='hero'&&mediaTarget.index===0)mediaTarget.page.heroPosition=item.presentation.y;changed();$('mediaDialog').close();}catch(error){$('mediaError').textContent=error.message;$('mediaError').hidden=false;}}
  $('mediaApply').addEventListener('click',()=>applyMedia());$('mediaRemove').addEventListener('click',()=>applyMedia(true));
  document.addEventListener('click',event=>{const button=event.target.closest('[data-open-media]');if(button)showMedia({scope:button.dataset.openMedia,index:Number(button.dataset.mediaIndex)||0});});
  function captureOriginal(project){for(const page of [project,...(project.pages||[])])page.original=createOriginalSnapshot(page);}
  function renderComparison(){
    const page=getPage(),original=page.original;comparePage=page;const source=/^https?:\/\//.test(page.source||'')?page.source:'';
    $('compareOriginalLink').hidden=!source;$('compareOriginalLink').href=source||'#';$('readComparison').disabled=!source;$('embedOriginal').disabled=!source;
    $('readComparison').textContent=original?'Uppdatera originalkopian':'Läs originalet för jämförelse';
    $('compareStatus').textContent=original?'Originalkopian sparas med projektet'+(Number.isFinite(Date.parse(original.capturedAt))?' · hämtad '+new Date(original.capturedAt).toLocaleString('sv-SE'):'')+'. Detta är importerat innehåll, inte originalets visuella design. Uppdatera läser in en ny jämförelsekopia.':'Ingen originalkopia finns för den här sidan. Läs originalet för att jämföra utan att skriva över ditt förslag.';
    const image=url=>url?`<img src="${e(url)}" alt="Originalets bild" loading="lazy" referrerpolicy="no-referrer">`:'';
    $('originalContent').innerHTML=original?`<h2>${e(original.headline)}</h2><p>${e(original.description)}</p>${(original.heroGallery?.length?original.heroGallery:[{url:original.hero}]).map(i=>image(i.url)+(i.caption?`<p>${e(i.caption)}</p>`:'')).join('')}${(original.cards||[]).map(c=>`<article><h3>${e(c.title)}</h3><p>${e(c.description)}</p>${(c.gallery?.length?c.gallery:[{url:c.image}]).map(i=>image(i.url)+(i.caption?`<p>${e(i.caption)}</p>`:'')).join('')}</article>`).join('')}`:'<p class="empty-state">Läs originalet med knappen ovan. Dina texter och bilder i förslaget behålls.</p>';
    $('comparisonPreview').srcdoc=renderDemo(getProject(),{pageSource:page.source});
    comparisonRows=compareContent(original,{...page,navigation:getProject().navigation});
    const differences=comparisonRows.map((row,index)=>`<article class="comparison-issue"><span class="issue-kind">${row.kind==='removed'?'SAKNAS I FÖRSLAGET':row.kind==='added'?'TILLAGT':'ÄNDRAT'}</span><h4>${e(row.label)}</h4><div class="difference-text"><p><strong>Original</strong>${e(row.before||'—')}</p><p><strong>Förslag</strong>${e(row.after||'—')}</p></div>${row.target?`<button class="text-button" data-compare-edit="${index}">Granska och ändra</button>`:row.source?`<button class="text-button" data-compare-restore="${index}">Återlägg sektionen</button>`:''}</article>`).join('');
    const warnings=(page.warnings||[]).filter(w=>/font|typsnitt|bild|färg|logo|kortats|JavaScript/i.test(w));
    $('comparisonIssues').innerHTML=(original&&!comparisonRows.length?'<p class="comparison-match">Ingen text- eller bildskillnad hittades i de jämförda fälten. Kontrollera fortfarande mot originalwebbsidan.</p>':'')+differences+warnings.map(w=>`<article class="comparison-issue"><span class="issue-kind">BEHÖVER GRANSKAS</span><p>${e(w)}</p></article>`).join('');
  }
  $('compareDesign').addEventListener('click',()=>{$('originalWebsite').hidden=true;$('originalWebsite').removeAttribute('src');$('originalContent').hidden=false;$('embedHelp').hidden=true;$('embedOriginal').textContent='Visa originalwebbsidan här';renderComparison();$('compareDialog').showModal();});
  $('readComparison').addEventListener('click',async()=>{
    const page=getPage();$('readComparison').disabled=true;$('compareStatus').textContent='Läser originalet… Ditt förslag ändras inte.';
    try{const response=await browserAPI('/api/import',{url:page.source,includePages:false}),data=await response.json();if(!response.ok)throw new Error(data.error||'Originalet kunde inte läsas.');if(getPage()!==page)return;page.original=createOriginalSnapshot(data);changed();renderComparison();}catch(error){if(getPage()!==page)return;console.warn('[mockup comparison]',error.message);$('compareStatus').textContent='Jämförelsen kunde inte hämtas: '+error.message;}finally{if(getPage()===page)$('readComparison').disabled=false;}
  });
  $('embedOriginal').addEventListener('click',()=>{const show=$('originalWebsite').hidden;$('originalWebsite').hidden=!show;$('originalContent').hidden=show;$('embedHelp').hidden=!show;$('embedOriginal').textContent=show?'Visa importerad innehållskopia':'Visa originalwebbsidan här';if(show)$('originalWebsite').src=getPage().source;else $('originalWebsite').removeAttribute('src');});
  $('compareDialog').addEventListener('close',()=>$('originalWebsite').removeAttribute('src'));
  $('comparisonIssues').addEventListener('click',event=>{if(getPage()!==comparePage)return;const edit=event.target.closest('[data-compare-edit]'),restore=event.target.closest('[data-compare-restore]');if(edit){const target=comparisonRows[Number(edit.dataset.compareEdit)]?.target;if(target){$('compareDialog').close();select(target);}}else if(restore){const source=comparisonRows[Number(restore.dataset.compareRestore)]?.source;if(source){if(getPage().cards.length>=40)return notify('Högst 40 sektioner ryms. Ta bort ett tomt block först.');getPage().cards.push(structuredClone(source));changed();renderComparison();}}});
  function select(target){
    if(target.type==='field'||target.type==='card')return quickText(target);
    if(target.type==='navigation')return editNavigation();
    if(target.type==='logo')return navigate('images','logoUpload');
    if(target.type==='contact')return navigate('details','email');
    if(target.type==='image')return showMedia(target);
  }
  function attach(doc){disposePreview?.();disposePreview=undefined;previewDoc=doc;if(editing&&doc)disposePreview=installPreviewEditing(doc,{onSelect:select,onExit:()=>setEditing(false),cardIndexes:getPage().cards.flatMap((card,index)=>normalizeProject({cards:[card]}).cards.length?[index]:[])});}
  function setEditing(value){editing=value;$('editPreview').setAttribute('aria-pressed',String(value));$('editPreview').textContent=value?'Avsluta redigering':'Redigera i förhandsvisningen';$('previewModeHelp').textContent=value?'Klicka på text, bild eller meny för att ändra. Escape avslutar.':'Visningsläge · länkar fungerar som i kunddemon.';attach(previewDoc);}
  $('editPreview').addEventListener('click',()=>setEditing(!editing));
  return {attach,captureOriginal,sync(){if(!getProject())return;},select};
}
