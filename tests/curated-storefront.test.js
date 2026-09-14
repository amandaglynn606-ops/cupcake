const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadCatalog}=require('../lib/load-catalog');
const {buildCatalog}=require('../lib/catalog');
const {makeServer}=require('../server');
const config=require('../store.config.json');

test('unreplaced imported photos are excluded while replaced designs remain available',async t=>{
 const raw=require('../data/catalog.json').products,catalog=loadCatalog(),ctx=buildCatalog(catalog,{curated:true});
 const originalPhotos=new Set(raw.flatMap(p=>[p.image,...p.images,...p.variants.map(v=>v.image)]));
 for(const p of ctx.catalog.products)for(const image of [p.image,...p.images,...p.variants.map(v=>v.image)])assert.ok(!originalPhotos.has(image),p.title+' still uses '+image);
 const before=require('../artifacts/remaining-perfect-gift.json');
 const retained=before.filter(p=>ctx.byId.has(p.id)),removed=before.filter(p=>!ctx.byId.has(p.id));
 assert.ok(retained.length>0&&removed.length>0);
 for(const p of retained)assert.notEqual(ctx.byId.get(p.id).image,p.localImage);
 for(const p of raw.filter(p=>ctx.byId.has(p.id)))assert.notEqual(ctx.byId.get(p.id).image,p.image);
 const server=makeServer({catalog,config:{...config,siteUrl:'https://example.com'}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port,sitemap=await(await fetch(base+'/sitemap.xml')).text();
 for(const p of removed){
  const original=raw.find(r=>r.id===p.id);
  assert.equal((await fetch(base+'/cakes/'+original.handle)).status,404);
  assert.equal((await fetch(base+'/api/products/'+p.id)).status,404);
  assert.equal((await fetch(base+'/'+p.localImage)).status,410);
  assert.ok(!sitemap.includes('/cakes/'+original.handle+'<'));
 }
 const retired=raw.find(p=>p.id===removed[0].id);
 const search=await(await fetch(base+'/search?q='+encodeURIComponent(retired.title))).text();assert.ok(!search.includes('data-product-id="'+retired.id+'"'));
 const wishlist=await(await fetch(base+'/api/wishlist?ids='+retired.id)).json();assert.equal(wishlist.count,0);
 const quote=await fetch(base+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{productId:retired.id,variantId:retired.variants[0].id,quantity:1}]})});assert.equal(quote.status,200);const saved=await quote.json();assert.equal(saved.items[0].title,'Saved design — confirmation needed');assert.equal(saved.items[0].unitPriceFils,null);assert.equal(saved.items[0].available,false);
 assert.ok(ctx.byId.has(ctx.catalog.featuredId));
 for(const p of retained)assert.equal((await fetch(base+'/cakes/'+ctx.byId.get(p.id).handle)).status,200);
});
test('public catalog contains only the six requested cake collections without altering archive data',()=>{
 const catalog=loadCatalog(),snapshot=JSON.stringify(catalog),ctx=buildCatalog(catalog,{curated:true});
 assert.deepEqual(ctx.collections.map(c=>c.slug),['wedding-cakes','luxury-cakes','engagement-cakes','tiered-cakes','fresh-floral-cakes','sugar-flower-cakes']);
 for(const p of ctx.catalog.products){assert.ok(require('../lib/product-categories').isCakeProduct(p));assert.ok(p.categories.every(id=>ctx.collections.some(c=>c.id===id)));}
 for(const p of ctx.bySlug.get('tiered-cakes').products)assert.ok(p.variants.some(v=>require('../lib/tier-options').tierCount(p,v)>=2));
 assert.ok(!ctx.bySlug.get('fresh-floral-cakes').products.some(p=>p.id==='8028655812833'),'Artificial orchids must not be classified as fresh');
 assert.equal(JSON.stringify(catalog),snapshot);
 for(const slug of ['fresh-floral-cakes','sugar-flower-cakes']){
  const result=ctx.query(slug,new URLSearchParams());
  for(const group of result.facets.features)for(const item of group.items){
   const filtered=ctx.query(slug,new URLSearchParams(group.key+'='+item.id));
   assert.equal(filtered.total,item.count,slug+' '+item.id);
   for(const p of filtered.products)assert.ok(item.matches(p));
  }
 }
 const combinations=ctx.query('fresh-floral-cakes',new URLSearchParams('combination=roses-peonies'));
 assert.ok(combinations.total>0);
 for(const p of combinations.products){const flowers=require('../data/flower-details.json').products[p.id].flowerTypes;assert.ok(flowers.includes('roses')&&flowers.includes('peonies'));}
});
test('retired products cannot appear through public routes, search, API, sitemap; stale cart references reveal no retired details',async t=>{
 const catalog=loadCatalog(),ctx=buildCatalog(catalog,{curated:true}),server=makeServer({catalog,config:{...config,siteUrl:'https://example.com'}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 for(const c of ctx.collections)assert.equal((await fetch(base+'/collections/'+c.slug)).status,200,c.slug);
 for(const slug of ['birthday-cakes','childrens-cakes','cupcakes-and-treats','candles','cake-toppers'])assert.equal((await fetch(base+'/collections/'+slug)).status,404,slug);
 const retired=catalog.products.find(p=>/Minecraft Cake/.test(p.title));
 assert.ok(retired&&!ctx.byId.has(retired.id));
 assert.equal((await fetch(base+'/cakes/'+retired.handle)).status,404);
 assert.equal((await fetch(base+'/api/products/'+retired.id)).status,404);
 assert.equal((await(await fetch(base+'/api/wishlist?ids='+retired.id)).json()).count,0);
 const sitemap=await(await fetch(base+'/sitemap.xml')).text();assert.ok(!sitemap.includes(retired.handle));
 const quote=await fetch(base+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{productId:retired.id,variantId:retired.variants[0].id,quantity:1}]})});assert.equal(quote.status,200);const saved=await quote.json();assert.equal(saved.items[0].title,'Saved design — confirmation needed');assert.equal(saved.items[0].unitPriceFils,null);assert.equal(saved.items[0].available,false);
 const search=await(await fetch(base+'/search?q=Minecraft')).text();assert.ok(!search.includes('data-product-id="'+retired.id+'"'));
 const home=await(await fetch(base+'/')).text();
 for(const c of ctx.collections)assert.ok(home.includes('/collections/'+c.slug));
 assert.ok(!home.includes('/collections/cupcakes-and-treats'));
});
