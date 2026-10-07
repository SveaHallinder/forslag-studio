const identity=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z\d]/g,'');

// A blocked first platform must not prevent the remaining profiles from being read.
// Combine photos only when the readable profiles have a matching business name
// or handle. Different businesses are left for the user to review separately.
export async function readSocialProfiles(profiles,fetcher=fetch) {
  const unique=[...new Map(profiles.map(profile=>[profile.url,profile])).values()];
  const results=await Promise.all(unique.map(async profile=>{
    try{
      const response=await fetcher('/api/social',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:profile.url}),signal:AbortSignal.timeout(30000)});
      const value=await response.json();
      return {profile,value:response.ok?value:{status:'limited',warning:value.error||'Profilen kunde inte läsas.'}};
    }catch{return {profile,value:{status:'limited',warning:'Profilen kunde inte läsas. Lägg in företagets underlag manuellt.'}};}
  }));
  const readable=results.filter(result=>result.value.status==='read'),first=readable[0];
  if(!first)return {status:'limited',warning:'Ingen av profilerna gav läsbart företagsinnehåll. Klistra in profiltexten och lägg till företagets bilder. Ditt öppna förslag är kvar.',photos:[]};
  const matched=readable.filter(result=>result===first||(identity(result.value.name)&&identity(result.value.name)===identity(first.value.name))||(identity(result.profile.handle)&&identity(result.profile.handle)===identity(first.profile.handle)));
  const photos=[...new Map(matched.flatMap(result=>result.value.photos||[]).map(photo=>[photo.url,photo])).values()].slice(0,8);
  const missing=results.length-readable.length,conflicts=readable.length-matched.length;
  const bio=matched.map(result=>result.value.bio).find(Boolean)||'';
  return {...first.value,bio,photos,warning:`${readable.length} av ${results.length} profiler kunde läsas. ${missing?'Blockerade profiler kan kompletteras manuellt. ':''}${conflicts?'Profiler med olika företagsnamn hölls isär. Kontrollera att länkarna hör till samma företag. ':''}Kontrollera profiltext och bildroller. Profilbilden väljs separat som logotyp.`};
}
