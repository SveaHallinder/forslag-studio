import {cloudJSON,cloudError,cloudId,cloudEmail,cloudText,cloudHash,cloudUser,cloudBody,cloudMember,cloudRows,changed} from './cloud-worker.mjs';
import {validateCustomerSetup} from './public/booking-settings.mjs';
import {customerMailConfigured,bookingMail,sendCustomerMail} from './customer-mail.mjs';
import {publicURL} from './worker.mjs';
import {socialProfileURL,extractSocialProfile} from './public/social-content.mjs';

const flowISO=milliseconds=>new Date(milliseconds).toISOString();
export function browserAgentConfigured(env={}) {return !!env.DB&&typeof env.BROWSER_AGENT_TOKEN==='string'&&/^[A-Za-z0-9_-]{32,200}$/.test(env.BROWSER_AGENT_TOKEN);}
async function agentReady(env,now=Date.now()) {
  if(!browserAgentConfigured(env))return false;
  const row=await env.DB.prepare("SELECT updated_at FROM studio_browser_jobs WHERE id='agent-heartbeat' AND state='heartbeat'").first();
  return !!row&&Date.parse(row.updated_at)>now-60_000;
}
export async function pilotStatus(env={}) {
  return {reservations:env.DB?'ready':'unconnected',agent:browserAgentConfigured(env)?await agentReady(env)?'ready':'offline':'unconnected',email:customerMailConfigured(env)?'configured':'unconnected'};
}
async function activeBooking(db,id) {
  if(!cloudId(id))throw cloudError('Bokningssidan hittades inte.',404);
  const row=await db.prepare("SELECT f.*,p.data FROM studio_forms f JOIN studio_projects p ON p.workspace_id=f.workspace_id AND p.id=f.project_id WHERE f.id=? AND f.active=1 AND f.kind='booking' AND p.archived=0").bind(id).first();
  const config=row&&JSON.parse(row.data).bookingConfig;
  if(!config)throw cloudError('Den här bokningssidan är stängd. Kontakta företaget via dess övriga kontaktvägar.',404);
  validateCustomerSetup(config.setup);return {...row,config};
}
async function bookingReceipt(db,formId,nonce,env) {
  const row=await db.prepare("SELECT b.id,b.state,b.starts_at,r.email,r.name,(SELECT j.state FROM studio_email_jobs j WHERE j.reservation_id=b.id AND j.audience='customer') AS email_state FROM studio_reservations b JOIN studio_requests r ON r.id=b.request_id WHERE r.form_id=? AND r.nonce=?").bind(formId,nonce).first();
  if(!row)return null;
  return {row,body:{confirmed:row.state==='confirmed',reference:row.id,email:row.email_state==='sent'?'sent':customerMailConfigured(env)&&['pending','sending','retry'].includes(row.email_state)?'queued':'unconnected'}};
}

