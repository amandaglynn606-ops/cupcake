'use strict';
const {OrderError}=require('./orders');
const {randomUUID}=require('node:crypto');
const {quoteWhatsApp,text,option,optionalDate,contact}=require('./whatsapp-quote');

function prepareWhatsApp(input,{isOrder,catalog,number}){
 if(!/^\d{7,15}$/.test(number||''))throw new OrderError('WhatsApp is not configured. Please contact Maison Zavi.');
 if(isOrder){
  const customer=input?.customer??{};
  const details=contact(customer);
  const quote=quoteWhatsApp({...input,emirate:customer.emirate},catalog);
  if(!quote.items.length)throw new OrderError('Please add a cake to your request.');
  let shipping;
  if(customer.shipping!==undefined){
   if(!customer.shipping||typeof customer.shipping!=='object'||Array.isArray(customer.shipping))throw new OrderError('Please review your delivery details.');
   shipping=Object.fromEntries(['firstName','lastName','city','area','street','emirate','country'].map(key=>[key,text(customer.shipping[key],key,key==='street'?500:100)]));
  }
  const order={...quote,id:'CAKE-'+randomUUID(),createdAt:new Date().toISOString(),currency:'AED',orderChannel:'whatsapp',paymentStatus:'not-collected',preferredTime:option(input.preferredTime,['10am-7pm','10am-10pm'],'preferred time'),customer:{...details,date:optionalDate(customer.date),address:text(customer.address,'address',500),notes:text(customer.notes,'notes',1000),emirate:quote.emirate,...(shipping?{shipping}:{})}};
  return {order:{...order,status:'prepared-for-whatsapp'},deliveryStatus:'awaiting-customer-send'};
 }
 if(!input||typeof input!=='object')throw new OrderError('Please complete your enquiry.');
 const files=input.referenceImages??[];
 if(!Array.isArray(files)||files.length>3)throw new OrderError('Please choose up to 3 reference images.');
 const referenceImages=files.map(file=>{
  if(!file||typeof file.name!=='string'||!file.name.trim()||file.name.length>200||!['image/jpeg','image/png','image/webp'].includes(file.type)||!Number.isInteger(file.size)||file.size<1||file.size>5*1024*1024||file.data!==undefined)throw new OrderError('Use JPG, PNG or WebP reference images, up to 5 MB each.');
  return {name:file.name.replace(/[\x00-\x1f<>/\\]/g,'').trim()||'Reference image',type:file.type,size:file.size};
 });
 const kind=option(input.kind,['contact','bespoke'],'enquiry type')||'contact';
 const guests=text(input.guests,'guests',20);
 if(guests&&(!/^\d{1,5}$/.test(guests)||Number(guests)<1))throw new OrderError('Please enter a valid number of guests.');
 const enquiry={...contact(input),id:(kind==='bespoke'?'CUSTOM-':'ENQUIRY-')+randomUUID(),createdAt:new Date().toISOString(),kind,occasion:text(input.occasion,'occasion',80),date:optionalDate(input.date),guests,budget:text(input.budget,'budget',80),brief:text(input.brief,'message',3000)};
 return {enquiry:{...enquiry,referenceImages,status:'prepared-for-whatsapp'},deliveryStatus:'awaiting-customer-send'};
}

module.exports={prepareWhatsApp};
