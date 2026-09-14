import {getCartDetails} from './cart-details.js';
import {animateDialog} from './motion.js';
export const $=(selector,root=document)=>root.querySelector(selector);
export const data=JSON.parse($('#page-data')?.textContent||'{}');
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=fils=>fils===null?'Price on request':'AED '+new Intl.NumberFormat('en-AE',{minimumFractionDigits:fils%100?2:0,maximumFractionDigits:2}).format(fils/100);
export const imageUrl=url=>url?.startsWith('https://')?url+(url.includes('?')?'&':'?')+'width=600':'/'+(url||'assets/placeholder.svg').replace(/^\/+/,'');
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{toast('Your browser could not save this selection for a future visit.');}};
function normaliseCart(value){return(Array.isArray(value)?value:[]).filter(i=>i&&typeof i.productId==='string'&&typeof i.variantId==='string'&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=20).slice(0,50).map(i=>({...i,message:typeof i.message==='string'?i.message.slice(0,100):'',personalisation:i.personalisation&&typeof i.personalisation==='object'?i.personalisation:{}}));}
let cart=normaliseCart(read('cake-cart-v1',[]));
let savedValue=read('cake-saved-v1',[]);
let saved=new Set((Array.isArray(savedValue)?savedValue:[]).filter(id=>typeof id==='string').slice(0,100));
let toastTimer,cartRequest=0;
export function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3300);}
export function getCart(){return cart;}
export function setCart(next){cart=normaliseCart(next);write('cake-cart-v1',cart);updateCount();window.dispatchEvent(new Event('cart-change'));}
function updateCount(){document.querySelectorAll('[data-bag-count]').forEach(el=>el.textContent=cart.reduce((n,i)=>n+i.quantity,0));}
export function savedIds(){return [...saved];}
export function syncSaved(){document.querySelectorAll('[data-save]').forEach(button=>button.setAttribute('aria-pressed',String(saved.has(button.dataset.save))));}
export function openDialog(id){const dialog=$('#'+id);document.querySelectorAll('dialog[open]').forEach(d=>d.close());dialog.showModal();animateDialog(dialog);}
export async function quoteCart(fulfilment=getCartDetails()?.fulfilment||'delivery',emirate=getCartDetails()?.emirate||'Dubai'){
 const response=await fetch('/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart,fulfilment,emirate}),signal:AbortSignal.timeout(15000)});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Your selection could not be loaded.');return result;
}
export function personalisationText(item){
 const p=item.personalisation||{};
 return [p.guests?'Number of guests: '+p.guests:'',item.message?'Cake message: '+item.message:'',p.instructions?'Special instructions: '+p.instructions:'',p.colouring?'Food colouring: '+(p.colouring==='natural'?'Keep the natural cream colour':'Accepted'):'',p.allergens==='accept'?'Allergen information acknowledged':'',...(p.tiers||[]).map(t=>'Tier '+t.tier+': '+(t.type==='dummy'?'Display (dummy) tier — not edible':'Edible cake'+(t.weightLb?' · '+t.weightLb+' lb':'')+' · '+t.sponge+' sponge · '+t.filling))].filter(Boolean);
}
export async function renderCart(){
 const request=++cartRequest;const containers=[...document.querySelectorAll('[data-cart-content]')];if(!containers.length)return;
 if(!cart.length){containers.forEach(el=>el.innerHTML='<div class="cart-empty"><p class="eyebrow">YOUR CART</p><h3>Your cart is empty.</h3><p>Choose a cake and add it to your cart to request a quote.</p><a class="button" href="/collections/all">Browse cakes →</a></div>');return;}
 try{
  const quote=await quoteCart();if(request!==cartRequest)return;
  const html=quote.items.map(item=>'<article class="cart-item"><a href="/cakes/'+esc(item.handle)+'"><img class="'+(item.cakeImage?'cake-image':'')+'" src="'+esc(imageUrl(item.image))+'" alt="'+esc(item.imageAlt||item.title)+'" width="100" height="120"></a><div><h3><a href="/cakes/'+esc(item.handle)+'">'+esc(item.title)+'</a></h3><p>'+esc(item.variation)+'</p><p class="cart-unit-price">'+(item.priceOnConsultation?'Starting price: ':'Unit price: ')+''+money(item.unitPriceFils)+'</p>'+personalisationText(item).map(text=>'<p>'+esc(text)+'</p>').join('')+'<a class="cart-edit" href="/cakes/'+esc(item.handle)+'?variant='+esc(item.variantId)+'&amp;edit='+item.index+'">'+(item.needsTiers?'Choose tier types & flavours':'Edit cake & tier details')+'</a>'+(!item.available?'<p class="form-error">Currently unavailable</p>':'')+(item.needsPersonalisation?'<div class="cart-preferences"><p>Confirm these details before sending your request.</p><label>Food colouring<select data-cart-preference="colouring" data-index="'+item.index+'"><option value="">Please select</option><option value="natural"'+(item.personalisation.colouring==='natural'?' selected':'')+'>Keep the natural cream colour</option><option value="accept"'+(item.personalisation.colouring==='accept'?' selected':'')+'>I accept food colouring</option></select></label><label>Allergen information<select data-cart-preference="allergens" data-index="'+item.index+'"><option value="">Please select</option><option value="accept"'+(item.personalisation.allergens==='accept'?' selected':'')+'>I acknowledge the information</option><option value="decline"'+(item.personalisation.allergens==='decline'?' selected':'')+'>I cannot accept</option></select></label><p>Cakes may contain milk, eggs, wheat and nuts. Contact us about any allergies before ordering.</p></div>':'')+'<button class="cart-remove" data-remove="'+item.index+'">Remove</button><div class="cart-item-bottom"><span>'+money(item.lineTotalFils)+'</span></div></div></article>').join('')+'<div class="cart-actions"><div class="summary-total"><span>Subtotal</span><span>'+money(quote.subtotalFils)+'</span></div>'+(quote.hasStartingPrices?'<p class="starting-price-note">Starting estimate. Final design and quotation are agreed on WhatsApp.</p>':'')+'<p class="summary-note">Delivery across the UAE: AED 100 in Dubai; AED 200 in all other emirates. Pickup has no delivery fee. Final availability is confirmed with your request. No payment is collected here.</p>'+'<a class="button" href="/cart">Review your cart &rarr;</a>'+'<a class="text-link" href="/cart">View your cart</a></div>';
  containers.forEach(el=>el.innerHTML=html);
 }catch(error){if(request===cartRequest)containers.forEach(el=>el.innerHTML='<div class="cart-empty"><p class="form-error">'+esc(error.message)+'</p><button class="button button-outline" data-retry-cart>Try again</button><button class="text-link" data-clear-cart>Clear your cart</button></div>');}
}
export function downloadText(filename,text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
export function contactUrl(subject,text,preferred='whatsapp'){
 const config=data.config||{};
 if(preferred==='email'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email||''))return 'mailto:'+config.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(text);
 if(/^\d{7,15}$/.test(config.whatsapp||''))return 'https://wa.me/'+config.whatsapp+'?text='+encodeURIComponent(subject+'\n\n'+text);
 if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email||''))return 'mailto:'+config.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(text);
 return '';
}
export function orderText(order){
 const addressLines=(address)=>[address.firstName+' '+address.lastName,address.street,address.area+', '+address.city,address.emirate+', United Arab Emirates',address.phone||''].filter(Boolean);
 return [data.config.name.toUpperCase()+' - WHATSAPP ORDER',order.id,'',...order.items.flatMap(item=>[item.quantity+' x '+item.title,item.variation,...personalisationText(item),money(item.lineTotalFils),'']),...(order.cartDetails?['Gift message: '+order.cartDetails.giftMessage,'Sender name: '+(order.cartDetails.senderDisplay==='anonymous'?'Keep anonymous':'Display as written'),'']:[]),...(order.hasStartingPrices?['STARTING ESTIMATE — final design, scale and price require written confirmation.']:[]),'Subtotal: '+money(order.subtotalFils),'Delivery: '+money(order.deliveryFeeFils),'Total: '+money(order.totalFils),'','Name: '+order.customer.name,'WhatsApp: '+order.customer.phone,...(order.customer.email?['Email: '+order.customer.email]:[]),'Fulfilment: '+order.fulfilment,'Preferred date: '+order.customer.date,'Preferred time: '+order.preferredTime,...(order.fulfilment==='delivery'?['SHIPPING ADDRESS',...(order.customer.shipping?addressLines(order.customer.shipping):[order.customer.address,order.emirate])]:[]),...(order.billingAddress?['','BILLING ADDRESS',...addressLines(order.billingAddress)]:[]),'Notes: '+order.customer.notes,'','Please confirm my cake, availability and delivery arrangements.'].join('\n');
}
document.addEventListener('error',event=>{const target=event.target;if(target.tagName==='IMG'&&!target.src.endsWith('/assets/placeholder.svg'))target.src='/assets/placeholder.svg';},true);
for(const image of document.images){if(image.complete&&image.naturalWidth===0&&!image.src.endsWith('/assets/placeholder.svg'))image.src='/assets/placeholder.svg';}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(button?.dataset.open){if(button.dataset.open==='bag-drawer')renderCart();openDialog(button.dataset.open);return;}
 if(button?.hasAttribute('data-close')){button.closest('dialog').close();return;}
 if(button?.dataset.save){const id=button.dataset.save;if(saved.has(id))saved.delete(id);else{if(saved.size>=100)return toast('Your wishlist can hold up to 100 designs.');saved.add(id);}write('cake-saved-v1',[...saved]);syncSaved();window.dispatchEvent(new Event('wishlist-change'));return;}
 if(button?.dataset.remove!==undefined){const next=cart.slice();next.splice(Number(button.dataset.remove),1);setCart(next);renderCart();return;}
 if(button?.hasAttribute('data-retry-cart'))return renderCart();
 if(button?.hasAttribute('data-clear-cart')){setCart([]);renderCart();return;}
 if(!event.target.closest('.nav-dropdown'))document.querySelectorAll('.desktop-nav .nav-dropdown[open]').forEach(el=>el.open=false);
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.nav-dropdown[open]').forEach(el=>el.open=false);});
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();}));
window.addEventListener('storage',event=>{if(event.key==='cake-cart-v1'){cart=normaliseCart(read('cake-cart-v1',[]));updateCount();if($('#bag-drawer')?.open||['/bag','/cart'].includes(document.body.dataset.page))renderCart();window.dispatchEvent(new Event('cart-change'));}if(event.key==='cake-saved-v1'){const values=read('cake-saved-v1',[]);saved=new Set(Array.isArray(values)?values:[]);syncSaved();window.dispatchEvent(new Event('wishlist-change'));}});
updateCount();syncSaved();
if(['/bag','/cart'].includes(document.body.dataset.page))renderCart();

document.addEventListener('change',event=>{
 const field=event.target.closest('[data-cart-preference]');if(!field)return;
 const next=cart.map(item=>({...item,personalisation:{...item.personalisation}})),item=next[Number(field.dataset.index)];
 if(!item||!['colouring','allergens'].includes(field.dataset.cartPreference))return;
 item.personalisation[field.dataset.cartPreference]=field.value;
 setCart(next);renderCart();
});
