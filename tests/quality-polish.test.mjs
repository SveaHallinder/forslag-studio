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
test('a single sourced hours heading with a colon and pasted line endings becomes editable',()=>{
 const intro='Hos oss finns plats för en kaffe och en lugn stund tillsammans.',description=intro+'\r\n\r\n  Öppettider:  \r\nMåndag–fredag 08–17\r\nLördag 10–15',p={name:'Nord Café',description,cards:[]},plan=planCopyRefinements(p);
 assert.equal(plan.changes.length,1);const next=applyCopyRefinements(p,plan);assert.equal(next.description,intro);assert.equal(next.cards[0].title,'Öppettider');assert.equal(next.cards[0].description,'Måndag–fredag 08–17\r\nLördag 10–15');assert.equal(p.description,description);
});
test('services and cases retain sourced copy even when section anchors are already reserved',()=>{
 const description='Vi hjälper företag med deras avtalsfrågor och juridiska uppdrag.\n\nTjänster:\nAvtalsgranskning enligt överenskommelse.\n\nKundcase:\nBolag A: granskning av leverantörsavtal.',p={name:'Klar',description,cards:[{title:'Original',anchor:'fordjupning-1'}],navigation:[{label:'Original',href:'#fordjupning-1'}]},plan=planCopyRefinements(p);
 assert.equal(plan.changes.length,1);const next=applyCopyRefinements(p,plan);assert.deepEqual(next.cards.slice(0,2).map(c=>c.kind),['service','case']);assert.equal(new Set(next.cards.map(c=>c.anchor)).size,3);assert.equal(next.cards[1].description,'Bolag A: granskning av leverantörsavtal.');
});
test('headings inside prose and empty labelled content never become invented sections',()=>{
 for(const tail of ['Våra öppettider: gäller enligt vår bekräftelse.','Öppettider:\n','Fyll i öppettider:\nMåndag–fredag']){const p={name:'Nord',description:'Här finns plats för en stund tillsammans med kaffe och nybakat.\n\n'+tail,cards:[]};assert.equal(planCopyRefinements(p).changes.length,0);}
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
