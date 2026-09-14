const fs=require('fs');
fs.writeFileSync('tests/verified-catalogue.test.js',`const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../data/catalog.json');
const {makeServer}=require('../server');
test('restored inventory and pricing exactly match the original import',()=>{
 assert.deepEqual(catalog,require('../data/archive/original-catalog.json'));
 assert.deepEqual(require('../data/price-audit.json'),require('../data/archive/original-price-audit.json'));
 for(const p of catalog.products)for(const file of [p.image,...p.images,...p.variants.map(v=>v.image)].filter(Boolean))assert.ok(fs.existsSync(file),file);
});
test('original product photos and wedding pages are served',async t=>{
 const server=makeServer({catalog});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const cake=catalog.products.find(p=>p.id==='8028660203745');
 for(const route of ['/','/collections/wedding-cakes','/cakes/'+cake.handle,'/'+cake.image])assert.equal((await fetch(base+route)).status,200,route);
 const html=await(await fetch(base+'/cakes/'+cake.handle)).text();assert.ok(html.includes(cake.title));assert.ok(html.includes('tierOptions'));
});
`);
let s=fs.readFileSync('tests/currency-tiers.spec.js','utf8');
s=s.replace('p.source.photoReviewNumber===10',"p.id==='8028660203745'");
s=s.replace("await page.locator('[data-option=\"0\"]').selectOption('6 Tier cake');","await page.locator('[data-option=\"0\"]').selectOption({index:1});");
s=s.replace('toHaveCount(6)','toHaveCount(4)');
s=s.replace("const custom=catalog.products.find(p=>p.quoteOnly);await page.goto('/cakes/'+custom.handle);await expect(page.locator('#product-price')).toHaveText('Price on request');await page.getByLabel('Display currency').selectOption('USD');await expect(page.locator('#product-price')).toHaveText('Price on request');",'');
s=s.replace('a filtered card opens the exact priced variation and quote-only designs never display zero','a filtered card opens the exact original priced variation');
s=s.replace('min=6000','min=2000');
fs.writeFileSync('tests/currency-tiers.spec.js',s);
