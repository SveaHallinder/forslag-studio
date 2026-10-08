const $=id=>document.getElementById(id),id=new URL(location.href).searchParams.get('form');let nonce=crypto.randomUUID();
async function send(body){
  const response=await fetch('/api/request/'+encodeURIComponent(id||''),{method:body?'POST':'GET',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Förfrågan kunde inte skickas. Försök igen.');return data;
}
try{
  const form=await send();document.title=form.title+' – förfrågan';$('requestTitle').textContent=form.title;
  $('requestIntro').textContent=form.kind==='booking'?'Berätta när du vill komma. Mottagaren återkommer med besked.':'Berätta vad du har i tankarna. Vi börjar med en förfrågan.';
  $('requestVisit').hidden=form.kind!=='booking';$('requestForm').hidden=false;$('requestState').hidden=true;
  document.documentElement.style.setProperty('--form-accent',form.accent);
  const rgb=[1,3,5].map(i=>parseInt(form.accent.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  document.documentElement.style.setProperty('--form-ink',.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.179?'#152015':'#ffffff');
}catch(error){$('requestIntro').textContent='Formuläret är inte tillgängligt.';$('requestState').textContent=error.message;}
$('requestForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;$('requestError').hidden=true;
  try{
    await send({nonce,name:$('requestName').value,email:$('requestEmail').value,message:$('requestMessage').value,visitAt:$('visitAt').value,website:event.target.elements.website.value});
    $('requestForm').hidden=true;$('requestState').hidden=false;$('requestState').innerHTML='<h2>Tack, vi har din förfrågan.</h2><p>Den är sparad i projektets inkorg. Mottagaren kan svara på mejladressen du angav.</p><p>Eventuell bokning bekräftas separat.</p>';nonce=crypto.randomUUID();
  }catch(error){$('requestError').textContent=error.message;$('requestError').hidden=false;}finally{button.disabled=false;}
});
