'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const products=require('../data/extravagant-additions.json').products;
const records=require('../data/extravagant-addition-manifest.json').products;
test('ten extravagant additions have unique verified photographs and accurate quotation tiers',()=>{
 assert.equal(products.length,10);assert.equal(records.length,10);
 const backgrounds=require('../data/cake-background-manifest.json').images;
 const selected=require('../data/luxury-selection.json').approvedProductIds;
 assert.deepEqual(selected.slice(0,10),products.map(p=>p.id));
 assert.equal(new Set(backgrounds.map(r=>r.sha256)).size,backgrounds.length);
 for(const p of products){
  const r=records.find(r=>r.productId===p.id);
  assert.ok(['CA','AU','GB'].includes(r.source_country)&&r.countryEvidence&&r.sourceImage);
  assert.ok(r.visualReview.approved&&r.visualReview.fullCakeVisible);
  assert.equal(p.tiers,r.tiers);assert.equal(p.variants[0].tiers,r.tiers);
  assert.equal(p.imageAlt,r.alt);assert.ok(p.quoteOnly);assert.equal(p.minPriceFils,null);
  assert.ok(!p.categories.includes('wedding-cake-dubai'));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',p.image))).digest('hex'),r.sha256);
  assert.ok(r.width>=1000&&r.height>=1000);
  assert.ok(!/Rosalind|Farah|Cahill|Perfect Gift/i.test(JSON.stringify(p)));
 }
});
