let context={workspace:'',user:null,workspaces:[],available:false,local:false},initialized;
const revisions=new Map();
const revisionKey=id=>'forslag-cloud-revision:'+context.user?.id+':'+context.workspace+':'+id;
function rememberRevision(id,revision){revisions.set(id,revision);try{localStorage.setItem(revisionKey(id),String(revision));}catch{}}
function savedRevision(id){if(revisions.has(id))return revisions.get(id);let revision=0;try{revision=Number(localStorage.getItem(revisionKey(id)));}catch{}return Number.isSafeInteger(revision)&&revision>0?revision:0;}
export function cloudDraftRevision(id){return id?savedRevision(id):0;}
export function restoreCloudDraft(id,revision){if(id&&Number.isSafeInteger(revision)&&revision>=0)revisions.set(id,revision);}
export async function cloudRequest(path,body) {
  const response=await fetch('/api/cloud'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
  let data;try{data=await response.json();}catch{throw new Error('Arbetsytan svarade inte korrekt. Ditt utkast finns kvar.');}
  if(!response.ok)throw Object.assign(new Error(data.error||'Arbetsytan kunde inte läsas. Försök igen.'),{status:response.status});return data;
}
export async function initializeCloud() {
  if(!initialized)initialized=(async()=>{
    const session=await cloudRequest('/session');Object.assign(context,session);
    let saved;try{saved=JSON.parse(localStorage.getItem('forslag-cloud-workspace'));}catch{}
    const requested=new URL(location.href).searchParams.get('workspace');
    const id=requested||(saved?.user===session.user?.id?saved.workspace:'');
    context.workspace=session.workspaces.some(item=>item.id===id)?id:'';return context;
  })().catch(()=>context);return initialized;
}
export function cloudContext(){return context;}
export function selectCloudWorkspace(workspace) {
  if(workspace&&!context.workspaces.some(item=>item.id===workspace))throw new Error('Du är inte medlem i arbetsytan.');
  context.workspace=workspace;revisions.clear();
  localStorage.setItem('forslag-cloud-workspace',JSON.stringify({workspace,user:context.user?.id||''}));
}
export async function refreshCloudSession(){Object.assign(context,await cloudRequest('/session'));return context;}
export async function cloudProjectAPI(path,body) {
  const workspace=context.workspace;let data;
  if(path==='/api/projects'||path==='/api/archived')data=await cloudRequest('/projects?workspace='+workspace+'&archived='+(path==='/api/archived'?'1':'0'));
  else if(path.startsWith('/api/projects/')){
    const id=path.split('/').at(-1),row=await cloudRequest('/project?workspace='+workspace+'&id='+encodeURIComponent(id));rememberRevision(id,row.revision);data=row.project;
  }else if(path==='/api/save'){
    const id=body.id||crypto.randomUUID();data=await cloudRequest('/save',{workspace,id,revision:savedRevision(id),project:{...body,id}});rememberRevision(id,data.revision);
    data.url='/preview.html?workspace='+workspace+'#id='+encodeURIComponent(id);
  }else if(path==='/api/archive'||path==='/api/restore'){
    data=await cloudRequest('/move',{workspace,id:body.id,revision:revisions.get(body.id),archived:path==='/api/archive'});revisions.set(body.id,data.revision);
  }else return null;
  return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
}
