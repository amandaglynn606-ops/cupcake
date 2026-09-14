const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildCatalog}=require('../lib/catalog');
const {createOrder,OrderError}=require('../lib/orders');
const catalog=require('../data/archive/original-catalog.json');

test('every collection has relevant facets and each feature filters its own products',()=>{
 const ctx=buildCatalog(catalog);
 for(const c of ctx.collections){
  const result=ctx.query(c.slug,new URLSearchParams());
  assert.ok(result.facets.features.length||result.facets.styles.length,c.slug);
  for(const group of result.facets.features)for(const item of group.items){
   const filtered=ctx.query(c.slug,new URLSearchParams(group.key+'='+item.id));
   assert.equal(filtered.total,item.count,c.slug+' '+item.id);
   for(const p of filtered.products){assert.ok(p.categories.includes(c.id));assert.ok(item.matches(p));}
  }
 }
 assert.deepEqual(ctx.query('candles',new URLSearchParams()).facets.flavours,[]);
 assert.deepEqual(ctx.query('childrens-cakes',new URLSearchParams('tier=3&style=floral')).tiers,[]);
 assert.deepEqual(ctx.query('ribbon-cakes',new URLSearchParams('category=wedding-cakes')).selectedCategories,[]);
 assert.equal(ctx.byId.get('8028660203745').image,require('../lib/cake-images').replaceCakeImage(catalog.products.find(p=>p.id==='8028660203745')).image);assert.equal(ctx.byId.get('8028660203745').imageReference,undefined);
});
test('cart gift and scheduling fields persist and invalid preparation choices are rejected',()=>{
 const p=catalog.products.find(p=>p.kind==='cake'&&p.available),v=p.variants.find(v=>v.available);
 const input={items:[{productId:p.id,variantId:v.id,quantity:1,personalisation:{colouring:'natural',allergens:'accept'}}],customer:{name:'Test',phone:'+971500000000',date:'2099-01-01',address:'Dubai'},consent:true,cartDetails:{giftMessage:'Congratulations!',senderDisplay:'anonymous',instructions:'Call on arrival',fulfilment:'delivery',date:'2099-01-01',time:'10am-7pm',sameDay:'no',leadTimeAccepted:true}};
 assert.equal(createOrder(input,catalog).cartDetails.giftMessage,'Congratulations!');
 for(const override of [{giftMessage:''},{senderDisplay:'invalid'},{leadTimeAccepted:false},{sameDay:'request'},{time:'10am-10pm'}])assert.throws(()=>createOrder({...input,cartDetails:{...input.cartDetails,...override}},catalog),OrderError);
 const pickup=createOrder({...input,customer:{...input.customer,address:''},cartDetails:{...input.cartDetails,fulfilment:'pickup',time:'10am-10pm'}},catalog);
 assert.equal(pickup.customer.address,'');assert.equal(pickup.cartDetails.fulfilment,'pickup');
});
