// Only remove a clearly uniform neutral/transparent frame, never guess a
// background from an average or discard small disconnected logo accents.
export function logoBounds(pixels,width,height) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||!pixels||pixels.length!==width*height*4)return null;
  let neutral;
  const background=index=>pixels[index+3]<=8||!!neutral&&pixels[index+3]>=250&&[0,1,2].every(channel=>Math.abs(pixels[index+channel]-neutral[channel])<=6);
  const border=index=>{
    if(pixels[index+3]<=8)return true;
    if(!neutral){
      const color=Array.from(pixels.slice(index,index+3));
      if(pixels[index+3]<250||!(color.every(v=>v>=245)||color.every(v=>v<=10)))return false;
      neutral=color;
    }
    return background(index);
  };
  for(let x=0;x<width;x++)if(!border(x*4)||!border(((height-1)*width+x)*4))return null;
  for(let y=0;y<height;y++)if(!border(y*width*4)||!border((y*width+width-1)*4))return null;
  let left=width,top=height,right=-1,bottom=-1,ink=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    if(background((y*width+x)*4))continue;
    ink++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(ink<Math.max(8,width*height*.0005))return null;
  const padding=Math.max(2,Math.ceil(Math.max(right-left+1,bottom-top+1)*.03));
  left=Math.max(0,left-padding);top=Math.max(0,top-padding);right=Math.min(width-1,right+padding);bottom=Math.min(height-1,bottom+padding);
  const result={x:left,y:top,width:right-left+1,height:bottom-top+1};
  return result.width*result.height<=width*height*.8?result:null;
}

export async function trimLogoBlob(blob) {
  const url=URL.createObjectURL(blob),image=new Image();let timer;
  try{
    await new Promise((resolve,reject)=>{
      timer=setTimeout(()=>reject(new Error('[logo framing] Logotypen kunde inte läsas inom 10 sekunder.')),10000);
      image.onload=resolve;image.onerror=()=>reject(new Error('[logo framing] Logotypens bildformat kunde inte läsas.'));image.src=url;
    });
    if(!image.naturalWidth||!image.naturalHeight)throw new Error('[logo framing] Logotypen saknar giltiga bildmått.');
    const scale=Math.min(1,1024/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context)throw new Error('[logo framing] Bildytan kunde inte skapas.');
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const bounds=logoBounds(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
    if(!bounds)return null;
    const output=document.createElement('canvas');output.width=bounds.width;output.height=bounds.height;
    const target=output.getContext('2d');if(!target)throw new Error('[logo framing] Bildytan kunde inte skapas.');
    target.drawImage(canvas,bounds.x,bounds.y,bounds.width,bounds.height,0,0,bounds.width,bounds.height);
    return output.toDataURL('image/png');
  }finally{clearTimeout(timer);image.onload=null;image.onerror=null;URL.revokeObjectURL(url);}
}
