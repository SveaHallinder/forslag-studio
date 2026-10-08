import {normalizeProject} from './render.mjs';

const roles={booking:/^(boka(?:\s+(?:bord|tid|besök))?|bokning|book(?:\s+(?:a table|a visit|now))?|reservations?)$/i,payment:/^(betala|till betalning|köp|köp online|beställ online|pay|payment|checkout|shop online|order online)$/i};
export function customerFunctionLinks(project) {
  return Object.fromEntries(Object.entries(roles).map(([role,pattern])=>{
    const items=(project.navigation||[]).filter(item=>pattern.test(item.label.trim()));
    if(!items.length&&project.ctaHref&&pattern.test(String(project.cta||'').trim()))items.push({label:project.cta,href:project.ctaHref});
    return [role,items];
  }));
}
export function customerFunctionURL(value,label) {
  const raw=String(value||'').trim();if(!raw)return '';
  let url;try{url=new URL(raw);}catch{throw new Error(`${label}: ange en fullständig https://-adress till företagets system.`);}
  const host=url.hostname.toLowerCase();
  if(url.protocol!=='https:'||url.username||url.password||url.port||raw.length>2000||!host.includes('.')||/^[\d.]+$/.test(host)||host.includes(':')||/(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host)||host.endsWith('.localhost'))throw new Error(`${label}: använd företagets offentliga https-adress utan inloggningsuppgifter eller egen port.`);
  return url.href;
}
export function prepareCustomerFunctions(raw,input) {
  const project=normalizeProject(raw),links=customerFunctionLinks(project);
  for(const [role,items] of Object.entries(links))if(items.length>1)throw new Error(`Flera ${role==='booking'?'boknings':'betal'}länkar finns i menyn. Rätta dem under Redigera meny innan du fortsätter.`);
  const booking=customerFunctionURL(input.booking,'Bokning'),payment=customerFunctionURL(input.payment,'Betalning'),email=String(input.email||'').trim();
  if(email&&(email.length>160||!/^[^\s@"<>?#&]+@[^\s@"<>?#&]+\.[^\s@"<>?#&]+$/.test(email)))throw new Error('Kontakt: ange företagets giltiga mejladress, högst 160 tecken.');
  const oldLinks=new Set([...links.booking,...links.payment]);
  const navigation=project.navigation.filter(item=>!oldLinks.has(item));
  if(booking)navigation.push({label:links.booking[0]?.label||'Boka besök',href:booking});
  if(payment)navigation.push({label:links.payment[0]?.label||'Till betalning',href:payment});
  if(navigation.length>12)throw new Error('Menyn är full. Ta bort en menylänk under Redigera meny innan du lägger till fler kundfunktioner.');
  const next={...project,email,navigation};
  if(input.primary==='booking'||input.primary==='payment'){
    const href=input.primary==='booking'?booking:payment;if(!href)throw new Error('Lägg till en giltig länk för den valda huvudknappen.');
    next.ctaHref=href;next.cta=input.primary==='booking'?'Boka besök':'Till betalning';
  }else if(input.primary==='contact'){
    if(!email&&!project.phone)throw new Error('Lägg till en mejladress eller telefon för kontaktknappen.');
    next.ctaHref=email?'mailto:'+email:'tel:'+project.phone.replace(/[^+\d]/g,'');next.cta='Kontakta oss';
  }else if(input.primary==='keep'){
    for(const [role,items] of Object.entries(links))if(items[0]?.href===project.ctaHref){
      const href=role==='booking'?booking:payment;if(!href)throw new Error('Den borttagna länken används av huvudknappen. Välj en annan huvudknapp innan du fortsätter.');next.ctaHref=href;
    }
    if(/^mailto:/i.test(project.ctaHref)&&project.email!==email){if(!email)throw new Error('Mejladressen används av huvudknappen. Välj en annan huvudknapp innan du fortsätter.');next.ctaHref='mailto:'+email;}
  }else throw new Error('Välj vilken huvudknapp som ska användas.');
  if(project.pages)next.pages=project.pages.map(page=>{
    const updated={...page};if(page.email===project.email)updated.email=email;
    if(input.primary!=='keep'){updated.cta=next.cta;updated.ctaHref=next.ctaHref;}
    else{
      for(const [role,items] of Object.entries(links))if(items[0]?.href===page.ctaHref){
        const href=role==='booking'?booking:payment;if(!href)throw new Error('Den borttagna länken används av en huvudknapp på en undersida. Välj en annan huvudknapp innan du fortsätter.');updated.ctaHref=href;
      }
      if(page.ctaHref==='mailto:'+project.email){if(!email)throw new Error('Mejladressen används av en huvudknapp på en undersida. Välj en annan huvudknapp innan du fortsätter.');updated.ctaHref='mailto:'+email;}
    }
    return updated;
  });
  return next;
}

export function createCustomerFunctions({getProject,onApply}) {
  const dialog=document.createElement('dialog');dialog.id='customerFunctionsDialog';dialog.className='connections-dialog';dialog.setAttribute('aria-labelledby','customerFunctionsTitle');
  dialog.innerHTML=`<form method="dialog"><button class="dialog-close" aria-label="Stäng kundfunktioner">×</button></form><p class="overline">FRÅN BESÖK TILL NÄSTA STEG</p><h2 id="customerFunctionsTitle">Kundfunktioner.</h2><p class="dialog-intro">Koppla företagets kontakt, bokning och betalning. Länkarna följer med till kunddemon och HTML-exporten.</p><form id="customerFunctionsForm" novalidate><p id="customerFunctionsError" class="navigation-error" role="alert" hidden></p><div class="connection-cards"><section class="connection-card"><h3>Kontakt</h3><label for="functionEmail">Företagets mejladress</label><input type="email" id="functionEmail" maxlength="160" placeholder="hej@företaget.se"><p>Besökaren skriver via sitt mejlprogram. Serverformulär är inte aktiverat ännu.</p></section><section class="connection-card"><h3>Bokning</h3><label for="functionBooking">Bokningslänk</label><input type="url" id="functionBooking" maxlength="2000" placeholder="https://företaget.se/boka"><p>Bokning och lediga tider hanteras av företagets bokningssystem.</p><a id="testBookingLink" class="text-button" target="_blank" rel="noopener noreferrer" hidden>Öppna bokningssystemet ↗</a></section><section class="connection-card"><h3>Betalning</h3><label for="functionPayment">Betal- eller beställningslänk</label><input type="url" id="functionPayment" maxlength="2000" placeholder="https://buy.stripe.com/…"><p>Betalning hanteras av företagets betaltjänst. Kontrollera mottagare och produkt där.</p><a id="testPaymentLink" class="text-button" target="_blank" rel="noopener noreferrer" hidden>Öppna betalningssidan ↗</a></section></div><label for="functionPrimary">Huvudknapp</label><select id="functionPrimary"><option value="keep">Behåll nuvarande huvudknapp</option><option value="contact">Kontakta oss</option><option value="booking">Boka besök</option><option value="payment">Till betalning</option></select><p id="customerFunctionsSummary" class="field-help"></p><div class="dialog-actions"><button type="button" id="cancelCustomerFunctions" class="button secondary">Avbryt</button><button type="submit" class="button primary">Använd kundfunktioner</button></div></form>`;
  document.body.append(dialog);let previous,snapshot;
  const field=id=>dialog.querySelector('#'+id),error=message=>{field('customerFunctionsError').textContent=message;field('customerFunctionsError').hidden=!message;};
  const refresh=()=>{
    for(const [input,link,label] of [['functionBooking','testBookingLink','Bokning'],['functionPayment','testPaymentLink','Betalning']]){
      let href='';try{href=customerFunctionURL(field(input).value,label);}catch{}
      field(link).hidden=!href;if(href)field(link).href=href;else field(link).removeAttribute('href');
    }
  };
  dialog.addEventListener('input',()=>{error('');refresh();});
  field('cancelCustomerFunctions').addEventListener('click',()=>dialog.close());
  field('customerFunctionsForm').addEventListener('submit',event=>{
    event.preventDefault();
    try{
      if(getProject()!==previous||JSON.stringify(previous)!==snapshot)throw new Error('Det öppna förslaget har ändrats. Stäng och öppna Kundfunktioner igen; dina ändringar finns kvar.');
      const next=prepareCustomerFunctions(previous,{email:field('functionEmail').value,booking:field('functionBooking').value,payment:field('functionPayment').value,primary:field('functionPrimary').value});
      onApply(next);dialog.close();
    }catch(failure){error(failure.message);field('customerFunctionsError').scrollIntoView({block:'nearest'});}
  });
  return {open(){
    previous=getProject();if(!previous)return;snapshot=JSON.stringify(previous);const links=customerFunctionLinks(previous);
    field('functionEmail').value=previous.email;field('functionBooking').value=links.booking[0]?.href||'';field('functionPayment').value=links.payment[0]?.href||'';field('functionPrimary').value='keep';
    field('customerFunctionsSummary').textContent=`Gäller ${previous.name}. Ändringarna används när du väljer Använd kundfunktioner. Spara sedan utkastet.`;
    error('');refresh();dialog.showModal();
  }};
}
