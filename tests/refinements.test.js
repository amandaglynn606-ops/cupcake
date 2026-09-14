'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {randomUUID}=require('node:crypto');
const {buildCatalog}=require('../lib/catalog');
const {validateReferences}=require('../lib/reference-images');
const {OrderError}=require('../lib/orders');
const {makeServer}=require('../server');
const catalog=require('../data/archive/original-catalog.json');

test('wedding styles and tiers combine, retain prices, and exclude unrelated products',()=>{
 const ctx=buildCatalog(catalog);
 const result=ctx.query('wedding-cakes',new URLSearchParams('style=floral&tier=3'));
 assert.ok(result.total>0);
 assert.ok(result.products.some(p=>p.id==='8028661612769'));
 assert.ok(!result.products.some(p=>p.id==='8028660203745'));
 for(const p of result.products){assert.ok(p.categories.includes('wedding-cake-dubai'));assert.ok(p.variants.some(v=>v.priceFils===p.listingPriceFils));}
 const four=ctx.query('wedding-cakes',new URLSearchParams('tier=4-plus'));
 const specific=ctx.query('wedding-cakes',new URLSearchParams('tier=4-plus&q=Four Tiered White Blush'));
 assert.ok(specific.products.some(p=>p.id==='8028660203745'));
 assert.ok(!four.products.some(p=>p.id==='8028661612769'));
 assert.equal(ctx.query('wedding-cakes',new URLSearchParams('style=floral&tier=3&max=1')).total,0);
});
test('reference uploads reject unsupported, disguised, oversized or excessive files',()=>{
 assert.deepEqual(validateReferences(undefined),[]);
 for(const input of [null,[{name:'x.svg',data:'data:image/svg+xml;base64,PHN2Zz4='}],[{name:'x.png',data:'data:image/png;base64,aGVsbG8gd29ybGQ='}],Array(4).fill({}),[{name:'x.jpg',data:'data:image/jpeg;base64,'+'A'.repeat(7*1024*1024)}]])assert.throws(()=>validateReferences(input),OrderError);
});
test('uploaded image bytes persist privately with enquiry, survive retries and stay out of JSON',async t=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'cake-references-'));
 const server=makeServer({catalog,enquiryDir:directory});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.rm(directory,{recursive:true,force:true});});
 const bytes=await fs.readFile(path.join(__dirname,'..',catalog.products[0].image));
 const input={kind:'bespoke',name:'Upload test',email:'test@example.com',phone:'+971500000000',occasion:'Wedding',date:'2099-01-01',guests:'50',budget:'AED 4,000+',brief:'White florals',consent:true,referenceImages:[{name:'My inspiration.jpg',data:'data:image/jpeg;base64,'+bytes.toString('base64')}]};
 const base='http://127.0.0.1:'+server.address().port;
 const key=randomUUID(),headers={'Content-Type':'application/json','Idempotency-Key':key},body=JSON.stringify(input);
 const first=await fetch(base+'/api/enquiries',{method:'POST',headers,body});assert.equal(first.status,201);
 const record=(await first.json()).enquiry,ref=record.referenceImages[0];
 assert.equal(ref.name,'My inspiration.jpg');assert.equal(ref.data,undefined);
 assert.deepEqual(await fs.readFile(path.join(directory,ref.file)),bytes);
 const stored=await fs.readFile(path.join(directory,key+'.json'),'utf8');assert.ok(!stored.includes('base64'));
 const repeat=await fetch(base+'/api/enquiries',{method:'POST',headers,body});assert.equal(repeat.status,200);assert.equal((await repeat.json()).enquiry.id,record.id);
 const changed=await fetch(base+'/api/enquiries',{method:'POST',headers,body:JSON.stringify({...input,brief:'Different'})});assert.equal(changed.status,409);
 assert.equal((await fetch(base+'/private/enquiries/'+ref.file)).status,404);
});
