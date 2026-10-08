import {escapeHTML as e} from './render.mjs';
import {cloudContext,cloudRequest} from './cloud-api.mjs';
import {customerFunctionLinks} from './customer-functions.mjs';

import {normalizeCustomerSetup,validateCustomerSetup,zonedSlot} from './booking-settings.mjs';

export function createPilotSetup({getProject,onApply,onForm,save,openWorkspace,editFunctions,notify}) {
  const dialog=document.createElement('dialog');dialog.id='pilotDialog';dialog.className='connections-dialog pilot-dialog';dialog.setAttribute('aria-labelledby','pilotTitle');
  dialog.innerHTML=`<form method="dialog"><button class="dialog-close" aria-label="Stäng kundflöden">×</button></form><p class="overline">FRÅN FÖRSLAG TILL FÖRSTA KUND</p><h2 id="pilotTitle">En enklare start.</h2><p class="dialog-intro">Bokning, betalning och bekräftelser. Börja utan nya månadsabonnemang och se vad som faktiskt är anslutet.</p><p id="pilotStatus" class="field-help" role="status"></p><p id="pilotError" class="navigation-error" role="alert" hidden></p><div id="pilotConnections" class="connection-cards"></div><form id="pilotSettings"><section class="cloud-section"><div class="pilot-section-title"><h3>Bokningsupplägg.</h3><span class="pilot-tag">EGEN BOKNING</span></div><p class="field-help">En bokning tar en plats på den valda tiden. Kapaciteten gäller per tillfälle, till exempel antal bord eller bokningsbara besök.</p><label for="pilotZone">Företagets tidszon</label><select id="pilotZone"><option value="Europe/Stockholm">Stockholm</option><option value="Europe/Bucharest">Bucharest</option><option value="Europe/London">London</option><option value="Europe/Paris">Paris</option><option value="UTC">UTC</option></select><div class="pilot-field-row"><div><label for="pilotDuration">Minuter per besök</label><input id="pilotDuration" type="number" min="15" max="240" step="15" value="60"></div><div><label for="pilotCapacity">Platser per tillfälle</label><input id="pilotCapacity" type="number" min="1" max="100" step="1" value="1"></div></div><label for="pilotSlot">Lägg till ett bokningstillfälle</label><div class="pilot-field-row"><input id="pilotSlot" type="datetime-local"><button id="pilotAddSlot" type="button" class="button secondary">Lägg till tid +</button></div><p class="field-help">Tiden tolkas i företagets tidszon. Överlappande tider tillåts inte.</p><div id="pilotSlots" class="pilot-slots"></div><label class="pilot-checkbox"><input id="pilotNotify" type="checkbox"> Skicka även en avisering till företagets mejladress</label><p class="field-help">Besökarens bekräftelse och företagets avisering räknas som två mejl. Automatiska mejl startar först när en verifierad avsändare är ansluten.</p></section><div class="dialog-actions"><button id="pilotPreview" type="button" class="button secondary">Förhandsvisa kundflödet ↗</button><button type="submit" class="button primary">Spara upplägg</button></div></form><section class="cloud-section"><h3>Redo att ta emot bokningar?</h3><p id="pilotActivationHelp" class="field-help"></p><div class="dialog-actions"><button id="pilotWorkspace" class="button secondary" type="button">Arbetsyta & inkorg ↗</button><button id="pilotActivate" class="button primary" type="button" disabled>Aktivera egen bokning</button></div></section>`;
  document.body.append(dialog);const field=id=>dialog.querySelector('#'+id);let previous,snapshot,settings,server={},busy=false,sequence=0;
  const error=message=>{field('pilotError').textContent=message;field('pilotError').hidden=!message;};
  const isCurrent=()=>getProject()===previous&&JSON.stringify(getProject())===snapshot;
  function read(){return validateCustomerSetup({...settings,timeZone:field('pilotZone').value,duration:field('pilotDuration').value,capacity:field('pilotCapacity').value,notifyTeam:field('pilotNotify').checked});}
  function renderSlots(){
    const format=new Intl.DateTimeFormat('sv-SE',{timeZone:field('pilotZone').value,dateStyle:'medium',timeStyle:'short'});
    field('pilotSlots').innerHTML=settings.slots.map(slot=>`<div class="pilot-slot"><span>${e(format.format(new Date(slot)))}</span><button type="button" class="text-button" data-remove-slot="${e(slot)}" aria-label="Ta bort ${e(format.format(new Date(slot)))}">Ta bort ×</button></div>`).join('')||'<p class="cloud-empty">Inga tider ännu. Lägg till nästa tillfälle som företaget kan ta emot besök.</p>';
  }
  function refreshActivation(){
    const ready=server.reservations==='ready'&&!!cloudContext().workspace&&settings.slots.length>0;
    field('pilotActivate').disabled=!ready||busy;
    field('pilotActivationHelp').textContent=server.reservations!=='ready'?'Bokningsupplägget kan granskas här. Serverns bokningslagring behöver aktiveras innan riktiga tider kan reserveras.':!cloudContext().workspace?'Välj en arbetsyta och kopiera förslaget dit. Aktiveringen sparar upplägget och öppnar ett bokningsformulär.':!settings.slots.length?'Lägg till minst en framtida tid för att aktivera bokning.':'Aktiveringen öppnar de valda tiderna för riktiga bokningar. Granska kapacitet och företagets tidszon först.';
  }
  async function refresh(){
    const token=++sequence;field('pilotStatus').textContent='Kontrollerar pilotens anslutningar…';
    try{const response=await fetch('/api/status',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error();server=await response.json();}catch{server={};}
    if(token!==sequence||!dialog.open)return;
    const card=(title,state,copy,action='')=>`<section class="connection-card"><div><h3>${e(title)}</h3><span>${e(state)}</span></div><p>${e(copy)}</p>${action}</section>`;
    const payment=customerFunctionLinks(getProject()).payment[0]?.href;
    field('pilotConnections').innerHTML=card('JavaScript-import',server.browser==='local'?'Redo på denna Mac':server.browserProvider==='mac'?server.agent==='ready'?'Macen är ansluten':'Macen är offline':server.browser==='configured'?'Konfigurerad online':'Onlineanslutning saknas','Den egna Chromium-motorn kräver inga extra webbläsarabonnemang. Macen måste vara igång när importer körs.')+card('Betalning',payment?'Betallänk angiven':'Betallänk saknas','Koppla företagets betalningslänk. Stripe tar en avgift per betalning. En återkomst till förslaget räknas inte som en bekräftad betalning.','<button type="button" class="text-button" data-pilot-payment>Koppla betalningslänk ↗</button>')+card('Automatiska mejl',server.email==='configured'?'Avsändare konfigurerad':'Avsändare saknas','Resend Free: högst 100 mejl per dag och 3 000 per månad. Bokningen sparas även när mejlet inte kan skickas. Återförsök körs när Mac-agenten är ansluten.','<a class="text-button" href="https://resend.com/domains" target="_blank" rel="noopener noreferrer">Anslut avsändardomän ↗</a>');
    field('pilotStatus').textContent=server.browser?'Status uppdaterad. Förhandsvisningen skickar inga mejl och reserverar inga tider.':'Anslutningarna kunde inte läsas. Upplägget och förhandsvisningen går fortfarande att använda.';refreshActivation();
  }
  dialog.addEventListener('click',event=>{
    const remove=event.target.closest('[data-remove-slot]');if(remove){settings.slots=settings.slots.filter(slot=>slot!==remove.dataset.removeSlot);renderSlots();refreshActivation();}
    if(event.target.closest('[data-pilot-payment]')){dialog.close();editFunctions();}
  });
  field('pilotZone').addEventListener('change',renderSlots);
  field('pilotAddSlot').addEventListener('click',()=>{
    error('');try{
      const value=field('pilotSlot').value;if(!value)throw new Error('Välj ett datum och klockslag.');
      const slot=zonedSlot(value,field('pilotZone').value);if(Date.parse(slot)<=Date.now())throw new Error('Välj en tid i framtiden.');
      if(settings.slots.length>=60)throw new Error('Högst 60 tillfällen kan vara öppna samtidigt.');
      const duration=read().duration*60_000;if(settings.slots.some(old=>Math.abs(Date.parse(old)-Date.parse(slot))<duration))throw new Error('Tiden överlappar ett annat tillfälle. Välj en separat tid.');
      settings.slots.push(slot);settings.slots.sort();field('pilotSlot').value='';renderSlots();refreshActivation();
    }catch(failure){error(failure.message);}
  });
  field('pilotSettings').addEventListener('submit',event=>{event.preventDefault();error('');if(!isCurrent()){error('Förslaget har ändrats. Stäng och öppna kundflöden igen; ditt utkast finns kvar.');return;}try{settings=read();onApply(settings);snapshot=JSON.stringify(getProject());notify('Bokningsupplägget finns i utkastet. Spara förslaget och aktivera separat för att öppna riktiga tider.');}catch(failure){error(failure.message);}});
  field('pilotPreview').addEventListener('click',()=>{
    error('');try{const data={name:getProject().name,accent:getProject().accent,email:getProject().email,setup:read()};window.open('/booking.html#draft='+encodeURIComponent(JSON.stringify(data)),'_blank','noopener');}catch(failure){error(failure.message);}
  });
  field('pilotWorkspace').addEventListener('click',()=>{dialog.close();openWorkspace();});
  field('pilotActivate').addEventListener('click',async()=>{
    if(busy)return;error('');if(!isCurrent()){error('Förslaget har ändrats. Stäng och öppna kundflöden igen.');return;}
    busy=true;refreshActivation();try{settings=validateCustomerSetup(read(),{requireSlots:true});onApply(settings);const current=getProject(),before=JSON.stringify(current),oldId=current.id,workspace=cloudContext().workspace;await save(false);if(getProject()!==current||JSON.stringify({...current,id:oldId})!==before||cloudContext().workspace!==workspace)throw new Error('Förslaget ändrades under sparningen. Öppna kundflöden igen.');snapshot=JSON.stringify(current);const result=await cloudRequest('/booking-config',{workspace,projectId:current.id,setup:settings});if(!isCurrent()||cloudContext().workspace!==workspace)throw new Error('Förslaget ändrades under aktiveringen. Kontrollera formuläret i arbetsytan.');onForm(result);await save(false);snapshot=JSON.stringify(getProject());notify('Bokningsformuläret är aktiverat. Kontrollera kundflödet före delning.');dialog.close();}catch(failure){error(failure.message);}finally{busy=false;refreshActivation();}
  });
  return {open(){previous=getProject();if(!previous)return;snapshot=JSON.stringify(previous);settings=normalizeCustomerSetup(previous.customerSetup);if(![...field('pilotZone').options].some(option=>option.value===settings.timeZone)){const option=document.createElement('option');option.value=settings.timeZone;option.textContent=settings.timeZone;field('pilotZone').append(option);}field('pilotZone').value=settings.timeZone;field('pilotDuration').value=settings.duration;field('pilotCapacity').value=settings.capacity;field('pilotNotify').checked=settings.notifyTeam;error('');renderSlots();dialog.showModal();refresh();}};
}
