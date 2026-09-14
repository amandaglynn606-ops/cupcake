const phone=matchMedia('(max-width:760px)'),originals=new WeakMap();
export function arrangeMobileCards(){
 if(document.body.dataset.page==='/')return;
 const group=phone.matches&&(!document.querySelector('[name=sort]')||document.querySelector('[name=sort]').value==='featured');
 for(const grid of document.querySelectorAll('.product-grid:not(.carousel-track)')){
  const current=[...grid.children];if(!current.every(c=>c.matches('.product-card')))continue;
  let original=originals.get(grid);
  if(!original||original.length!==current.length||current.some(c=>!original.includes(c))){original=current;originals.set(grid,original);}
  const ordered=group?[...original].sort((a,b)=>Number(a.dataset.imageRatio||1)-Number(b.dataset.imageRatio||1)):original;
  if(ordered.some((card,i)=>card!==current[i])){
   const focused=grid.contains(document.activeElement)?document.activeElement:null;
   grid.replaceChildren(...ordered);focused?.focus({preventScroll:true});
  }
 }
}
phone.addEventListener('change',arrangeMobileCards);
