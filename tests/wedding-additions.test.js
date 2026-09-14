const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loadCatalog}=require('../lib/load-catalog');
const {buildCatalog}=require('../lib/catalog');
const {createOrder}=require('../lib/orders');
const {makeServer}=require('../server');
const additions=require('../data/wedding-additions.json').products;

test('wedding additions preserve imported prices and have unique photos, IDs and reviewed tiers',()=>{
 const original=require('../data/catalog.json'),catalog=loadCatalog();
 assert.deepEqual(catalog.products.slice(0,original.products.length),original.products);
 assert.equal(catalog.products.length,original.products.length+additions.length+require('../data/curated-additions.json').products.length+require('../data/luxury-additions.json').products.length+require('../data/extravagant-additions.json').products.length+require('../data/downloaded-additions.json').products.length);
 assert.equal(new Set(catalog.products.map(p=>p.id)).size,catalog.products.length);
 assert.equal(new Set(catalog.products.map(p=>p.handle)).size,catalog.products.length);
 const ctx=buildCatalog(catalog);
 const first=ctx.query('wedding-cakes',new URLSearchParams()).products;
 assert.ok(first.every(p=>p.catalogueAddition));
 for(const p of additions){
  assert.ok(p.tiers>=2&&p.tiers<=10,p.title);
  assert.equal(p.variants[0].tiers,p.tiers);assert.equal(p.variants[0].priceFils,null);assert.equal(p.quoteOnly,true);
  assert.ok(!/rosewood|gc couture|gccouture|pinterest/i.test(JSON.stringify(p)),p.title);
  for(const file of p.images)assert.ok(fs.existsSync(file),file);
  assert.ok(ctx.query('wedding-cakes',new URLSearchParams({q:p.title,tier:p.tiers>=6?'6-plus':p.tiers>=4?'4-plus':String(p.tiers)})).products.some(found=>found.id===p.id),p.title);
 }
});

test('a new wedding quote preserves unknown pricing and enforces the photographed tier count',()=>{
 const p=additions.find(p=>p.tiers===3),catalog=loadCatalog();
 const tiers=Array.from({length:p.tiers},()=>({type:'edible',sponge:'Vanilla',filling:'Swiss Vanilla cream'}));
 const input={items:[{productId:p.id,variantId:p.variants[0].id,quantity:1,personalisation:{colouring:'natural',allergens:'accept',tiers}}],customer:{name:'Wedding Test',phone:'+971500000000',email:'test@example.com',address:'Test building, Dubai',date:'2099-12-01',notes:''},consent:true};
 const order=createOrder(input,catalog,new Date('2026-09-12T12:00:00Z'));
 assert.equal(order.subtotalFils,null);assert.equal(order.totalFils,null);assert.equal(order.hasUnpricedItems,true);assert.equal(order.items[0].personalisation.tiers.length,3);
 input.items[0].personalisation.tiers.pop();assert.throws(()=>createOrder(input,catalog),/number of cake tiers/i);
});

test('wedding listings, galleries and API work without public bakery credits',async t=>{
 const server=makeServer({catalog:loadCatalog()});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 for(const p of additions){
  const html=await(await fetch(base+'/cakes/'+p.handle)).text();
  assert.ok(html.includes('Price on request'));assert.ok(html.includes(p.image));assert.ok(!/Rosewood|GC Couture|gccouture|Image credits|imageSourceUrl/.test(html));
  const response=await fetch(base+'/api/products/'+p.id);assert.equal(response.status,200);
  assert.equal((await response.json()).product.variants[0].priceFils,null);
 }
 for(const route of ['/collections/wedding-cakes','/photography']){
  const html=await(await fetch(base+route)).text();assert.ok(!/The Perfect Gift|Rosewood|GC Couture|Image credits|pinterest\.com/.test(html));
 }
});
