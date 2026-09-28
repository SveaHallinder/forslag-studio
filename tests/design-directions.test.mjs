import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendDirections } from '../public/design-directions.mjs';
import { templates } from '../public/templates.mjs';

test('empty and malformed input always receives three distinct existing directions',()=>{
  for(const project of [undefined,null,{},[],{cards:null,images:{}}]) {
    const directions=recommendDirections(project);
    assert.equal(directions.length,3);
    assert.equal(new Set(directions.map(direction=>direction.templateId)).size,3);
    assert.deepEqual(directions.map(direction=>direction.label),['Stilrent','Bilddrivet','Uttrycksfullt']);
    for(const direction of directions) {
      assert.ok(templates.some(template=>template.id===direction.templateId));
      assert.ok(direction.reason.length>20);
      assert.deepEqual(Object.keys(direction).sort(),['label','reason','templateId']);
    }
  }
});

for(const [name,templateId] of [
  ['Butik med produkter','retail'],['Café och restaurang','dining'],
  ['Salong med behandlingar','wellness'],['Bygg och hantverk','construction'],
  ['Hotell och boende','hospitality'],['Rådgivning och juridik','consulting'],
  ['Arkitektur och kultur','editorial'],
]) {
  test(`company cues include the ${templateId} layout`,()=>{
    assert.ok(recommendDirections({name}).some(direction=>direction.templateId===templateId));
  });
}

test('card text contributes semantic cues without reading image filenames',()=>{
  const project={name:'Acme',cards:[{title:'Vår restaurang',description:'Café med lunch',image:'/consulting.jpg'}]};
  assert.ok(recommendDirections(project).some(direction=>direction.templateId==='dining'));
});

test('image-rich projects get a gallery direction and repeated image references count once',()=>{
  const image='/one.jpg';
  const scarce={hero:image,images:[{url:image}],cards:[{image,gallery:[{url:image}]}]};
  const rich={...scarce,heroGallery:[{url:'/two.jpg'}],cards:[{gallery:[{url:'/three.jpg'}]}]};
  assert.equal(recommendDirections(scarce)[1].templateId,'story');
  assert.equal(recommendDirections(rich)[1].templateId,'retail');
  assert.match(recommendDirections({})[1].reason,/lägger till bilder/);
  assert.doesNotMatch(recommendDirections(rich)[1].reason,/lägger till bilder/);
});

test('unselected image candidates never affect the recommendation or hide the empty image reminder',()=>{
  const candidates={images:[{url:'/one.jpg'},{url:'/two.jpg'},{url:'/three.jpg'}]};
  assert.deepEqual(recommendDirections(candidates),recommendDirections({}));
  assert.deepEqual(recommendDirections({...candidates,hero:'/one.jpg'}),recommendDirections({hero:'/one.jpg'}));
});

test('reasons describe composition without promising colors or fonts that branding overrides',()=>{
  for(const name of ['','Butik','Café','Salong','Bygg','Hotell','Juridik','Arkitektur']) {
    for(const direction of recommendDirections({name})) {
      assert.doesNotMatch(direction.reason,/mörk|ljus|varm|klassisk typografi|typsnitt/i);
    }
  }
});

test('recommendations are deterministic and never change project or previous results',()=>{
  const card=Object.freeze({title:'Jurister',description:'Rådgivning',image:'/team.jpg'});
  const project=Object.freeze({name:'Acme',cards:Object.freeze([card]),images:Object.freeze([])});
  const first=recommendDirections(project),second=recommendDirections(project);
  assert.deepEqual(first,second);
  first[0].reason='Changed by caller';
  assert.deepEqual(recommendDirections(project),second);
});

test('unrelated words do not turn ordinary company information into a dining recommendation',()=>{
  assert.deepEqual(recommendDirections({description:'Information om företaget'}),recommendDirections({}));
});

test('repeated secondary copy does not override the company’s own business heading',()=>{
 const directions=recommendDirections({name:'Klar Advokatbyrå',headline:'Juridisk rådgivning för företag',cards:[{title:'Nyheter',description:'Restaurang café lunch '.repeat(60)}]});
 assert.equal(directions[0].templateId,'consulting');
});
test('partner logos and team portraits are not counted as a product catalogue',()=>{
 const directions=recommendDirections({cards:[{title:'Our partners',gallery:[{url:'/a.png'},{url:'/b.png'},{url:'/c.png'}]},{title:'Team',image:'/team.jpg'}]});
 assert.notEqual(directions[1].templateId,'retail');
});
test('a text-heavy introduction without a hero favours a readable first direction',()=>{
 const directions=recommendDirections({name:'Hotell Utsikten',description:'Vår berättelse. '.repeat(70)});
 assert.equal(directions[0].templateId,'consulting');
 assert.ok(directions.some(d=>d.templateId==='hospitality'));
 assert.match(directions[0].reason,/introduktion/);
});
test('building trust and building software are not construction industry cues',()=>{
 assert.deepEqual(recommendDirections({description:'Vi bygger förtroende genom långsiktiga relationer.'}),recommendDirections({}));
 assert.ok(!recommendDirections({headline:'Skräddarsydda webblösningar',description:'Vi bygger digitala verktyg.'}).some(d=>d.templateId==='construction'));
});
test('many repeated secondary cards cannot outweigh an explicit business name',()=>{
 assert.equal(recommendDirections({name:'Klar Advokatbyrå',cards:Array.from({length:40},()=>({title:'Café',description:'Restaurang med lunch'}))})[0].templateId,'consulting');
});
