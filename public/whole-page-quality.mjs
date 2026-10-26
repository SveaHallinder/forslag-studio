import {normalizeProject,escapeHTML as e} from './render.mjs';
import {launchSignature,checkLaunchAssets,importLaunchChecks} from './launch-checks.mjs';
import {assessProject} from './project-tools.mjs';
import {customerJourney} from './customer-journey.mjs';
import {industryChecks,planCopyRefinements,applyCopyRefinements,planActionRefinements,applyActionRefinements} from './proposal-refinements.mjs';
import {checkVisualLayout} from './visual-checks.mjs';
import {customerFunctionLinks} from './customer-functions.mjs';

export function wholePageChecks(raw) {
  const project=normalizeProject(raw),checks=[];
  for(const [index,page] of [project,...(project.pages||[])].entries()){
    const pageIndex=index-1,label=index?page.name:'Startsida';
    const add=(id,title,field,tab,help)=>checks.push({id,label:label+': '+title,ok:false,blocking:false,pageIndex,field,tab,help});
    if(!page.description)add('copy','Introduktion saknas','description','content','Beskriv vad företaget erbjuder och vem det hjälper. Använd företagets egna uppgifter.');
    if(page.headline.length>100)add('copy','Huvudrubriken är lång','headline','content','Ge rubriken ett tydligt huvudbudskap. Behåll detaljerna i introduktionen och sektionerna.');
    if(!page.cards.length&&!page.about)add('copy','Innehåll efter första intrycket saknas','addCard','content','Lägg till exempelvis utbud, arbetssätt, meny eller om företaget.');
    for(const [cardIndex,card] of page.cards.entries()){
      if(card.description.length>1800)add('copy','Sektion '+(cardIndex+1)+' är texttung','card-description-'+cardIndex,'content','Texten är lång. Granska läsordningen på mobil och dela vid behov upp innehållet i tydliga sektioner. Originaltexten är kvar.');
      if(!card.title)add('copy','Sektion '+(cardIndex+1)+' saknar rubrik','card-title-'+cardIndex,'content','Ge sektionen en beskrivande rubrik så besökaren förstår bilden eller texten.');
      if(!card.description&&!card.image&&!card.gallery?.length&&!card.href)add('copy','Sektion '+(cardIndex+1)+' innehåller bara en rubrik','card-description-'+cardIndex,'content','Komplettera sektionen med företagets innehåll eller ta bort den om den inte behövs.');
    }
    const content=[['headline',page.headline],['description',page.description],['about',page.about],...page.cards.flatMap((card,i)=>[['card-title-'+i,card.title],['card-description-'+i,card.description]])];
    for(const [field,value] of content)if(/\blorem ipsum\b|\b(?:TODO|TBD)\b|\[fyll i|\[företagsnamn\]/i.test(value))add('copy','Platshållartext finns kvar',field,'content','Ersätt arbetsmaterialet med godkänd företagstext före kundvisning.');
    const journey=customerJourney({...page,templateId:project.templateId,navigation:project.navigation,email:page.email||project.email,phone:page.phone||project.phone,requestForm:project.requestForm});
    if(!journey.primary)add('journey','Besökaren saknar ett nästa steg','editCustomerFunctions','details','Koppla kontakt, företagets bokningssystem eller beställningslänk under Kundfunktioner.');
    if(page.description.length>900)add('copy','Introduktionen tar stor plats','description','content','Välj en kort ingång och flytta fördjupningen till en egen sektion. Orden behålls tills du redigerar.');
  }
  for(const [kind,links] of Object.entries(customerFunctionLinks(project)))if(links.length)checks.push({id:'journey',label:kind==='booking'?'Bokningsflödet hos företaget':'Betal- eller beställningsflödet hos företaget',ok:false,blocking:false,pageIndex:-1,field:'editCustomerFunctions',tab:'details',help:kind==='booking'?'Öppna den kopplade länken och kontrollera företag, tjänster och lediga tider. En länk bekräftar inte att reservationen kan slutföras.':'Öppna den kopplade länken och kontrollera företag, produkt och belopp. Den automatiska kontrollen genomför inget köp.'});
  checks.push(...industryChecks(project));
  return checks;
}

// Choose only a larger readable photo in the same authored image group. Never
// mix product/portrait ownership, change manual framing, or upscale pixels.
export function planImageRefinements(raw,results) {
  const project=normalizeProject(raw),next=structuredClone(project),changes=[];
  for(const [index,page] of [next,...(next.pages||[])].entries())for(const [cardIndex,owner] of [page,...page.cards].entries()){
    const primary=cardIndex?'image':'hero',key=cardIndex?'gallery':'heroGallery',current=owner[primary],group=owner[key]||[];
    if(!current||group.length<2||cardIndex===0&&page.heroPosition!==50||group.some(item=>item.url===current&&item.presentation))continue;
    const before=results.get(current);if(!before)continue;
    const readable=r=>r?.ok&&!r.vector&&!r.soft&&r.width>0&&r.height>0;
    if(before.ok&&before.vector)continue;
    const candidates=group.filter(item=>item.url!==current).map(item=>({item,result:results.get(item.url)})).filter(({result:r})=>readable(r)&&(!before.ok||r.width>=before.width&&r.height>=before.height&&(before.soft||r.width*r.height>=before.width*before.height*1.5)&&Math.abs(Math.log((r.width/r.height)/(before.width/before.height)))<.18)).sort((a,b)=>b.result.width*b.result.height-a.result.width*a.result.height);
    const chosen=candidates[0];if(!chosen)continue;
    owner[primary]=chosen.item.url;owner[key]=[chosen.item,...group.filter(item=>item.url!==chosen.item.url&&results.get(item.url)?.ok!==false)];
    changes.push({pageIndex:index-1,field:cardIndex?'card-image-'+(cardIndex-1):'heroThumbnail',label:(index?page.name:'Startsida')+' · '+(cardIndex?owner.title||'Sektion '+cardIndex:'Huvudbild'),before:before.ok?`${before.width} × ${before.height} px`:'Otillgänglig bild',after:`${chosen.result.width} × ${chosen.result.height} px`,image:chosen.item.url});
  }
  return {project:next,changes,signature:launchSignature(raw)};
}

export function applyImageRefinements(current,plan) {
  if(launchSignature(current)!==plan.signature)throw new Error('Förslaget ändrades efter kontrollen. Kör genomgången igen; dina senaste ändringar finns kvar.');
  const next=structuredClone(current);
  for(const change of plan.changes){
    const page=change.pageIndex<0?next:next.pages[change.pageIndex],planned=change.pageIndex<0?plan.project:plan.project.pages[change.pageIndex];
    if(change.field==='heroThumbnail'){page.hero=planned.hero;page.heroGallery=structuredClone(planned.heroGallery);}
    else{const index=Number(change.field.replace('card-image-',''));page.cards[index].image=planned.cards[index].image;page.cards[index].gallery=structuredClone(planned.cards[index].gallery);}
  }
  return next;
}

export function createWholePageQuality({getProject,probe,probeForms=async()=>[],changed,edit,notify}) {
  const dialog=document.createElement('dialog');dialog.id='wholePageDialog';dialog.className='whole-page-dialog';dialog.setAttribute('aria-labelledby','wholePageTitle');
  dialog.innerHTML=`<header class="whole-page-header"><div><p class="overline">HELA FÖRSLAGET · ALLA SIDOR</p><h2 id="wholePageTitle">Förfina förslaget.</h2><p class="dialog-intro">Skarpare bildval, tydlig text och ett nästa steg för besökaren.</p></div><form method="dialog"><button class="dialog-close" aria-label="Stäng genomgång">×</button></form></header><p id="wholePageStatus" class="field-help" role="status"></p><div id="wholePageSummary" class="whole-page-summary"></div><div id="wholePageChanges"></div><div id="wholePageCopy"></div><div id="wholePageActions"></div><div id="wholePageIssues"></div><p class="field-help">Du väljer vilka förbättringar som används. Vid kortare introduktion flyttas resterande originaltext till en egen sektion. Fakta, priser och ord ändras inte. Bokning och betalning använder företagets kopplade system.</p><footer class="dialog-actions"><button id="wholePageRefresh" type="button" class="button secondary">Kontrollera igen</button><button id="wholePageUndo" type="button" class="text-button" hidden>Ångra förbättringar</button><button id="wholePageApply" type="button" class="button primary" disabled>Använd valda förbättringar</button></footer>`;
  document.body.append(dialog);const $=id=>dialog.querySelector('#'+id);let controller,sequence=0,plan,copyPlan,actionPlan,previous,snapshot,applied,undo;
  function render(checks,report){
    const groups=[['Bilder',checks.filter(c=>['asset','images'].includes(c.id))],['Text & varumärke',checks.filter(c=>['copy','industry','import','branding','headline','name'].includes(c.id))],['Mobil & layout',checks.filter(c=>c.id==='layout')],['Kundflöden',checks.filter(c=>!['asset','copy','industry','import','branding','headline','name','images','layout'].includes(c.id))]];
    $('wholePageSummary').innerHTML=groups.map(([name,items])=>{const pending=items.filter(c=>!c.ok).length;return `<div><span>${e(name)}</span><strong>${pending?pending+' att granska':'Kontrollerat'}</strong></div>`;}).join('');
    $('wholePageChanges').innerHTML=plan.changes.length?`<section class="whole-page-improvements"><label class="whole-page-option"><input id="wholePageImagesOption" type="checkbox" checked> Använd bättre bilder (${plan.changes.length})</label><p class="field-help">Samma bildgrupp. Ingen förstoring av originalfilen.</p>${plan.changes.map(c=>`<div class="whole-page-change"><img src="${e(c.image)}" alt="${e(c.label)}" referrerpolicy="no-referrer"><div><strong>${e(c.label)}</strong><p>${e(c.before)} <span aria-hidden="true">→</span> ${e(c.after)}</p></div></div>`).join('')}</section>`:'';
    $('wholePageCopy').innerHTML=copyPlan.changes.length?`<section class="whole-page-improvements whole-page-copy"><label class="whole-page-option"><input id="wholePageCopyOption" type="checkbox"> Kortare introduktion (${copyPlan.changes.length})</label><p class="field-help">Förslag att granska. Resten av texten flyttas till en egen sektion.</p>${copyPlan.changes.map(c=>`<article><h3>${e(c.label)}</h3><details><summary>Visa nuvarande introduktion · ${c.before.length} tecken</summary><p>${e(c.before)}</p></details><strong>Föreslagen introduktion · ${c.after.length} tecken</strong><p>${e(c.after)}</p><small>${(c.cards||[c.card]).reduce((n,card)=>n+card.description.length,0)} tecken bevaras i ${(c.cards||[c.card]).map(card=>'”'+e(card.title)+'”').join(', ')}.</small></article>`).join('')}</section>`:'';
    $('wholePageActions').innerHTML=actionPlan.changes.length?`<section class="whole-page-improvements whole-page-copy"><label class="whole-page-option"><input id="wholePageActionOption" type="checkbox"> Tydligare kontaktknapp (${actionPlan.changes.length})</label><p class="field-help">Använder bara företagets befintliga destination.</p>${actionPlan.changes.map(c=>`<article><h3>${e(c.label)}</h3><p>${e(c.before||'Ingen knapptext')} → <strong>${e(c.after)}</strong></p><small>${e(c.href)}</small></article>`).join('')}</section>`:'';
    const issues=checks.filter(c=>!c.ok);$('wholePageIssues').innerHTML=issues.length?issues.map(c=>`<article class="whole-page-issue"><div><span class="overline">${c.blocking?'BEHÖVER RÄTTAS':'GRANSKA'}</span><h3>${e(c.label)}</h3><p>${e(c.help)}</p></div><button type="button" class="text-button" data-quality-field="${e(c.field)}" data-quality-page="${c.pageIndex??-1}" data-quality-tab="${e(c.tab)}">Öppna delen ↗</button></article>`).join(''):'<p class="whole-page-empty">Inga problem hittades i bild-, text- och länkkontrollerna. Öppna kunddemon på mobil och granska företagets fakta före visning.</p>';
    $('wholePageStatus').textContent=`${1+(previous.pages?.length||0)} ${previous.pages?.length?'sidor':'sida'} · ${report.checked} av ${report.total} bildfiler kontrollerade · ${plan.changes.length} bildförslag · ${copyPlan.changes.length+actionPlan.changes.length} textförslag · ${report.visual.checked} av ${report.visual.total} layoutvyer kontrollerade.`;
    updateSelection();
  }
  function updateSelection(){
    const count=($('wholePageImagesOption')?.checked?plan?.changes.length||0:0)+($('wholePageCopyOption')?.checked?copyPlan?.changes.length||0:0)+($('wholePageActionOption')?.checked?actionPlan?.changes.length||0:0);
    $('wholePageApply').disabled=!count;$('wholePageApply').textContent=count?`Använd valda förbättringar (${count})`:'Välj en förbättring';
  }
  dialog.addEventListener('change',event=>{if(event.target.matches('#wholePageImagesOption,#wholePageCopyOption,#wholePageActionOption'))updateSelection();});
  async function run(){
    controller?.abort();const token=++sequence;controller=new AbortController();const signal=controller.signal;
    previous=getProject();snapshot=JSON.stringify(previous);plan=copyPlan=actionPlan=null;undo=null;$('wholePageUndo').hidden=true;
    $('wholePageApply').disabled=true;$('wholePageRefresh').disabled=true;dialog.setAttribute('aria-busy','true');$('wholePageStatus').textContent='Kontrollerar alla sidor och valda bildgrupper…';for(const id of ['wholePageSummary','wholePageChanges','wholePageCopy','wholePageActions','wholePageIssues'])$(id).innerHTML='';
    const activeController=controller,timer=setTimeout(()=>activeController.abort(),25000);
    try{
      const [report,forms,visual]=await Promise.all([checkLaunchAssets(previous,probe,{signal}),probeForms(previous,signal),checkVisualLayout(previous,{signal})]);
      report.checks.push(...forms,...visual.checks);report.visual=visual;
      for(const check of report.checks.filter(c=>c.id==='asset')){const page=check.pageIndex<0?previous:previous.pages[check.pageIndex],card=page.cards.findIndex(c=>c.image===check.url||c.gallery?.some(i=>i.url===check.url));if(card>=0){check.field='card-image-'+card;check.tab='content';}else if(check.url===page.logo||check.url===previous.logo)check.field='logoUpload';}
      if(token!==sequence||!dialog.open)return;
      if(getProject()!==previous||JSON.stringify(previous)!==snapshot)throw new Error('Förslaget ändrades under kontrollen. Kör igen för den senaste versionen.');
      plan=planImageRefinements(previous,report.results);copyPlan=planCopyRefinements(previous);actionPlan=planActionRefinements(previous);render([...wholePageChecks(previous),...importLaunchChecks(previous),...assessProject(previous),...report.checks],report);
    }catch(error){if(token===sequence)$('wholePageStatus').textContent=error.message;}
    finally{clearTimeout(timer);if(token===sequence){$('wholePageRefresh').disabled=false;dialog.setAttribute('aria-busy','false');}}
  }
  $('wholePageRefresh').addEventListener('click',run);
  $('wholePageApply').addEventListener('click',()=>{try{
    if(getProject()!==previous||JSON.stringify(previous)!==snapshot)throw new Error('Förslaget ändrades. Kör genomgången igen.');
    const images=!!$('wholePageImagesOption')?.checked,copy=!!$('wholePageCopyOption')?.checked,action=!!$('wholePageActionOption')?.checked;
    if(!images&&!copy&&!action)return;
    undo=structuredClone(previous);let next=images?applyImageRefinements(previous,plan):structuredClone(previous);
    if(copy)next=applyCopyRefinements(next,planCopyRefinements(next));
    if(action)next=applyActionRefinements(next,planActionRefinements(next));
    changed(next);applied=JSON.stringify(getProject());$('wholePageApply').disabled=true;$('wholePageUndo').hidden=false;
    for(const option of dialog.querySelectorAll('.whole-page-option input'))option.disabled=true;
    $('wholePageStatus').textContent='Valda förbättringar används i förhandsvisningen. Granska hela sidan och spara utkastet när du är nöjd.';
    notify('Förslaget är förfinat. Du kan ångra förbättringarna här.');
  }catch(error){$('wholePageStatus').textContent=error.message;}});
  $('wholePageUndo').addEventListener('click',()=>{if(!undo)return;if(JSON.stringify(getProject())!==applied){$('wholePageStatus').textContent='Du har redigerat förslaget efter förbättringarna. Ångra är avstängt för att bevara dina ändringar.';return;}changed(undo);run();});
  dialog.addEventListener('click',event=>{const button=event.target.closest('[data-quality-field]');if(!button)return;dialog.close();edit({pageIndex:Number(button.dataset.qualityPage),field:button.dataset.qualityField,tab:button.dataset.qualityTab});});
  // A queued close event from the previous opening must not cancel a new review.
  dialog.addEventListener('close',()=>{if(!dialog.open){controller?.abort();++sequence;}});
  return {open(){if(!getProject())return;dialog.showModal();run();}};
}
