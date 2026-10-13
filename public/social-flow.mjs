import {socialProfileURL} from './social-content.mjs';

export function socialIntakeIssue(data,target='images') {
  const links=String(data.links||'').split(/\r?\n/).map(value=>value.trim()).filter(Boolean);
  try{
    if(!links.length||links.length>3)throw new Error('Lägg till en till tre företagsprofiler, en länk per rad.');
    links.forEach(socialProfileURL);
  }catch(error){return {step:'profile',field:'socialLinks',message:error.message};}
  if(target==='company')return;
  if(!String(data.name||'').trim()||String(data.name).trim().length>100)return {step:'company',field:'socialName',message:'Fyll i företagets riktiga namn, högst 100 tecken.'};
  if(!String(data.bio||'').trim())return {step:'company',field:'socialBio',message:'Lägg till en kort beskrivning av företaget. Använd gärna deras egna ord.'};
}

export function createSocialFlow({root,getData,onChange=()=>{}}) {
  const $=id=>root.querySelector('#'+id),names=['profile','company','images'],buttons=[...root.querySelectorAll('[data-social-step]')];
  let current='profile',inputError=false;
  function reveal(issue) {
    select(issue.step);
    $('socialStatus').textContent=issue.message;$('socialStatus').classList.add('error');inputError=true;
    const field=issue.field&&$(issue.field);
    for(let node=field?.parentElement;node&&node!==root;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
    field?.focus();return false;
  }
  function select(name,focus=false) {
    if(!names.includes(name))return false;
    if(names.indexOf(name)>names.indexOf(current)){const issue=socialIntakeIssue(getData(),name);if(issue)return reveal(issue);}
    current=name;root.dataset.socialStep=name;
    if(inputError){$('socialStatus').textContent='Fortsätt med företagets egna uppgifter.';$('socialStatus').classList.remove('error');inputError=false;}
    for(const panel of root.querySelectorAll('[data-social-panel]'))panel.hidden=panel.dataset.socialPanel!==name;
    for(const button of buttons){if(button.dataset.socialStep===name)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');}
    $('socialBack').hidden=name==='profile';$('socialNext').hidden=name==='images';$('socialCreate').hidden=name!=='images';
    $('socialNext').textContent=name==='profile'?'Fyll i själv →':'Fortsätt med bilder →';
    $('socialNext').className='button '+(name==='profile'?'secondary':'primary');
    root.scrollTop=0;onChange();
    if(focus)$(name==='profile'?'socialLinks':name==='company'?'socialName':'socialAddPhotos').focus({preventScroll:true});
    return true;
  }
  for(const button of buttons)button.addEventListener('click',()=>select(button.dataset.socialStep,true));
  $('socialNext').addEventListener('click',()=>select(names[names.indexOf(current)+1],true));
  $('socialBack').addEventListener('click',()=>select(names[names.indexOf(current)-1],true));
  return {select,reveal,get current(){return current;}};
}
