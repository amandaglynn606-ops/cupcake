const menu=document.querySelector('.zavi-header .nav-dropdown');
const trigger=document.querySelector('[data-open="mobile-navigation"]');
const drawer=document.querySelector('#mobile-navigation');
const phone=matchMedia('(max-width:760px)');
const footerToggles=[...document.querySelectorAll('.footer-toggle')];
function resetFooter(){
 for(const button of footerToggles){
  const panel=document.getElementById(button.getAttribute('aria-controls'));
  button.disabled=!phone.matches;
  button.setAttribute('aria-expanded',String(!phone.matches));
  panel.hidden=phone.matches;
 }
}
for(const button of footerToggles)button.addEventListener('click',()=>{
 const panel=document.getElementById(button.getAttribute('aria-controls'));
 panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));
});
phone.addEventListener('change',resetFooter);resetFooter();
if(trigger&&drawer){
 const group=drawer.querySelector('.mobile-cake-menu'),summary=group?.querySelector('summary');
 let expansion=null;
 summary?.addEventListener('click',event=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!group.animate)return;
  event.preventDefault();
  const expanded=!(expansion?expansion.expanded:group.open),from=group.getBoundingClientRect().height;
  expansion?.animation.cancel();group.open=true;
  const to=expanded?group.scrollHeight:summary.getBoundingClientRect().height;
  group.style.overflow='hidden';
  const animation=group.animate([{height:from+'px'},{height:to+'px'}],{duration:180,easing:'cubic-bezier(.2,.7,.2,1)'});
  const current={animation,expanded};expansion=current;
  animation.finished.then(()=>{if(expansion===current)group.open=expanded;}).catch(()=>{}).finally(()=>{
   if(expansion===current){expansion=null;group.style.overflow='';}
  });
 });
 trigger.setAttribute('aria-controls',drawer.id);
 trigger.setAttribute('aria-expanded','false');
 let scrollPosition=null;
 function syncDrawer(){
  trigger.setAttribute('aria-expanded',String(drawer.open));
  if(drawer.open&&scrollPosition===null){
   scrollPosition=window.scrollY;
   document.body.style.top=-scrollPosition+'px';
   document.documentElement.classList.add('mobile-menu-open');
  }else if(!drawer.open&&scrollPosition!==null){
   const restore=scrollPosition;scrollPosition=null;
   document.documentElement.classList.remove('mobile-menu-open');
   document.body.style.top='';window.scrollTo({top:restore,behavior:'instant'});
  }
 }
 new MutationObserver(syncDrawer).observe(drawer,{attributes:true,attributeFilter:['open']});
 drawer.addEventListener('close',syncDrawer);
 matchMedia('(min-width:1101px)').addEventListener('change',event=>{if(event.matches&&drawer.open)drawer.close();});
}
if(menu){
 menu.addEventListener('focusout',()=>setTimeout(()=>{if(!menu.contains(document.activeElement))menu.open=false;},0));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}},true);
 matchMedia('(max-width:1100px)').addEventListener('change',event=>{if(event.matches)menu.open=false;});
}
