'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('sharp');
const {makeServer}=require('../server');
const {canonicalRedirect,canonicalRoutes,identityHead}=require('../lib/site-identity');
const config=require('../store.config.json');

test('canonical redirects keep paths and queries on the configured owned HTTPS host',()=>{
 for(const host of ['weddingcakes.ae','WEDDINGCAKES.AE','weddingcakes.ae:80']){
  assert.equal(canonicalRedirect(config,host,'/collections/wedding-cakes?page=2'),'https://www.weddingcakes.ae/collections/wedding-cakes?page=2');
 }
 for(const host of ['www.weddingcakes.ae','localhost:3000','127.0.0.1','preview.vercel.app','evil.example','weddingcakes.ae.evil.example',undefined]){
  assert.equal(canonicalRedirect(config,host,'/'),null);
 }
 assert.equal(canonicalRedirect(config,'weddingcakes.ae','//evil.example/path'),'https://www.weddingcakes.ae//evil.example/path');
 assert.equal(canonicalRedirect(config,'weddingcakes.ae','/\r\nLocation: https://evil.example'),null);
 assert.equal(canonicalRedirect({siteUrl:'http://localhost:3000'},'weddingcakes.ae','/'),null);
 const apex={siteUrl:'https://weddingcakes.ae'};
 assert.equal(canonicalRedirect(apex,'www.weddingcakes.ae','/'),'https://weddingcakes.ae/');
 assert.equal(canonicalRedirect(apex,'weddingcakes.ae','/'),null);
 assert.deepEqual(canonicalRoutes(config),[{src:'/(.*)',has:[{type:'host',value:'weddingcakes.ae'}],status:308,headers:{Location:'https://www.weddingcakes.ae/$1'}}]);
});

test('site identity markup cannot break out of structured data',()=>{
 const hostile={...config,name:'</script><script>alert(1)</script>'};
 const head=identityHead(hostile,{path:'/'},require('../lib/ui').esc);
 assert.equal((head.match(/<script/g)||[]).length,1);
 const data=JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(data['@graph'][0].name,hostile.name);
 assert.ok(!identityHead(config,{path:'/checkout'},require('../lib/ui').esc).includes('application/ld+json'));
});

test('homepage identity, favicon formats and redirects work through the HTTP server',async t=>{
 const server=makeServer({catalog:require('../lib/load-catalog').loadCatalog(),config});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const response=await new Promise((resolve,reject)=>{
  require('node:http').get(base+'/cakes/example?variant=123',{headers:{Host:'weddingcakes.ae'}},res=>{res.resume();resolve(res);}).on('error',reject);
 });
 assert.equal(response.statusCode,308);
 assert.equal(response.headers.location,'https://www.weddingcakes.ae/cakes/example?variant=123');
 const html=await(await fetch(base+'/')).text();
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(data['@graph'][0].logo.url,'https://www.weddingcakes.ae/assets/brand/site-logo.png');
 assert.equal(data['@graph'][1].name,'Maison Zavi');
 const iconLinks=[...html.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g)];
 assert.equal(iconLinks.length,4);
 for(const [,url]of iconLinks){
  const result=await fetch(base+url);
  assert.equal(result.status,200,url);
  assert.match(result.headers.get('content-type'),/^image\//);
  assert.equal(result.headers.get('x-content-type-options'),'nosniff');
 }
 for(const [file,size]of [['favicon-48.png',48],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512],['assets/brand/site-logo.png',512]]){
  const result=await fetch(base+'/'+file);
  assert.equal(result.status,200,file);
  const metadata=await sharp(Buffer.from(await result.arrayBuffer())).metadata();
  assert.equal(metadata.width,size);assert.equal(metadata.height,size);
 }
 const ico=await fs.readFile(path.join(__dirname,'../favicon.ico'));
 assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
 for(let index=0;index<3;index++){
  const entry=6+16*index,size=ico.readUInt32LE(entry+8),offset=ico.readUInt32LE(entry+12);
  const metadata=await sharp(ico.subarray(offset,offset+size)).metadata();
  assert.equal(metadata.width,[16,32,48][index]);
 }
});
