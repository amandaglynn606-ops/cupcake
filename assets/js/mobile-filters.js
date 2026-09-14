import {animateDialog,closeDialog} from './motion.js';

const phone=matchMedia('(max-width:760px)');
let panel,scrollPosition=null;
function unlock(){
 if(scrollPosition===null)return;
 const top=scrollPosition;scrollPosition=null;
 document.documentElement.classList.remove('mobile-filters-open');
 document.body.style.top='';window.scrollTo({top,behavior:'instant'});
}
export function openFilters(animate=true){
 if(!panel||panel.open)return;
 scrollPosition=window.scrollY;
 document.body.style.top=-scrollPosition+'px';
 document.documentElement.classList.add('mobile-filters-open');
 panel.showModal();
 document.querySelector('#toggle-filters').setAttribute('aria-expanded','true');
 if(animate)animateDialog(panel);
}
export function releaseFilters(){
 const state={open:!!panel?.open,scrollTop:panel?.querySelector('#filters').scrollTop||0};
 if(panel?.open)panel.close();
 unlock();panel=null;
 return state;
}
export function prepareFilters(){
 const sidebar=document.querySelector('#filters'),toggle=document.querySelector('#toggle-filters');
 if(!sidebar||!toggle)return;
 if(!phone.matches){
  const previous=panel;releaseFilters();
  if(previous){previous.before(sidebar);previous.remove();}
  toggle.setAttribute('aria-controls','filters');toggle.setAttribute('aria-expanded','false');
  return;
 }
 if(panel)return;
 const dialog=document.createElement('dialog');
 dialog.id='mobile-filters';dialog.setAttribute('aria-labelledby','mobile-filters-title');
 dialog.innerHTML='<div class="filter-panel-head"><h2 id="mobile-filters-title">Filters</h2><button type="button" data-close aria-label="Close filters"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="filter-panel-foot"><button type="button" class="button" data-close>View cakes</button></div>';
 sidebar.before(dialog);dialog.querySelector('.filter-panel-foot').before(sidebar);panel=dialog;
 toggle.setAttribute('aria-controls',dialog.id);toggle.setAttribute('aria-haspopup','dialog');
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog(dialog);});
 dialog.addEventListener('click',event=>{
  const r=dialog.getBoundingClientRect();
  if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))closeDialog(dialog);
 });
 dialog.addEventListener('close',()=>{
  if(panel!==dialog)return;
  unlock();toggle.setAttribute('aria-expanded','false');toggle.focus({preventScroll:true});
 });
}
phone.addEventListener('change',prepareFilters);
