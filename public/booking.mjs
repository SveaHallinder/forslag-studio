import {escapeHTML as e} from './render.mjs';
import {normalizeCustomerSetup} from './booking-settings.mjs';
const $=id=>document.getElementById(id),formId=new URL(location.href).searchParams.get('form');let draft,form,nonce=crypto.randomUUID(),selected='';
async function call(body){const response=await fetch('/api/booking/'+encodeURIComponent(formId||''),{method:body?'POST':'GET',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});let data;try{data=await response.json();}catch{throw new Error('Bokningssidan svarade inte korrekt. Försök igen.');}if(!response.ok)throw new Error(data.error||'Bokningen kunde inte slutföras.');return data;}
function show(){
  const setup=form.setup,format=new Intl.DateTimeFormat('sv-SE',{timeZone:setup.timeZone,dateStyle:'medium',timeStyle:'short'});
  document.title=form.title+' – boka besök';$('bookingCompany').textContent=form.title;$('bookingDuration').textContent=setup.duration+' minuter per besök';$('bookingZone').textContent='Företagets tid · '+setup.timeZone;
  $('bookingNote').innerHTML=draft?'<span class="booking-preview-tag">FÖRHANDSVISNING</span><br>Det här är ett utkast till kundflödet. Inga tider reserveras och inga mejl skickas.':'En plats reserveras när bokningen har bekräftats här. Mejlets leveransstatus visas separat.';
  if(/^#[a-f0-9]{6}$/i.test(form.accent||'')){document.documentElement.style.setProperty('--form-accent',form.accent);const rgb=[1,3,5].map(i=>parseInt(form.accent.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);document.documentElement.style.setProperty('--form-ink',.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.179?'#152015':'#fff');}
  $('bookingSlots').innerHTML=form.slots.map(slot=>`<label class="booking-time"><input type="radio" name="slot" value="${e(slot.startsAt)}" required ${slot.startsAt===selected?'checked':''}>${e(format.format(new Date(slot.startsAt)))}<small>${slot.remaining} ${slot.remaining===1?'plats kvar':'platser kvar'}</small></label>`).join('');
  $('bookingForm').hidden=!form.slots.length;$('bookingState').hidden=!!form.slots.length;
  if(!form.slots.length)$('bookingState').textContent='Inga lediga tillfällen just nu. Kontakta företaget eller prova igen senare.';
  $('bookingSubmit').innerHTML=(draft?'Prova bekräftelsen':'Bekräfta bokning')+' <span aria-hidden="true">↗</span>';
}
try{if(location.hash.startsWith('#draft=')){const data=JSON.parse(decodeURIComponent(location.hash.slice(7)));draft=true;const setup=normalizeCustomerSetup(data.setup);form={title:String(data.name||'Ditt företag').slice(0,100),accent:data.accent,setup,slots:setup.slots.map(startsAt=>({startsAt,remaining:setup.capacity}))};}else form=await call();show();}catch(error){$('bookingNote').textContent='Kontakta företaget via dess övriga kontaktvägar.';$('bookingState').textContent=error.message;}
$('bookingForm').addEventListener('submit',async event=>{
  event.preventDefault();$('bookingError').hidden=true;selected=event.target.elements.slot.value;const button=$('bookingSubmit');button.disabled=true;
  try{
    const result=draft?{confirmed:true,email:'preview'}:await call({nonce,startsAt:selected,name:$('bookingName').value,email:$('bookingEmail').value,message:$('bookingMessage').value,website:event.target.elements.website.value});
    if(result.confirmed!==true)throw new Error('Bokningen är inte längre bekräftad. Kontrollera lediga tillfällen eller kontakta företaget.');
    const format=new Intl.DateTimeFormat('sv-SE',{timeZone:form.setup.timeZone,dateStyle:'full',timeStyle:'short'});
    $('bookingForm').hidden=true;$('bookingState').hidden=false;$('bookingTitle').textContent=draft?'Så här ser bekräftelsen ut.':'Vi ses snart.';
    $('bookingState').innerHTML=`<div class="booking-confirmation"><p>${draft?'Exempel på bokningsbekräftelse. Ingen tid har reserverats.':'Din bokning hos '+e(form.title)+' är bekräftad.'}</p><strong>${e(format.format(new Date(selected)))}</strong><p>${result.email==='sent'?'Bekräftelsen har skickats till mejltjänsten.':result.email==='queued'?'Bekräftelsemejlet väntar på att skickas. Bokningen är sparad.':draft?'När en avsändare är ansluten kan bekräftelsen skickas automatiskt.':'Bokningen är sparad. Bekräftelsemejlet har inte skickats; spara uppgifterna här.'}</p>${result.reference?'<p class="help">Bokningsnummer: '+e(result.reference)+'</p>':''}${draft?'<a href="/">Tillbaka till verktyget ↗</a>':''}</div>`;
    nonce=crypto.randomUUID();
  }catch(error){$('bookingError').textContent=error.message;$('bookingError').hidden=false;if(!draft){try{form=await call();show();}catch{}}}finally{button.disabled=false;}
});