export async function processCustomerMail(env,{now=Date.now(),limit=2,requestFetch=env.MAIL_FETCH||fetch}={}) {
  if(!env.DB||!customerMailConfigured(env))return {processed:0};
  const db=env.DB,stamp=flowISO(now),day=stamp.slice(0,10),month=stamp.slice(0,7),expired=flowISO(now-23*3_600_000);
  // Never retry an uncertain send beyond the provider's 24-hour idempotency
  // window, including after a crash or an exhausted daily quota.
  await db.prepare("UPDATE studio_email_jobs SET state='unknown',error='Leveransen är osäker. Kontrollera mejltjänsten innan du skickar igen.',lease_token=NULL,lease_until=NULL WHERE state IN ('pending','retry','sending') AND first_attempt_at IS NOT NULL AND (first_attempt_at<? OR attempts>=5) AND (lease_until IS NULL OR lease_until<?)").bind(expired,stamp).run();
  let processed=0;
  for(let index=0;index<Math.min(2,limit);index++){
    const lease=crypto.randomUUID();
    const claim=await db.prepare("UPDATE studio_email_jobs SET state='sending',payload=json_set(payload,'$.from',COALESCE(json_extract(payload,'$.from'),?)),attempts=attempts+1,attempt_log=json_insert(attempt_log,'$[#]',?),first_attempt_at=COALESCE(first_attempt_at,?),lease_token=?,lease_until=? WHERE id=(SELECT j.id FROM studio_email_jobs j JOIN studio_reservations b ON b.id=j.reservation_id WHERE b.state='confirmed' AND ((j.state IN ('pending','retry') AND j.next_attempt_at<=?) OR (j.state='sending' AND j.lease_until<?)) AND (j.first_attempt_at IS NULL OR j.first_attempt_at>=?) AND j.attempts<5 ORDER BY j.created_at,j.id LIMIT 1) AND (SELECT COUNT(*) FROM studio_email_jobs q,json_each(q.attempt_log) a WHERE substr(a.value,1,10)=?)<100 AND (SELECT COUNT(*) FROM studio_email_jobs q,json_each(q.attempt_log) a WHERE substr(a.value,1,7)=?)<3000").bind(env.RESEND_FROM,stamp,stamp,lease,flowISO(now+120_000),stamp,stamp,expired,day,month).run();
    if(!changed(claim))break;
    const job=await db.prepare('SELECT * FROM studio_email_jobs WHERE lease_token=?').bind(lease).first();
    const result=await sendCustomerMail(JSON.parse(job.payload),'booking-'+job.id,env,requestFetch);
    const state=result.state==='unconnected'?'retry':result.state,next=flowISO(now+Math.min(3600,60*2**job.attempts)*1000);
    await db.prepare('UPDATE studio_email_jobs SET state=?,provider_id=?,error=?,next_attempt_at=?,sent_at=?,lease_token=NULL,lease_until=NULL WHERE id=? AND lease_token=?').bind(state,result.providerId||null,result.error||'',next,state==='sent'?stamp:null,job.id,lease).run();
    console.info('[customer email] Queue result',state);processed++;
  }
  return {processed};
}

