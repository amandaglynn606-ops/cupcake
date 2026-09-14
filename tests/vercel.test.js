'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {buildVercel}=require('../scripts/build-vercel.cjs');

test('Vercel bundle boots independently, routes pages and JSON, and separates public assets from source',async t=>{
 const {functionDir,staticDir}=await buildVercel();
 const handler=require(path.join(functionDir,'vercel-handler.js'));
 assert.equal(typeof handler,'function');
 const server=http.createServer(handler);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const origin='http://127.0.0.1:'+server.address().port;
 const catalog=require(path.join(functionDir,'lib/load-catalog')).loadCatalog();
 const ctx=require(path.join(functionDir,'lib/catalog')).buildCatalog(catalog,{curated:true});
 for(const route of ['/','/collections/wedding-cakes','/cakes/'+ctx.catalog.products[0].handle,'/contact','/checkout']){
  const response=await fetch(origin+route);
  assert.equal(response.status,200,route);
  const html=await response.text();
  assert.match(html,/<main/);
  for(const [,asset]of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)(?:[^" ]*)"/g)){
   await fs.access(path.join(staticDir,asset));
  }
 }
 const config=await (await fetch(origin+'/api/config')).json();
 assert.equal(config.email,'info@weddingcakes.ae');
 const response=await fetch(origin+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[]})});
 assert.equal(response.status,200);
 assert.equal((await response.json()).canOrder,false);
 for(const route of ['/server.js','/store.config.json','/data/catalog.json','/private/orders/example.json']){
  assert.equal((await fetch(origin+route)).status,404,route);
 }
 for(const product of ctx.catalog.products){
  for(const file of [product.image,...product.images,...product.variants.map(v=>v.image)].filter(Boolean))await fs.access(path.join(staticDir,file));
 }
 const responsive=require(path.join(functionDir,'data/responsive-images.json'));
 for(const entry of Object.values(responsive))for(const variant of entry.variants)await fs.access(path.join(staticDir,variant.url));
 const outputConfig=JSON.parse(await fs.readFile(path.join(staticDir,'..','config.json'),'utf8'));
 assert.equal(outputConfig.routes[0].headers['Cache-Control'],'public, max-age=31536000, immutable');
 const active=new Set(ctx.catalog.products.flatMap(p=>[p.image,...p.images,...p.variants.map(v=>v.image)]));
 const retired=catalog.products.flatMap(p=>[p.image,...p.images,...p.variants.map(v=>v.image)]).find(file=>file&&!active.has(file));
 assert.ok(retired);
 await assert.rejects(fs.access(path.join(staticDir,retired)),{code:'ENOENT'});
 assert.equal((await fetch(origin+'/'+retired)).status,410);
 for(const file of ['assets','private','products.csv','variations.csv'])await assert.rejects(fs.access(path.join(functionDir,file)),{code:'ENOENT'});
 const files=await fs.readdir(functionDir,{recursive:true,withFileTypes:true});
 let size=0;
 for(const file of files)if(file.isFile())size+=(await fs.stat(path.join(file.parentPath||file.path,file.name))).size;
 assert.ok(size<250*1024*1024,'Function bundle must fit Vercel’s size limit');
 console.log('Vercel function bundle: '+(size/1024/1024).toFixed(1)+' MiB');
});
