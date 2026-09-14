import {$,syncSaved,toast} from './app.js';
import {prepareFilters,openFilters,releaseFilters} from './mobile-filters.js';
prepareFilters();
let controller,timer;
async function navigate(url,push=true){
 controller?.abort();controller=new AbortController();
 const section=$('.shop-section');section.setAttribute('aria-busy','true');
 try{
  const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw new Error('The collection could not be loaded.');
  const html=await response.text();const parsed=new DOMParser().parseFromString(html,'text/html');const replacement=parsed.querySelector('#shop-content');
  if(!replacement)throw new Error('The collection could not be loaded.');
  const focusName=document.activeElement?.name,focusValue=document.activeElement?.value;
  const mobile=releaseFilters();
  $('#shop-content').replaceWith(replacement);const headerSearch=$('#site-search');if(headerSearch)headerSearch.value=parsed.querySelector('#site-search')?.value||'';document.title=parsed.title;if(push)history.pushState({},'',url);
  prepareFilters();
  if(mobile.open){openFilters(false);$('#filters').scrollTop=mobile.scrollTop;}
  if(focusName){const field=[...document.querySelectorAll('[name]')].find(el=>el.name===focusName&&(el.type!=='checkbox'||el.value===focusValue));field?.focus({preventScroll:true});}
  syncSaved();
 }catch(error){if(error.name!=='AbortError')toast(error.message);}finally{if(!controller.signal.aborted)section.removeAttribute('aria-busy');}
}
function submit(){const form=$('#filter-form');if(!form)return;const params=new URLSearchParams(new FormData(form));for(const [key,value]of [...params])if(!value||key==='sort'&&value==='featured')params.delete(key);navigate(form.action.split('?')[0]+(params.size?'?'+params:''));}
document.addEventListener('submit',event=>{if(event.target.id==='filter-form'){event.preventDefault();clearTimeout(timer);submit();}});
document.addEventListener('change',event=>{if(event.target.closest('#filter-form')&&(event.target.matches('select')||event.target.type==='checkbox')){clearTimeout(timer);submit();}});
document.addEventListener('input',event=>{if(event.target.matches('#filter-form input[name=q]')){clearTimeout(timer);timer=setTimeout(submit,350);}});
document.addEventListener('click',event=>{
 const toggle=event.target.closest('#toggle-filters');
 if(toggle){openFilters();return;}
 const anchor=event.target.closest('[data-shop-link]');
 if(anchor&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){event.preventDefault();clearTimeout(timer);navigate(anchor.href);if(anchor.closest('.pagination'))$('#shop').scrollIntoView();}
});
window.addEventListener('popstate',()=>navigate(location.href,false));

