import {normalizeProject,renderDemo} from './render.mjs';

export function layoutIssues({width,pageWidth,clipped=[]}) {
  const issues=[];
  if(pageWidth>width+2)issues.push({kind:'overflow',field:'chooseTemplate',tab:'content',help:`Sidan blir ${Math.ceil(pageWidth)} px bred i en ${width} px vy. Granska designen, menyn och de breda innehållsblocken.`});
  for(const item of clipped.slice(0,5))issues.push({kind:'clipped',field:item.field,tab:item.tab||'content',...(item.blocking===false?{blocking:false}:{}),help:`${item.label} ryms inte i ${width} px vyn. Granska texten och designen före delning.`});
  return issues;
}
function measureLayout(doc,width) {
  const win=doc.defaultView,clipped=[];
  const nodes=[...doc.querySelectorAll('h1,.card h2,.hero-copy>p,.ending-action,.customer-mobile-actions a,.customer-action-label,.ending-action-label')];
  for(const node of nodes){
    const box=node.getBoundingClientRect(),style=win.getComputedStyle(node);
    if(!box.width||!box.height||style.visibility==='hidden'||node.closest('[hidden],[aria-hidden="true"],template'))continue;
    const clippedLabel=node.matches('.customer-action-label,.ending-action-label')&&node.scrollHeight>node.clientHeight+2;
    if(node.scrollWidth>node.clientWidth+2||box.left<-2||box.right>width+2||clippedLabel){
      const heading=node.matches('h1'),intro=node.matches('.hero-copy>p'),card=node.matches('.card h2')?node.closest('.card'):null,cardIndex=card?[...doc.querySelectorAll('main .card')].indexOf(card):-1;
      clipped.push({field:heading?'headline':cardIndex>=0?'card-title-'+cardIndex:intro?'description':'cta',tab:heading||intro||card?'content':'details',blocking:!clippedLabel,label:heading?'Huvudrubriken':card?'Sektionsrubriken':intro?'Introduktionen':'Kontaktknappen'});
    }
  }
  return {width,pageWidth:Math.max(doc.documentElement.scrollWidth,doc.body.scrollWidth),clipped};
}
// Inert local previews use the same renderer as the customer demo. Source scripts
// never execute. Image decoding/sharpness is checked separately by the asset probe.
export async function checkVisualLayout(raw,{signal,widths=[320,1280],timeout=2500,render=renderDemo}={}) {
  const project=normalizeProject(raw),pages=[project,...(project.pages||[])],checks=[];let checked=0;
  for(const [index,page]of pages.entries())for(const width of widths){
    const label=(index?page.name:'Startsida')+' · '+width+' px',base={id:'layout',label,ok:false,blocking:true,pageIndex:index-1,field:'chooseTemplate',tab:'content'};
    if(signal?.aborted){checks.push({...base,help:'Layoutkontrollen avbröts. Kör kontrollen igen före delning.'});continue;}
    if(typeof document==='undefined'){checks.push({...base,help:'Layoutkontrollen kräver en webbläsare.'});continue;}
    const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.setAttribute('sandbox','allow-same-origin');frame.tabIndex=-1;frame.style.cssText=`position:fixed;left:-100000px;top:0;width:${width}px;height:900px;border:0;opacity:0;pointer-events:none`;
    let timer,stop;
    try{
      const content={...page,pages:undefined,templateId:project.templateId,name:project.name,logo:project.logo,accent:project.accent,branding:project.branding,typography:project.typography,navigation:project.navigation,requestForm:project.requestForm,email:page.email||project.email,phone:page.phone||project.phone,address:page.address||project.address};
      const html=render(content).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/loading="(?:eager|lazy)"/g,'loading="lazy"').replace('</head>','<style>html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important}</style></head>');
      await new Promise((resolve,reject)=>{
        const fail=message=>reject(new Error(message));stop=()=>fail('Layoutkontrollen avbröts.');signal?.addEventListener('abort',stop,{once:true});timer=setTimeout(()=>fail('Layouten eller typsnitten tog för lång tid att läsa.'),timeout);
        frame.onload=async()=>{try{if(!frame.contentDocument.querySelector('body[data-template]'))return;await frame.contentDocument.fonts.ready;if(signal?.aborted)return stop();resolve();}catch{fail('Förhandsvisningen kunde inte läsas.');}};
        document.body.append(frame);frame.srcdoc=html;
      });
      const issues=layoutIssues(measureLayout(frame.contentDocument,width));checked++;
      if(issues.length)checks.push(...issues.map(issue=>({...base,...issue,label:label+': '+(issue.kind==='overflow'?'för bred sida':'text ryms inte')})));
      else checks.push({...base,ok:true,blocking:false,help:''});
    }catch(error){checks.push({...base,help:(error.message||'Layoutkontrollen kunde inte slutföras.')+' Kör kontrollen igen och granska designen.'});}
    finally{clearTimeout(timer);signal?.removeEventListener('abort',stop);frame.onload=null;frame.remove();}
  }
  return {checks,checked,total:pages.length*widths.length};
}
