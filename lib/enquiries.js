'use strict';
const { randomUUID } = require('node:crypto');
const { OrderError } = require('./orders');
const {validateReferences}=require('./reference-images');
function createEnquiry(input) {
  if(!input||typeof input!=='object')throw new OrderError('Please complete your enquiry.');
  const text=(key,max,required=true)=>{const value=input[key];if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw new OrderError('Please enter a valid '+key+'.');return value.trim();};
  const kind=input.kind==='contact'?'contact':'bespoke';
  const name=text('name',100),email=text('email',160),phone=text('phone',30),occasion=text('occasion',80),date=kind==='bespoke'?text('date',10):'',guests=kind==='bespoke'?text('guests',20):'',budget=kind==='bespoke'?text('budget',80):'',brief=text('brief',3000);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new OrderError('Please enter a valid email address.');
  if(!/^\+?[\d\s()-]{7,30}$/.test(phone)||phone.replace(/\D/g,'').length<7)throw new OrderError('Please enter a valid phone number.');
  const parsed=new Date(date+'T00:00:00Z');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(kind==='bespoke'&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||date<today))throw new OrderError('Please choose today or a future date.');
  if(kind==='bespoke'&&(!/^\d{1,5}$/.test(guests)||Number(guests)<1))throw new OrderError('Please enter the approximate number of guests.');
  if(input.consent!==true)throw new OrderError('Please agree to being contacted about your enquiry.');
  const referenceImages=validateReferences(input.referenceImages);
  return {id:(kind==='bespoke'?'CUSTOM-':'ENQUIRY-')+randomUUID(),createdAt:new Date().toISOString(),status:'enquiry-received',kind,name,email,phone,occasion,date,guests,budget,brief,referenceImages};
}
module.exports={createEnquiry};
