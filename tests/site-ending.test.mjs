import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProject,escapeHTML} from '../public/render.mjs';
import {renderSiteEnding,siteEndingCSS} from '../public/site-ending.mjs';

const ending=raw=>renderSiteEnding(normalizeProject(raw),escapeHTML,(url,alt)=>`<img src="${escapeHTML(url)}" alt="${escapeHTML(alt)}">`);

test('confirmed booking routes are labelled as booking while request forms retain their meaning',()=>{
  const id=crypto.randomUUID();
  const native=ending({requestForm:{kind:'booking',url:'https://studio.example.com/booking.html?form='+id}}).contact;assert.match(native,/ending-label">Bokning</);assert.match(native,/Boka besök/);assert.doesNotMatch(native,/bokningsförfrågan/i);
  const request=ending({requestForm:{kind:'booking',url:'https://studio.example.com/contact.html?form='+id}}).contact;assert.match(request,/Skicka bokningsförfrågan/);
});

test('contact ending uses real email, phone and address while preserving editor targets',()=>{
  const {contact}=ending({name:'Åkes ateljé',cta:'Köp kollektionen',ctaHref:'https://example.com/shop',email:'hej@example.com',phone:'+46 (0) 70-123 45 67',address:'Torget 2\nStockholm'});
  assert.match(contact,/class="contact site-contact" id="kontakt"/);
  assert.match(contact,/class="contact-links"/);
  assert.match(contact,/<h2>Kontakt<span/);
  assert.match(contact,/href="mailto:hej@example.com"/);
  assert.match(contact,/href="tel:\+460701234567"/);
  assert.match(contact,/Torget 2\nStockholm/);
  assert.doesNotMatch(contact,/Köp kollektionen|\/shop/);
});

test('missing contacts produce a compact honest state, never a dead contact CTA',()=>{
  const {contact,footer}=ending({name:'Företaget'});
  assert.match(contact,/data-contact="empty"/);
  assert.match(contact,/Kontaktuppgifter saknas/);
  assert.doesNotMatch(contact,/<a |ending-action/);
  assert.doesNotMatch(footer,/href="(?:mailto:|tel:|https?:)/);
  const sourceEnding=ending({source:'https://example.com/',cta:'Handla nu'});
  assert.match(sourceEnding.contact,/data-contact="website"/);
  assert.match(sourceEnding.contact,/href="https:\/\/example.com\/"/);
  assert.match(sourceEnding.contact,/aria-label="Besök webbplatsen"/);
  assert.doesNotMatch(sourceEnding.contact,/Handla nu/);
});

test('original contact pages are usable while self-referential anchors do not become CTAs',()=>{
  const {contact}=ending({navigation:[{label:'Kontakt',href:'https://example.com/contact'}]});
  assert.match(contact,/data-contact="available"/);
  assert.match(contact,/href="https:\/\/example.com\/contact"/);
  assert.match(contact,/target="_blank" rel="noopener noreferrer"/);
  assert.match(ending({navigation:[{label:'Kontakt',href:'#kontakt'}]}).contact,/data-contact="empty"/);
});

test('footer keeps every source menu label and destination, including pages and anchors',()=>{
  const navigation=[{label:'Om oss',href:'https://example.com/about'},{label:'Utvalt',href:'#erbjudande'},{label:'Boka',href:'https://example.com/book'}];
  const {footer}=ending({name:'Ateljén',source:'https://example.com/',navigation});
  assert.match(footer,/aria-label="Sidfotsmeny"/);
  for(const link of navigation)assert.ok(footer.includes(`href="${link.href}"`)&&footer.includes(`>${link.label}</a>`));
  assert.match(footer,/class="source">Designförslag · Innehåll och bilder från <a/);
  assert.match(footer,/class="ending-top" href="#start"/);
  assert.doesNotMatch(footer,/class="brand"|class="nav-links"|instagram|facebook|copyright/i);
});

test('unsafe and long source content stays escaped and has a wrap-safe presentation',()=>{
  const name='Ett mycket långt företagsnamn & partners med flera verksamheter <script>bad</script>';
  const {contact,footer}=ending({name,address:'<img src=x onerror=alert(1)>',source:'https://user:secret@example.com/',navigation:[{label:'<img>',href:'javascript:alert(1)'}]});
  assert.match(footer,/data-name-length="extended"/);
  assert.ok(footer.includes(escapeHTML(name)));
  assert.match(contact,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(contact+footer,/<script>|<img src=x|javascript:|secret@example/);
  assert.match(siteEndingCSS(normalizeProject({})),/overflow-wrap:anywhere/);
});

test('logo and wordmark use separate footer selectors and tone follows the chosen design',()=>{
  for(const [templateId,tone] of [['atelier','editorial'],['cinema','atmospheric'],['pop','playful'],['precision','structured']]){
    const p=normalizeProject({templateId,name:'Nord',logo:'https://example.com/logo.svg',accent:'#ffe000'}),result=renderSiteEnding(p,escapeHTML,(url,alt)=>`<img src="${url}" alt="${alt}">`);
    assert.match(result.contact,new RegExp(`data-ending="${tone}"`));
    assert.match(result.footer,new RegExp(`data-ending="${tone}"`));
    assert.match(result.footer,/class="ending-logo"/);
    assert.match(result.footer,/class="ending-wordmark"/);
    assert.equal((result.footer.match(/<img /g)||[]).length,1);
    assert.doesNotMatch(siteEndingCSS(p),/undefined|NaN/);
  }
});
