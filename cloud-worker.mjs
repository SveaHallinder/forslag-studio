import {customerMailConfigured} from './customer-mail.mjs';
const cloudHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const cloudJSON=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:cloudHeaders});
const cloudError=(message,status=400)=>Object.assign(new Error(message),{status});
const cloudId=value=>typeof value==='string'&&/^[a-z0-9-]{1,70}$/.test(value);
const cloudEmail=value=>typeof value==='string'&&value.length<=160&&/^[^\s@"<>?#&]+@[^\s@"<>?#&]+\.[^\s@"<>?#&]+$/.test(value);
const cloudText=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
const cloudHash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
function cloudUser(request){
  const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
  return id&&id.length<=200&&cloudEmail(email)?{id,email:email.toLowerCase()}:null;
}
async function cloudBody(request,maximum=20_000_000){
  if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')throw cloudError('Använd verktygets formulär för den här begäran.',415);
  if(Number(request.headers.get('Content-Length'))>maximum)throw cloudError('Förslaget är för stort för arbetsytan. Ladda ner en projektkopia eller använd mindre bilder.',413);
  let size=0,text='';const reader=request.body?.getReader(),decoder=new TextDecoder();if(!reader)throw cloudError('Begäran saknar innehåll.');
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>maximum)throw cloudError('Begäran är för stor. Ditt utkast finns kvar.',413);text+=decoder.decode(part.value,{stream:true});}}finally{await reader.cancel();}
  try{const data=JSON.parse(text+decoder.decode());if(!data||typeof data!=='object'||Array.isArray(data))throw 0;return data;}catch{throw cloudError('Begäran innehåller ogiltig JSON.');}
}
async function cloudMember(db,workspace,user,owner=false){
  if(!cloudId(workspace))throw cloudError('Välj en giltig arbetsyta.');
  const member=await db.prepare('SELECT role FROM studio_members WHERE workspace_id=? AND user_id=?').bind(workspace,user.id).first();
  if(!member||(owner&&member.role!=='owner'))throw cloudError('Du saknar åtkomst till arbetsytan eller den här ändringen.',403);return member;
}
const cloudRows=async stmt=>(await stmt.all()).results;
const changed=result=>Number(result.meta?.changes||0)>0;
export {cloudJSON,cloudError,cloudId,cloudEmail,cloudText,cloudHash,cloudUser,cloudBody,cloudMember,cloudRows,changed};
export async function handleCloud(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/cloud/')&&!path.startsWith('/api/request/'))return null;
  const publicRoute=path.startsWith('/api/request/'),user=cloudUser(request),db=env.DB;
  try{
    if(path==='/api/cloud/session'&&request.method==='GET'){
      const workspaces=db&&user?await cloudRows(db.prepare('SELECT w.id,w.name,m.role FROM studio_workspaces w JOIN studio_members m ON m.workspace_id=w.id WHERE m.user_id=? ORDER BY w.created_at DESC').bind(user.id)):[];
      return cloudJSON({user,available:!!db,local:!!env.LOCAL_IDENTITY,workspaces});
    }
    if(!db)throw cloudError('Arbetsytans databas är inte ansluten. Dina lokala förslag finns kvar.',503);
    if(!publicRoute&&!user)throw cloudError('Logga in för att använda arbetsytan. Ditt lokala utkast finns kvar.',401);
    if(!['GET','POST'].includes(request.method))throw cloudError('Metoden stöds inte.',405);
    if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)throw cloudError('Öppna formuläret på den här webbplatsen och försök igen.',403);
    const data=request.method==='POST'?await cloudBody(request,publicRoute?12_000:20_000_000):Object.fromEntries(url.searchParams);
    const now=new Date().toISOString();
    if(publicRoute){
      const formId=path.split('/').at(-1);if(!cloudId(formId))throw cloudError('Formuläret hittades inte.',404);
      const form=await db.prepare('SELECT f.* FROM studio_forms f JOIN studio_projects p ON p.workspace_id=f.workspace_id AND p.id=f.project_id WHERE f.id=? AND f.active=1 AND p.archived=0').bind(formId).first();
      if(!form)throw cloudError('Det här formuläret är stängt. Kontakta företaget via dess övriga kontaktvägar.',404);
      if(request.method==='GET')return cloudJSON({title:form.title,accent:form.accent,kind:form.kind});
      if(data.website)throw cloudError('Förfrågan kunde inte skickas. Försök utan autofyllning.');
      const name=cloudText(data.name,100),message=cloudText(data.message,4000),email=cloudText(data.email,160).toLowerCase(),visit=cloudText(data.visitAt,20);
      if(!name||!message||!cloudEmail(email)||!cloudId(data.nonce))throw cloudError('Fyll i namn, giltig mejladress och meddelande.');
      if(visit&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(visit))throw cloudError('Välj ett giltigt datum och klockslag.');
      const hash=await cloudHash(formId+':'+(request.headers.get('CF-Connecting-IP')||'local-preview'));
      const old=await db.prepare('SELECT id FROM studio_requests WHERE form_id=? AND nonce=?').bind(formId,data.nonce).first();if(old)return cloudJSON({accepted:true});
      const cutoff=new Date(Date.now()-600_000).toISOString(),hour=new Date(Date.now()-3_600_000).toISOString();
      const result=await db.prepare('INSERT OR IGNORE INTO studio_requests(id,form_id,nonce,visitor_hash,name,email,message,visit_at,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM studio_requests WHERE form_id=? AND visitor_hash=? AND created_at>?)<5 AND (SELECT COUNT(*) FROM studio_requests WHERE form_id=? AND created_at>?)<100').bind(crypto.randomUUID(),formId,data.nonce,hash,name,email,message,form.kind==='booking'?visit:'',now,formId,hash,cutoff,formId,hour).run();
      if(!changed(result)){if(await db.prepare('SELECT id FROM studio_requests WHERE form_id=? AND nonce=?').bind(formId,data.nonce).first())return cloudJSON({accepted:true});throw cloudError('Flera förfrågningar har skickats nyligen. Vänta tio minuter och försök igen.',429);}
      console.info('[customer request] Accepted',form.kind);return cloudJSON({accepted:true},201);
    }
    if(path==='/api/cloud/workspace'&&request.method==='POST'){
      const name=cloudText(data.name,80);if(!name)throw cloudError('Ge arbetsytan ett namn.');
      const count=await db.prepare('SELECT COUNT(*) AS count FROM studio_members WHERE user_id=? AND role=?').bind(user.id,'owner').first();if(count.count>=20)throw cloudError('Du har redan tjugo arbetsytor. Använd en befintlig arbetsyta.');
      const id=crypto.randomUUID();await db.batch([db.prepare('INSERT INTO studio_workspaces(id,name,created_at) VALUES(?,?,?)').bind(id,name,now),db.prepare('INSERT INTO studio_members(workspace_id,user_id,email,role) VALUES(?,?,?,?)').bind(id,user.id,user.email,'owner')]);
      console.info('[studio cloud] Workspace created');return cloudJSON({id},201);
    }
    if(path==='/api/cloud/join'&&request.method==='POST'){
      if(!/^[a-z0-9-]{36}$/i.test(data.token||''))throw cloudError('Inbjudningslänken är ogiltig.');
      const hash=await cloudHash(data.token),invite=await db.prepare('SELECT * FROM studio_invites WHERE token_hash=? AND email=? AND expires_at>? AND used_at IS NULL').bind(hash,user.email,now).first();
      if(!invite)throw cloudError('Inbjudan har gått ut, använts eller gäller en annan mejladress.',403);
      await db.batch([db.prepare('INSERT OR IGNORE INTO studio_members(workspace_id,user_id,email,role) SELECT workspace_id,?,?,? FROM studio_invites WHERE token_hash=? AND email=? AND expires_at>? AND used_at IS NULL').bind(user.id,user.email,'member',hash,user.email,now),db.prepare('UPDATE studio_invites SET used_at=? WHERE token_hash=? AND email=? AND used_at IS NULL').bind(now,hash,user.email)]);
      console.info('[studio cloud] Invitation accepted');return cloudJSON({workspace:invite.workspace_id});
    }
    const workspace=data.workspace;await cloudMember(db,workspace,user,['/api/cloud/invite','/api/cloud/remove-member'].includes(path));
    if(path==='/api/cloud/invite'&&request.method==='POST'){
      const email=cloudText(data.email,160).toLowerCase();if(!cloudEmail(email))throw cloudError('Ange kollegans giltiga mejladress.');
      const token=crypto.randomUUID();await db.prepare('INSERT INTO studio_invites(token_hash,workspace_id,email,expires_at) VALUES(?,?,?,?)').bind(await cloudHash(token),workspace,email,new Date(Date.now()+7*86400000).toISOString()).run();
      return cloudJSON({url:url.origin+'/?invite='+token},201);
    }
    if(path==='/api/cloud/members'&&request.method==='GET')return cloudJSON(await cloudRows(db.prepare('SELECT user_id,email,role FROM studio_members WHERE workspace_id=? ORDER BY role,email').bind(workspace)));
    if(path==='/api/cloud/remove-member'&&request.method==='POST'){
      await db.batch([db.prepare('UPDATE studio_invites SET used_at=? WHERE workspace_id=? AND email IN (SELECT email FROM studio_members WHERE workspace_id=? AND user_id=? AND role=?)').bind(now,workspace,workspace,data.userId,'member'),db.prepare('DELETE FROM studio_members WHERE workspace_id=? AND user_id=? AND role=?').bind(workspace,data.userId,'member')]);return cloudJSON({removed:true});
    }
    if(path==='/api/cloud/projects'&&request.method==='GET')return cloudJSON(await cloudRows(db.prepare('SELECT id,name,updated_at AS updatedAt,revision FROM studio_projects WHERE workspace_id=? AND archived=? ORDER BY updated_at DESC LIMIT 500').bind(workspace,data.archived==='1'?1:0)));
    if(path==='/api/cloud/project'&&request.method==='GET'){
      const row=await db.prepare('SELECT data,revision FROM studio_projects WHERE workspace_id=? AND id=? AND archived=0').bind(workspace,data.id).first();if(!row)throw cloudError('Projektet finns inte eller är arkiverat i arbetsytan.',404);
      return cloudJSON({project:JSON.parse(row.data),revision:row.revision});
    }
    if(path==='/api/cloud/save'&&request.method==='POST'){
      if(!cloudId(data.id)||!Number.isSafeInteger(data.revision)||data.revision<0||!data.project||typeof data.project!=='object'||Array.isArray(data.project))throw cloudError('Projektets id eller version är ogiltig. Öppna projektet igen.');
      const name=cloudText(data.project.name,100);if(!name)throw cloudError('Fyll i företagsnamnet.');
      // Live booking configuration is server-owned; ordinary draft saves cannot
      // replace it, erase it or activate unvalidated times.
      const prior=await db.prepare('SELECT data FROM studio_projects WHERE workspace_id=? AND id=?').bind(workspace,data.id).first();
      const {bookingConfig,...draft}=data.project,live=prior?JSON.parse(prior.data).bookingConfig:null;
      const project=JSON.stringify({...draft,id:data.id,name,...(live?{bookingConfig:live}:{})});
      if(new TextEncoder().encode(project).length>1_800_000)throw cloudError('Förslaget är för stort för molnsparning (max 1,8 MB). Använd färre eller mindre uppladdade bilder, eller behåll projektet lokalt och ladda ner en projektkopia. Ditt utkast finns kvar.',413);
      const result=data.revision===0?
        await db.prepare('INSERT OR IGNORE INTO studio_projects(workspace_id,id,name,data,updated_at) VALUES(?,?,?,?,?)').bind(workspace,data.id,name,project,now).run():
        await db.prepare('UPDATE studio_projects SET name=?,data=?,updated_at=?,revision=revision+1 WHERE workspace_id=? AND id=? AND revision=? AND archived=0').bind(name,project,now,workspace,data.id,data.revision).run();
      if(!changed(result))throw cloudError('En annan sparning eller arkivering har ändrat projektet. Ditt utkast finns kvar. Ladda ner en projektkopia, öppna den senaste versionen och för över dina ändringar.',409);
      console.info('[studio cloud] Project saved');return cloudJSON({id:data.id,revision:data.revision+1});
    }
    if(path==='/api/cloud/move'&&request.method==='POST'){
      if(!cloudId(data.id)||typeof data.archived!=='boolean')throw cloudError('Projektet kan inte flyttas.');
      // A library action may not have opened the project. An explicitly supplied
      // revision must match; otherwise change only the archive state, never data.
      const row=await db.prepare('SELECT revision FROM studio_projects WHERE workspace_id=? AND id=?').bind(workspace,data.id).first();if(!row)throw cloudError('Projektet finns inte.',404);
      const revision=data.revision??row.revision;
      const result=await db.prepare('UPDATE studio_projects SET archived=?,revision=revision+1,updated_at=? WHERE workspace_id=? AND id=? AND revision=? AND archived=?').bind(data.archived?1:0,now,workspace,data.id,revision,data.archived?0:1).run();
      if(!changed(result))throw cloudError('Projektet har ändrats. Uppdatera projektlistan innan du flyttar det.',409);return cloudJSON({id:data.id,revision:revision+1});
    }
    if(path==='/api/cloud/form'&&request.method==='POST'){
      const project=await db.prepare('SELECT name,data FROM studio_projects WHERE workspace_id=? AND id=? AND archived=0').bind(workspace,data.projectId).first();if(!project)throw cloudError('Spara förslaget i arbetsytan innan du aktiverar formuläret.',404);
      if(data.active===false){await db.prepare('UPDATE studio_forms SET active=0 WHERE workspace_id=? AND project_id=?').bind(workspace,data.projectId).run();return cloudJSON({closed:true});}
      if(!['contact','booking'].includes(data.kind))throw cloudError('Välj en typ av förfrågan.');
      const p=JSON.parse(project.data),accent=/^#[a-f0-9]{6}$/i.test(p.accent)?p.accent:'#26382b',id=crypto.randomUUID();
      await db.prepare('INSERT INTO studio_forms(id,workspace_id,project_id,title,accent,kind,active) VALUES(?,?,?,?,?,?,1) ON CONFLICT(workspace_id,project_id) DO UPDATE SET title=excluded.title,accent=excluded.accent,kind=excluded.kind,active=1').bind(id,workspace,data.projectId,project.name,accent,data.kind).run();
      const form=await db.prepare('SELECT id FROM studio_forms WHERE workspace_id=? AND project_id=?').bind(workspace,data.projectId).first();return cloudJSON({url:url.origin+'/contact.html?form='+form.id,kind:data.kind});
    }
    if(path==='/api/cloud/inbox'&&request.method==='GET')return cloudJSON(await cloudRows(db.prepare("SELECT r.id,r.name,r.email,r.message,r.visit_at,r.state,r.created_at,f.title,f.kind,b.id AS reservation_id,b.state AS reservation_state,b.starts_at,b.ends_at,b.time_zone,(SELECT j.state FROM studio_email_jobs j WHERE j.reservation_id=b.id AND j.audience='customer') AS email_state,? AS email_configured,(SELECT j.error FROM studio_email_jobs j WHERE j.reservation_id=b.id AND j.audience='customer') AS email_error FROM studio_requests r JOIN studio_forms f ON f.id=r.form_id LEFT JOIN studio_reservations b ON b.request_id=r.id WHERE f.workspace_id=? ORDER BY r.created_at DESC LIMIT 100").bind(customerMailConfigured(env)?1:0,workspace)));
    if(path==='/api/cloud/message-state'&&request.method==='POST'){
      if(!['new','read'].includes(data.state))throw cloudError('Välj en giltig meddelandestatus.');
      const result=await db.prepare('UPDATE studio_requests SET state=? WHERE id=? AND form_id IN (SELECT id FROM studio_forms WHERE workspace_id=?)').bind(data.state,data.id,workspace).run();if(!changed(result))throw cloudError('Förfrågan finns inte i arbetsytan.',404);return cloudJSON({updated:true});
    }
    throw cloudError('Funktionen hittades inte.',404);
  }catch(error){console.warn(publicRoute?'[customer request]':'[studio cloud]',path,error.status||500,error.name);return cloudJSON({error:error.status?error.message:'Servern kunde inte slutföra begäran. Försök igen; ditt utkast finns kvar.'},error.status||500);}
}
