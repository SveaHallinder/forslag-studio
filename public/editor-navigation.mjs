// Resolve repair links against the actual field so moving a control to another
// tab cannot silently send the user to a hidden input.
export function createEditorNavigation(root=document) {
  const tabs=[...root.querySelectorAll('[data-tab]')];
  function select(name,focus=false) {
    const selected=tabs.find(tab=>tab.dataset.tab===name);
    if(!selected)return false;
    for(const tab of tabs){
      const active=tab===selected;
      tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
      root.getElementById(tab.getAttribute('aria-controls')).hidden=!active;
    }
    if(focus)selected.focus();
    return true;
  }
  for(const tab of tabs){
    tab.addEventListener('click',()=>select(tab.dataset.tab));
    tab.addEventListener('keydown',event=>{
      const index=tabs.indexOf(tab),last=tabs.length-1;
      const next={ArrowRight:(index+1)%tabs.length,ArrowLeft:(index+last)%tabs.length,Home:0,End:last}[event.key];
      if(next===undefined)return;
      event.preventDefault();select(tabs[next].dataset.tab,true);
    });
  }
  function reveal(name,id) {
    const field=root.getElementById(id);
    const panel=field?.closest('[role="tabpanel"]');
    select(panel?tabs.find(tab=>tab.getAttribute('aria-controls')===panel.id)?.dataset.tab:name);
    if(!field)return false;
    for(let parent=field.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
    const target=field.hidden?root.querySelector(`label[for="${field.id}"]`):field;
    if(!target)return false;
    target.scrollIntoView({block:'center'});
    if(field.hidden)target.tabIndex=0;
    target.focus({preventScroll:true});
    return true;
  }
  return {select,reveal};
}
