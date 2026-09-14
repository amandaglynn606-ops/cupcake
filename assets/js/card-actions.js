import {getCart,setCart,renderCart,openDialog,toast} from './app.js';

const pending=new Set();
document.addEventListener('click',async event=>{
 const card=event.target.closest('.product-card');
 if(!card)return;
 const anchor=event.target.closest('[data-quote]');
 if(!anchor){
  // Links and buttons keep their normal keyboard and modified-click behaviour.
  if(!event.target.closest('a,button,input,select,textarea')&&!window.getSelection()?.toString()){
   if(event.ctrlKey||event.metaKey)window.open(card.dataset.productUrl,'_blank','noopener');
   else location.assign(card.dataset.productUrl);
  }
  return;
 }
 if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
 event.preventDefault();const id=anchor.dataset.quote;
 if(pending.has(id))return;
 pending.add(id);anchor.setAttribute('aria-busy','true');
 const original=anchor.innerHTML;anchor.textContent='Adding…';
 try{
  const response=await fetch('/api/products/'+encodeURIComponent(id),{signal:AbortSignal.timeout(15000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'This cake could not be added.');
  const p=result.product;
  const available=p.variants.filter(v=>v.available);
  const selected=available.find(v=>v.id===anchor.dataset.quoteVariant)||available.find(v=>v.priceFils===Number(anchor.dataset.quotePrice))||available.sort((a,b)=>a.priceFils-b.priceFils)[0];
  if(!selected)throw new Error('This cake is currently unavailable.');
  const cart=getCart().map(item=>({...item}));
  const existing=cart.find(item=>item.productId===p.id&&item.variantId===selected.id&&!item.message&&!Object.keys(item.personalisation||{}).length);
  if(!existing&&cart.length>=50)throw new Error('Your quote can hold up to 50 different selections.');
  if(existing)existing.quantity=1;else cart.push({productId:p.id,variantId:selected.id,quantity:1,message:'',personalisation:{}});
  setCart(cart);renderCart();openDialog('bag-drawer');toast('Added to your quote.');
 }catch(error){toast(error.name==='TimeoutError'?'Adding took too long. Please try again.':error.message);}
 finally{pending.delete(id);anchor.removeAttribute('aria-busy');anchor.innerHTML=original;}
});
