import {$,syncSaved,toast} from './app.js';
let controller,timer;
async function navigate(url,push=true){
 controller?.abort();controller=new AbortController();
 const section=$('.shop-section');section.setAttribute('aria-busy','true');
 const focusName=document.activeElement?.name,focusValue=document.activeElement?.value;
 const mobileOpen=$('#filters')?.classList.contains('is-open');
 try{
  const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw new Error('The collection could not be loaded.');
  const html=await response.text();const parsed=new DOMParser().parseFromString(html,'text/html');const replacement=parsed.querySelector('#shop-content');
  if(!replacement)throw new Error('The collection could not be loaded.');
  $('#shop-content').replaceWith(replacement);const headerSearch=$('#site-search');if(headerSearch)headerSearch.value=parsed.querySelector('#site-search')?.value||'';document.title=parsed.title;if(push)history.pushState({},'',url);
  if(mobileOpen){$('#filters')?.classList.add('is-open');$('#toggle-filters')?.setAttribute('aria-expanded','true');}
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
 if(toggle){const open=$('#filters').classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));return;}
 const anchor=event.target.closest('[data-shop-link]');
 if(anchor&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){event.preventDefault();clearTimeout(timer);navigate(anchor.href);if(anchor.closest('.pagination'))$('#shop').scrollIntoView();}
});
window.addEventListener('popstate',()=>navigate(location.href,false));

