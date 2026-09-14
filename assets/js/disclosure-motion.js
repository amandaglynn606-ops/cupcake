const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const transitions=new Map();
const easing='cubic-bezier(.22,1,.36,1)';

export function disclosureOpen(element){return transitions.get(element)?.expanded??element.open;}

export function setDisclosure(element,expanded,{immediate=false}={}){
 if(!element)return Promise.resolve();
 const previous=transitions.get(element);
 if(previous?.expanded===expanded&&!immediate)return previous.finished;
 if(!previous&&element.open===expanded)return Promise.resolve();
 const from=element.getBoundingClientRect().height;
 previous?.animation.cancel();transitions.delete(element);
 element.style.overflow='';
 const panel=element.matches('.nav-dropdown')?element.querySelector('.mega-menu'):null;
 element.open=expanded;
 const to=element.getBoundingClientRect().height;
 if(immediate||reduced.matches||!element.animate||!element.getClientRects().length){delete element.dataset.motionOpen;return Promise.resolve();}
 element.open=true;element.dataset.motionOpen=String(expanded);
 if(!panel)element.style.overflow='clip';
 const target=panel||element;
 const animation=target.animate(panel?[{opacity:expanded?0:1},{opacity:expanded?1:0}]:[{height:from+'px'},{height:to+'px'}],{duration:panel?240:360,easing,fill:'both'});
 const entry={animation,expanded,finish(){element.open=expanded;element.style.overflow='';delete element.dataset.motionOpen;}};
 transitions.set(element,entry);
 entry.finished=animation.finished.catch(()=>{}).then(()=>{
  if(transitions.get(element)!==entry)return;
  entry.finish();transitions.delete(element);animation.cancel();
 });
 return entry.finished;
}

export function setPanelVisible(panel,expanded,{immediate=false}={}){
 const previous=transitions.get(panel),from=panel.getBoundingClientRect().height;
 previous?.animation.cancel();transitions.delete(panel);
 panel.hidden=false;panel.style.overflow='';
 const to=expanded?panel.getBoundingClientRect().height:0;
 panel.inert=!expanded;
 if(immediate||reduced.matches||!panel.animate){panel.hidden=!expanded;return;}
 panel.style.overflow='clip';
 const animation=panel.animate([{height:from+'px',opacity:expanded?0:1},{height:to+'px',opacity:expanded?1:0}],{duration:320,easing,fill:'both'});
 const entry={animation,expanded,finish(){panel.hidden=!expanded;panel.style.overflow='';}};
 transitions.set(panel,entry);
 animation.finished.catch(()=>{}).then(()=>{if(transitions.get(panel)!==entry)return;entry.finish();transitions.delete(panel);animation.cancel();});
}

document.addEventListener('click',event=>{
 if(event.defaultPrevented)return;
 const summary=event.target.closest('summary');
 if(!summary||event.target.closest('a,button,input,select'))return;
 const details=summary.parentElement;
 if(!details.matches('.cake-choice,.tier-row,.mobile-cake-menu,.nav-dropdown,.filter-group,.order-message,.product-accordions details,.faq-layout details'))return;
 event.preventDefault();setDisclosure(details,!disclosureOpen(details));
});

reduced.addEventListener('change',()=>{
 if(!reduced.matches)return;
 for(const entry of transitions.values()){entry.finish();entry.animation.cancel();}
 transitions.clear();
});
