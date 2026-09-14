'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeServer}=require('../server');
const {isPublicAsset}=require('../lib/public-security');

test('public assets exclude internal manifests, dotfiles, backups and source maps',()=>{
 for(const file of ['assets/image-map.json','assets/js/app.js.map','assets/.env','assets/.git/config','assets/js/app.js.bak','assets/../server.js','assets/js/.private.js'])assert.equal(isPublicAsset(file),false,file);
 for(const file of ['favicon.svg','assets/js/app.js','assets/css/atelier.css','assets/fonts/Runethia.otf','assets/products/cake.webp'])assert.equal(isPublicAsset(file),true,file);
});

test('local server protects internal files and still delivers browser assets',async t=>{
 const server=makeServer({catalog:require('../lib/load-catalog').loadCatalog(),config:require('../store.config.json')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 for(const route of ['/assets/image-map.json','/.env','/.git/config','/server.js','/private/orders/example.json','/assets/..%2fserver.js','/assets/js/app.js.map'])assert.equal((await fetch(base+route)).status,404,route);
 for(const route of ['/','/assets/js/app.js','/assets/css/atelier.css']){
  const response=await fetch(base+route);
  assert.equal(response.status,200,route);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('x-frame-options'),'DENY');
  assert.equal(response.headers.get('permissions-policy'),'camera=(), microphone=(), geolocation=()');
  assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 }
});
