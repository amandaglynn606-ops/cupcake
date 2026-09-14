import {$,data,esc,money,imageUrl,getCart,setCart,renderCart,openDialog,toast} from './app.js';
import {renderTiers,selectedTiers} from './tier-configurator.js';
import {initChoices,refreshChoices,validateChoices} from './product-customisation.js';
const product=data.product;
const editParam=new URLSearchParams(location.search).get('edit');
const editIndex=editParam!==null&&/^\d+$/.test(editParam)?Number(editParam):-1;
const editing=getCart()[editIndex]?.productId===product.id?getCart()[editIndex]:null;
const quantity=1;
const variantFromURL=new URLSearchParams(location.search).get('variant');
let selected=product.variants.find(v=>v.id===(editing?.variantId||variantFromURL))||product.variants.filter(v=>v.available).sort((a,b)=>(a.priceFils??0)-(b.priceFils??0))[0]||product.variants[0];
function update(){
 renderTiers(product,selected);
 refreshChoices();
 product.optionNames.forEach((name,index)=>{
  const options=[...new Set(product.variants.filter(v=>v.options.slice(0,index).every((value,i)=>value===selected.options[i])).map(v=>v.options[index]))];
  const select=$('[data-option="'+index+'"]');
  select.closest('label').hidden=(selected.tiers||product.tiers||1)>1&&/flavo[u]?r|sponge|filling|cream/i.test(name);
  select.replaceChildren(...options.map(value=>{const option=document.createElement('option');option.value=value;const available=product.variants.some(v=>v.available&&v.options[index]===value&&v.options.slice(0,index).every((val,i)=>val===selected.options[i]));option.textContent=value+(available?'':' — unavailable');return option;}));
  select.value=selected.options[index];
 });
 $('#product-price').textContent=(product.priceOnConsultation?'From ':'')+money(selected.priceFils);
 const declined=$('[name=allergens]')?.value==='decline';
 $('#add-to-cart').disabled=false;
 $('#product-availability').textContent=declined?'Please discuss allergen suitability with us on WhatsApp.':selected.available?'Available to request':'Availability will be confirmed on WhatsApp.';
 if(selected.image)$('#product-image').src=imageUrl(selected.image).replace('width=600','width=1200');
}
$('#product-form').addEventListener('change',event=>{
 if(event.target.dataset.option!==undefined){const index=Number(event.target.dataset.option),values=selected.options.slice();values[index]=event.target.value;const possible=product.variants.filter(v=>v.options.slice(0,index+1).every((value,i)=>value===values[i]));selected=possible.find(v=>v.available&&v.options.every((value,i)=>value===values[i]))||possible.find(v=>v.available)||possible[0];const url=new URL(location.href);url.searchParams.set('variant',selected.id);history.replaceState({},'',url);}
 update();
});
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.open==='product-lightbox')$('[data-zoom-image]').src=$('#product-image').src;
 // Custom cake requests always contain one cake per design.
 if(button.dataset.image!==undefined){$('#product-image').src=imageUrl(product.images[Number(button.dataset.image)]).replace('width=600','width=1200');document.querySelectorAll('[data-image]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
});
$('#product-form').addEventListener('submit',event=>{
 event.preventDefault();if(!validateChoices())return;
 const fields=new FormData(event.currentTarget);
 const personalisation={instructions:String(fields.get('instructions')||'').trim(),colouring:String(fields.get('colouring')||''),allergens:String(fields.get('allergens')||'')};
 personalisation.tiers=selectedTiers();
 if(fields.get('guests'))personalisation.guests=Number(fields.get('guests'));

 const message=String(fields.get('message')||'').trim();
 const cart=getCart().map(item=>({...item}));
 const existing=cart.find(item=>item.productId===product.id&&item.variantId===selected.id&&item.message===message&&JSON.stringify(item.personalisation)===JSON.stringify(personalisation));
 // Re-adding identical cake details keeps the existing quote item.
 if(!existing&&cart.length>=50)return toast('Your bag can hold up to 50 different selections.');
 if(editing)cart[editIndex]={productId:product.id,variantId:selected.id,quantity,message,personalisation};else if(existing)existing.quantity=quantity;else cart.push({productId:product.id,variantId:selected.id,quantity,message,personalisation});
 setCart(cart);renderCart();openDialog('bag-drawer');toast(editing?'Quote updated.':'Added to your quote.');
});
update();

if(editing){
 // Restore the cake details without a quantity selector.
 document.getElementById('add-to-cart').textContent='Update quote';
 for(const name of ['message','instructions','colouring','allergens','guests']){
  const field=document.querySelector('[name="'+name+'"]');if(field)field.value=name==='message'?editing.message:editing.personalisation?.[name]||'';
 }
 for(const tier of editing.personalisation?.tiers||[]){
  const row=document.querySelector('[data-tier-row="'+tier.tier+'"]');if(!row)continue;
  row.querySelector('[data-tier-type]').value=tier.type;
  row.querySelector('[data-tier-weight]').value=tier.weightLb??'';
  row.querySelector('[data-tier-sponge]').value=tier.sponge;
  row.querySelector('[data-tier-filling]').value=tier.filling;
  row.querySelector('[data-tier-type]').dispatchEvent(new Event('change',{bubbles:true}));
 }
}
initChoices();
