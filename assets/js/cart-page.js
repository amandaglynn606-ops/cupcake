import {$,quoteCart,money,getCart} from './app.js';
import {getCartDetails,saveCartDetails} from './cart-details.js';
const form=$('#cart-details-form');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const afterCutoff=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'2-digit',hourCycle:'h23'}).format(new Date()))>=12;
const tomorrow=new Date(today+'T00:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
const stored=getCartDetails();
if(stored)for(const [key,value]of Object.entries(stored)){const field=form.elements.namedItem(key);if(field){if(field.type==='checkbox')field.checked=value===true;else field.value=String(value);}}
let quote,request=0;
function value(){return {...Object.fromEntries(new FormData(form)),leadTimeAccepted:form.elements.leadTimeAccepted.checked};}
function sync(){
 $('#gift-message-count').textContent=form.elements.giftMessage.value.length;
 const pickup=form.elements.fulfilment.value==='pickup';
 form.elements.emirate.closest('label').hidden=pickup;
 $('[data-pickup-time]').hidden=!pickup;$('[data-pickup-time]').disabled=!pickup;
 if(!pickup&&form.elements.time.value==='10am-10pm')form.elements.time.value='';
 saveCartDetails(value());
}
async function refresh(){
 const current=++request;
 try{
  const result=await quoteCart(form.elements.fulfilment.value,form.elements.emirate.value);if(current!==request)return;quote=result;
  $('.cart-details-panel').hidden=!result.items.length;$('.cart-table-head').hidden=!result.items.length;
  $('#cart-subtotal').textContent=money(result.subtotalFils);
  $('#cart-delivery').textContent=money(result.deliveryFeeFils);
  $('#cart-delivery-label').textContent=result.fulfilment==='pickup'?'Pickup':'Delivery';
  $('#cart-total').textContent=(result.hasStartingPrices&&!result.hasUnpricedItems?'From ':'')+money(result.totalFils);
  const needsPreparation=result.items.some(item=>item.kind!=='accessory');
  $('#same-day-option').disabled=needsPreparation||afterCutoff;
  if(needsPreparation||afterCutoff)form.elements.sameDay.value='no';
  form.elements.date.min=needsPreparation?tomorrow.toISOString().slice(0,10):today;
  $('#cart-schedule-note').textContent=needsPreparation?'Same-day delivery is not available for cakes and personalised treats.':'Same-day requests must be placed before 12 noon UAE time and require availability confirmation.';
  sync();
 }catch(error){$('#cart-details-error').textContent=error.message;}
}
form.addEventListener('input',sync);form.addEventListener('change',event=>{sync();if(['fulfilment','emirate'].includes(event.target.name))refresh();});
form.addEventListener('submit',event=>{
 event.preventDefault();if(!form.reportValidity())return;
 if(!getCart().length||!quote?.canOrder){$('#cart-details-error').textContent='Please confirm each cake’s colouring, allergens and tier choices. Use Edit cake & tier details to choose your tiers.';$('.cart-preferences select')?.focus();return;}
 if(form.elements.sameDay.value==='request'&&form.elements.date.value!==today){$('#cart-details-error').textContent='For a future date, choose “On my selected date”.';return;}
 saveCartDetails(value());location.assign('/checkout');
});
window.addEventListener('cart-change',refresh);sync();refresh();
