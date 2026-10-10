import {normalizeProject} from './render.mjs';
import {selectBrandLogo} from './branding.mjs';
import {importQualityIssues} from './import-quality.mjs';

// Check only assets that the customer will actually see, never every image on
// the source website. Gallery ownership is retained when repairing an import.
export function launchAssets(raw) {
  const project=normalizeProject(raw),assets=new Map();
  const add=(url,role,pageIndex,label)=>{if(!url)return;if(!assets.has(url))assets.set(url,{url,uses:[]});assets.get(url).uses.push({role,pageIndex,label});};
  for(const [index,page] of [project,...(project.pages||[])].entries()){
    const pageIndex=index-1;
    add(selectBrandLogo({...page,logo:page.logo||project.logo,branding:project.branding}),'logo',pageIndex,'Logotyp');
    add(page.hero,'hero',pageIndex,'Huvudbild');
    for(const item of page.heroGallery||[])add(item.url,'gallery',pageIndex,item.label||'Huvudgalleri');
    for(const card of page.cards){add(card.image,'card',pageIndex,card.title||'Innehållsbild');for(const item of card.gallery||[])add(item.url,'gallery',pageIndex,card.title||'Bildgalleri');}
  }
  return [...assets.values()];
}
export function launchSignature(raw) {
  const project=normalizeProject(raw);
  const visible=({id,original,images,warnings,importedAt,pages,...content})=>content;
  return JSON.stringify([visible(project),...(project.pages||[]).map(visible)]);
}
export function launchReportCurrent(project,report,now=Date.now()) {return !!report&&report.signature===launchSignature(project)&&now-report.checkedAt>=0&&now-report.checkedAt<=300000&&!report.checks.some(check=>check.blocking&&!check.ok);}
export async function checkLaunchAssets(raw,probe,{maximum=64,signal}={}) {
  const assets=launchAssets(raw),results=new Map();let cursor=0;
  const chosen=assets.slice(0,maximum);
  await Promise.all(Array.from({length:Math.min(3,chosen.length)},async()=>{
    while(cursor<chosen.length){
      const asset=chosen[cursor++];
      try{if(signal?.aborted)throw new Error('Kontrollen avbröts.');const result=await probe(asset.url,signal);if(!result||!Number.isFinite(result.width)||!Number.isFinite(result.height)||result.width<1||result.height<1)throw new Error('Bilden saknar läsbara mått.');results.set(asset.url,{...result,ok:true});}
      catch(error){results.set(asset.url,{ok:false,reason:error.message||'Bilden kunde inte kontrolleras.'});}
    }
  }));
  const checks=assets.flatMap(asset=>{
    const result=results.get(asset.url),use=asset.uses.find(use=>use.role!=='gallery')||asset.uses[0];
    const base={id:'asset',url:asset.url,label:use.label,pageIndex:use.pageIndex,field:'imageUpload',tab:'images',blocking:true};
    if(!result)return [{...base,ok:false,help:'Förslaget har fler än '+maximum+' valda bilder. Kontrollen är ofullständig; dela upp förslaget eller minska antalet bilder.'}];
    if(!result.ok)return [{...base,ok:false,help:'Bilden kunde inte hämtas eller avkodas. Byt den eller ladda upp en egen kopia. '+result.reason}];
    const small=!result.vector&&asset.uses.some(use=>use.role==='hero'&&result.width<800||use.role==='card'&&Math.max(result.width,result.height)<400||use.role==='logo'&&Math.max(result.width,result.height)<80);
    return [{...base,ok:!small,blocking:false,help:small?`Bilden är ${result.width} × ${result.height} px. Välj en större originalbild för en skarpare kunddemo.`:''}];
  });
  return {checks,results,checked:results.size,total:assets.length,signature:launchSignature(raw)};
}
export function repairImportedImages(raw,results) {
  const project=structuredClone(raw);let repaired=0;
  for(const page of [project,...(project.pages||[])])for(const owner of [page,...(page.cards||[])]){
    const primary=owner===page?'hero':'image',gallery=owner===page?'heroGallery':'gallery';
    if(!owner[primary]||results.get(owner[primary])?.ok!==false||!Array.isArray(owner[gallery]))continue;
    // Never replace a portrait/product with a random photo from another block.
    const replacement=owner[gallery].find(item=>results.get(item.url)?.ok===true);
    if(!replacement)continue;
    owner[primary]=replacement.url;owner[gallery]=[replacement,...owner[gallery].filter(item=>item!==replacement&&results.get(item.url)?.ok!==false)];repaired++;
  }
  if(repaired)project.warnings=[`Automatiken ersatte ${repaired} otillgänglig(a) huvudbild(er) med läsbara bilder ur samma bildgrupp.`,...(project.warnings||[])];
  return {project,repaired};
}
export function importLaunchChecks(project) {
  const checks=importQualityIssues(project).map(issue=>({id:'import',label:(issue.pageIndex<0?'Startsidan':issue.name)+': innehållsblock',ok:false,blocking:false,field:'description',tab:'content',pageIndex:issue.pageIndex,help:'Introduktionen har '+issue.characters+' tecken men inga sektioner. Hämta om med webbläsare eller dela upp texten.'}));
  for(const [index,page] of [project,...(project.pages||[])].entries())for(const warning of page.warnings||[]){
    if(!/inte.*(?:bedömas|kontrolleras)|osäkr|varierar|ingen säker|inte.*fontfil|Flera.*(?:logo|färg)|delvis identifierad|Kunde inte hämta/i.test(warning))continue;
    checks.push({id:'branding',label:(index?'Sida '+(index+1)+': ':'')+'Varumärkesunderlaget behöver kompletteras',ok:false,blocking:false,field:/logo/i.test(warning)?'logoUpload':/font|typsnitt/i.test(warning)?'headingFont':'accent',tab:/logo/i.test(warning)?'images':'content',pageIndex:index-1,help:warning});
  }
  return checks;
}
