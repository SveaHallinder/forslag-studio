import test from 'node:test';import assert from 'node:assert/strict';
import {sourceImagePresentation} from '../public/image-presentation.mjs';
import {planCopyRefinements,applyCopyRefinements,planActionRefinements,applyActionRefinements} from '../public/proposal-refinements.mjs';
import {layoutIssues} from '../public/visual-checks.mjs';
import {renderTemplateThumbnail} from '../public/design-workbench.mjs';
test('source focus wins; unframed portraits and products retain their full composition',()=>{
 assert.deepEqual(sourceImagePresentation({fit:'cover',position:'30% 20%',width:800,height:1200},'Team'),{fit:'cover',x:30,y:20,ratio:'template'});
 assert.equal(sourceImagePresentation({width:800,height:1200},'Möt vårt team').fit,'contain');
 assert.equal(sourceImagePresentation({width:1200,height:800},'Produkter').ratio,'original');
 assert.equal(sourceImagePresentation({width:1200,height:800},'Vårt café'),undefined);
 assert.equal(sourceImagePresentation({fit:'cover',position:'var(--focus)'},'Bilder'),undefined);
});
test('labelled menu and hours become exact sourced sections; original words and prices remain',()=>{
 const description='Här finns plats för en kaffe och en lugn stund tillsammans.\n\nMENY\nEspresso 35 kr\nLatte 45 kr\n\nÖPPETTIDER\nMåndag–fredag 08–17';
 const p={name:'Nord Café',headline:'Kaffe',description,cards:[]},plan=planCopyRefinements(p);assert.equal(plan.changes.length,1);const next=applyCopyRefinements(p,plan);
 assert.deepEqual(next.cards.map(c=>c.title),['MENY','ÖPPETTIDER']);assert.equal(next.cards[0].description,'Espresso 35 kr\nLatte 45 kr');assert.equal(next.cards[1].description,'Måndag–fredag 08–17');
 assert.equal((next.description+' '+next.cards.map(c=>c.title+' '+c.description).join(' ')).replace(/\s+/g,' '),description.replace(/\s+/g,' '));assert.equal(p.cards.length,0);
});
test('generic source buttons can be clarified only from real destinations; custom copy remains',()=>{
 const p={name:'Nord',cta:'Läs mer',ctaHref:'mailto:hej@example.com'},plan=planActionRefinements(p);assert.equal(plan.changes[0].after,'Skicka ett mejl');const next=applyActionRefinements(p,plan);assert.equal(next.ctaHref,p.ctaHref);assert.equal(next.cta,'Skicka ett mejl');
 assert.equal(planActionRefinements({...p,cta:'Fråga om vårt sortiment'}).changes.length,0);
 assert.equal(planActionRefinements({...p,ctaHref:'https://example.com/unidentified'}).changes.length,0);
 assert.equal(planActionRefinements({cta:'Läs mer',ctaHref:'javascript:alert(1)'}).changes.length,0);
 assert.throws(()=>applyActionRefinements({...p,phone:'+461234567'},plan),/ändrades/);
});
test('readable layouts pass; overflow, clipped headings and unfinished checks are distinguished',()=>{
 assert.deepEqual(layoutIssues({width:320,pageWidth:320,clipped:[]}),[]);
 assert.ok(layoutIssues({width:320,pageWidth:460,clipped:[]}).some(i=>i.kind==='overflow'));
 assert.ok(layoutIssues({width:320,pageWidth:320,clipped:[{field:'headline',label:'Huvudrubrik'}]}).some(i=>i.field==='headline'));
});
test('design comparisons can preview template type while retaining source branding and reversible font choice',()=>{
 const p={name:'Nord',headline:'Ett eget uttryck',typography:{heading:'Georgia',body:'Verdana'},branding:{background:'#ffffff',text:'#112233'}};
 assert.notEqual(renderTemplateThumbnail(p,p,'precision',true),renderTemplateThumbnail(p,p,'precision'));
 assert.equal(p.typography.heading,'Georgia');
});
