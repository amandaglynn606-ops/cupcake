'use strict';
const { randomUUID } = require('node:crypto');
const {totals,EMIRATES}=require('./pricing');
const {validateTiers}=require('./tier-options');

class OrderError extends Error {}

function clean(value, label, max, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) {
    throw new OrderError(`Please enter a valid ${label}.`);
  }
  return value.trim();
}

function createOrder(input, catalog, now = new Date()) {
  if (!input || !Array.isArray(input.items) || !input.items.length || input.items.length > 50) {
    throw new OrderError('Your bag must contain between 1 and 50 items.');
  }
  const items = input.items.map(item => {
    if (!item || typeof item !== 'object') throw new OrderError('Please choose a valid cake.');
    const product = catalog.products.find(p => p.id === item.productId);
    const variant = product?.variants.find(v => v.id === item.variantId);
    if (!variant || !variant.available) throw new OrderError('A selected cake is no longer available. Please update your bag.');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new OrderError('Choose a quantity between 1 and 20.');
    }
    if (!(product.quoteOnly&&variant.priceFils===null)&&(!Number.isSafeInteger(variant.priceFils) || variant.priceFils < 0)) throw new OrderError('This cake needs a price confirmation.');
    const personalisation = item.personalisation || {};
    let guests;try{guests=require('./cake-size').requestedGuests(personalisation.guests);}catch(error){throw new OrderError(error.message);}
    let tiers;try{tiers=validateTiers(personalisation.tiers,product,variant,{required:true});}catch(error){throw new OrderError(error.message);}
    if (product.kind === 'cake' && (!['accept', 'natural'].includes(personalisation.colouring) || personalisation.allergens !== 'accept')) {
      throw new OrderError('Please confirm the food-colouring preference and allergen acknowledgement for each cake.');
    }
    return {
      productId: product.id, variantId: variant.id, title: product.title,
      priceOnConsultation:!!product.priceOnConsultation||tiers.length>0,quoteOnly:!!product.quoteOnly,variation: require('./tier-options').variationLabel(product,variant,tiers), quantity: item.quantity, unitPriceFils: variant.priceFils,
      message: clean(item.message ?? '', 'cake message', 100, false),
      personalisation: { instructions: clean(personalisation.instructions ?? '', 'special instructions', 500, false), colouring: ['accept', 'natural'].includes(personalisation.colouring) ? personalisation.colouring : '', allergens: personalisation.allergens === 'accept' ? 'accept' : '',tiers,...(guests!==undefined?{guests}:{}) },
      lineTotalFils: product.quoteOnly?null:variant.priceFils * item.quantity
    };
  });
  const customer = input.customer || {};
  const fulfilment=input.fulfilment||input.cartDetails?.fulfilment||'delivery';
  if(!['delivery','pickup'].includes(fulfilment))throw new OrderError('Choose delivery or pickup.');
  if(input.cartDetails&&input.cartDetails.fulfilment!==fulfilment)throw new OrderError('Please review your delivery choice.');
  const emirate=customer.emirate||input.cartDetails?.emirate||'Dubai';
  if(!EMIRATES.includes(emirate))throw new OrderError('Choose a valid UAE emirate.');
  const name = clean(customer.name, 'name', 100);
  const phone = clean(customer.phone, 'phone number', 30);
  if (!/^\+?[\d\s()-]{7,30}$/.test(phone) || phone.replace(/\D/g, '').length < 7) throw new OrderError('Please enter a valid phone number.');
  const email = clean(customer.email ?? '', 'email address', 160, false);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OrderError('Please enter a valid email address.');
  const address = clean(customer.address??'', 'delivery address', 500,fulfilment!=='pickup');
  const date = clean(customer.date, 'preferred delivery date', 10);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < today) {
    throw new OrderError('Please choose today or a future date.');
  }
  if (input.consent !== true) throw new OrderError('Please agree to being contacted about your order request.');
  const needsPreparation=input.items.some(item=>catalog.products.find(p=>p.id===item.productId)?.kind!=='accessory');
  if(needsPreparation&&date<=today)throw new OrderError('Cakes and personalised treats require preparation time. Please choose a future date.');
  const preferredTime=input.preferredTime||input.cartDetails?.time||'10am-7pm';
  if(!['10am-7pm','10am-10pm'].includes(preferredTime)||(fulfilment==='delivery'&&preferredTime==='10am-10pm'))throw new OrderError('Please choose a valid delivery or pickup time.');
  function addressDetails(value,label){
    if(!value||typeof value!=='object'||!EMIRATES.includes(value.emirate))throw new OrderError('Please complete your '+label+' address.');
    return {firstName:clean(value.firstName,label+' first name',60),lastName:clean(value.lastName,label+' last name',60),country:'United Arab Emirates',emirate:value.emirate,city:clean(value.city,label+' city',100),area:clean(value.area,label+' area',120),street:clean(value.street,label+' street',500),phone:clean(value.phone??'',label+' phone',30,false)};
  }
  const shipping=customer.shipping!==undefined&&fulfilment==='delivery'?addressDetails(customer.shipping,'shipping'):undefined;
  if(shipping&&shipping.emirate!==emirate)throw new OrderError('Please review your delivery emirate.');
  const billingAddress=input.billingAddress!==undefined?addressDetails(input.billingAddress,'billing'):undefined;
  let cartDetails;
  if(input.cartDetails!==undefined){
    const d=input.cartDetails;
    if(!d||typeof d!=='object'||!['delivery','pickup'].includes(d.fulfilment)||!['10am-7pm','10am-10pm'].includes(d.time)||!['no','request'].includes(d.sameDay)||d.leadTimeAccepted!==true)throw new OrderError('Please complete the delivery details in your cart.');
    if(d.fulfilment==='delivery'&&d.time==='10am-10pm')throw new OrderError('Please select a delivery time between 10 am and 7 pm.');
    const needsPreparation=input.items.some(item=>catalog.products.find(p=>p.id===item.productId)?.kind!=='accessory');
    if(needsPreparation&&(date<=today||d.sameDay==='request'))throw new OrderError('Cakes and personalised treats require preparation time. Please choose a future date.');
    if(d.sameDay==='request'&&date!==today)throw new OrderError('Choose scheduled delivery for a future date.');
    const dubaiHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'2-digit',hourCycle:'h23'}).format(now));
    if(d.sameDay==='request'&&dubaiHour>=12)throw new OrderError('Same-day requests must be placed before 12 noon UAE time.');
    cartDetails={instructions:clean(d.instructions??'','special instructions',1000,false),fulfilment:d.fulfilment,date,time:d.time,sameDay:d.sameDay,leadTimeAccepted:true};
  }
  return {
    id: `CAKE-${randomUUID()}`, createdAt: now.toISOString(), status: 'awaiting-whatsapp',orderChannel:'whatsapp',preferredTime,
    currency: 'AED', hasStartingPrices:items.some(i=>i.priceOnConsultation),hasUnpricedItems:items.some(i=>i.quoteOnly),items, ...totals(items.some(i=>i.quoteOnly)?null:items.reduce((sum,item)=>sum+(item.lineTotalFils??0),0),fulfilment,emirate),...(items.some(i=>i.quoteOnly)?{subtotalFils:null,totalFils:null}:{}),
    customer: { name, phone, email, address, emirate, date, ...(shipping?{shipping}:{}),notes: clean(customer.notes ?? '', 'order notes', 1000, false) },
    ...(billingAddress?{billingAddress}:{}),
    ...(cartDetails?{cartDetails}:{}),paymentStatus: 'not-collected', deliveryStatus: 'awaiting-confirmation'
  };
}

module.exports = { createOrder, OrderError };
