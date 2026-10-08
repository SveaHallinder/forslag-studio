import {escapeHTML as e} from './render.mjs';
import {customerFunctionLinks} from './customer-functions.mjs';

export function browserConnection(state) {
  if(state==='local')return {state:'Redo på din Mac',copy:'Chromium läser sidan efter att JavaScript laddats. Välj Läs med webbläsare. Ingen Browser Run-tjänst används; den lokala appen behöver vara igång.'};
  if(state==='unavailable')return {state:'Behöver startas',copy:'Den lokala webbläsaren kunde inte starta. Kör npm run browser:install och starta om npm start. Importera underlag fungerar under tiden.'};
  if(state==='configured')return {state:'Konfigurerad',copy:'Browser Run kan läsa offentliga JavaScript-sidor inom kontots kvot. Prova Läs med webbläsare vid ofullständig import.'};
  if(state==='unknown')return {state:'Status okänd',copy:'Serverstatus kunde inte läsas. Prova igen eller importera en sparad HTML-sida.'};
  return {state:'Finns i lokalappen',copy:'JavaScript-import utan Browser Run finns i lokalappen på din Mac. Online kan du importera vanlig HTML eller sparat underlag. Kundernas visningslänkar ligger online.'};
}

export function createConnectionsStudio({getProject,navigate,editFunctions}) {
  const dialog=document.createElement('dialog');dialog.id='connectionsDialog';dialog.className='connections-dialog';dialog.setAttribute('aria-labelledby','connectionsTitle');
  dialog.innerHTML=`<form method="dialog"><button class="dialog-close" aria-label="Stäng kopplingar">×</button></form><p class="overline">FÖRSLAGETS STATUS</p><h2 id="connectionsTitle">Förslagets kopplingar.</h2><p class="dialog-intro">Granska varumärket och se vilka kundfunktioner som faktiskt är anslutna.</p><div id="connectionCards" class="connection-cards"></div><p id="connectionsStatus" class="field-help" role="status"></p><button id="refreshConnections" type="button" class="button secondary">Kontrollera kopplingar</button>`;
  document.body.append(dialog);let sequence=0;
  dialog.addEventListener('click',event=>{const action=event.target.closest('[data-connection-functions]');if(action){dialog.close();editFunctions();return;}const button=event.target.closest('[data-connection-tab]');if(button){dialog.close();navigate(button.dataset.connectionTab,button.dataset.connectionField);}});
  async function refresh(){
    const token=++sequence,p=getProject(),cards=dialog.querySelector('#connectionCards'),status=dialog.querySelector('#connectionsStatus');status.textContent='Kontrollerar anslutningar…';
    const section=(title,state,copy,button='')=>`<section class="connection-card"><div><h3>${e(title)}</h3><span>${e(state)}</span></div><p>${e(copy)}</p>${button}</section>`;
    const edit=(label,tab,field)=>`<button type="button" class="text-button" data-connection-tab="${tab}" data-connection-field="${field}">${e(label)} ↗</button>`;
    let server;try{const response=await fetch('/api/status',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Status kunde inte läsas.');server=await response.json();}catch{server={browser:'unknown',cloud:'unknown'};}
    if(token!==sequence||!dialog.open)return;
    const browser=browserConnection(server.browser),functions=customerFunctionLinks(p),functionCount=Number(!!functions.booking.length)+Number(!!functions.payment.length);
    cards.innerHTML=section('Varumärke',p.logo?'Logotyp vald':'Granska logotyp',`${Object.keys(p.branding||{}).length} färgroller · ${p.typography?.heading||'mallens rubriktypsnitt'} · ${p.cards.length} innehållsblock. Automatisk import behöver granskas.`,edit('Granska bilder och logga','images','logoUpload'))+
      section('JavaScript-sidor',browser.state,browser.copy)+
      section('Sociala profiler','Offentlig import + underlag','Alla angivna profiler prövas. Plattformar kan fortfarande neka åtkomst. Lägg då in företagets bio och bilder i socialflödet.')+
      section('Kontakt',p.email||p.phone?'Kontaktväg finns':'Kontaktväg saknas',p.email?'Mejl öppnar företagets adress. Ett skickat mejl bekräftas av ditt mejlprogram.':p.phone?'Besökaren kan ringa företaget. Lägg till en mejladress vid behov.':'Lägg till företagets riktiga kontaktuppgifter.',edit('Redigera kontakt','details','email'))+
      section('Bokning och betalning',functionCount?`${functionCount} ${functionCount===1?'länk angiven':'länkar angivna'}`:'Inga länkar angivna','Ange separata boknings- och betallänkar under Kundfunktioner. Välj vilket nästa steg huvudknappen ska visa. Bokning och köp hanteras av företagets system.','<button type="button" class="text-button" data-connection-functions>Koppla kundfunktioner ↗</button>')+
      section('Projektlagring',server.cloud==='workspaces'?'Arbetsytor tillgängliga':server.cloud==='local'?'Den här webbläsaren':'Status okänd',server.cloud==='workspaces'?'Logga in under Arbetsyta & inkorg och välj var projekten ska sparas. Lokala original finns kvar när du kopierar dem till arbetsytan.':'Förslagen sparas i den här webbläsaren. Ladda ner en projektkopia som redigerbar backup.');
    status.textContent=server.browser==='unknown'?'Serverstatus kunde inte kontrolleras. Prova igen; ditt utkast finns kvar.':'Status uppdaterad. Konfiguration är inte samma sak som ett genomfört kundtest.';
  }
  dialog.querySelector('#refreshConnections').addEventListener('click',refresh);
  dialog.addEventListener('close',()=>{sequence++;});
  return {open(){dialog.showModal();refresh();}};
}
