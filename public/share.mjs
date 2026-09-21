import { normalizeProject } from './render.mjs';

export async function encodeProject(raw, publicBase) {
  const project = normalizeProject(raw);
  const base = new URL(publicBase);
  if (!['https:', 'http:'].includes(base.protocol)) throw new Error('Demolänkens adress är ogiltig.');
  const absolute = value => value.startsWith('/assets/') ? new URL(value, base).href : value;
  for(const page of [project,...(project.pages||[])]){
    page.images=[];page.warnings=[];page.id='';page.benefits=page.benefits.filter(b=>b.title);
    page.hero=absolute(page.hero);page.logo=absolute(page.logo);
    page.cards.forEach(card=>card.image=absolute(card.image));
  }
  const content = new Blob([JSON.stringify(project)]);
  if(content.size > 1500000) throw new Error('Förslaget innehåller för mycket bilddata för en kundlänk. Välj färre uppladdade bilder eller ladda ner demosidan som HTML.');
  const stream = content.stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  if (encoded.length > 250000) throw new Error('Bilderna gör länken för lång. Välj bilder från företagets hemsida eller ladda ner en fristående demosida.');
  base.hash = 'd=' + encoded;
  return base.href;
}

export async function decodeProject(fragment) {
  const encoded = fragment.replace(/^#?d=/, '');
  if (!encoded || encoded.length > 250000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Länken är ofullständig eller ogiltig. Be avsändaren skicka hela demolänken.');
  const raw = atob(encoded.replaceAll('-','+').replaceAll('_','/'));
  const compressed = Uint8Array.from(raw, c => c.charCodeAt(0));
  const reader = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks = []; let length = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 1500000) { await reader.cancel(); throw new Error('Designförslaget är för stort för att öppnas via länk.'); }
    chunks.push(value);
  }
  const parsed = JSON.parse(await new Blob(chunks).text());
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Länken innehåller inget designförslag.');
  return normalizeProject(parsed);
}
