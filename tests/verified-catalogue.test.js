const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../data/catalog.json');
const {makeServer}=require('../server');
test('restored inventory and pricing exactly match the original import',()=>{
 assert.deepEqual(catalog,require('../data/archive/original-catalog.json'));
 assert.deepEqual(require('../data/price-audit.json'),require('../data/archive/original-price-audit.json'));
 for(const p of catalog.products)for(const file of [p.image,...p.images,...p.variants.map(v=>v.image)].filter(Boolean))assert.ok(fs.existsSync(file),file);
});
test('unmatched cake photos remain available while replacements are reviewed',async t=>{
 const server=makeServer({catalog});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const cake=catalog.products.find(p=>p.id==='8028660170977');
 for(const route of ['/','/collections/wedding-cakes','/cakes/'+cake.handle])assert.equal((await fetch(base+route)).status,200,route);
 assert.equal((await fetch(base+'/'+cake.image)).status,200);
 const html=await(await fetch(base+'/cakes/'+cake.handle)).text();assert.ok(html.includes(require('../lib/ui').esc(cake.title)));assert.ok(html.includes('tierOptions'));
});
