'use strict';
const {OrderError,createOrder}=require('./orders');
const {createEnquiry}=require('./enquiries');

function prepareWhatsApp(input,{isOrder,catalog,number}){
 if(!/^\d{7,15}$/.test(number||''))throw new OrderError('WhatsApp is not configured. Please contact Maison Zavi.');
 if(isOrder){
  if(typeof input?.customer?.email!=='string'||!input.customer.email.trim())throw new OrderError('Please enter your email address.');
  const order=createOrder(input,catalog);
  return {order:{...order,status:'prepared-for-whatsapp'},deliveryStatus:'awaiting-customer-send'};
 }
 if(!input||typeof input!=='object')throw new OrderError('Please complete your enquiry.');
 const files=input.referenceImages??[];
 if(!Array.isArray(files)||files.length>3)throw new OrderError('Please choose up to 3 reference images.');
 const referenceImages=files.map(file=>{
  if(!file||typeof file.name!=='string'||!file.name.trim()||file.name.length>200||!['image/jpeg','image/png','image/webp'].includes(file.type)||!Number.isInteger(file.size)||file.size<1||file.size>5*1024*1024||file.data!==undefined)throw new OrderError('Use JPG, PNG or WebP reference images, up to 5 MB each.');
  return {name:file.name.replace(/[\x00-\x1f<>/\\]/g,'').trim()||'Reference image',type:file.type,size:file.size};
 });
 const enquiry=createEnquiry({...input,referenceImages:[]});
 return {enquiry:{...enquiry,referenceImages,status:'prepared-for-whatsapp'},deliveryStatus:'awaiting-customer-send'};
}

module.exports={prepareWhatsApp};
