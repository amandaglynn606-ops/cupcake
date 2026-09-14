import {$,data,esc,money,imageUrl,getCart,setCart,quoteCart,personalisationText,orderText,downloadText} from './app.js';
import {getCartDetails,clearCartDetails} from './cart-details.js';
import {prepareWhatsAppTab,addMessageActions} from './whatsapp-handoff.js';
const form=$('#checkout-form'),cartDetails=getCartDetails(),profileKey='xavi-checkout-profile-v1';
const profileFields=['name','lastName','email','phone','emirate','city','area','address'];
let quote,quoteRequest=0,requestKey='',lastPayload='',completed=false,pending=false;
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
form.elements.date.min=today;
try{const profile=JSON.parse(localStorage.getItem(profileKey));if(profile){for(const key of profileFields)if(typeof profile[key]==='string')form.elements[key].value=profile[key];form.elements.saveInfo.checked=true;}}catch{/* A saved profile is optional. */}
if(cartDetails){form.elements.fulfilment.value=cartDetails.fulfilment||'delivery';form.elements.emirate.value=cartDetails.emirate||'Dubai';form.elements.date.value=cartDetails.date||'';form.elements.notes.value=cartDetails.instructions||'';form.elements.time.value=cartDetails.time||'10am-7pm';}
function syncFields(){
 const pickup=form.elements.fulfilment.value==='pickup';
 $('#shipping-fields').hidden=pickup;$('#pickup-note').hidden=!pickup;
 for(const key of ['city','area','address']){form.elements[key].required=!pickup;form.elements[key].disabled=pickup;}
 $('[data-pickup-time]').hidden=!pickup;$('[data-pickup-time]').disabled=!pickup;
 if(!pickup&&form.elements.time.value==='10am-10pm')form.elements.time.value='10am-7pm';
 const different=form.elements.billingMode.value==='different';$('#billing-fields').hidden=!different;
 for(const field of $('#billing-fields').querySelectorAll('[name]')){field.disabled=!different;field.required=different&&field.name!=='billingPhone';}
}
function persistProfile(){try{if(form.elements.saveInfo.checked)localStorage.setItem(profileKey,JSON.stringify(Object.fromEntries(profileFields.map(key=>[key,form.elements[key].value]))));else localStorage.removeItem(profileKey);}catch{/* Checkout continues if browser storage is unavailable. */}}
form.elements.saveInfo.addEventListener('change',()=>{if(!form.elements.saveInfo.checked)persistProfile();});
form.addEventListener('change',event=>{syncFields();if(['emirate','fulfilment'].includes(event.target.name))refresh();});
async function refresh(){
 if(completed)return;
 const current=++quoteRequest;$('#submit-order').disabled=true;quote=null;
 try{
  const result=await quoteCart(form.elements.fulfilment.value,form.elements.emirate.value);if(current!==quoteRequest)return;quote=result;
  if(!quote.items.length){$('#checkout-layout').innerHTML='<div class="empty-state full-width"><h2>Your cart is empty.</h2><p>Choose a cake before preparing your WhatsApp order.</p><a class="button" href="/collections/all">Browse cakes &rarr;</a></div>';return;}
  const tomorrow=new Date(today+'T00:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  form.elements.date.min=quote.items.some(i=>i.kind!=='accessory')?tomorrow.toISOString().slice(0,10):today;
  $('#delivery-method-label').textContent=quote.fulfilment==='pickup'?'Pickup — no delivery fee':'Delivery to '+quote.emirate;
  $('#delivery-method-price').textContent=money(quote.deliveryFeeFils);
  $('#checkout-summary').innerHTML=`<div class="summary-heading"><div><p class="eyebrow">YOUR ORDER</p><h2>Order summary</h2></div><a href="/cart">Edit cart</a></div>${quote.hasStartingPrices?'<p class="starting-price-note">Starting design estimate. Final specifications and the complete quotation must be agreed on WhatsApp before ordering.</p>':''}${quote.items.map(item=>`<article class="summary-item"><a class="summary-photo" href="/cakes/${esc(item.handle)}"><img class="${item.cakeImage?'cake-image':''}" src="${esc(imageUrl(item.image))}" alt="${esc(item.imageAlt||item.title)}" width="80" height="96"><span aria-label="Quantity ${item.quantity}">${item.quantity}</span></a><div><h3>${esc(item.title)}</h3><p>${esc(item.variation)}</p>${personalisationText(item).map(text=>`<p class="summary-personalisation">${esc(text)}</p>`).join('')}</div><span>${money(item.lineTotalFils)}</span></article>`).join('')}<div class="fee-row"><span>Subtotal · ${quote.items.reduce((n,i)=>n+i.quantity,0)} items</span><span>${money(quote.subtotalFils)}</span></div><div class="fee-row" data-delivery-fee><span>${quote.fulfilment==='pickup'?'Pickup':'Delivery · '+esc(quote.emirate)}</span><span>${money(quote.deliveryFeeFils)}</span></div><div class="summary-total" data-grand-total><span>Total <small>AED</small></span><strong>${money(quote.totalFils)}</strong></div><p class="summary-note">Delivery across the UAE: AED 100 in Dubai; AED 200 in all other emirates. Pickup has no delivery fee.</p><div class="summary-whatsapp"><span class="eyebrow">CONFIRMED ON WHATSAPP</span><p>Your cake, date and delivery arrangements are confirmed personally with you.</p></div>`;
  $('.form-error',form).textContent=quote.canOrder?'':'Please review the unavailable items or missing cake preferences in your cart.';
  $('#submit-order').disabled=!quote.canOrder||pending;
 }catch(error){if(current===quoteRequest)$('#checkout-summary').innerHTML=`<p class="form-error">${esc(error.message)}</p><button type="button" class="text-link" id="retry-checkout">Try again</button>`;}
}
document.addEventListener('click',event=>{if(event.target.closest('#retry-checkout'))refresh();});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(pending||!form.reportValidity()||!getCart().length||!quote?.canOrder)return;
 const fields=Object.fromEntries(new FormData(form));
 const shipping=fields.fulfilment==='delivery'?{firstName:fields.name,lastName:fields.lastName,country:'United Arab Emirates',emirate:fields.emirate,city:fields.city,area:fields.area,street:fields.address}:undefined;
 const customer={name:[fields.name,fields.lastName].join(' '),phone:fields.phone,email:fields.email,date:fields.date,address:fields.address||'',emirate:fields.emirate,notes:fields.notes,...(shipping?{shipping}:{})};
 const billingAddress=fields.billingMode==='different'?{firstName:fields.billingFirstName,lastName:fields.billingLastName,country:'United Arab Emirates',emirate:fields.billingEmirate,city:fields.billingCity,area:fields.billingArea,street:fields.billingStreet,phone:fields.billingPhone}:undefined;
 const payload=JSON.stringify({items:getCart(),customer,fulfilment:fields.fulfilment,preferredTime:fields.time,consent:form.elements.consent.checked,...(billingAddress?{billingAddress}:{}),...(cartDetails?.leadTimeAccepted?{cartDetails:{...cartDetails,fulfilment:fields.fulfilment,emirate:fields.emirate,date:fields.date,time:fields.time,sameDay:fields.date===today?cartDetails.sameDay:'no'}}:{})});
 if(payload!==lastPayload){requestKey=crypto.randomUUID();lastPayload=payload;}
 const handoff=prepareWhatsAppTab();
 const button=$('#submit-order'),errorEl=$('.form-error',form);pending=true;button.disabled=true;button.textContent='Preparing your order…';errorEl.textContent='';
 try{
  const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestKey},body:payload,signal:AbortSignal.timeout(20000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Your order could not be prepared.');
  completed=true;persistProfile();setCart([]);clearCartDetails();$('#checkout-layout').hidden=true;$('#order-success').hidden=false;
  const order=result.order,text=orderText(order),number=data.config.whatsapp||'',contact=/^\d{7,15}$/.test(number)?'https://wa.me/'+number+'?text='+encodeURIComponent(text):'';
  $('#order-success').innerHTML=`<div class="request-success"><p class="eyebrow">ONE LAST STEP</p><h2 id="success-title" tabindex="-1">Ready for WhatsApp.</h2><p>Press Send in WhatsApp to deliver your order to Maison Zavi. Your message has not been sent yet. We will confirm your cake and delivery date.</p><p class="request-reference">${esc(order.id)}</p>${order.hasStartingPrices?'<p class="starting-price-note">Starting estimate only. Final design and quotation require confirmation.</p>':''}<div class="fee-row"><span>Cake subtotal</span><span>${money(order.subtotalFils)}</span></div><div class="fee-row"><span>${order.fulfilment==='pickup'?'Pickup':'Delivery · '+esc(order.emirate)}</span><span>${money(order.deliveryFeeFils)}</span></div><div class="summary-total"><span>Total</span><strong>${money(order.totalFils)}</strong></div><details class="order-message"><summary>Review your WhatsApp message</summary><pre>${esc(text)}</pre></details><div class="success-actions">${contact?`<a class="button" id="send-whatsapp-order" href="${esc(contact)}" target="_blank" rel="noopener">Send order on WhatsApp &nearr;</a>`:'<p class="form-error">WhatsApp ordering will be available once the maison’s number is configured. You can download your prepared order below.</p>'}<button class="text-link" id="download-order">Download your order &darr;</button><a class="text-link" href="/collections/all">Browse more cakes &rarr;</a></div></div>`;
  $('#download-order').addEventListener('click',()=>downloadText(order.id+'.txt',text));$('#success-title').focus();$('#order-success').scrollIntoView();
  addMessageActions($('#order-success .success-actions'),{text});handoff.open(contact);
 }catch(error){handoff.close();errorEl.textContent=error.name==='TimeoutError'?'This took too long. Please try again; your reference prevents duplicates.':error.message;}
 finally{pending=false;button.disabled=false;button.textContent='Prepare WhatsApp order';}
});
window.addEventListener('cart-change',refresh);syncFields();refresh();