export async function queueBrowserPage(request,value,env,mode='page') {
  const user=cloudUser(request),db=env.DB,target=publicURL(value).href;
  if(!user)throw cloudError('Logga in med ChatGPT för att använda onlineimporten med Macen. Ditt utkast finns kvar.',401);
  if(!await agentReady(env))throw cloudError('Import-Macen är offline. Starta Mac-agenten och försök igen, eller importera ett sparat underlag.',503);
  const now=Date.now(),stamp=flowISO(now),id=crypto.randomUUID();
  const inserted=await db.prepare("INSERT INTO studio_browser_jobs(id,kind,user_id,mode,url,state,created_at,updated_at,expires_at) SELECT ?,'render',?,?,?,'pending',?,?,? WHERE (SELECT COUNT(*) FROM studio_browser_jobs WHERE kind='render' AND state IN ('pending','running') AND expires_at>?)<10 AND (SELECT COUNT(*) FROM studio_browser_jobs WHERE user_id=? AND kind='render' AND created_at>?)<30 AND (SELECT COUNT(*) FROM studio_browser_jobs WHERE user_id=? AND kind='render' AND created_at>?)<3").bind(id,user.id,mode,target,stamp,stamp,flowISO(now+120_000),stamp,user.id,flowISO(now-86400000),user.id,flowISO(now-60000)).run();
  if(!changed(inserted))throw cloudError('Importkön är upptagen eller din importgräns har nåtts. Vänta en stund; ditt utkast finns kvar.',429);
  console.info('[online browser import] Job queued');return {jobId:id};
}
async function authorizeAgent(request,env) {
  const header=request.headers.get('Authorization')||'',provided=header.startsWith('Bearer ')?header.slice(7):'';
  if(!browserAgentConfigured(env)||!/^[-A-Za-z0-9_]{32,200}$/.test(provided))throw cloudError('Mac-agentens nyckel saknas eller är ogiltig.',401);
  const a=await cloudHash(provided),b=await cloudHash(env.BROWSER_AGENT_TOKEN);let different=0;for(let index=0;index<a.length;index++)different|=a.charCodeAt(index)^b.charCodeAt(index);
  if(different)throw cloudError('Mac-agentens nyckel är ogiltig.',401);
}
async function agentAPI(request,env,path,ctx) {
  await authorizeAgent(request,env);if(request.method!=='POST')throw cloudError('Använd Mac-agentens POST-begäran.',405);
  const data=await cloudBody(request,path==='/api/agent/result'?8_000_000:4096),db=env.DB,now=Date.now(),stamp=flowISO(now);
  if(path==='/api/agent/poll'){
    if(data.ready!==true)throw cloudError('Chromium måste vara redo innan Macen hämtar importjobb.',503);
    await db.prepare("INSERT INTO studio_browser_jobs(id,kind,user_id,state,created_at,updated_at,expires_at) VALUES('agent-heartbeat','agent','','heartbeat',?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at,expires_at=excluded.expires_at").bind(stamp,stamp,flowISO(now+60000)).run();
    await db.batch([
      db.prepare("DELETE FROM studio_browser_jobs WHERE kind='render' AND created_at<?").bind(flowISO(now-86400000)),
      db.prepare("UPDATE studio_browser_jobs SET result=NULL,state=CASE WHEN state='complete' THEN 'complete' ELSE 'failed' END,error='Importjobbet har gått ut. Starta en ny import.' WHERE kind='render' AND expires_at<? AND result IS NOT NULL OR kind='render' AND expires_at<? AND state IN ('pending','running')").bind(stamp,stamp)
    ]);
    const mail=processCustomerMail(env).catch(error=>console.warn('[customer email] Queue unavailable',error.name));if(ctx?.waitUntil)ctx.waitUntil(mail);else await mail;
    const lease=crypto.randomUUID();
    await db.prepare("UPDATE studio_browser_jobs SET state='running',lease_token=?,lease_until=?,updated_at=? WHERE id=(SELECT id FROM studio_browser_jobs WHERE kind='render' AND expires_at>? AND (state='pending' OR state='running' AND lease_until<?) ORDER BY created_at LIMIT 1)").bind(lease,flowISO(now+45_000),stamp,stamp,stamp).run();
    const job=await db.prepare("SELECT id,url,lease_token FROM studio_browser_jobs WHERE lease_token=? AND kind='render'").bind(lease).first();
    return cloudJSON({job:job?{id:job.id,url:job.url,lease:job.lease_token}:null});
  }
  if(path==='/api/agent/result'){
    if(!cloudId(data.id)||!cloudId(data.lease))throw cloudError('Importjobbets id eller lås är ogiltigt.');
    let result=null,error='';
    if(data.error)error=cloudText(data.error,250);
    else{
      if(typeof data.result?.html!=='string'||!data.result.html.trim()||new TextEncoder().encode(data.result.html).length>2_000_000)throw cloudError('Importresultatet måste vara en läsbar sida under 2 MB.');
      result=JSON.stringify({html:data.result.html,url:publicURL(data.result.url).href,runtimeBrand:data.result.runtimeBrand===true});
      if(new TextEncoder().encode(result).length>1_900_000)throw cloudError('Sidan är för stor för onlinekön (max 1,9 MB). Använd lokal import eller sparat underlag.',413);
    }
    const update=await db.prepare("UPDATE studio_browser_jobs SET state=?,result=?,error=?,updated_at=?,lease_token=NULL,lease_until=NULL WHERE id=? AND lease_token=? AND state='running' AND lease_until>? AND expires_at>?").bind(result?'complete':'failed',result,error,stamp,data.id,data.lease,stamp,stamp).run();
    if(!changed(update))throw cloudError('Importjobbet är avslutat eller låset har gått ut. Resultatet sparades inte.',409);
    console.info('[online browser import] Job completed',result?'complete':'failed');return cloudJSON({accepted:true});
  }
  throw cloudError('Mac-agentens funktion hittades inte.',404);
}

