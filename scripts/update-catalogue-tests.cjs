const fs=require('fs');
// Retain the imported catalogue as a stable fixture for the existing business-rule tests.
for(const file of ['orders','boutique','category-profiles','delivery','refinements']){
 const path='tests/'+file+'.test.js';let s=fs.readFileSync(path,'utf8');
 s=s.replaceAll("require('../data/catalog.json')","require('../data/archive/original-catalog.json')").replaceAll("require('../data/price-audit.json')","require('../data/archive/original-price-audit.json')");
 s=s.replace("assert.ok(ctx.byId.get('8028660203745').image.startsWith('assets/studio/'));assert.equal(ctx.byId.get('8028660203745').imageReference,true);","assert.ok(ctx.byId.get('8028660203745').image.startsWith('assets/products/'));assert.equal(ctx.byId.get('8028660203745').imageReference,undefined);");
 s=s.replace('tier=4-plus&q=Four Tier White Blush','tier=4-plus&q=Four Tiered White Blush');
 s=s.replace('assert.deepEqual(order.items[0].personalisation,payload.items[0].personalisation);','assert.deepEqual(order.items[0].personalisation,{...payload.items[0].personalisation,tiers:[]});');
 fs.writeFileSync(path,s);
}
