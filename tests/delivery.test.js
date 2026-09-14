const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createOrder,OrderError}=require('../lib/orders');
const {makeServer}=require('../server');
const {EMIRATES}=require('../lib/pricing');
const catalog=require('../data/archive/original-catalog.json');
const p=catalog.products.find(p=>p.available&&p.kind==='cake'),v=p.variants.find(v=>v.available);
const input=()=>({items:[{productId:p.id,variantId:v.id,quantity:3,personalisation:{colouring:'natural',allergens:'accept'}}],customer:{name:'Xavi Test',phone:'+971500000000',date:'2099-12-01',address:'Test building',emirate:'Dubai'},consent:true});
test('UAE delivery fees apply once per order and pickup is free; client totals cannot override them',()=>{
 for(const emirate of EMIRATES){const request=input();request.customer.emirate=emirate;request.items.push({...request.items[0],quantity:2});request.deliveryFeeFils=1;request.totalFils=1;const order=createOrder(request,catalog);assert.equal(order.subtotalFils,v.priceFils*5);assert.equal(order.deliveryFeeFils,emirate==='Dubai'?10000:20000);assert.equal(order.totalFils,order.subtotalFils+order.deliveryFeeFils);assert.equal(order.orderChannel,'whatsapp');assert.equal(order.status,'awaiting-whatsapp');}
 const request=input();request.fulfilment='pickup';request.customer.address='';request.customer.emirate='Abu Dhabi';const order=createOrder(request,catalog);assert.equal(order.deliveryFeeFils,0);assert.equal(order.totalFils,order.subtotalFils);
 for(const mutate of [p=>p.customer.emirate='Invalid',p=>p.fulfilment='free',p=>p.billingAddress={},p=>p.customer.shipping={},p=>p.preferredTime='10am-10pm']){const request=input();mutate(request);assert.throws(()=>createOrder(request,catalog),OrderError);}
});
test('quote API and saved order agree for all UAE emirates and fulfilment choices',async t=>{
 const server=makeServer({catalog});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base='http://127.0.0.1:'+server.address().port;
 for(const emirate of EMIRATES)for(const fulfilment of ['delivery','pickup']){const request=input();request.customer.emirate=emirate;request.fulfilment=fulfilment;const response=await fetch(base+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:request.items,emirate,fulfilment})});assert.equal(response.status,200);const quote=await response.json(),order=createOrder(request,catalog);for(const key of ['subtotalFils','deliveryFeeFils','totalFils'])assert.equal(quote[key],order[key]);}
 const invalid=await fetch(base+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:input().items,emirate:'Other'})});assert.equal(invalid.status,400);
});
