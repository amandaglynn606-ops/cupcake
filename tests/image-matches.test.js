const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const catalog=require('../data/catalog.json');
const matches=require('../data/image-matches.json');
const {replaceCakeImage}=require('../lib/cake-images');
const {isCakeProduct}=require('../lib/product-categories');
const batch=require('../data/image-batch-001.json');
const {buildCatalog}=require('../lib/catalog');
const {makeServer}=require('../server');
test('a two-tier cake rejects one-tier, unknown-tier and unreviewed replacements',()=>{
 const {compatibleImageMatch}=require('../lib/image-matches');
 const p=catalog.products.find(p=>p.title==='Two Tier Heart Lambeth Cake'),match=matches[p.id];
 assert.equal(compatibleImageMatch(p,match),true);
 for(const count of [1,3,null,undefined])assert.equal(compatibleImageMatch(p,{...match,visualReview:{...match.visualReview,tierCount:count}}),false);
 assert.equal(compatibleImageMatch(p,{...match,visualReview:{...match.visualReview,verified:false}}),false);
 assert.equal(compatibleImageMatch(p,{...match,sourceUrl:'https://example.com/cake'}),false);
 assert.equal(compatibleImageMatch(p,{...match,visualReview:{...match.visualReview,tierCount:3,originalTierCount:3}}),false);
});

test('a cake with no numbered tier label uses the visually reviewed original count',()=>{
 const {compatibleImageMatch}=require('../lib/image-matches');
 const p=catalog.products.find(p=>p.title==='Ferrari & Tyre Tiered Cake'),match=matches[p.id];
 assert.equal(compatibleImageMatch(p,match),true);
 for(const count of [1,3,null])assert.equal(compatibleImageMatch(p,{...match,visualReview:{...match.visualReview,tierCount:count}}),false);
});
test('reviewed replacements preserve commercial data; unmatched cakes retain existing photos',()=>{
 const original=JSON.stringify(catalog),ctx=buildCatalog(catalog);
 assert.equal(batch.records.length,50);
 assert.equal(Object.values(matches).filter(m=>m.batch===1).length,batch.summary.replaced);
 for(const p of catalog.products){
  const shown=ctx.byId.get(p.id),match=replaceCakeImage(p)||matches[p.id];
  const retained=!match&&isCakeProduct(p);
  const expectedImage=match?.image||(retained?p.image:'assets/maison-photo-pending.svg');
  assert.equal(shown.image,expectedImage);
  assert.equal(shown.images[0],expectedImage);
  if(retained)assert.deepEqual(shown.images,p.images);
  else assert.ok(shown.images.every(image=>!p.images.includes(image)),p.title+' retains an original gallery photo');
  assert.ok(fs.existsSync(path.join(__dirname,'..',expectedImage)));
  const {image,images,variants,categories,...before}=p;
  const {image:shownImage,images:shownImages,variants:shownVariants,categories:shownCategories,imageAlt,imageNote,imageSourceUrl,...after}=shown;
  assert.deepEqual(after,before);
  for(let i=0;i<variants.length;i++){
   const {image:oldImage,...oldVariant}=variants[i],{image:newImage,...newVariant}=shownVariants[i];
   assert.deepEqual(newVariant,oldVariant);
   assert.equal(newImage,retained?oldImage:expectedImage);
  }
 }
 assert.equal(JSON.stringify(catalog),original);
});
test('retained cake photos load and only superseded original URLs are retired',async t=>{
 const server=makeServer({catalog});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const paths=products=>products.flatMap(p=>[p.image,...p.images,...p.variants.map(v=>v.image)]).filter(Boolean);
 const originals=new Set(paths(catalog.products)),publicPaths=new Set(paths(buildCatalog(catalog).catalog.products));
 const queue=[...originals];
 await Promise.all(Array.from({length:8},async()=>{while(queue.length){
  const original=queue.pop(),response=await fetch(base+'/'+original);
  assert.equal(response.status,publicPaths.has(original)?200:410,original);
  if(!publicPaths.has(original))assert.equal(response.headers.get('cache-control'),'no-store');
  await response.arrayBuffer();
 }}));
 const placeholder=await fetch(base+'/assets/maison-photo-pending.svg');
 assert.equal(placeholder.status,200);
 assert.match(await placeholder.text(),/Photo coming soon/);
});

test('matched product images are served without public source credits, including AVIF',async t=>{
 const server=makeServer({catalog});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 for(const [id,match] of Object.entries(matches)){
  const response=await fetch(base+'/'+match.image);assert.equal(response.status,200);
  assert.ok(response.headers.get('content-type').startsWith('image/'));
  if(match.image.endsWith('.avif'))assert.equal(response.headers.get('content-type'),'image/avif');
  const p=catalog.products.find(p=>p.id===id);
  const html=await(await fetch(base+'/cakes/'+p.handle)).text();assert.ok(html.includes(match.image),p.title);
  for(const original of p.images){
   assert.ok(!html.includes(original),p.title+' exposes an original gallery image');
   assert.equal((await fetch(base+'/'+original)).status,410,original);
  }
 }
 const sources=await(await fetch(base+'/photography')).text();
 for(const match of Object.values(matches))assert.ok(!sources.includes(require('../lib/ui').esc(match.sourceUrl)));
 assert.ok(!/The Perfect Gift|Rosewood|GC Couture|Image credits/.test(sources));
});
