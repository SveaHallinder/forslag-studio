import test from 'node:test';
import assert from 'node:assert/strict';
import {templates} from '../public/templates.mjs';
import {recommendDirections} from '../public/design-directions.mjs';
import {templateGroups,findTemplates} from '../public/template-picker.mjs';

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
  const before=JSON.stringify(project),expected=recommendDirections(project).map(direction=>direction.templateId);
  assert.deepEqual(new Set(findTemplates({group:'recommended',project}).map(template=>template.id)),new Set(expected));
  assert.equal(JSON.stringify(project),before);
});
