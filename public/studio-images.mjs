// Image bytes belong in the project and image elements, never repeated in every
// <option>. These references live only for the current editor render.
export function createStudioImageOptions(escape) {
  const urls=new Map(),references=new Map();let next=0;
  function reference(url) {
    if(!references.has(url)){const key='image-'+next++;references.set(url,key);urls.set(key,url);}
    return references.get(url);
  }
  return {
    options(images,selected='') {
      const items=[...images];
      if(selected&&!items.some(item=>item.url===selected))items.unshift({url:selected,label:'Vald bild'});
      return items.map((image,i)=>`<option value="${reference(image.url)}"${image.url===selected?' selected':''}>${escape(image.label||'Bild '+(i+1))}</option>`).join('');
    },
    resolve(value) {return value===''?'':urls.get(value)??null;},
    clear() {urls.clear();references.clear();},
  };
}
