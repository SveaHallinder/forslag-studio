import test from 'node:test';
import assert from 'node:assert/strict';
import {launchAssets,launchSignature,launchReportCurrent,checkLaunchAssets,repairImportedImages} from '../public/launch-checks.mjs';
const image=name=>'https://images.example.com/'+name+'.jpg';
const project={name:'QA Café',hero:image('hero'),logo:image('logo'),cards:[{title:'Mat',image:image('food')}],pages:[{source:'https://example.com/about',headline:'Om caféet',hero:image('hero'),cards:[{title:'Team',image:image('team')}]}]};

test('customer image checks deduplicate actual visible files across pages and ignore unused imports',()=>{
  const assets=launchAssets({...project,images:[{url:image('unused'),label:'Original'}]});
  assert.equal(assets.length,4);assert.ok(!assets.some(a=>a.url===image('unused')));
  assert.deepEqual(assets.find(a=>a.url===image('hero')).uses.map(u=>u.pageIndex),[-1,0]);
});
test('unreadable images block sharing but readable small originals remain explicit quality reminders',async()=>{
  const report=await checkLaunchAssets(project,async url=>{
    if(url===image('team'))throw new Error('HTTP 404');
    return {width:url===image('hero')?500:1000,height:1000};
  });
  const broken=report.checks.find(c=>c.url===image('team')),small=report.checks.find(c=>c.url===image('hero'));
  assert.equal(broken.blocking,true);assert.equal(broken.ok,false);assert.equal(broken.pageIndex,0);assert.match(broken.help,/404/);
  assert.equal(small.ok,false);assert.equal(small.blocking,false);assert.match(small.help,/500 × 1000/);
  const vector=await checkLaunchAssets({logo:image('vector')},async()=>({width:30,height:20,vector:true}));assert.equal(vector.checks[0].ok,true);
});
test('bounded image checks have at most three concurrent requests and fail closed for unchecked files',async()=>{
  let active=0,peak=0,calls=0;
  const many={cards:Array.from({length:8},(_,i)=>({title:'Foto '+i,image:image('photo-'+i)}))};
  const report=await checkLaunchAssets(many,async()=>{calls++;peak=Math.max(peak,++active);await new Promise(resolve=>setTimeout(resolve,2));active--;return {width:1000,height:1000};},{maximum:5});
  assert.equal(calls,5);assert.equal(peak,3);assert.equal(report.checked,5);assert.equal(report.total,8);
  assert.equal(report.checks.filter(c=>!c.ok&&c.blocking).length,3);
});
test('an aborted or invalid image probe never receives a passed check',async()=>{
  const controller=new AbortController();controller.abort();let calls=0;
  const stopped=await checkLaunchAssets(project,async()=>{calls++;},{signal:controller.signal});assert.equal(calls,0);assert.ok(stopped.checks.every(c=>!c.ok&&c.blocking));
  const invalid=await checkLaunchAssets(project,async()=>({width:0,height:100}));assert.ok(invalid.checks.every(c=>!c.ok&&c.blocking));
});
test('repair uses only a working image from the same group, preserving source assets and unrelated blocks',()=>{
  const original={hero:image('broken'),heroGallery:[{url:image('broken')},{url:image('good'),caption:'Original bildtext'}],images:[{url:image('broken')}],cards:[{title:'Portrait',image:image('missing')},{title:'Food',image:image('food'),gallery:[{url:image('food')}]}]},before=JSON.stringify(original);
  const {project:next,repaired}=repairImportedImages(original,new Map([[image('broken'),{ok:false}],[image('good'),{ok:true}],[image('missing'),{ok:false}],[image('food'),{ok:true}]]));
  assert.equal(repaired,1);assert.equal(next.hero,image('good'));assert.equal(next.heroGallery[0].caption,'Original bildtext');assert.equal(next.cards[0].image,image('missing'));
  assert.equal(next.images[0].url,image('broken'));assert.equal(JSON.stringify(original),before);
});
test('a reviewed report is invalidated by any visible change, never by a saved id or import timestamp',()=>{
  const base=launchSignature(project);
  for(const change of [{templateId:'cafe'},{heroPosition:8},{about:'Ny presentation'},{benefits:[{title:'Lunch'}]},{address:'Ny adress'},{cta:'Boka nu'},{pages:[{...project.pages[0],description:'Ändrad undersida'}]}])assert.notEqual(launchSignature({...project,...change}),base);
  assert.equal(launchSignature({...project,id:'saved-123',importedAt:'later',warnings:['Older warning']}),base);
  const report={signature:base,checkedAt:1000,checks:[{ok:true,blocking:true}]};
  assert.equal(launchReportCurrent(project,report,2000),true);assert.equal(launchReportCurrent(project,report,302000),false);assert.equal(launchReportCurrent(project,report,999),false);
  assert.equal(launchReportCurrent({...project,address:'Changed'},report,2000),false);assert.equal(launchReportCurrent(project,{...report,checks:[{ok:false,blocking:true}]},2000),false);
});
