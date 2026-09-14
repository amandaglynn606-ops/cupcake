// Progressive motion: content remains visible without JavaScript.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const touch=matchMedia('(pointer: coarse)');
const active=new Set();
function play(element,frames,options){
 if(reduced.matches||touch.matches||!element?.animate)return;
 const animation=element.animate(frames,options);active.add(animation);
 animation.finished.catch(()=>{}).finally(()=>active.delete(animation));
}
const timing={duration:850,easing:'cubic-bezier(.22,1,.36,1)'};
document.querySelectorAll('.hero-copy > *, .enquiry-intro > h1, .collection-intro h1').forEach((el,i)=>play(el,[{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'none'}],{...timing,delay:Math.min(i*85,340),fill:'backwards'}));
play(document.querySelector('.hero-photo'),[{opacity:0,clipPath:'inset(6% 0 0 0)'},{opacity:1,clipPath:'inset(0)'}],{...timing,duration:1200});
const seen=new WeakSet();
const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
 for(const entry of entries){
  if(!entry.isIntersecting)continue;
  observer.unobserve(entry.target);
  play(entry.target,[{opacity:.2,transform:'translateY(28px)'},{opacity:1,transform:'none'}],timing);
 }
},{threshold:.08}):null;
function observe(){document.querySelectorAll('.section-heading,.collection-showcase-heading,.hero-art,.wedding-photo,.wedding-copy,.wedding-products .product-card,.collection-tile,.bespoke-photo,.bespoke-copy,.maison-note,.approach-grid article,.process-grid article,.enquiry-help-links,.enquiry-form-wrap').forEach(el=>{if(!seen.has(el)){seen.add(el);observer?.observe(el);}});}
observe();
reduced.addEventListener('change',()=>{if(reduced.matches)for(const animation of active)animation.cancel();});
document.addEventListener('click',event=>{
 const field=event.target.closest('input[type="date"]');
 if(field?.showPicker){try{field.showPicker();}catch{/* Native calendar remains available. */}}
});
function slides(dialog){
 return ['mobile-navigation','mobile-filters'].includes(dialog.id)||(dialog.id==='bag-drawer'&&matchMedia('(max-width:760px)').matches);
}
export function animateDialog(dialog){
 menuTransition(dialog,false);
}
const menuAnimations=new WeakMap();
function menuTransition(dialog,closing){
 const cart=dialog.id==='bag-drawer',sliding=slides(dialog)||dialog.classList.contains('drawer'),offscreen=sliding?(cart?'translateX(100%)':'translateX(-100%)'):'scale(.97)';
 const previous=menuAnimations.get(dialog);
 if(closing&&previous?.closing)return;
 const from=previous?getComputedStyle(dialog).transform:closing?'none':offscreen;
 const opacity=previous?getComputedStyle(dialog).opacity:closing?1:0;
 previous?.animation.cancel();menuAnimations.delete(dialog);
 if(reduced.matches||!dialog.animate){if(closing)dialog.close();return;}
 const animation=dialog.animate([{transform:from,opacity:sliding?1:opacity},{transform:closing?offscreen:'none',opacity:sliding?1:closing?0:1}],{
  duration:closing?260:340,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'
 });
 const entry={animation,closing};menuAnimations.set(dialog,entry);active.add(animation);
 animation.finished.then(()=>{if(closing&&menuAnimations.get(dialog)===entry)dialog.close();}).catch(()=>{
  if(closing&&reduced.matches&&menuAnimations.get(dialog)===entry)dialog.close();
 }).finally(()=>{
  if(menuAnimations.get(dialog)===entry)menuAnimations.delete(dialog);
  active.delete(animation);animation.cancel();
 });
}
export function closeDialog(dialog){
 if(dialog?.open)menuTransition(dialog,true);
}
document.addEventListener('cancel',event=>{if(event.target.matches('dialog')){event.preventDefault();closeDialog(event.target);}},true);
