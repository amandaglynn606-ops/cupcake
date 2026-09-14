'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadCatalog}=require('../lib/load-catalog');
const {buildCatalog}=require('../lib/catalog');
const additions=require('../data/luxury-additions.json').products;
const manifest=require('../data/luxury-addition-manifest.json');
const photos=p=>[p.image,...p.images,...p.variants.map(v=>v.image)].filter(Boolean);
test('luxury and wedding collections have no shared products or photographs',()=>{
 const ctx=buildCatalog(loadCatalog(),{curated:true});
 const wedding=ctx.bySlug.get('wedding-cakes').products,luxury=ctx.bySlug.get('luxury-cakes').products;
 const downloaded=require('../data/downloaded-additions.json').products; assert.equal(wedding.length,130+downloaded.filter(p=>p.categories.includes('wedding-cake-dubai')).length);assert.equal(luxury.length,22+downloaded.filter(p=>p.categories.includes('luxury-cakes')).length);assert.equal(ctx.catalog.products.length,177+downloaded.length);
 const ids=new Set(wedding.map(p=>p.id)),images=new Set(wedding.flatMap(photos));
 for(const p of luxury){assert.ok(!ids.has(p.id),p.title);for(const image of photos(p))assert.ok(!images.has(image),image);}
 assert.deepEqual(luxury.map(p=>p.id).sort(),[...require('../data/luxury-selection.json').approvedProductIds].sort());
 for(const id of ['8232863629537','8957441278177','8957444653281','8957434069217','8961211990241','8961203994849','9910000000014'])assert.ok(!luxury.some(p=>p.id===id),'Simple piped hearts and ribbon cakes must stay out of Luxury');
 assert.ok(ctx.byId.has('8232863629537'),'Removing a collection placement must not delete the product');
});
test('20 distinct luxury additions have local reviewed images from the four requested countries',()=>{
 assert.equal(additions.length,20);assert.equal(manifest.products.length,20);
 assert.deepEqual([...new Set(manifest.products.map(r=>r.source_country))].sort(),['AU','CA','GB','IT']);
 const existing=require('../data/cake-background-manifest.json').images.filter(r=>!r.products.some(p=>additions.some(a=>a.id===p.id)));
 const oldHashes=new Set(existing.flatMap(r=>[r.originalImage,r.image]).map(file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',file))).digest('hex')));
 for(const field of ['id','handle','image'])assert.equal(new Set(additions.map(p=>p[field])).size,20);
 assert.equal(new Set(manifest.products.map(r=>r.originalSha256)).size,20);
 for(const p of additions){
  const r=manifest.products.find(r=>r.productId===p.id);
  assert.equal(r.tiers,p.tiers);assert.equal(p.variants[0].tiers,p.tiers);assert.equal(r.alt,p.imageAlt);
  assert.ok(r.visualReview.approved&&r.countryEvidence&&r.source&&r.sourceImage);
  assert.ok(r.width>=1000&&r.height>=1000);assert.ok(!oldHashes.has(r.sha256)&&!oldHashes.has(r.originalSha256));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',p.image))).digest('hex'),r.sha256);
  assert.ok(p.quoteOnly);assert.equal(p.minPriceFils,null);
  assert.ok(!/Simon's|Artisienne|Daan Go|Delizie|Perfect Gift/i.test(JSON.stringify(p)));
 }
});
