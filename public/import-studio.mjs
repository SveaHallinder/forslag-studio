import {importSavedPage} from './browser-api.mjs';
import {normalizeProject,escapeHTML as e} from './render.mjs';

export function createImportStudio({getProject,getSource,onCreate,notify}) {
  const dialog=document.createElement('dialog');dialog.className='import-files-dialog';dialog.id='importFilesDialog';dialog.setAttribute('aria-labelledby','importFilesTitle');
  dialog.innerHTML=`<form method="dialog"><button class="dialog-close" aria-label="Stäng import">×</button></form><p class="overline">EN ANNAN VÄG IN</p><h2 id="importFilesTitle">Ta med hela underlaget.</h2><p class="dialog-intro">Om en sida blockerar hämtning kan du spara den som HTML i webbläsaren och lägga in den här. Förslaget skapas från sidans text, bilder och styling.</p><label for="importFilesSource">Originalets webbadress</label><input type="url" id="importFilesSource" placeholder="https://foretaget.se/" maxlength="2000"><label for="importHTMLFile">Sparad HTML-sida <span>Högst 2 MB</span></label><input id="importHTMLFile" type="file" accept=".html,.htm,text/html"><label for="importCSSFiles">Tillhörande CSS-filer <span>Valfritt · högst åtta</span></label><input id="importCSSFiles" type="file" accept=".css,text/css" multiple><p class="field-help">Välj CSS-filer från den sparade sidans resursmapp. Lokal import kör inga script. Originalets bilder och typsnitt måste fortfarande vara tillgängliga eller laddas upp separat.</p><div id="importFilesSummary" class="import-file-summary">Ingen HTML-sida vald ännu.</div><p id="importFilesStatus" class="field-help" role="status">Ditt öppna förslag sparas innan det nya underlaget öppnas.</p><div class="dialog-actions"><button id="importFilesCreate" type="button" class="button primary">Skapa från underlaget →</button></div>`;
  document.body.append(dialog);const $=id=>dialog.querySelector('#'+id);let expected,snapshot,sequence=0,busy=false;
  const status=(message,error=false)=>{$('importFilesStatus').textContent=message;$('importFilesStatus').classList.toggle('error',error);};
  const changed=()=>{$('importFilesSummary').innerHTML=$('importHTMLFile').files[0]?`<strong>${e($('importHTMLFile').files[0].name)}</strong><span>${$('importCSSFiles').files.length} CSS-filer valda</span>`:'Ingen HTML-sida vald ännu.';if(!busy)status('Ditt öppna förslag sparas innan det nya underlaget öppnas.');};
  for(const id of ['importHTMLFile','importCSSFiles'])$(id).addEventListener('change',changed);
  $('importFilesCreate').addEventListener('click',async()=>{
    if(busy)return;const file=$('importHTMLFile').files[0],cssFiles=[...$('importCSSFiles').files],url=$('importFilesSource').value.trim(),token=sequence;
    if(!file){status('Välj den sparade HTML-sidan först.',true);$('importHTMLFile').focus();return;}
    if(!/\.html?$/i.test(file.name)||file.size>2_000_000){status('Välj en .html- eller .htm-fil under 2 MB.',true);return;}
    if(cssFiles.length>8||cssFiles.some(f=>!/\.css$/i.test(f.name)||f.size>500000)){status('Välj högst åtta CSS-filer under 500 kB vardera.',true);return;}
    try{const source=new URL(url);if(!/^https?:$/.test(source.protocol)||source.username||source.password||source.port)throw new Error();}catch{status('Ange originalets fullständiga offentliga webbadress, till exempel https://foretaget.se/.',true);$('importFilesSource').focus();return;}
    busy=true;$('importFilesCreate').disabled=true;for(const id of ['importFilesSource','importHTMLFile','importCSSFiles'])$(id).disabled=true;status('Läser text, bilder, logotyp och varumärkesfärger…');
    try{
      const html=await file.text(),styles=await Promise.all(cssFiles.map(async f=>({css:await f.text(),url:new URL(f.name,url).href})));
      const next=normalizeProject({...await importSavedPage(html,url,styles),templateId:expected.templateId});
      if(token!==sequence||!dialog.open)return;
      await onCreate(next,expected,snapshot,()=>token===sequence&&dialog.open);dialog.close();notify('HTML-underlaget är öppnat som ett nytt utkast. Granska importen innan delning.');
    }catch(error){if(token===sequence&&dialog.open)status(error.message||'Underlaget kunde inte läsas. Ditt utkast finns kvar.',true);console.warn('[mockup file import]',error.name);}
    finally{busy=false;$('importFilesCreate').disabled=false;for(const id of ['importFilesSource','importHTMLFile','importCSSFiles'])$(id).disabled=false;}
  });
  dialog.addEventListener('close',()=>{sequence++;});
  return {open(){if(busy)return;expected=getProject();snapshot=JSON.stringify(expected);sequence++;$('importFilesSource').value=getSource()||expected.source||'';$('importHTMLFile').value='';$('importCSSFiles').value='';changed();status('Ditt öppna förslag sparas innan det nya underlaget öppnas.');dialog.showModal();}};
}
