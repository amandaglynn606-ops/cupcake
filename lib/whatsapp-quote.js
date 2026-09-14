'use strict';
const {OrderError}=require('./orders');
const {totals,EMIRATES}=require('./pricing');
const {choices,tierCount,variationLabel}=require('./tier-options');
const text=(value,label,max=500)=>{
 if(value===undefined||value===null)return '';
 if(typeof value!=='string'||value.length>max)throw new OrderError('Please enter a valid '+label+'.');
 return value.trim();
};
const option=(value,values,label)=>{const result=text(value,label,100);if(result&&!values.includes(result))throw new OrderError('Please review '+label+'.');return result;};
function optionalDate(value){
 const date=text(value,'date',10);
 if(date){const parsed=new Date(date+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw new OrderError('Please enter a valid date.');}
 return date;
}
function contact(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new OrderError('Please review your contact details.');
 const name=text(value.name,'name',120),email=text(value.email,'email',160),phone=text(value.phone,'phone',30);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new OrderError('Please enter a valid email address.');
 if(phone&&(!/^\+?[\d\s()-]{7,30}$/.test(phone)||phone.replace(/\D/g,'').length<7))throw new OrderError('Please enter a valid phone number.');
 return {name,email,phone};
}
// WhatsApp creates enquiries: missing choices and stock confirmation never block them.
// Prices and public product details always come from the server catalogue.
function quoteWhatsApp(input,catalog){
 if(!input||!Array.isArray(input.items)||input.items.length>50)throw new OrderError('Please check your selection.');
 const items=input.items.map((item,index)=>{
  if(!item||typeof item!=='object'||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20)throw new OrderError('Choose a quantity between 1 and 20.');
  const productId=text(item.productId,'cake reference',100),variantId=text(item.variantId,'variation reference',100);
  const p=catalog.products.find(p=>p.id===productId),v=p?.variants.find(v=>v.id===variantId);
  const raw=item.personalisation??{};
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new OrderError('Please review your cake details.');
  const tiers=raw.tiers??[];
  if(!Array.isArray(tiers)||tiers.length>10)throw new OrderError('Please review your tier details.');
  const cleanTiers=tiers.map((tier,i)=>{
   if(!tier||typeof tier!=='object')throw new OrderError('Please review your tier details.');
   const type=option(tier.type,['edible','dummy'],'tier type');
   const sponge=option(tier.sponge,choices.sponges,'sponge'),filling=option(tier.filling,choices.fillings,'filling');
   let weightLb;try{weightLb=require('./cake-size').requestedWeight(tier.weightLb);}catch(error){throw new OrderError(error.message);}
   return {tier:i+1,type,sponge:type==='dummy'?'':sponge,filling:type==='dummy'?'':filling,...(type!=='dummy'&&weightLb!==undefined?{weightLb}:{})};
  });
  let guests;try{guests=require('./cake-size').requestedGuests(raw.guests);}catch(error){throw new OrderError(error.message);}
  const personalisation={instructions:text(raw.instructions,'instructions',500),colouring:option(raw.colouring,['accept','natural'],'food colouring'),allergens:option(raw.allergens,['accept','decline'],'allergen preference'),tiers:cleanTiers,...(guests!==undefined?{guests}:{})};
  const priced=!!v&&!p.quoteOnly&&Number.isSafeInteger(v.priceFils)&&v.priceFils>=0;
  const confirmationNotes=[];
  if(!v||!v.available)confirmationNotes.push('Availability to confirm');
  if(p?.kind==='cake'&&(!personalisation.colouring||!personalisation.allergens))confirmationNotes.push('Colour and allergen preferences to confirm');
  if(personalisation.allergens==='decline')confirmationNotes.push('Allergen concern — discuss suitability before confirming');
  if(v&&tierCount(p,v)>1&&(!cleanTiers.length||cleanTiers.some(t=>!t.type||t.type!=='dummy'&&(!t.sponge||!t.filling))))confirmationNotes.push('Tier types and flavours to confirm');
  return {index,productId,variantId,title:p?.title||'Saved design — confirmation needed',handle:p?.handle||'',kind:p?.kind||'cake',image:p?.image||'assets/placeholder.svg',imageAlt:p?.imageAlt||p?.title||'Saved design',cakeImage:p?!!require('./cake-images').cakeImageClass(p):false,variation:v?variationLabel(p,v,cleanTiers):'Reference '+productId+' / '+variantId,quantity:item.quantity,message:text(item.message,'cake message',100),available:!!v?.available,personalisation,confirmationNotes,needsTiers:false,needsPersonalisation:false,priceOnConsultation:!!p?.priceOnConsultation||cleanTiers.length>0,quoteOnly:!priced,unitPriceFils:priced?v.priceFils:null,lineTotalFils:priced?v.priceFils*item.quantity:null};
 });
 const fulfilment=option(input.fulfilment,['delivery','pickup'],'delivery or pickup'),emirate=option(input.emirate,EMIRATES,'emirate');
 const hasUnpricedItems=items.some(i=>i.quoteOnly),subtotalFils=hasUnpricedItems?null:items.reduce((sum,i)=>sum+i.lineTotalFils,0);
 const pricing=totals(subtotalFils,fulfilment,emirate);
 if(!fulfilment||fulfilment==='delivery'&&!emirate){pricing.deliveryFeeFils=null;pricing.totalFils=null;}
 return {items,hasStartingPrices:items.some(i=>i.priceOnConsultation),hasUnpricedItems,...pricing,canOrder:items.length>0};
}
module.exports={quoteWhatsApp,text,option,optionalDate,contact};
