const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const products=require('../data/downloaded-additions.json').products;
const manifest=require('../data/downloaded-addition-manifest.json');
const {buildCatalog}=require('../lib/catalog');
const {loadCatalog}=require('../lib/load-catalog');
test('downloaded cake designs are distinct, categorised, locally served and retain reviewed tier counts',()=>{
 const ctx=buildCatalog(loadCatalog(),{curated:true});
 const hashes=new Set();
 for(const p of products){
  const actual=ctx.byId.get(p.id),record=manifest.products.find(r=>r.productId===p.id);
  assert.ok(actual,p.title+' hidden from storefront');
  assert.equal(actual.tiers,record.tiers);assert.equal(actual.variants[0].tiers,record.tiers);
  assert.equal(actual.title,p.title);assert.ok(p.metaTitle&&p.metaDescription&&p.imageAlt);
  const background=require('../data/cake-background-manifest.json').images.find(r=>r.originalImage===p.image);
  assert.ok(background?.visualReview.approved);assert.equal(background.status,'applied');
  assert.equal(actual.image,background.image);assert.equal(actual.variants[0].image,background.image);
  assert.ok(actual.images.every(image=>image===background.image));
  assert.ok(background.width>=1200&&background.height>=1200);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(background.image)).digest('hex'),background.sha256);
  assert.ok(p.quoteOnly);assert.equal(p.variants[0].priceFils,null);
  const digest=crypto.createHash('sha256').update(fs.readFileSync(p.image)).digest('hex');
  assert.equal(digest,record.sha256);assert.ok(!hashes.has(digest));hashes.add(digest);
  for(const category of p.categories)assert.ok(ctx.collections.find(c=>c.id===category).products.some(item=>item.id===p.id));
  assert.ok(!(p.categories.includes('wedding-cake-dubai')&&p.categories.includes('luxury-cakes')));
  for(const other of ctx.catalog.products.filter(other=>other.id!==p.id))assert.notEqual(other.image,p.image);
 }
 const filtered=ctx.query('fresh-floral-cakes',new URLSearchParams('combination=roses-hydrangeas'));
 assert.ok(filtered.products.some(p=>p.id==='9930000000006'));
});
