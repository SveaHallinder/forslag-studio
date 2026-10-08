const mailAddress=value=>typeof value==='string'&&value.length<=160&&/^[^\s@"<>?#&]+@[^\s@"<>?#&]+\.[^\s@"<>?#&]+$/.test(value);
export function customerMailConfigured(env={}) {
  return env.RESEND_PLAN==='free'&&typeof env.RESEND_API_KEY==='string'&&/^re_[a-zA-Z0-9_-]{20,150}$/.test(env.RESEND_API_KEY)&&mailAddress(env.RESEND_FROM);
}
export function bookingMail({title,name,email,reference,startsAt,timeZone,duration,teamEmail}) {
  if(!mailAddress(email)||teamEmail&&!mailAddress(teamEmail))throw new Error('Bokningens mejladress är ogiltig.');
  const when=new Intl.DateTimeFormat('sv-SE',{timeZone,dateStyle:'full',timeStyle:'short'}).format(new Date(startsAt));
  const company=String(title||'Ditt företag').replace(/[\r\n]/g,' ').slice(0,100),person=String(name||'').slice(0,100);
  const details=`${when}\nFöretagets tidszon: ${timeZone}\nBesökslängd: ${duration} minuter\nBokningsnummer: ${reference}`;
  const customer={to:email,subject:`Din bokning hos ${company}`,text:`Hej ${person}!\n\nDin bokning hos ${company} är bekräftad.\n\n${details}\n\n${teamEmail?'Kontakta företaget på '+teamEmail+' om du behöver ändra bokningen.':'Kontakta företaget via dess kontaktuppgifter om du behöver ändra bokningen.'}`,...(teamEmail?{reply_to:teamEmail}:{})};
  const team=teamEmail?{to:teamEmail,subject:`Ny bokning hos ${company}`,text:`En bokning har bekräftats.\n\n${details}\n\nNamn: ${person}\nMejl: ${email}`,reply_to:email}:null;
  return {customer,team};
}
export async function sendCustomerMail(payload,idempotencyKey,env={},requestFetch=fetch) {
  if(!customerMailConfigured(env))return {state:'unconnected',error:'Anslut Resend Free och en verifierad avsändaradress för att skicka bekräftelser.'};
  const from=payload?.from||env.RESEND_FROM;
  if(!payload||!mailAddress(from)||!mailAddress(payload.to)||payload.reply_to&&!mailAddress(payload.reply_to)||typeof payload.subject!=='string'||payload.subject.length>160||/[\r\n]/.test(payload.subject)||typeof payload.text!=='string'||payload.text.length>8000||!/^[-a-zA-Z0-9]{1,200}$/.test(idempotencyKey||''))return {state:'failed',error:'Bekräftelsens innehåll är ogiltigt. Bokningen finns kvar i inkorgen.'};
  try{
    const response=await requestFetch('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify({from,to:[payload.to],subject:payload.subject,text:payload.text,...(payload.reply_to?{reply_to:payload.reply_to}:{})})});
    let data;try{data=await response.json();}catch{}
    console.info('[customer email] Provider response',response.status);
    if(response.ok&&typeof data?.id==='string'&&data.id.length<=200)return {state:'sent',providerId:data.id};
    if(response.ok)return {state:'unknown',error:'Mejltjänsten gav inget bekräftelsenummer. Kontrollera leveransen innan du skickar igen.'};
    if([408,409,429].includes(response.status)||response.status>=500)return {state:'retry',error:'Mejltjänsten är tillfälligt upptagen. Bekräftelsen ligger kvar i kön.'};
    return {state:'failed',error:[401,403].includes(response.status)?'Mejltjänstens nyckel eller avsändare behöver kontrolleras. Bokningen är sparad.':'Mejltjänsten nekade bekräftelsen. Kontrollera avsändare och mottagare; bokningen är sparad.'};
  }catch(error){console.warn('[customer email] Provider unavailable',error.name);return {state:'retry',error:'Mejltjänsten svarade inte. Bekräftelsen ligger kvar i kön.'};}
}
