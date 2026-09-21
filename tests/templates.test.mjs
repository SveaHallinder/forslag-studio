import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProject, renderDemo } from '../public/render.mjs';
import { encodeProject, decodeProject } from '../public/share.mjs';
import { restoreProject } from '../public/project-tools.mjs';

test('older projects and unknown template IDs keep the original layout',()=>{
  for(const templateId of [undefined,'future-template','"><script>']) {
    assert.equal(normalizeProject({templateId}).templateId,'story');
    assert.match(renderDemo({templateId}),/data-template="story"/);
  }
});

for(const templateId of ['story','studio','services','dining','wellness','retail']) {
  test(`${templateId} survives project copies and public links without losing content`,async()=>{
    const original={name:'Åkes ateljé',headline:'Rum för bättre idéer',templateId,heroPosition:0,hero:'/assets/hero.jpg',cards:[{title:'Vårt arbete',description:'En egen beskrivning',image:'/assets/city.png'}],benefits:[{title:'Lokalt',description:'Nära dig'}]};
    const restored=restoreProject(JSON.stringify({...original,id:'source'}));
    assert.equal(restored.templateId,templateId);
    assert.equal(restored.id,'');
    const link=await encodeProject(restored,'https://demo.example.com');
    const decoded=await decodeProject(new URL(link).hash);
    assert.equal(decoded.templateId,templateId);
    assert.equal(decoded.headline,original.headline);
    assert.deepEqual(decoded.cards[0],{...original.cards[0],image:'https://demo.example.com/assets/city.png'});
    assert.equal(decoded.heroPosition,0);
    const html=renderDemo(decoded);
    assert.match(html,new RegExp(`data-template="${templateId}"`));
    assert.equal((html.match(/<h1>/g)||[]).length,1);
    for(const text of ['Åkes ateljé','Vårt arbete','En egen beskrivning','Lokalt','Nära dig'])assert.ok(html.includes(text));
  });
  test(`${templateId} handles text-only projects and untrusted content`,()=>{
    const html=renderDemo({templateId,name:'<script>evil</script>',headline:'Välkommen',cards:[],email:'bad"email',about:''});
    assert.match(html,new RegExp(`data-template="${templateId}"`));
    assert.doesNotMatch(html,/<script>|src=""|mailto:|id="om"|id="erbjudande"/);
    assert.match(html,/Kontaktuppgifter saknas/);
  });
}
