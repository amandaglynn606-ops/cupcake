'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {buildCatalog}=require('../lib/catalog');
const {createOrder,OrderError}=require('../lib/orders');
const {createEnquiry}=require('../lib/enquiries');
const {makeServer}=require('../server');
const catalog=require('../data/archive/original-catalog.json');

test('combined filters must match the same variation and show its price',()=>{
 const fixture={products:[{id:'p',title:'Test cake',handle:'test-cake',description:'',categories:['birthday-cake-dubai'],optionNames:['Sponge Flavor','Size'],variants:[{id:'cheap',options:['Vanilla','Small'],priceFils:65000,available:true},{id:'large',options:['Chocolate','Large'],priceFils:95000,available:true}]}]};
 const ctx=buildCatalog(fixture);
 assert.equal(ctx.query('all',new URLSearchParams('flavour=chocolate&max=700')).total,0);
 assert.equal(ctx.query('all',new URLSearchParams('flavour=chocolate&size=small')).total,0);
 const results=ctx.query('birthday-cakes',new URLSearchParams('flavour=chocolate&size=large'));
 assert.equal(results.total,1);
 assert.equal(results.products[0].listingPriceFils,95000);
 assert.equal(ctx.query('missing',new URLSearchParams()),null);
});

test('every gallery and variation photo exists locally',async()=>{
 const urls=new Set(catalog.products.flatMap(p=>[...p.images,...p.variants.map(v=>v.image).filter(Boolean)]));
 for(const url of urls){assert.ok(url.startsWith('assets/products/'),url);await fs.access(path.join(__dirname,'..',url));}
});

test('cake acknowledgements cannot be bypassed or declined at checkout',()=>{
 const p=catalog.products.find(p=>p.kind==='cake'&&p.available),v=p.variants.find(v=>v.available);
 const payload={items:[{productId:p.id,variantId:v.id,quantity:1,message:''}],customer:{name:'Test',phone:'+971500000000',email:'',address:'Dubai',date:'2099-01-01',notes:''},consent:true};
 assert.throws(()=>createOrder(payload,catalog),OrderError);
 payload.items[0].personalisation={colouring:'natural',allergens:'decline'};
 assert.throws(()=>createOrder(payload,catalog),OrderError);
 payload.items[0].personalisation={colouring:'natural',allergens:'accept',instructions:'Ivory ribbons'};
 const order=createOrder(payload,catalog);
 assert.deepEqual(order.items[0].personalisation,{...payload.items[0].personalisation,tiers:[]});
 assert.equal(order.subtotalFils,v.priceFils);
});

test('bespoke enquiries require contact information, future dates, guests, and consent',()=>{
 const input={kind:'bespoke',name:'Test',email:'test@example.com',phone:'+971500000000',occasion:'Wedding',date:'2099-12-01',guests:'100',budget:'AED 2,000–4,000',brief:'Ivory tiers',consent:true};
 assert.equal(createEnquiry(input).kind,'bespoke');
 for(const override of [{date:'2020-01-01'},{date:'2099-02-30'},{guests:'0'},{email:'invalid'},{consent:false},{brief:''}])assert.throws(()=>createEnquiry({...input,...override}),OrderError);
 const contact={...input,kind:'contact',date:'',guests:'',budget:''};
 assert.equal(createEnquiry(contact).kind,'contact');
});

test('all collection routes render independently and enquiries persist idempotently',async t=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'boutique-test-'));
 const server=makeServer({catalog,orderDir:path.join(directory,'orders'),enquiryDir:path.join(directory,'enquiries'),config:require('../store.config.json')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.rm(directory,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+server.address().port;
 for(const c of buildCatalog(catalog,{curated:true}).collections){const response=await fetch(base+'/collections/'+c.slug);assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('<h1>'+c.title.replace(/&/g,'&amp;').replace(/’/g,'’')+'</h1>'),c.slug);assert.ok(!html.includes('src="catalog.js"'));}
 const input={kind:'contact',name:'Enquiry Test',phone:'+971500000000',email:'test@example.com',occasion:'Product enquiry',brief:'A question about a cake.',consent:true};
 const headers={'Content-Type':'application/json','Idempotency-Key':randomUUID()},body=JSON.stringify(input);
 const first=await fetch(base+'/api/enquiries',{method:'POST',headers,body});assert.equal(first.status,201);
 const enquiry=(await first.json()).enquiry;
 const repeat=await fetch(base+'/api/enquiries',{method:'POST',headers,body});assert.equal(repeat.status,200);assert.equal((await repeat.json()).enquiry.id,enquiry.id);
 assert.equal((await fs.readdir(path.join(directory,'enquiries'))).length,1);
 assert.equal((await fetch(base+'/private/enquiries')).status,404);
 assert.equal((await fetch(base+'/collections/unknown')).status,404);
 assert.equal((await fetch(base+'/cakes/unknown')).status,404);
});
