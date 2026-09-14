const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadCatalog}=require('../lib/load-catalog');
const {buildCatalog}=require('../lib/catalog');
const {isCakeProduct,NON_CAKE_CATEGORIES}=require('../lib/product-categories');
const {makeServer}=require('../server');

test('non-cakes leave every cake category and remain in suitable treat or accessory categories',()=>{
 const original=loadCatalog(),snapshot=JSON.stringify(original),ctx=buildCatalog(original);
 for(const collection of ctx.collections){
  if(!NON_CAKE_CATEGORIES.has(collection.id))assert.ok(collection.products.every(isCakeProduct),collection.slug);
 }
 for(const p of ctx.catalog.products){
  if(!isCakeProduct(p)){
   assert.ok(p.categories.length,p.title+' has no category');
   assert.ok(p.categories.every(id=>NON_CAKE_CATEGORIES.has(id)),p.title);
  }
  const source=original.products.find(source=>source.id===p.id);
  assert.equal(p.minPriceFils,source.minPriceFils);
  assert.deepEqual(p.variants.map(({image,...v})=>v),source.variants.map(({image,...v})=>v));
 }
 assert.equal(ctx.catalog.products.length,original.products.length);
 assert.equal(JSON.stringify(original),snapshot);
 for(const c of ctx.catalog.categories)assert.equal(c.count,ctx.catalog.products.filter(p=>p.categories.includes(c.id)).length);
});

test('mislabelled cake pops and cake-shaped treats are excluded while decorated cakes and cake sets remain',()=>{
 const ctx=buildCatalog(loadCatalog());
 const excluded=['Pink Bow Cake Pops','White Elegant Cake Pops','Oh Baby Rainbows & Bears Cupcakes','Teddy Bear Square Cakesicles','Angel Shaped Macarons','Birthday Cake Cookies','Birthday Cake Shaped Swiss Chocolate Dipped Strawberries','Pink Roses Bouquet - Cupcake Cake','Wooden Numbers Cake Topper'];
 for(const title of excluded){
  const p=ctx.catalog.products.find(p=>p.title===title);assert.ok(p,title);assert.equal(isCakeProduct(p),false,title);
  assert.equal(ctx.query('all',new URLSearchParams({q:title})).products.some(found=>found.id===p.id),false,title);
 }
 for(const title of ['Cookie Monster Cake & Macarons','Macaron Cake','Blue Striped Cake with Candles','Stitch Bento Cake & Cupcakes','Astronaut Bomb Cake']){
  const p=ctx.catalog.products.find(p=>p.title===title);assert.ok(p,title);assert.equal(isCakeProduct(p),true,title);
  assert.ok(ctx.query('all',new URLSearchParams({q:title})).total>0,title);
 }
 for(const c of ctx.collections.filter(c=>!NON_CAKE_CATEGORIES.has(c.id))){
  const filtered=ctx.query('all',new URLSearchParams({category:c.slug}));
  assert.equal(filtered.total,c.products.length,c.slug);
 }
});

test('all-cakes pagination stays cake-only and search still finds treats and accessories',()=>{
 const ctx=buildCatalog(loadCatalog()),seen=new Set();
 const first=ctx.query('all',new URLSearchParams());
 for(let page=1;page<=first.pageCount;page++)for(const p of ctx.query('all',new URLSearchParams({page})).products){
  assert.ok(isCakeProduct(p),p.title);assert.ok(!seen.has(p.id));seen.add(p.id);
 }
 assert.equal(seen.size,ctx.catalog.products.filter(isCakeProduct).length);
 for(const q of ['Pink Bow Cake Pops','Angel Shaped Macarons','Wooden Numbers Cake Topper']){
  assert.ok(ctx.query('all',new URLSearchParams({q}),{includeAllProducts:true}).products.some(p=>p.title===q),q);
 }
});

test('public cake pages, search and product breadcrumbs use corrected assignments',async t=>{
 const catalog=loadCatalog(),ctx=buildCatalog(catalog),server=makeServer({catalog});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const cakepop=ctx.catalog.products.find(p=>p.title==='White Elegant Cake Pops');
 for(const route of ['/collections/wedding-cakes?q='+encodeURIComponent(cakepop.title),'/collections/all?q='+encodeURIComponent(cakepop.title)]){
  const html=await(await fetch(base+route)).text();assert.ok(!html.includes('/cakes/'+cakepop.handle),route);
 }
 const search=await(await fetch(base+'/search?q='+encodeURIComponent(cakepop.title))).text();
 assert.ok(search.includes('/cakes/'+cakepop.handle));
 const html=await(await fetch(base+'/cakes/'+cakepop.handle)).text();
 assert.match(html,/<p class="eyebrow">Cupcakes &amp; petite treats<\/p>/);
});
