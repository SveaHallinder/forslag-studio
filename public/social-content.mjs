const clean=(value,limit=6000)=>String(value??'').replace(/\u0000/g,'').trim().slice(0,limit);
const entities=value=>String(value||'').replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi,(_,key)=>({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'})[key.toLowerCase()]??String.fromCodePoint(Math.min(0x10ffff,parseInt(key.slice(key[1]?.toLowerCase()==='x'?2:1),key[1]?.toLowerCase()==='x'?16:10)||32)));
const plain=value=>clean(entities(value).replace(/<[^>]*>/g,' '));
const blocked=/^(?:accounts|login|signup|explore|p|reel|reels|stories|share|watch|videos|photo|photos|sharer|help|privacy|legal|about)$/i;

export function socialProfileURL(value) {
  let url;try{url=new URL(String(value||'').includes('://')?value:'https://'+value);}catch{throw new Error('Klistra in en fullständig länk till företagets Instagram-, Facebook- eller TikTok-profil.');}
  const host=url.hostname.toLowerCase(),parts=url.pathname.split('/').filter(Boolean);
  if(url.protocol!=='https:'||url.username||url.password||url.port)throw new Error('Använd en offentlig https-länk till företagets profil.');
  let platform,handle;
  if(['instagram.com','www.instagram.com'].includes(host)&&parts.length===1&&!blocked.test(parts[0])&&/^[a-z\d._]{1,30}$/i.test(parts[0])){platform='Instagram';handle=parts[0];url.hostname='www.instagram.com';}
  else if(['facebook.com','www.facebook.com','m.facebook.com'].includes(host)&&parts.length===1&&!blocked.test(parts[0])&&/^[a-z\d._-]{1,100}$/i.test(parts[0])&&parts[0]!=='profile.php'){platform='Facebook';handle=parts[0];url.hostname='www.facebook.com';}
  else if(['tiktok.com','www.tiktok.com'].includes(host)&&parts.length===1&&/^@[a-z\d._]{1,30}$/i.test(parts[0])){platform='TikTok';handle=parts[0].slice(1);url.hostname='www.tiktok.com';}
  else throw new Error('Länka till själva företagsprofilen på Instagram, Facebook eller TikTok, inte ett inlägg, en delningslänk eller en inloggningssida.');
  url.hash='';url.search='';url.pathname='/'+parts[0]+'/';
  return {url:url.href,platform,handle};
}

function publicImage(value) {
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname.includes('.')&&!/(^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname)&&!/^\d[\d.]*$/.test(u.hostname)?u.href:'';}catch{return '';}
}
function metadata(html) {
  const values={};
  for(const tag of html.matchAll(/<meta\b[^>]*>/gi)){
    const attrs=Object.fromEntries([...tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1].toLowerCase(),entities(m[2]??m[3])]));
    const key=attrs.property||attrs.name;if(key&&attrs.content)values[key.toLowerCase()]=attrs.content;
  }
  return values;
}

export function socialProfileDetails(bio) {
  const lines=String(bio||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const address=lines.find(line=>/^(?:📍|address\s*:|adress\s*:|adresa\s*:)/i.test(line));
  const hours=lines.filter(line=>/^(?:weekdays|weekends|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|mån(?:dag)?|tis(?:dag)?|ons(?:dag)?|tor(?:sdag)?|fre(?:dag)?|lör(?:dag)?|sön(?:dag)?|luni|marți|miercuri|joi|vineri|sâmbătă|duminică)\b/i.test(line)&&/\d{1,2}[:.]\d{2}/.test(line));
  return {address:address?address.replace(/^(?:📍|address\s*:|adress\s*:|adresa\s*:)\s*/i,''):'',hours:hours.join('\n')};
}

// Only public HTML and JSON data are read. Source scripts are never executed.
// A profile avatar is kept separate from post photos, and never becomes a hero.
export function extractSocialProfile(html,value) {
  const profile=socialProfileURL(value),meta=metadata(html),photos=[];let node,visits=0;
  const walk=(entry,depth=0)=>{
    if(!entry||typeof entry!=='object'||depth>24||++visits>12000)return;
    if(!Array.isArray(entry)&&String(entry.username||entry.uniqueId||'').toLowerCase()===profile.handle.toLowerCase()&&(typeof entry.biography==='string'||typeof entry.signature==='string'))node=entry;
    for(const child of Object.values(entry))if(typeof child==='object')walk(child,depth+1);
  };
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{walk(JSON.parse(match[1]));}catch{}
  }
  if(node){
    const posts=node.edge_owner_to_timeline_media?.edges||node.posts||[];
    for(const entry of posts.slice(0,12)){
      const post=entry.node||entry,candidates=post.display_resources||[],largest=[...candidates].sort((a,b)=>(b.config_width||0)-(a.config_width||0))[0];
      const url=publicImage(largest?.src||post.display_url||post.image?.url);
      if(url&&!photos.some(photo=>photo.url===url))photos.push({url,label:plain(post.edge_media_to_caption?.edges?.[0]?.node?.text||post.caption||'Bild från '+profile.platform).slice(0,160)});
    }
  }
  const title=plain(meta['og:title']||meta['twitter:title']||'').replace(/\s*\(@[^)]+\)\s*[•|\-–].*$/,'').replace(/\s*[•|\-–]\s*(?:Instagram|Facebook|TikTok).*$/i,'').trim();
  const generic=/^(?:Instagram|Facebook|TikTok|Log in|Login|Sign in|Page not found|Inloggning|Se connecter)$/i;
  const name=plain(node?.full_name||node?.nickname||(!generic.test(title)?title:'')).slice(0,100);
  let bio=plain(node?.biography||node?.signature||meta['og:description']||meta.description||'');
  // Platform counters and boilerplate are not the company's biography.
  if(!node&&profile.platform==='Instagram'){
    const quoted=bio.match(/(?:on Instagram:\s*)["“]([\s\S]+)["”]\s*$/i);bio=quoted?quoted[1]:/followers|following|posts|photos and videos|log in|sign up/i.test(bio)?'':bio;
  }
  if(/log in to|sign up for|connect with friends|create an account|logga in för/i.test(bio))bio='';
  const avatar=publicImage(node?.profile_pic_url_hd||node?.profile_pic_url||node?.avatarLarger||meta['og:image']);
  const titleHandle=String(meta['og:title']||'').match(/\(@([a-z\d._]+)\)/i)?.[1];
  const usable=!!name&&!!bio&&(!titleHandle||titleHandle.toLowerCase()===profile.handle.toLowerCase());
  return {...profile,status:usable?'read':'limited',name:usable?name:'',bio:usable?bio:'',avatar:usable?avatar:'',photos:usable?photos:[],warning:usable?'Kontrollera profiltexten och välj vilka bilder som ska användas. Profilbilden är inte automatiskt en logotyp.':'Profilen gav inget säkert läsbart företagsinnehåll. Klistra in profiltexten och lägg till företagets bilder nedan. Din nuvarande version är kvar.'};
}
