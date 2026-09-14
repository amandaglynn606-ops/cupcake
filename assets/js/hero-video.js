const hero=document.querySelector('.video-hero');
if(hero){
 const video=hero.querySelector('video');
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:760px)');
 let visible=false,stopped=false,failed=false,ready=false;
 function afterLoad(){
  const start=()=>{ready=true;update();};
  if(window.requestIdleCallback)requestIdleCallback(start,{timeout:1200});else setTimeout(start,0);
 }
 if(document.readyState==='complete')afterLoad();else window.addEventListener('load',afterLoad,{once:true});
 function update(){
  const allowed=!motion.matches&&!navigator.connection?.saveData&&!stopped&&!failed;
  if(!allowed){video.pause();hero.dataset.videoState='still';return;}
  if(!ready||!visible||document.hidden){
   video.pause();if(video.currentTime>0)hero.dataset.videoState='paused';return;
  }
  if(!video.getAttribute('src'))video.src=mobile.matches?video.dataset.mobileSrc:video.dataset.desktopSrc;
  video.muted=true;
  if(!video.paused)return;
  video.play().catch(()=>{if(!video.paused)return;hero.dataset.videoState='still';});
 }
 video.addEventListener('playing',()=>{hero.dataset.videoState='playing';});
 video.addEventListener('error',()=>{failed=true;hero.dataset.videoState='still';});
 document.addEventListener('visibilitychange',update);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){stopped=true;update();}});
 motion.addEventListener('change',update);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:.1}).observe(hero);
}