export async function handleCustomerFlows(request,env={},ctx) {
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/booking/')&&!path.startsWith('/api/agent/')&&!path.startsWith('/api/browser-job/')&&!['/api/cloud/booking-config','/api/cloud/reservation-state'].includes(path))return null;
  const db=env.DB;
  try{
    if(!db)throw cloudError('Kundflödets lagring är inte ansluten. Ditt utkast finns kvar.',503);
    if(path.startsWith('/api/agent/'))return await agentAPI(request,env,path,ctx);
    if(!['GET','POST'].includes(request.method))throw cloudError('Metoden stöds inte.',405);
    if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)throw cloudError('Öppna kundflödet på den här webbplatsen och försök igen.',403);
    const now=Date.now(),stamp=flowISO(now),user=cloudUser(request);
    if(path.startsWith('/api/browser-job/')){
      if(request.method!=='GET'||!user)throw cloudError('Logga in för att läsa ditt importjobb.',401);
      const id=path.split('/').at(-1);if(!cloudId(id))throw cloudError('Importjobbet hittades inte.',404);
      const job=await db.prepare("SELECT mode,url,state,result,error,expires_at FROM studio_browser_jobs WHERE id=? AND user_id=? AND kind='render'").bind(id,user.id).first();
      if(!job)throw cloudError('Importjobbet hittades inte.',404);
      if(Date.parse(job.expires_at)<=now)throw cloudError('Importjobbet har gått ut. Starta en ny import.',410);
      if(job.state==='failed')throw cloudError(job.error||'Macen kunde inte läsa sidan. Ditt utkast finns kvar.',502);
      if(job.state!=='complete')return cloudJSON({state:job.state});
      const result=JSON.parse(job.result);
      if(job.mode==='social'){
        let destination;try{destination=socialProfileURL(result.url);}catch{}
        if(!destination||destination.url!==job.url)throw cloudError('Plattformen omdirigerade till en annan profil eller en inloggningssida. Lägg in bio och bilder manuellt.',502);
        return cloudJSON({state:'complete',result:extractSocialProfile(result.html,job.url)});
      }
      return cloudJSON({state:'complete',result});
    }
    const data=request.method==='POST'?await cloudBody(request,12000):{};
    if(path.startsWith('/api/cloud/')){
      if(!user)throw cloudError('Logga in och välj en arbetsyta för att aktivera kundflödet.',401);
      await cloudMember(db,data.workspace,user);
      if(request.method!=='POST')throw cloudError('Använd verktygets aktiveringsknapp.',405);
      if(path==='/api/cloud/reservation-state'){
        if(!cloudId(data.id)||data.state!=='cancelled')throw cloudError('Välj en giltig reservation att avboka.');
        const reservation=await db.prepare('SELECT b.id FROM studio_reservations b JOIN studio_forms f ON f.id=b.form_id WHERE b.id=? AND f.workspace_id=?').bind(data.id,data.workspace).first();if(!reservation)throw cloudError('Reservationen finns inte i arbetsytan.',404);
        await db.batch([db.prepare("UPDATE studio_reservations SET state='cancelled' WHERE id=?").bind(data.id),db.prepare("UPDATE studio_email_jobs SET state='cancelled',error='Bokningen avbokades före utskicket.' WHERE reservation_id=? AND state IN ('pending','retry')").bind(data.id)]);
        console.info('[customer booking] Reservation cancelled');return cloudJSON({cancelled:true});
      }
      const project=await db.prepare('SELECT name,data,revision FROM studio_projects WHERE workspace_id=? AND id=? AND archived=0').bind(data.workspace,data.projectId).first();
      if(!project)throw cloudError('Spara förslaget i arbetsytan innan du aktiverar bokningar.',404);
      let setup;try{setup=validateCustomerSetup(data.setup,{requireSlots:true,now});}catch(error){throw cloudError(error.message);}
      const current=JSON.parse(project.data),bookings=await cloudRows(db.prepare("SELECT b.starts_at,b.ends_at FROM studio_reservations b JOIN studio_forms f ON f.id=b.form_id WHERE f.workspace_id=? AND f.project_id=? AND b.state='confirmed' AND b.ends_at>?").bind(data.workspace,data.projectId,stamp));
      for(const booking of bookings){if(!setup.slots.includes(booking.starts_at)||flowISO(Date.parse(booking.starts_at)+setup.duration*60000)!==booking.ends_at||bookings.filter(b=>b.starts_at===booking.starts_at).length>setup.capacity)throw cloudError('Upplägget skulle ändra en bekräftad bokning. Behåll tillfället och besökslängden, eller avboka först i inkorgen.',409);}
      if(setup.notifyTeam&&!cloudEmail(current.email))throw cloudError('Lägg till företagets giltiga mejladress innan du aktiverar teamaviseringar.');
      const existing=await db.prepare('SELECT id FROM studio_forms WHERE workspace_id=? AND project_id=?').bind(data.workspace,data.projectId).first(),id=existing?.id||crypto.randomUUID();
      const config={id:crypto.randomUUID(),setup,teamEmail:cloudEmail(current.email)?current.email:'',title:project.name,accent:/^#[a-f0-9]{6}$/i.test(current.accent)?current.accent:'#26382b'};
      const form={url:url.origin+'/booking.html?form='+id,kind:'booking'},saved=JSON.stringify({...current,customerSetup:setup,bookingConfig:config,requestForm:form});
      // Check occupied times again inside the same atomic batch as activation.
      // A reservation may have arrived after the editor's initial read.
      const compatible="NOT EXISTS(SELECT 1 FROM studio_reservations b JOIN studio_forms f ON f.id=b.form_id WHERE f.workspace_id=? AND f.project_id=? AND b.state='confirmed' AND b.ends_at>? AND (NOT EXISTS(SELECT 1 FROM json_each(?) s WHERE s.value=b.starts_at) OR b.ends_at<>strftime('%Y-%m-%dT%H:%M:00.000Z',b.starts_at,'+'||?||' minutes') OR (SELECT COUNT(*) FROM studio_reservations c WHERE c.form_id=b.form_id AND c.state='confirmed' AND c.starts_at=b.starts_at)>?))";
      const guard=[data.workspace,data.projectId,stamp,JSON.stringify(setup.slots),setup.duration,setup.capacity];
      const results=await db.batch([
        db.prepare("INSERT INTO studio_forms(id,workspace_id,project_id,title,accent,kind,active) SELECT ?,?,?,?,?,'booking',1 WHERE EXISTS(SELECT 1 FROM studio_projects WHERE workspace_id=? AND id=? AND revision=? AND archived=0) AND "+compatible+" ON CONFLICT(workspace_id,project_id) DO UPDATE SET title=excluded.title,accent=excluded.accent,kind='booking',active=1").bind(id,data.workspace,data.projectId,config.title,config.accent,data.workspace,data.projectId,project.revision,...guard),
        db.prepare('UPDATE studio_projects SET data=?,updated_at=?,revision=revision+1 WHERE workspace_id=? AND id=? AND revision=? AND archived=0 AND '+compatible).bind(saved,stamp,data.workspace,data.projectId,project.revision,...guard)
      ]);
      if(!changed(results[1]))throw cloudError('Projektet ändrades under aktiveringen. Öppna senaste versionen och försök igen.',409);
      console.info('[customer booking] Configuration activated');return cloudJSON({...form,projectId:data.projectId,revision:project.revision+1});
    }
    const form=await activeBooking(db,path.split('/').at(-1)),config=form.config,setup=config.setup;
    if(request.method==='GET'){
      const occupied=await cloudRows(db.prepare("SELECT starts_at,COUNT(*) AS count FROM studio_reservations WHERE form_id=? AND state='confirmed' GROUP BY starts_at").bind(form.id));
      return cloudJSON({title:config.title,accent:config.accent,kind:'booking',setup:{timeZone:setup.timeZone,duration:setup.duration},slots:setup.slots.filter(slot=>Date.parse(slot)>now).map(startsAt=>({startsAt,remaining:Math.max(0,setup.capacity-(occupied.find(b=>b.starts_at===startsAt)?.count||0))})).filter(slot=>slot.remaining>0)});
    }
    const name=cloudText(data.name,100),email=cloudText(data.email,160).toLowerCase(),message=cloudText(data.message,4000);
    if(data.website||!name||!cloudEmail(email)||!cloudId(data.nonce)||!setup.slots.includes(data.startsAt))throw cloudError('Fyll i namn och giltig mejladress och välj ett tillgängligt tillfälle.');
    const previous=await bookingReceipt(db,form.id,data.nonce,env);
    if(previous){if(previous.row.email!==email||previous.row.name!==name||previous.row.starts_at!==data.startsAt)throw cloudError('Bokningsförsöket gäller andra uppgifter. Ladda om bokningssidan.',409);if(!previous.body.confirmed)throw cloudError('Den här bokningen har avbokats. Ladda om för att boka en ny tid.',409);return cloudJSON(previous.body);}
    if(Date.parse(data.startsAt)<=now)throw cloudError('Tillfället har redan börjat. Välj en ny tid.',409);
    const requestId=crypto.randomUUID(),reservationId=crypto.randomUUID(),endsAt=flowISO(Date.parse(data.startsAt)+setup.duration*60000),hash=await cloudHash(form.id+':'+(request.headers.get('CF-Connecting-IP')||'local-preview'));
    const mail=bookingMail({title:config.title,name,email,reference:reservationId,startsAt:data.startsAt,timeZone:setup.timeZone,duration:setup.duration,teamEmail:config.teamEmail});
    const statements=[
      db.prepare("INSERT OR IGNORE INTO studio_requests(id,form_id,nonce,visitor_hash,name,email,message,visit_at,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM studio_forms f JOIN studio_projects p ON p.workspace_id=f.workspace_id AND p.id=f.project_id WHERE f.id=? AND f.active=1 AND f.kind='booking' AND p.archived=0 AND json_extract(p.data,'$.bookingConfig.id')=?) AND (SELECT COUNT(*) FROM studio_reservations WHERE form_id=? AND state='confirmed' AND starts_at=? AND ends_at=?)<? AND NOT EXISTS(SELECT 1 FROM studio_reservations WHERE form_id=? AND state='confirmed' AND starts_at<? AND ends_at>? AND (starts_at<>? OR ends_at<>?)) AND (SELECT COUNT(*) FROM studio_requests WHERE form_id=? AND visitor_hash=? AND created_at>?)<5 AND (SELECT COUNT(*) FROM studio_requests WHERE form_id=? AND created_at>?)<100").bind(requestId,form.id,data.nonce,hash,name,email,message,data.startsAt,stamp,form.id,config.id,form.id,data.startsAt,endsAt,setup.capacity,form.id,endsAt,data.startsAt,data.startsAt,endsAt,form.id,hash,flowISO(now-600000),form.id,flowISO(now-3600000)),
      db.prepare("INSERT INTO studio_reservations(id,form_id,request_id,starts_at,ends_at,time_zone,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM studio_requests WHERE id=?)").bind(reservationId,form.id,requestId,data.startsAt,endsAt,setup.timeZone,stamp,requestId)
    ];
    for(const [audience,payload] of [['customer',mail.customer],['team',setup.notifyTeam?mail.team:null]])if(payload)statements.push(db.prepare("INSERT INTO studio_email_jobs(id,reservation_id,audience,payload,next_attempt_at,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM studio_reservations WHERE id=?)").bind(crypto.randomUUID(),reservationId,audience,JSON.stringify(payload),stamp,stamp,reservationId));
    const results=await db.batch(statements);
    const receipt=await bookingReceipt(db,form.id,data.nonce,env);
    if(!receipt)throw cloudError('Tiden är inte längre tillgänglig, flera försök har gjorts nyligen eller upplägget ändrades. Uppdatera tiderna och försök igen.',409);
    if(receipt.row.email!==email||receipt.row.name!==name||receipt.row.starts_at!==data.startsAt||!receipt.body.confirmed)throw cloudError('Bokningsförsöket ändrades eller bokningen avbokades. Ladda om för att boka en ny tid.',409);
    if(changed(results[0])){console.info('[customer booking] Reservation confirmed');const send=processCustomerMail(env).catch(error=>console.warn('[customer email] Queue unavailable',error.name));if(ctx?.waitUntil)ctx.waitUntil(send);else await send;}
    return cloudJSON((await bookingReceipt(db,form.id,data.nonce,env)).body,changed(results[0])?201:200);
  }catch(error){console.warn(path.startsWith('/api/agent/')||path.startsWith('/api/browser-job/')?'[online browser import]':'[customer booking]',path,error.status||500,error.name);return cloudJSON({error:error.status?error.message:'Kundflödet kunde inte slutföras. Uppdatera och försök igen; ditt utkast finns kvar.'},error.status||500);}
}
