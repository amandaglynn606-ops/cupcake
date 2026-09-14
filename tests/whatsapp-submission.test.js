'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {makeServer}=require('../server');
const {prepareWhatsApp}=require('../lib/whatsapp-submission');
const catalog=require('../data/archive/original-catalog.json');
const enquiry=()=>({kind:'bespoke',name:'Test Customer',email:'test@example.com',phone:'+971500000000',occasion:'Wedding',date:'2099-12-01',guests:'80',budget:'AED 4,000+',brief:'Ivory roses and chocolate sponge',consent:true,referenceImages:[{name:'My cake.webp',type:'image/webp',size:1024}]});

test('WhatsApp preparation validates enquiries and includes reference metadata without claiming delivery',()=>{
 const result=prepareWhatsApp(enquiry(),{isOrder:false,number:'971545974005'});
 assert.equal(result.enquiry.status,'prepared-for-whatsapp');
 assert.equal(result.deliveryStatus,'awaiting-customer-send');
 assert.equal(result.enquiry.brief,enquiry().brief);
 assert.deepEqual(result.enquiry.referenceImages,enquiry().referenceImages);
 for(const input of [{...enquiry(),consent:false},{...enquiry(),referenceImages:[{name:'attack.svg',type:'image/svg+xml',size:20}]},{...enquiry(),referenceImages:[{name:'large.png',type:'image/png',size:6000000}]},{...enquiry(),referenceImages:[{...enquiry().referenceImages[0],data:'private bytes'}]}])assert.throws(()=>prepareWhatsApp(input,{isOrder:false,number:'971545974005'}));
 assert.throws(()=>prepareWhatsApp(enquiry(),{isOrder:false,number:''}));
});

test('configured WhatsApp forms work without a writable archive and reject cross-origin requests',async t=>{
 // A file path used as a directory would fail if preparation tried to persist data.
 const server=makeServer({catalog,orderDir:__filename,enquiryDir:__filename,config:{submissionMode:'whatsapp',whatsapp:'971545974005'}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const origin='http://127.0.0.1:'+server.address().port;
 const headers={'Content-Type':'application/json','Idempotency-Key':randomUUID(),Origin:origin};
 const response=await fetch(origin+'/api/enquiries',{method:'POST',headers,body:JSON.stringify(enquiry())});
 assert.equal(response.status,201);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal((await response.json()).deliveryStatus,'awaiting-customer-send');
 assert.equal((await fetch(origin+'/api/enquiries',{method:'POST',headers:{...headers,Origin:'https://unrelated.example'},body:JSON.stringify(enquiry())})).status,403);
 assert.equal((await fetch(origin+'/api/enquiries',{method:'POST',headers,body:JSON.stringify({...enquiry(),brief:'x'.repeat(70000)})})).status,413);
 const p=catalog.products.find(p=>p.kind==='accessory'&&p.variants.some(v=>v.available));
 assert.ok(p);const v=p.variants.find(v=>v.available);
 const order={items:[{productId:p.id,variantId:v.id,quantity:1}],customer:{name:'Test Customer',email:'test@example.com',phone:'+971500000000',date:'2099-12-01',emirate:'Dubai',address:'Test address',notes:''},fulfilment:'delivery',consent:true,totalFils:1};
 const ordered=await fetch(origin+'/api/orders',{method:'POST',headers,body:JSON.stringify(order)});
 assert.equal(ordered.status,201);const result=await ordered.json();
 assert.equal(result.order.status,'prepared-for-whatsapp');
 assert.equal(result.order.totalFils,v.priceFils+10000);
 assert.equal(result.deliveryStatus,'awaiting-customer-send');
});
