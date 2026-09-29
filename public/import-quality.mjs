// A long imported introduction without sections usually means the page was read
// as one text dump. Keep authored text-only drafts and ordinary landing pages valid.
export function importQualityIssues(project) {
 if(!project||typeof project!=='object'||Array.isArray(project))return [];
 return [project,...(Array.isArray(project.pages)?project.pages.slice(0,5):[])].flatMap((page,index)=>{
  if(!page||typeof page!=='object'||!page.importedAt||!/^https?:\/\//.test(page.source||''))return [];
  const description=String(page.description||'').trim();
  const hasSections=Array.isArray(page.cards)&&page.cards.some(card=>card&&(card.title||card.description||card.image));
  if(description.length<1800||hasSections)return [];
  return [{pageIndex:index-1,name:String(page.name||'Sida '+index),source:page.source,characters:description.length}];
 });
}
