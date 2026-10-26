// A low-detail hint, not an AI verdict that an image is blurry or unsuitable.
// Flat logos/artwork are excluded; every hint remains a non-blocking review item.
export function photoDetail({data,width,height}={}) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||width>256||height>256||!data||data.length<width*height*4)return {soft:false};
  const gray=new Float32Array(width*height);let sum=0,square=0,low=255,high=0;
  for(let i=0;i<gray.length;i++){const n=i*4,value=.2126*data[n]+.7152*data[n+1]+.0722*data[n+2];gray[i]=value;sum+=value;square+=value*value;low=Math.min(low,value);high=Math.max(high,value);}
  let energy=0,count=0;
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const i=y*width+x,edge=gray[i]*4-gray[i-1]-gray[i+1]-gray[i-width]-gray[i+width];energy+=edge*edge;count++;}
  const variance=square/gray.length-(sum/gray.length)**2,score=energy/count;
  return {soft:variance>324&&high-low>60&&score<10,detail:Math.round(score*100)/100};
}
