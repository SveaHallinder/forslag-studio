import {cloudContext,cloudRequest,refreshCloudSession} from './cloud-api.mjs';
import {escapeHTML as e} from './render.mjs';

export function createCloudStudio({getProject,onSelect,onForm,save,notify}) {
  const dialog=document.createElement('dialog');dialog.className='connections-dialog cloud-dialog';dialog.setAttribute('aria-labelledby','cloudTitle');
  dialog.innerHTML='<form method="dialog"><button class="dialog-close" aria-label="Stäng arbetsyta">×</button></form><p class="overline">ETT GEMENSAMT STÄLLE</p><h2 id="cloudTitle">Arbetsyta & inkorg.</h2><p class="dialog-intro">Spara mellan enheter, samarbeta och ta emot förfrågningar. Lokala projekt kopieras bara när du väljer det.</p><p class="field-help" data-local-note hidden>På localhost testar du en separat databas på din Mac. Formulären fungerar bara här. Logga in i onlineverktyget för molnsynk och kundformulär.</p><p class="navigation-error" data-cloud-error role="alert" hidden></p><div data-cloud-content></div>';
  document.body.append(dialog);let busy=false;
  const error=message=>{const node=dialog.querySelector('[data-cloud-error]');node.textContent=message;node.hidden=!message;};
  async function render(inbox=false){
    const c=await refreshCloudSession(),node=dialog.querySelector('[data-cloud-content]'),active=c.workspaces.find(w=>w.id===c.workspace);
    dialog.querySelector('[data-local-note]').hidden=!c.local;
    if(!c.available){node.innerHTML='<p class="cloud-empty">Arbetsytans lagring är inte ansluten ännu. Dina lokala förslag finns kvar.</p>';return;}
    if(!c.user){node.innerHTML=`<section class="cloud-empty"><h3>Din arbetsyta börjar här.</h3><p>Logga in för privata projekt och en gemensam inkorg. Kundernas visningslänkar fungerar utan inloggning.</p><a class="button primary" target="_top" href="${e((c.local?'/local-signin':'/signin-with-chatgpt')+'?return_to='+encodeURIComponent(location.search?location.pathname+location.search:'/?workspace-open=1'))}">${c.local?'Starta lokal testinloggning':'Logga in med ChatGPT'} ↗</a>${c.local?'<p class="field-help">Testkontot gäller bara servern på din Mac.</p>':'<p class="field-help">Om inloggningen inte startar här, öppna verktyget i Chrome eller Safari och försök igen.</p>'}</section>`;return;}
    node.innerHTML=`<p class="field-help">Inloggad som ${e(c.user.email)} ${c.local?'· lokal testmiljö':''}</p><label for="cloudWorkspace">Var vill du arbeta?</label><select id="cloudWorkspace"><option value="">Den här webbläsaren</option>${c.workspaces.map(w=>`<option value="${e(w.id)}" ${w.id===c.workspace?'selected':''}>${e(w.name)}${w.role==='owner'?' · ägare':''}</option>`).join('')}</select><div class="dialog-actions"><button class="button secondary" data-cloud-switch>Byt arbetsyta</button>${c.workspaces.length?'<button class="button primary" data-cloud-copy>Kopiera öppet förslag till valet</button>':''}</div><form data-create-workspace><label for="newWorkspaceName">Skapa privat arbetsyta</label><div class="cloud-row"><input id="newWorkspaceName" maxlength="80" required placeholder="Till exempel Vega Vista"><button class="button secondary">Skapa arbetsyta</button></div></form>${active?`<section class="cloud-section"><h3>${e(active.name)}.</h3><p>Alla medlemmar kan redigera projekt och läsa inkorgen.</p>${active.role==='owner'?'<form data-invite><label for="inviteEmail">Bjud in en kollega via en personlig länk</label><div class="cloud-row"><input id="inviteEmail" type="email" maxlength="160" required placeholder="kollega@företaget.se"><button class="button secondary">Skapa inbjudan</button></div><p class="field-help">Länken gäller i sju dagar och kan bara användas av mejladressen du anger. Du skickar länken själv.</p><div data-invite-result></div></form>':''}<div data-members></div></section><section class="cloud-section"><h3>Kontakt och förfrågningar.</h3><p>De här formulären sparar förfrågningar i inkorgen. För bekräftade tider och automatiska bokningsmejl, öppna <strong>Kundflöden</strong> under Kopplingar.</p><label for="cloudFormKind">Typ av förfrågan</label><select id="cloudFormKind"><option value="contact">Kontaktförfrågan</option><option value="booking" ${getProject()?.requestForm?.kind==='booking'?'selected':''}>Bokningsförfrågan</option></select><div class="dialog-actions"><button class="button secondary" data-enable-form>Aktivera för öppet förslag</button>${getProject()?.requestForm?'<button class="text-button" data-disable-form>Stäng formuläret</button><a class="text-button" href="'+e(getProject().requestForm.url)+'" target="_blank" rel="noopener noreferrer">Visa formuläret ↗</a>':''}</div></section><section class="cloud-section"><div class="cloud-row"><h3>Inkorg.</h3><button class="text-button" data-refresh-inbox>Uppdatera</button></div><div data-inbox>${inbox?'Läser förfrågningar…':'<p class="cloud-empty">Välj Uppdatera för att läsa arbetsytans förfrågningar.</p>'}</div></section>`:'<p class="cloud-empty">Välj en arbetsyta för gemensamma projekt och inkorg, eller fortsätt med lokala utkast.</p>'}<p><a href="${c.local?'/local-signout':'/signout-with-chatgpt'}?return_to=%2F" target="_top" class="text-button">Logga ut ↗</a></p>`;
    if(active){await members(active);if(inbox)await loadInbox();}
  }
  async function members(active){
    const rows=await cloudRequest('/members?workspace='+active.id);
    dialog.querySelector('[data-members]').innerHTML=rows.map(m=>`<div class="cloud-row cloud-member"><span>${e(m.email)} · ${m.role==='owner'?'ägare':'medlem'}</span>${active.role==='owner'&&m.role!=='owner'?`<button class="text-button" data-remove-member="${e(m.user_id)}">Ta bort åtkomst</button>`:''}</div>`).join('');
  }
  async function loadInbox(){
    const rows=await cloudRequest('/inbox?workspace='+cloudContext().workspace);
    const emailLabel=(state,configured)=>!configured&&['pending','retry'].includes(state)?'Avsändare saknas — inget mejl skickat':({pending:'Bekräftelse väntar på mejlutskick',sending:'Mejlet behandlas',retry:'Mejl väntar på återförsök',sent:'Bekräftelsen accepterad av mejltjänsten',failed:'Mejlutskicket nekades',unknown:'Osäker mejlleverans — kontrollera mejltjänsten',cancelled:'Mejlutskicket stoppades'})[state]||'Inget mejlutskick';
    dialog.querySelector('[data-inbox]').innerHTML=rows.map(r=>`<article class="cloud-message"><p class="overline">${e(r.title)} · ${r.reservation_id?r.reservation_state==='cancelled'?'AVBOKAD':'BEKRÄFTAD BOKNING':r.kind==='booking'?'BOKNINGSFÖRFRÅGAN':'KONTAKT'} · ${r.state==='new'?'NY':'LÄST'}</p><h4>${e(r.name)}</h4><a href="mailto:${e(r.email)}">${e(r.email)}</a><p>${e(r.message)}</p>${r.reservation_id?'<p>'+e(new Intl.DateTimeFormat('sv-SE',{timeZone:r.time_zone,dateStyle:'medium',timeStyle:'short'}).format(new Date(r.starts_at)))+' · '+e(r.time_zone)+'</p><p class="field-help">Bokningsnummer: '+e(r.reservation_id)+'<br>'+e(emailLabel(r.email_state,r.email_configured))+(r.email_error?'<br>'+e(r.email_error):'')+'</p>':r.visit_at?'<p>Önskat besök: '+e(r.visit_at)+'</p>':''}<p class="field-help">${e(new Date(r.created_at).toLocaleString('sv-SE'))}</p><button class="text-button" data-message="${e(r.id)}" data-state="${r.state==='new'?'read':'new'}">${r.state==='new'?'Markera som läst':'Markera som ny'}</button>${r.reservation_state==='confirmed'?'<button class="text-button" data-cancel-reservation="'+e(r.reservation_id)+'">Avboka och frigör plats</button>':''}</article>`).join('')||'<div class="cloud-empty"><h4>Här landar nästa kontakt.</h4><p>Aktivera ett formulär för ett sparat förslag. Förfrågningar och bekräftade bokningar visas här.</p></div>';
  }
  async function run(action){if(busy)return;busy=true;error('');dialog.setAttribute('aria-busy','true');try{await action();}catch(failure){error(failure.message);}finally{busy=false;dialog.removeAttribute('aria-busy');}}
  dialog.addEventListener('submit',event=>{
    if(event.target.method==='dialog')return;event.preventDefault();
    run(async()=>{
      if(event.target.matches('[data-create-workspace]')){await cloudRequest('/workspace',{name:dialog.querySelector('#newWorkspaceName').value});await render();}
      else if(event.target.matches('[data-invite]')){
        const result=await cloudRequest('/invite',{workspace:cloudContext().workspace,email:dialog.querySelector('#inviteEmail').value});
        dialog.querySelector('[data-invite-result]').innerHTML='<label for="inviteLink">Personlig inbjudningslänk</label><input id="inviteLink" readonly value="'+e(result.url)+'"><p class="field-help">Kopiera länken och skicka till kollegan.</p>';
      }
    });
  });
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    run(async()=>{
      if(button.hasAttribute('data-cloud-switch')){await onSelect(dialog.querySelector('#cloudWorkspace').value,false);await render();}
      if(button.hasAttribute('data-cloud-copy')){const workspace=dialog.querySelector('#cloudWorkspace').value;if(!workspace)throw new Error('Välj en arbetsyta att kopiera förslaget till.');await onSelect(workspace,true);notify('En egen kopia är sparad i arbetsytan. Originalet finns kvar.');await render();}
      if(button.hasAttribute('data-refresh-inbox'))await loadInbox();
      if(button.dataset.message){await cloudRequest('/message-state',{workspace:cloudContext().workspace,id:button.dataset.message,state:button.dataset.state});await loadInbox();}
      if(button.dataset.cancelReservation){if(!confirm('Avboka och frigör platsen? Kontakta kunden själv; inget avbokningsmejl skickas och ett tidigare mejl kan redan vara på väg.'))return;await cloudRequest('/reservation-state',{workspace:cloudContext().workspace,id:button.dataset.cancelReservation,state:'cancelled'});await loadInbox();}
      if(button.dataset.removeMember){if(!confirm('Ta bort den här kollegans åtkomst till arbetsytan?'))return;await cloudRequest('/remove-member',{workspace:cloudContext().workspace,userId:button.dataset.removeMember});await render();}
      if(button.hasAttribute('data-enable-form')){
        if(getProject()?.requestForm?.url?.includes('/booking.html?')&&!confirm('Byta från bekräftade bokningar till ett förfrågningsformulär? Befintliga bokningar finns kvar i inkorgen.'))return;
        const current=getProject(),snapshot=JSON.stringify(current);await save(false);
        if(getProject()!==current||JSON.stringify({...current,id:JSON.parse(snapshot).id})!==snapshot)throw new Error('Förslaget ändrades under sparningen. Försök igen med ditt senaste utkast.');
        const result=await cloudRequest('/form',{workspace:cloudContext().workspace,projectId:current.id,kind:dialog.querySelector('#cloudFormKind').value,active:true});onForm(result);await save(false);await render();
      }
      if(button.hasAttribute('data-disable-form')){await cloudRequest('/form',{workspace:cloudContext().workspace,projectId:getProject().id,active:false});onForm(null);await save(false);await render();}
    });
  });
  return {open(inbox=false){error('');dialog.showModal();run(()=>render(inbox));}};
}
