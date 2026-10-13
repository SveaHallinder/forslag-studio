import test from 'node:test';
import assert from 'node:assert/strict';
import {templates} from '../public/templates.mjs';
import {recommendDirections} from '../public/design-directions.mjs';
import {templateGroups,findTemplates,templateThumbnail} from '../public/template-picker.mjs';

test('every existing design remains discoverable in the library and a relevant group',()=>{
  assert.deepEqual(findTemplates().map(template=>template.id),templates.map(template=>template.id));
  const grouped=new Set(templateGroups.flatMap(group=>group.ids||[]));
  for(const template of templates)assert.ok(grouped.has(template.id),template.id+' is missing from all groups');
  assert.deepEqual(findTemplates({group:'unknown'}),findTemplates());
});
test('search accepts Swedish accents and combines words with the chosen group',()=>{
  assert.ok(findTemplates({query:'  CAFE  ',group:'hospitality'}).some(template=>template.id==='cafe'));
  assert.deepEqual(findTemplates({query:'rådgivning juridik',group:'services'}).map(template=>template.id),['consulting']);
  assert.equal(findTemplates({query:'rådgivning juridik',group:'hospitality'}).length,0);
  assert.equal(findTemplates({query:'<script>not a design</script>'}).length,0);
});
test('recommended filter follows the imported business without changing the project',()=>{
  const project={name:'Bageri',headline:'Café med nybakat varje dag',templateId:'story',cards:[{title:'Lunch',description:'Originalets meny'}]};
  const before=JSON.stringify(project),expected=[project.templateId,...recommendDirections(project).map(direction=>direction.templateId)];
  assert.deepEqual(new Set(findTemplates({group:'recommended',project}).map(template=>template.id)),new Set(expected));
  assert.equal(JSON.stringify(project),before);
});
test('the current design comes first in the curated list and cannot be duplicated',()=>{
  const choices=findTemplates({group:'recommended',project:{name:'Café',templateId:'cafe'}});
  assert.equal(choices[0].id,'cafe');assert.equal(choices.filter(choice=>choice.id==='cafe').length,1);assert.ok(choices.length<=4);
});
test('an English coffee profile gets café choices rather than legal and retail layouts',()=>{
  const project={name:'Pebble Bucharest',templateId:'cafe',headline:'A little pause. A better coffee.',description:'Specialty coffee and a slower moment.'};
  assert.deepEqual(findTemplates({group:'recommended',project}).map(choice=>choice.id),['cafe','dining','cinema','pop']);
});
test('a selected industry guides the shortlist when the company text supplies no clear cues',()=>{
  for(const id of ['wellness','construction','hospitality','retail'])assert.equal(recommendDirections({name:'Norda',templateId:id}).at(0).templateId,id);
});
test('unknown and inherited object keys cannot break the design shortlist',()=>{
  for(const templateId of ['constructor','__proto__','toString',{},null])assert.equal(recommendDirections({templateId}).length,3);
});
test('library thumbnails show real customer content without scripts or interactive controls',()=>{
  const project={name:'Kund <script>',headline:'Företagets egna ord',templateId:'story',hero:'https://example.com/customer.jpg'};
  const before=JSON.stringify(project);
  for(const template of templates){const html=templateThumbnail(project,template.id);assert.match(html,/<body inert/);assert.doesNotMatch(html,/<script\b/i);assert.match(html,/Företagets egna ord/);assert.match(html,/Kund &lt;script&gt;/);}
  assert.equal(JSON.stringify(project),before);
});
