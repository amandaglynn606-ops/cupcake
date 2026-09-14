const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prepareWhatsApp}=require('../lib/whatsapp-submission');
const {quoteWhatsApp}=require('../lib/whatsapp-quote');
const catalog=require('../lib/load-catalog').loadCatalog();
const p=catalog.products.find(p=>p.kind==='cake'&&p.variants.length),v=p.variants[0];
const item={productId:p.id,variantId:v.id,quantity:1};
const options={isOrder:true,catalog,number:'971545974005'};
test('WhatsApp accepts a cake with no preferences, contact, date or consent',()=>{
 const {order}=prepareWhatsApp({items:[item]},options);
 assert.equal(order.customer.name,'');assert.equal(order.customer.email,'');assert.equal(order.customer.date,'');
 assert.deepEqual(order.items[0].personalisation.tiers,[]);assert.equal(order.deliveryFeeFils,null);
 assert.equal(order.billingAddress,undefined);assert.equal(order.status,'prepared-for-whatsapp');
});
test('unavailable and retired selections can be discussed without trusting client prices',()=>{
 const stock={products:[{...p,variants:[{...v,available:false}]}]};
 const quote=quoteWhatsApp({items:[{...item,unitPriceFils:1},{productId:'retired-id',variantId:'old-variant',quantity:1,title:'Untrusted title',unitPriceFils:1}]},stock);
 assert.equal(quote.canOrder,true);assert.equal(quote.items[0].unitPriceFils,p.quoteOnly?null:v.priceFils);
 assert.match(quote.items[0].confirmationNotes.join(' '),/Availability to confirm/);
 assert.equal(quote.items[1].title,'Saved design — confirmation needed');assert.equal(quote.totalFils,null);
});
test('partial tier choices are optional but supplied input is validated',()=>{
 const input={items:[{...item,personalisation:{tiers:[{type:'',sponge:'',filling:'',weightLb:5}],allergens:'decline'}}]};
 const {order}=prepareWhatsApp(input,options);
 assert.equal(order.items[0].personalisation.tiers[0].weightLb,5);
 assert.match(order.items[0].confirmationNotes.join(' '),/Allergen concern/);
 for(const change of [{customer:{email:'bad'}},{customer:{phone:'x'}},{customer:{date:'2099-02-31'}},{items:[{...item,quantity:-1}]},{items:[{...item,personalisation:{tiers:[{type:'script'}]}}]},{items:[{...item,message:'x'.repeat(101)}]}])assert.throws(()=>prepareWhatsApp({...input,...change},options));
});
test('contact and custom cake enquiries allow blank fields and no consent',()=>{
 for(const kind of ['contact','bespoke']){
  const {enquiry}=prepareWhatsApp({kind,consent:false},{isOrder:false,number:options.number});
  assert.equal(enquiry.name,'');assert.equal(enquiry.date,'');assert.equal(enquiry.guests,'');
 }
});
