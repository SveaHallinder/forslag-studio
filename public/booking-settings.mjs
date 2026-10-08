export function normalizeCustomerSetup(raw={}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))raw={};
  let timeZone='Europe/Stockholm';try{new Intl.DateTimeFormat('sv-SE',{timeZone:raw.timeZone});if(typeof raw.timeZone==='string')timeZone=raw.timeZone;}catch{}
  const slots=[...new Set((Array.isArray(raw.slots)?raw.slots:[]).filter(value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value))].sort().slice(0,60);
  const duration=Number(raw.duration),capacity=Number(raw.capacity);
  return {timeZone,duration:Number.isFinite(duration)&&duration>0?Math.min(240,Math.max(15,Math.round(duration/15)*15)):60,capacity:Number.isFinite(capacity)&&capacity>0?Math.min(100,Math.max(1,Math.floor(capacity))):1,slots,notifyTeam:raw.notifyTeam===true};
}

export function validateCustomerSetup(raw,{requireSlots=false,now=Date.now()}={}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Bokningsupplägget är ogiltigt. Öppna kundflöden igen.');
  try{if(typeof raw.timeZone!=='string'||raw.timeZone.length>100)throw 0;new Intl.DateTimeFormat('sv-SE',{timeZone:raw.timeZone});}catch{throw new Error('Välj en giltig tidszon för företaget.');}
  if(!Number.isSafeInteger(Number(raw.duration))||Number(raw.duration)<15||Number(raw.duration)>240||Number(raw.duration)%15)throw new Error('Besökslängden måste vara 15–240 minuter i steg om 15.');
  if(!Number.isSafeInteger(Number(raw.capacity))||Number(raw.capacity)<1||Number(raw.capacity)>100)throw new Error('Ange ett helt antal platser mellan 1 och 100.');
  const setup=normalizeCustomerSetup(raw);
  if(!Array.isArray(raw.slots)||setup.slots.length!==raw.slots.length)throw new Error('Ange högst 60 unika tillfällen med giltigt datum och klockslag.');
  if(requireSlots&&!setup.slots.some(slot=>Date.parse(slot)>now))throw new Error('Lägg till minst en tid i framtiden.');
  if(setup.slots.some((slot,index)=>index&&Date.parse(slot)-Date.parse(setup.slots[index-1])<setup.duration*60_000))throw new Error('Tiderna överlappar. Flytta tillfällena eller minska besökslängden.');
  return setup;
}

export function zonedSlot(value,timeZone) {
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw new Error('Välj ett giltigt datum och klockslag.');
  const desired=Date.parse(value+':00Z');if(!Number.isFinite(desired)||new Date(desired).toISOString().slice(0,16)!==value)throw new Error('Datumet är ogiltigt.');
  const format=new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const local=timestamp=>{const parts=Object.fromEntries(format.formatToParts(new Date(timestamp)).map(part=>[part.type,part.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;};
  let utc=desired;for(let i=0;i<3;i++)utc+=desired-Date.parse(local(utc)+':00Z');
  if(local(utc)!==value)throw new Error('Klockslaget finns inte i den valda tidszonen. Välj en annan tid.');
  if([-180,-150,-120,-90,-60,-30,30,60,90,120,150,180].some(minutes=>local(utc+minutes*60_000)===value))throw new Error('Klockslaget inträffar två gånger vid tidsomställningen. Välj en annan tid.');
  return new Date(utc).toISOString();
}
