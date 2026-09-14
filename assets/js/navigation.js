const menu=document.querySelector('.zavi-header .nav-dropdown');
const trigger=document.querySelector('[data-open="mobile-navigation"]');
const drawer=document.querySelector('#mobile-navigation');
if(trigger&&drawer){
 trigger.setAttribute('aria-controls',drawer.id);
 trigger.setAttribute('aria-expanded','false');
 new MutationObserver(()=>trigger.setAttribute('aria-expanded',String(drawer.open))).observe(drawer,{attributes:true,attributeFilter:['open']});
 matchMedia('(min-width:1101px)').addEventListener('change',event=>{if(event.matches&&drawer.open)drawer.close();});
}
if(menu){
 menu.addEventListener('focusout',()=>setTimeout(()=>{if(!menu.contains(document.activeElement))menu.open=false;},0));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}},true);
 matchMedia('(max-width:1100px)').addEventListener('change',event=>{if(event.matches)menu.open=false;});
}
