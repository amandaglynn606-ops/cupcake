import {setDisclosure,setPanelVisible} from './disclosure-motion.js';
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
  setPanelVisible(panel,!phone.matches,{immediate:true});
 }
}
for(const button of footerToggles)button.addEventListener('click',()=>{
 const panel=document.getElementById(button.getAttribute('aria-controls'));
 const expanded=button.getAttribute('aria-expanded')!=='true';
 setPanelVisible(panel,expanded);button.setAttribute('aria-expanded',String(expanded));
});
phone.addEventListener('change',resetFooter);resetFooter();
if(trigger&&drawer){
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
 menu.addEventListener('focusout',()=>setTimeout(()=>{if(!menu.contains(document.activeElement))setDisclosure(menu,false);},0));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){setDisclosure(menu,false);menu.querySelector('summary').focus({preventScroll:true});}},true);
 matchMedia('(max-width:1100px)').addEventListener('change',event=>{if(event.matches)setDisclosure(menu,false,{immediate:true});});
}
