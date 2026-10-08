export async function completeBrowserImport(response,fetcher=fetch) {
  if(response.status!==202)return response;
  const initial=await response.json();if(!/^[-a-z0-9]{36}$/.test(initial.jobId||''))throw new Error('Importkön svarade utan ett giltigt jobb. Ditt utkast finns kvar.');
  const deadline=Date.now()+110_000;
  while(Date.now()<deadline){
    await new Promise(resolve=>setTimeout(resolve,1000));
    const next=await fetcher('/api/browser-job/'+initial.jobId,{signal:AbortSignal.timeout(10000)});
    if(!next.ok)return next;
    const data=await next.json();
    if(data.state==='complete')return new Response(JSON.stringify(data.result),{headers:{'Content-Type':'application/json'}});
  }
  throw new Error('Importen tog för lång tid. Kontrollera att Macen är igång och försök igen. Ditt utkast finns kvar.');
}
