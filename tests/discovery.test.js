'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeServer}=require('../server');
const {loadCatalog}=require('../lib/load-catalog');
const {buildCatalog}=require('../lib/catalog');
const config=require('../store.config.json');

test('public discovery uses the live origin and includes every active cake without private URLs',async t=>{
 const catalog=loadCatalog(),ctx=buildCatalog(catalog,{curated:true});
 const server=makeServer({catalog,config});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const robots=await(await fetch(base+'/robots.txt')).text();
 assert.match(robots,/User-agent: \*\nAllow: \/\n/);
 assert.match(robots,/Sitemap: https:\/\/www\.weddingcakes\.ae\/sitemap.xml/);
 assert.ok(!robots.includes('Disallow: /\n'));
 const sitemap=await(await fetch(base+'/sitemap.xml')).text();
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);
 assert.equal(new Set(urls).size,urls.length);
 const response=await fetch(base+'/llms.txt');
 assert.equal(response.status,200);
 assert.match(response.headers.get('content-type'),/^text\/plain/);
 const guide=await response.text();
 assert.match(guide,/^# Maison Zavi\n/);
 for(const p of ctx.catalog.products){
  assert.ok(urls.includes('https://www.weddingcakes.ae/cakes/'+p.handle),p.handle);
  assert.ok(guide.includes('(https://www.weddingcakes.ae/cakes/'+p.handle+')'),p.handle);
 }
 for(const route of ['/private/','/api/','/checkout','/cart','/wishlist']){
  assert.ok(!urls.some(url=>url.includes(route)),route);
  assert.ok(!guide.includes('https://www.weddingcakes.ae'+route),route);
 }
 const html=await(await fetch(base+'/')).text();
 assert.match(html,/<link rel="canonical" href="https:\/\/www\.weddingcakes\.ae\/">/);
 assert.match(html,/<meta name="robots" content="index, follow,/);
 for(const route of ['/search','/cart','/checkout','/wishlist'])assert.match(await(await fetch(base+route)).text(),/<meta name="robots" content="noindex, follow">/);
 for(const route of ['/robots.txt','/sitemap.xml','/llms.txt']){
  const head=await fetch(base+route,{method:'HEAD'});
  assert.equal(head.status,200);assert.equal(await head.text(),'');
 }
});
