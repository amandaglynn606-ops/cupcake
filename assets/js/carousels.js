const reduced=matchMedia('(prefers-reduced-motion: reduce)');
for(const carousel of document.querySelectorAll('[data-carousel]')){
 const track=carousel.querySelector('[data-carousel-track]');
 const prev=carousel.querySelector('[data-carousel-prev]'),next=carousel.querySelector('[data-carousel-next]');
 const status=carousel.querySelector('[data-carousel-status]'),progress=carousel.querySelector('[data-carousel-progress]');
 const cards=[...track.children];
 const auto=carousel.hasAttribute('data-autoplay');
 let timer=null,paused=false,visible=false,hovered=false;
 function schedule(){
  clearInterval(timer);timer=null;
  const playing=!!auto&&!paused&&!reduced.matches&&visible&&!hovered&&!carousel.contains(document.activeElement)&&!document.hidden&&track.scrollWidth>track.clientWidth+2;
  carousel.dataset.motion=playing?'playing':'paused';
  if(playing)timer=setInterval(()=>{
   if(track.scrollLeft>=track.scrollWidth-track.clientWidth-2)track.scrollTo({left:0,behavior:'smooth'});else move(1);
  },5600);
 }
 function pause(){paused=true;schedule();}
 document.addEventListener('keydown',event=>{if(event.key==='Escape')pause();});
 carousel.addEventListener('pointerenter',()=>{hovered=true;schedule();});
 carousel.addEventListener('pointerleave',()=>{hovered=false;schedule();});
 carousel.addEventListener('focusin',schedule);
 carousel.addEventListener('focusout',()=>setTimeout(schedule,0));
 track.addEventListener('pointerdown',pause);
 track.addEventListener('wheel',pause,{passive:true});
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.3}).observe(carousel);
 function update(){
  const max=track.scrollWidth-track.clientWidth;
  prev.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft>=max-2;
  const box=track.getBoundingClientRect();
  const visible=cards.map((card,i)=>({r:card.getBoundingClientRect(),i})).filter(({r})=>r.left<box.right-8&&r.right>box.left+8);
  status.textContent=visible.length?`${visible[0].i+1}–${visible.at(-1).i+1} / ${cards.length}`:'';
  progress.style.width=`${max>0?Math.max(15,100*track.clientWidth/track.scrollWidth):100}%`;
  progress.style.transform=`translateX(${max>0?track.scrollLeft/track.clientWidth*100:0}%)`;
 }
 function move(direction){
  const step=cards[1]?cards[1].offsetLeft-cards[0].offsetLeft:track.clientWidth;
  track.scrollBy({left:direction*step,behavior:reduced.matches?'instant':'smooth'});
 }
 prev.addEventListener('click',()=>{pause();move(-1);});next.addEventListener('click',()=>{pause();move(1);});
 track.addEventListener('keydown',event=>{
  if(event.target!==track)return;
  if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
   pause();
   event.preventDefault();
   if(event.key.startsWith('Arrow'))move(event.key==='ArrowLeft'?-1:1);
   else track.scrollTo({left:event.key==='Home'?0:track.scrollWidth,behavior:reduced.matches?'instant':'smooth'});
  }
 });
 track.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(track);update();
}
