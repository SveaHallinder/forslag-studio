import test from 'node:test';
import assert from 'node:assert/strict';
import {templates} from '../public/templates.mjs';
import {renderDemo} from '../public/render.mjs';
import {findTemplates,templateProject} from '../public/template-picker.mjs';
import {recommendDirections} from '../public/design-directions.mjs';

test('Norriva is selectable and searchable in the company template library',()=>{
 assert.ok(templates.some(t=>t.id==='norriva'));assert.equal(findTemplates({query:'Norriva'})[0]?.id,'norriva');
 for(const group of ['creative','services'])assert.ok(findTemplates({group}).some(t=>t.id==='norriva'));
 assert.equal(recommendDirections({headline:'Förpackningar med eget tryck'}).at(0).templateId,'norriva');
});
test('Norriva reuses company content, destinations, colors, images and explicit fonts',()=>{
 const raw={templateId:'norriva',name:'Kundens företag',headline:'Företagets egna ord',description:'Originaltext för vårt företag.',accent:'#764321',branding:{background:'#fffaf1',text:'#20262b'},hero:'https://example.com/photo.jpg',logo:'https://example.com/logo.png',email:'hej@example.com',cards:[{title:'Produkt A',kind:'product',description:'Bekräftat pris 150 kr',image:'https://example.com/item.jpg'}],navigation:[{label:'Original meny',href:'https://example.com/original'}]},before=JSON.stringify(raw),html=renderDemo(raw);
 assert.match(html,/data-website-design="norriva"/);assert.match(html,/Norriva composition/);assert.match(html,/font-weight:300/);assert.match(html,/font-family:'Norriva Sans'/);
 for(const text of ['Kundens företag','Företagets egna ord','Originaltext för vårt företag.','Bekräftat pris 150 kr','https://example.com/item.jpg','https://example.com/original','#764321','#fffaf1'])assert.ok(html.includes(text),text);
 assert.equal(JSON.stringify(raw),before);assert.doesNotMatch(html,/norrivapack@gmail|preview-name-bag|studio-form/);
 const custom=renderDemo({...raw,typography:{heading:'Georgia',body:'Verdana'}});assert.match(custom,/--rd-heading:"Georgia",serif/);assert.match(custom,/font-family:"Verdana",sans-serif/);
 assert.equal(templateProject(raw,'norriva').accent,raw.accent);
});
test('other designs do not carry Norriva fonts or styles',()=>{
 assert.doesNotMatch(renderDemo({templateId:'editorial',name:'Other'}),/Norriva Sans|Norriva composition/);
});
