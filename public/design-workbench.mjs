import {browserAPI} from './browser-api.mjs';
import {compareContent} from './content-comparison.mjs';
import {imageCandidates,replaceGalleryImage} from './image-selection.mjs';
import {linkURL,normalizeProject,normalizeGallery,renderDemo,escapeHTML as e} from './render.mjs';
import {getTemplate} from './templates.mjs';
import {recommendDirections} from './design-directions.mjs';
import {installPreviewEditing} from './preview-edit.mjs';

export function createDesignWorkbench({getProject,getPage,changed,navigate,editNavigation,notify}) {
  const $=id=>document.getElementById(id);
  let editing=false,disposePreview,previewDoc,textTarget,directionProject,mediaTarget,mediaChoice,comparisonRows=[],comparePage;
  const originals=new WeakMap();
  const shell=document.createElement('div');shell.innerHTML=`
  <dialog id="directionsDialog" class="workbench-dialog" aria-labelledby="directionsTitle"><form method="dialog"><button class="dialog-close" aria-label="Stäng designförslag">×</button></form><p class="overline">DITT INNEHÅLL · TRE UTTRYCK</p><h2 id="directionsTitle">Vilket känns som företaget?</h2><p class="dialog-intro">Samma texter, bilder och branding. Jämför kompositionerna innan du väljer.</p><div id="directionsGrid" class="directions-grid"></div><p class="field-help">Förslagen väljs utifrån innehållet. Du kan också välja fritt bland alla mallar.</p></dialog>
  <dialog id="quickEditDialog" class="quick-edit-dialog" aria-labelledby="quickEditTitle"><form method="dialog"><button class="dialog-close" aria-label="Stäng snabbredigering">×</button></form><p class="overline">REDIGERA DÄR DU ÄR</p><h2 id="quickEditTitle">Ändra text</h2><form id="quickEditForm"><label for="quickEditValue">Text</label><textarea id="quickEditValue" rows="7" required></textarea><p id="quickEditHelp" class="field-help">Originalets text behålls tills du väljer Använd.</p><p id="quickEditError" class="field-error" role="alert" hidden></p><div class="dialog-actions"><button type="button" id="quickEditCancel" class="button secondary">Avbryt</button><button class="button primary" type="submit">Använd</button></div></form></dialog>
  <dialog id="mediaDialog" class="workbench-dialog media-dialog" aria-labelledby="mediaTitle"><form method="dialog"><button class="dialog-close" aria-label="Stäng bildväljaren">×</button></form><p class="overline">RÄTT BILD PÅ RÄTT PLATS</p><h2 id="mediaTitle">Välj bild</h2><div class="media-layout"><div><label for="mediaSearch">Sök bland företagets bilder</label><input id="mediaSearch" type="search" placeholder="Bildtext eller filnamn"><p id="mediaCount" class="field-help" role="status"></p><div id="mediaCandidates" class="media-candidates"></div></div><div class="media-inspector"><div class="media-stage"><img id="mediaPreview" alt="Vald bild" hidden><p id="mediaEmpty">Välj en bild i listan.</p></div><p id="mediaLoadError" class="field-error" hidden>Bilden kunde inte visas. Välj en annan eller ladda upp en egen.</p><label for="mediaCaption">Bildtext</label><textarea id="mediaCaption" rows="3" maxlength="600"></textarea><div id="mediaFraming"></div><p id="mediaError" class="field-error" role="alert" hidden></p><div class="dialog-actions"><button id="mediaCancel" class="button secondary">Avbryt</button><button id="mediaApply" class="button primary" disabled>Använd bild</button></div><button id="mediaRemove" class="text-button">Ta bort bilden från sektionen</button></div></div></dialog>
  <dialog id="compareDialog" class="workbench-dialog compare-dialog" aria-labelledby="compareTitle"><form method="dialog"><button class="dialog-close" aria-label="Stäng jämförelse">×</button></form><p class="overline">ORIGINAL → FÖRSLAG</p><h2 id="compareTitle">Se vad som ändrats.</h2><div class="compare-actions"><a id="compareOriginalLink" class="button secondary" target="_blank" rel="noopener noreferrer">Öppna original ↗</a><button id="readComparison" class="button secondary">Läs originalet för jämförelse</button><button id="embedOriginal" class="text-button">Visa originalwebbsidan här</button></div><p id="compareStatus" class="field-help" role="status"></p><div class="comparison-columns"><section><h3 id="originalColumnTitle">Importerat originalinnehåll</h3><p id="embedHelp" class="field-help" hidden>Vissa webbplatser blockerar inbäddning. Öppna originalet i egen flik om ytan är tom.</p><div id="originalContent" class="original-content"></div><iframe id="originalWebsite" title="Företagets originalwebbsida" sandbox="allow-scripts" referrerpolicy="no-referrer" hidden></iframe></section><section><h3>Ditt designförslag</h3><iframe id="comparisonPreview" title="Designförslag att jämföra" sandbox="allow-same-origin"></iframe></section></div><h3>Skillnader och saker att granska</h3><div id="comparisonIssues" class="comparison-issues"></div></dialog>`;
  document.body.append(shell);
  const fitDirections=()=>{for(const sample of $('directionsGrid').querySelectorAll('.direction-sample')){const width=sample.clientWidth;sample.querySelector('iframe').style.transform=`scale(${width/1100})`;}};
  new ResizeObserver(fitDirections).observe($('directionsGrid'));
  $('designDirections').addEventListener('click',()=>{
    directionProject=getProject();
    $('directionsGrid').innerHTML=recommendDirections(directionProject).map(d=>`<article class="direction-option"><div class="direction-sample" aria-hidden="true"><iframe inert tabindex="-1" sandbox title="${e(d.label)}" srcdoc="${e(renderDemo({...directionProject,templateId:d.templateId},{pageSource:getPage().source}))}"></iframe></div><div class="direction-copy"><p class="overline">${e(d.label)}</p><h3>${e(getTemplate(d.templateId).name)}</h3><p>${e(d.reason)}</p><button class="button ${directionProject.templateId===d.templateId?'primary':'secondary'}" data-direction="${e(d.templateId)}" aria-pressed="${directionProject.templateId===d.templateId}">${directionProject.templateId===d.templateId?'Behåll denna':'Välj denna design'}</button></div></article>`).join('');
    $('directionsDialog').showModal();fitDirections();
  });
  $('directionsGrid').addEventListener('click',event=>{const button=event.target.closest('[data-direction]');if(!button)return;if(getProject()!==directionProject)return $('directionsDialog').close();getProject().templateId=button.dataset.direction;changed();$('directionsDialog').close();notify('Designen är vald. Innehållet är oförändrat.');});
  function quickText(target){
    const owner=target.type==='card'?getPage().cards[target.index]:getPage();if(!owner)return;
    const labels={headline:'Huvudrubrik',description:target.type==='card'?'Sektionstext':'Introduktion',title:'Sektionsrubrik',eyebrow:'Liten rubrik',cta:'Knapptext',ctaHref:'Knappdestination',about:'Om företaget',aboutTitle:'Rubrik om företaget'};
    const limits={headline:180,description:6000,title:300,eyebrow:100,cta:100,ctaHref:2000,about:1500,aboutTitle:180};
    if(!Object.hasOwn(labels,target.field))return;
    textTarget={project:getProject(),page:getPage(),owner,field:target.field};$('quickEditTitle').textContent=labels[target.field];$('quickEditValue').value=owner[target.field]||'';$('quickEditValue').maxLength=limits[target.field];$('quickEditValue').required=target.field==='headline';$('quickEditError').hidden=true;
    $('quickEditDialog').showModal();$('quickEditValue').focus();
  }
  $('quickEditCancel').addEventListener('click',()=>$('quickEditDialog').close());
  $('quickEditForm').addEventListener('submit',event=>{event.preventDefault();if(!textTarget||getProject()!==textTarget.project||getPage()!==textTarget.page){$('quickEditError').textContent='Sidan har bytts. Stäng dialogen och välj texten igen.';$('quickEditError').hidden=false;return;}if(textTarget.field==='headline'&&!$('quickEditValue').value.trim()){$('quickEditError').textContent='Skriv en huvudrubrik.';$('quickEditError').hidden=false;return;}if(textTarget.field==='ctaHref'&&$('quickEditValue').value.trim()&&!linkURL($('quickEditValue').value)){$('quickEditError').textContent='Ange en fullständig webbadress eller ett #ankare.';$('quickEditError').hidden=false;return;}textTarget.owner[textTarget.field]=$('quickEditValue').value;changed();$('quickEditDialog').close();});
  function mediaList(){
    const query=$('mediaSearch').value.trim().toLocaleLowerCase('sv'),items=imageCandidates(mediaTarget.page).filter(item=>(item.label+' '+item.url.split('/').at(-1)).toLocaleLowerCase('sv').includes(query));
    $('mediaCount').textContent=items.length+' bildalternativ';
    $('mediaCandidates').innerHTML=items.length?items.map(item=>`<button type="button" class="media-choice" data-media-url="${e(item.url)}" data-media-label="${e(item.label)}" aria-pressed="${item.url===mediaChoice?.url}"><img src="${e(item.url)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span>${e(item.label)}</span></button>`).join(''):'<p class="empty-state">Inga bilder matchar. Prova en annan sökning eller ladda upp en egen under Bilder.</p>';
  }
  function showMedia(target){
    const page=getPage(),owner=target.scope==='hero'?page:page.cards[Number(target.scope)];if(!owner)return;
    const key=target.scope==='hero'?'heroGallery':'gallery',primary=target.scope==='hero'?'hero':'image',items=normalizeGallery(owner[key]||[],owner[primary])||[];
    mediaTarget={project:getProject(),page,owner,key,primary,index:target.index||0};mediaChoice=items[mediaTarget.index]?{...items[mediaTarget.index]}:null;
    $('mediaTitle').textContent=target.scope==='hero'?'Huvudbild':'Bild · '+(owner.title||'Sektion');$('mediaSearch').value='';$('mediaError').hidden=true;$('mediaCaption').value=mediaChoice?.caption||'';$('mediaRemove').hidden=!mediaChoice;mediaList();previewMedia();$('mediaDialog').showModal();
  }
  function previewMedia(){const image=$('mediaPreview');$('mediaLoadError').hidden=true;image.hidden=!mediaChoice;$('mediaEmpty').hidden=!!mediaChoice;$('mediaApply').disabled=!mediaChoice;if(mediaChoice)image.src=mediaChoice.url;else image.removeAttribute('src');}
  $('mediaPreview').addEventListener('error',()=>{$('mediaLoadError').hidden=false;$('mediaApply').disabled=true;});
  $('mediaPreview').addEventListener('load',()=>{$('mediaApply').disabled=!mediaChoice;});
  $('mediaSearch').addEventListener('input',mediaList);
  $('mediaCandidates').addEventListener('click',event=>{const button=event.target.closest('[data-media-url]');if(!button)return;const previous=normalizeGallery(mediaTarget.owner[mediaTarget.key]||[],mediaTarget.owner[mediaTarget.primary])?.find(item=>item.url===button.dataset.mediaUrl);mediaChoice=previous?{...previous}:{url:button.dataset.mediaUrl,label:button.dataset.mediaLabel,caption:''};$('mediaCaption').value=mediaChoice.caption||'';for(const choice of $('mediaCandidates').querySelectorAll('[data-media-url]'))choice.setAttribute('aria-pressed',String(choice.dataset.mediaUrl===mediaChoice.url));previewMedia();});
  $('mediaCancel').addEventListener('click',()=>$('mediaDialog').close());
  function applyMedia(remove=false){try{if(!mediaTarget||getProject()!==mediaTarget.project||getPage()!==mediaTarget.page)throw new Error('Sidan har bytts. Stäng bildväljaren och välj igen.');const item=remove?null:{...mediaChoice,caption:$('mediaCaption').value};Object.assign(mediaTarget.owner,replaceGalleryImage(mediaTarget.owner,mediaTarget.key,mediaTarget.primary,mediaTarget.index,item));changed();$('mediaDialog').close();}catch(error){$('mediaError').textContent=error.message;$('mediaError').hidden=false;}}
  $('mediaApply').addEventListener('click',()=>applyMedia());$('mediaRemove').addEventListener('click',()=>applyMedia(true));
  document.addEventListener('click',event=>{const button=event.target.closest('[data-open-media]');if(button)showMedia({scope:button.dataset.openMedia,index:Number(button.dataset.mediaIndex)||0});});
  function captureOriginal(project){for(const page of [project,...(project.pages||[])]){const {pages,...snapshot}=page;originals.set(page,structuredClone(snapshot));}}
  function renderComparison(){
    const page=getPage(),original=originals.get(page);comparePage=page;const source=/^https?:\/\//.test(page.source||'')?page.source:'';
    $('compareOriginalLink').hidden=!source;$('compareOriginalLink').href=source||'#';$('readComparison').disabled=!source;$('embedOriginal').disabled=!source;
    $('compareStatus').textContent=original?'Jämför mot importerat originalinnehåll i den här sessionen. Detta är en innehållskopia, inte originalets visuella design.':'Ingen originalkopia finns för den här sidan. Läs originalet för att jämföra utan att skriva över ditt förslag.';
    const image=url=>url?`<img src="${e(url)}" alt="Originalets bild" loading="lazy" referrerpolicy="no-referrer">`:'';
    $('originalContent').innerHTML=original?`<h2>${e(original.headline)}</h2><p>${e(original.description)}</p>${image(original.hero)}${(original.cards||[]).map(c=>`<article><h3>${e(c.title)}</h3><p>${e(c.description)}</p>${(c.gallery?.length?c.gallery:[{url:c.image}]).map(i=>image(i.url)).join('')}</article>`).join('')}`:'<p class="empty-state">Läs originalet med knappen ovan. Dina texter och bilder i förslaget behålls.</p>';
    $('comparisonPreview').srcdoc=renderDemo(getProject(),{pageSource:page.source});
    comparisonRows=compareContent(original,{...page,navigation:getProject().navigation});
    const differences=comparisonRows.map((row,index)=>`<article class="comparison-issue"><span class="issue-kind">${row.kind==='removed'?'SAKNAS I FÖRSLAGET':row.kind==='added'?'TILLAGT':'ÄNDRAT'}</span><h4>${e(row.label)}</h4><div class="difference-text"><p><strong>Original</strong>${e(row.before||'—')}</p><p><strong>Förslag</strong>${e(row.after||'—')}</p></div>${row.target?`<button class="text-button" data-compare-edit="${index}">Granska och ändra</button>`:row.source?`<button class="text-button" data-compare-restore="${index}">Återlägg sektionen</button>`:''}</article>`).join('');
    const warnings=(page.warnings||[]).filter(w=>/font|typsnitt|bild|färg|logo|kortats|JavaScript/i.test(w));
    $('comparisonIssues').innerHTML=(original&&!comparisonRows.length?'<p class="comparison-match">Ingen text- eller bildskillnad hittades i de jämförda fälten. Kontrollera fortfarande mot originalwebbsidan.</p>':'')+differences+warnings.map(w=>`<article class="comparison-issue"><span class="issue-kind">BEHÖVER GRANSKAS</span><p>${e(w)}</p></article>`).join('');
  }
  $('compareDesign').addEventListener('click',()=>{$('originalWebsite').hidden=true;$('originalWebsite').removeAttribute('src');$('originalContent').hidden=false;$('embedHelp').hidden=true;$('embedOriginal').textContent='Visa originalwebbsidan här';renderComparison();$('compareDialog').showModal();});
  $('readComparison').addEventListener('click',async()=>{
    const page=getPage();$('readComparison').disabled=true;$('compareStatus').textContent='Läser originalet… Ditt förslag ändras inte.';
    try{const response=await browserAPI('/api/import',{url:page.source,includePages:false}),data=await response.json();if(!response.ok)throw new Error(data.error||'Originalet kunde inte läsas.');if(getPage()!==page)return;originals.set(page,normalizeProject(data));renderComparison();}catch(error){$('compareStatus').textContent='Jämförelsen kunde inte hämtas: '+error.message;}finally{if(getPage()===page)$('readComparison').disabled=false;}
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
