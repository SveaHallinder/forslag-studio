import {socialProfileURL,socialProfileDetails} from './social-content.mjs';
import {createSocialProject,socialIndustries,socialCopy} from './social-project.mjs';
import {renderDemo,escapeHTML as e} from './render.mjs';

export function createSocialStudio({getProject,onCreate,readImage,notify}) {
  const dialog=document.createElement('dialog');dialog.id='socialDialog';dialog.className='social-dialog';dialog.setAttribute('aria-labelledby','socialTitle');
  dialog.innerHTML=`<form method="dialog"><button class="dialog-close" aria-label="Stäng sociala medier">×</button></form><p class="overline">INGEN HEMSIDA. ETT HELT NYTT FÖRSTA INTRYCK.</p><h2 id="socialTitle">Från profil till plats.</h2><p class="dialog-intro">Lägg in företagets socials. Välj bilderna och skapa en hemsida att visa i nästa säljsamtal.</p>
  <div class="social-intake"><label for="socialLinks">Företagets profiler <span>En länk per rad · högst tre</span></label><textarea id="socialLinks" rows="2" placeholder="https://www.instagram.com/foretaget/" spellcheck="false"></textarea><div class="social-intake-actions"><button type="button" class="button primary" id="socialRead">Läs profil <span>→</span></button><button type="button" class="text-button" id="socialPilot">Testa Pebble-piloten ↗</button></div><p id="socialStatus" class="field-help" role="status">Instagram, Facebook och TikTok. Offentligt innehåll hämtas när plattformen tillåter det.</p></div>
  <div class="social-builder"><div class="social-fields"><div class="social-step"><span>01</span><h3>Företaget bakom profilen</h3></div><div class="social-field-row"><div><label for="socialName">Företagsnamn</label><input id="socialName" maxlength="100" placeholder="Företagets riktiga namn"></div><div><label for="socialIndustry">Bransch</label><select id="socialIndustry">${Object.entries(socialIndustries).map(([key,value])=>`<option value="${key}">${e(value.label)}</option>`).join('')}</select></div></div><div class="social-field-row"><div><label for="socialLanguage">Språk i förslaget</label><select id="socialLanguage"><option value="en">English</option><option value="sv">Svenska</option><option value="ro">Română</option></select></div><div><label for="socialAccent">Föreslagen accent</label><input id="socialAccent" type="color" value="#95382a"></div></div><label for="socialBio">Profiltext / beskrivning</label><textarea id="socialBio" rows="3" maxlength="2500" placeholder="Klistra in företagets bio om den inte gick att hämta."></textarea><label for="socialHeadline">Förslag på huvudrubrik <span>Redigera fritt</span></label><textarea id="socialHeadline" rows="2" maxlength="180"></textarea><label for="socialAbout">En lite längre berättelse <span>Valfritt</span></label><textarea id="socialAbout" rows="3" maxlength="1500" placeholder="Vad ska besökaren veta om företaget?"></textarea><label for="socialOffer">Utbud / meny / tjänster <span>Valfritt · bara riktiga uppgifter</span></label><textarea id="socialOffer" rows="3" maxlength="6000" placeholder="Beskriv det de faktiskt erbjuder. Ta bara med bekräftade priser."></textarea>
  <div class="social-step"><span>02</span><h3>Bilder med en uppgift</h3></div><p class="field-help">Välj en huvudbild, en bild till utbudet och resten till galleriet. Logotypen väljs separat.</p><div class="social-upload"><label class="upload-button" for="socialPhotoUpload">＋ Lägg till företagets bilder</label><input id="socialPhotoUpload" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden></div><div id="socialPhotos" class="social-photos"></div><p id="socialPhotoStatus" class="field-help" role="status">Inga verksamhetsbilder ännu. Om plattformen blockerar hämtning kan du lägga till dem här.</p><div class="social-logo-row"><img id="socialLogoPreview" alt="Vald logotyp" hidden><div><label class="upload-button" for="socialLogoUpload">Ladda upp logotyp</label><input id="socialLogoUpload" type="file" accept="image/jpeg,image/png,image/webp" hidden><button id="socialUseAvatar" type="button" class="text-button" hidden>Använd profilbild som logotyp</button><button id="socialClearLogo" type="button" class="text-button" hidden>Visa företagsnamn i stället</button></div></div><p class="field-help">Profilbilden används aldrig automatiskt som logotyp. Färger och typsnitt är ett designförslag som du kan ändra i studion.</p>
  <details class="social-details"><summary>Adress, öppettider och kontakt</summary><label for="socialAddress">Adress <span>Valfritt</span></label><input id="socialAddress" maxlength="200"><label for="socialHours">Öppettider <span>Valfritt</span></label><textarea id="socialHours" rows="2" maxlength="700" placeholder="Ange endast bekräftade öppettider."></textarea><div class="social-field-row"><div><label for="socialEmail">Mejladress</label><input id="socialEmail" type="email" maxlength="160"></div><div><label for="socialPhone">Telefon</label><input id="socialPhone" type="tel" maxlength="35"></div></div></details></div>
  <aside class="social-preview"><div><span class="overline">DITT NYA FÖRSLAG</span><p id="socialDesignName">Little Café · Pebble-uttrycket</p></div><div class="social-preview-stage"><iframe id="socialPreview" title="Förhandsvisning från sociala medier" sandbox></iframe></div><p class="field-help">En komplett hemsida med meny, innehåll, bildberättelser, kontakt och sidfot. Allt kan redigeras efteråt.</p></aside></div>
  <div class="social-finish"><p id="socialCreateStatus" class="field-help" role="status">Skapar ett nytt utkast. Ditt öppna förslag sparas innan du byter.</p><button type="button" class="button primary" id="socialCreate">Skapa hemsideförslag <span>↗</span></button></div>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id),fields={name:'socialName',industry:'socialIndustry',language:'socialLanguage',bio:'socialBio',headline:'socialHeadline',about:'socialAbout',offer:'socialOffer',address:'socialAddress',hours:'socialHours',email:'socialEmail',phone:'socialPhone',accent:'socialAccent'};
  let photos=[],logo='',avatar='',expected,snapshot,sequence=0,timer,photoSequence=0,logoSequence=0,reading=false,creating=false;
  const status=(id,message,error=false)=>{$(id).textContent=message;$(id).classList.toggle('error',error);};
  function data(){return {...Object.fromEntries(Object.entries(fields).map(([key,id])=>[key,$(id).value])),links:$('socialLinks').value,photos,logo};}
  function updatePreview(){
    clearTimeout(timer);timer=setTimeout(()=>{
      let draft;try{draft=createSocialProject({...data(),links:$('socialLinks').value||'https://www.instagram.com/your.cafe/',name:$('socialName').value||'Your little place',bio:$('socialBio').value||'En plats för företagets egna ord, bilder och berättelse.'});}catch{return;}
      $('socialPreview').srcdoc=renderDemo(draft);$('socialDesignName').textContent= draft.templateId==='cafe'?'Little Café · Pebble-uttrycket':socialIndustries[$('socialIndustry').value].label;
      const stage=$('socialPreview').parentElement,scale=stage.clientWidth/1100;$('socialPreview').style.transform=`scale(${scale})`;
    },180);
  }
  function renderPhotos(){
    $('socialPhotos').innerHTML=photos.map((p,i)=>`<div class="social-photo"><img src="${e(p.url)}" alt="${e(p.label||'Företagsbild '+(i+1))}" referrerpolicy="no-referrer"><label for="social-role-${i}">Bild ${i+1} används som</label><select id="social-role-${i}" data-photo="${i}"><option value="hero" ${p.role==='hero'?'selected':''}>Huvudbild</option><option value="offer" ${p.role==='offer'?'selected':''}>Utbud / tjänster</option><option value="gallery" ${p.role==='gallery'?'selected':''}>Galleri</option><option value="none" ${p.role==='none'?'selected':''}>Använd inte</option></select><label for="social-caption-${i}">Bildtext <span>Valfritt</span></label><input id="social-caption-${i}" data-caption="${i}" value="${e(p.caption||'')}" maxlength="160"><button type="button" class="text-button" data-remove-photo="${i}">Ta bort</button></div>`).join('');
    const image=$('socialLogoPreview');image.hidden=!logo;if(logo)image.src=logo;else image.removeAttribute('src');
    $('socialClearLogo').hidden=!logo;$('socialUseAvatar').hidden=!avatar;
    updatePreview();
  }
  function apply(values){
    for(const [key,id] of Object.entries(fields))$(id).value=values[key]??(key==='industry'?'cafe':key==='language'?'en':key==='accent'?'#95382a':'');
    $('socialLinks').value=values.links||values.url||'';photos=values.photos||[];logo=values.logo||'';avatar=values.avatar||'';renderPhotos();
  }
  function headline(){const c=socialCopy[$('socialLanguage').value];$('socialHeadline').value=$('socialIndustry').value==='cafe'?c.headline:$('socialIndustry').value==='restaurant'?c.restaurant:c.other;updatePreview();}
  async function freezePhoto(url,isLogo=false){const response=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url}),signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error('Bilden kunde inte hämtas.');return readImage(await response.blob(),isLogo);}
  async function read(){
    if(reading||creating)return;
    let profiles;try{const links=$('socialLinks').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!links.length||links.length>3)throw new Error('Lägg till en till tre profillänkar, en per rad.');profiles=links.map(socialProfileURL);}catch(error){status('socialStatus',error.message,true);$('socialLinks').focus();return;}
    // Never overwrite a user's corrected intake while a slow platform responds.
    const before=JSON.stringify(data()),token=++sequence;reading=true;$('socialRead').disabled=true;status('socialStatus','Läser den första offentliga profilen… Du kan fortsätta manuellt medan plattformen svarar.');
    try{
      const response=await fetch('/api/social',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:profiles[0].url}),signal:AbortSignal.timeout(30000)}),result=await response.json();
      if(!response.ok)throw new Error(result.error||'Profilen kunde inte läsas.');
      if(token!==sequence||!dialog.open)return;
      if(JSON.stringify(data())!==before){status('socialStatus','Profilens svar lades åt sidan eftersom du ändrade uppgifterna. Dina senaste ändringar är kvar.');return;}
      if(result.status!=='read'){status('socialStatus',result.warning,true);$('socialBio').focus();return;}
      $('socialName').value=result.name;$('socialBio').value=result.bio;const details=socialProfileDetails(result.bio);$('socialAddress').value=details.address;$('socialHours').value=details.hours;avatar=result.avatar||'';renderPhotos();status('socialStatus',result.warning);status('socialPhotoStatus','Sparar profilens verksamhetsbilder i utkastet så att tillfälliga bildlänkar inte löper ut…');
      const photoToken=photoSequence,converted=await Promise.all((result.photos||[]).slice(0,6).map(async(p,i)=>{try{return {...p,url:await freezePhoto(p.url),role:i===0?'hero':i===1?'offer':'gallery'};}catch{return null;}}));
      if(token!==sequence||!dialog.open||photoToken!==photoSequence)return;
      photos=converted.filter(Boolean);renderPhotos();status('socialPhotoStatus',photos.length?`${photos.length} bilder är inlagda. Kontrollera placeringen innan du skapar förslaget.`:'Inga verksamhetsbilder kunde hämtas. Lägg till företagets bilder här. Profilbilden är separat.');
    }catch(error){if(token===sequence&&dialog.open)status('socialStatus','Profilen kunde inte läsas. Klistra in profiltexten och lägg till bilder nedan. Ditt öppna förslag är kvar.',true);console.warn('[social import]',error.name);}
    finally{if(token===sequence){reading=false;$('socialRead').disabled=false;}}
  }
  $('socialRead').addEventListener('click',read);
  $('socialPilot').addEventListener('click',async()=>{
    const token=++sequence;photoSequence++;reading=false;$('socialRead').disabled=false;status('socialStatus','Öppnar vår sparade Pebble-pilot…');
    try{const response=await fetch('/pebble-social-pilot.json');if(!response.ok)throw new Error('Piloten kunde inte öppnas.');const values=await response.json();values.photos=await Promise.all(values.photos.map(async p=>({...p,url:await readImage(await(await fetch(p.url)).blob(),false)})));if(token!==sequence||!dialog.open)return;apply(values);status('socialStatus','Sparad Pebble-pilot från 7 oktober. Bilder och uppgifter är hämtade från pilotunderlaget; text, färger och typografi är ett designförslag.');status('socialPhotoStatus','Fyra pilotbilder med olika roller. Ändra rollerna eller skapa förslaget.');}catch(error){status('socialStatus',error.message,true);}
  });
  $('socialPhotos').addEventListener('change',event=>{const index=Number(event.target.dataset.photo);if(!photos[index])return;photoSequence++;const role=event.target.value;if(['hero','offer'].includes(role))photos.forEach(p=>{if(p.role===role)p.role='gallery';});photos[index].role=role;renderPhotos();});
  $('socialPhotos').addEventListener('input',event=>{if(event.target.dataset.caption===undefined)return;photoSequence++;photos[Number(event.target.dataset.caption)].caption=event.target.value;updatePreview();});
  $('socialPhotos').addEventListener('click',event=>{const button=event.target.closest('[data-remove-photo]');if(!button)return;photoSequence++;photos.splice(Number(button.dataset.removePhoto),1);renderPhotos();});
  for(const [id,isLogo] of [['socialPhotoUpload',false],['socialLogoUpload',true]])$(id).addEventListener('change',async event=>{
    const files=[...event.target.files],token=sequence,logoToken=isLogo?++logoSequence:logoSequence;photoSequence++;
    try{
      if(!isLogo&&photos.length+files.length>8)throw new Error('Välj högst åtta verksamhetsbilder. Ta bort en bild om du vill byta.');
      const results=await Promise.all(files.map(async file=>({url:await readImage(file,isLogo),label:file.name})));
      if(token!==sequence||!dialog.open)return;
      if(isLogo){if(logoToken!==logoSequence)return;logo=results[0]?.url||logo;}else for(const p of results)photos.push({...p,role:!photos.some(item=>item.role==='hero')?'hero':!photos.some(item=>item.role==='offer')?'offer':'gallery'});
      renderPhotos();status('socialPhotoStatus',`${photos.length} verksamhetsbilder. Dina uppladdade bilder sparas med projektet.`);
    }catch(error){status('socialPhotoStatus',error.message,true);}finally{event.target.value='';}
  });
  $('socialUseAvatar').addEventListener('click',async()=>{const token=sequence,original=avatar,logoToken=++logoSequence;$('socialUseAvatar').disabled=true;try{const value=await freezePhoto(original,true);if(token===sequence&&original===avatar&&logoToken===logoSequence&&dialog.open){logo=value;renderPhotos();}}catch{status('socialPhotoStatus','Profilbilden kunde inte hämtas. Ladda upp logotypen i stället.',true);}finally{$('socialUseAvatar').disabled=false;}});
  $('socialClearLogo').addEventListener('click',()=>{logoSequence++;logo='';renderPhotos();});
  dialog.addEventListener('input',event=>{if(Object.values(fields).some(id=>id===event.target.id)||event.target.id==='socialLinks')updatePreview();});
  for(const id of ['socialIndustry','socialLanguage'])$(id).addEventListener('change',headline);
  $('socialCreate').addEventListener('click',async()=>{
    if(creating)return;
    let next;try{next=createSocialProject(data());}catch(error){status('socialCreateStatus',error.message,true);return;}
    creating=true;$('socialCreate').disabled=true;sequence++;reading=false;$('socialRead').disabled=false;status('socialCreateStatus','Sparar ditt öppna förslag och öppnar den nya hemsidan…');
    try{await onCreate(next,expected,snapshot);dialog.close();notify('Hemsidan är skapad. Redigera, granska och dela när du är nöjd.');}catch(error){status('socialCreateStatus',error.message,true);}finally{creating=false;$('socialCreate').disabled=false;}
  });
  dialog.addEventListener('close',()=>{sequence++;photoSequence++;reading=false;$('socialRead').disabled=false;clearTimeout(timer);});
  new ResizeObserver(updatePreview).observe($('socialPreview').parentElement);
  return {open(url=''){
    if(dialog.open)return;
    expected=getProject();snapshot=JSON.stringify(expected);sequence++;photoSequence++;apply({links:url});headline();status('socialStatus','Offentligt innehåll hämtas när plattformen tillåter det. Du kan också fylla i uppgifterna manuellt.');status('socialPhotoStatus','Inga verksamhetsbilder ännu. Profilbilden väljs separat.');status('socialCreateStatus','Ditt öppna förslag sparas innan det nya utkastet öppnas.');dialog.showModal();updatePreview();if(url)read();else $('socialLinks').focus();
  }};
}
