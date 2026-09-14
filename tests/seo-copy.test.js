'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loadCatalog}=require('../lib/load-catalog');
const {buildCatalog}=require('../lib/catalog');
const {makeServer}=require('../server');
const {tierCount}=require('../lib/tier-options');
const {esc}=require('../lib/ui');
const config=require('../store.config.json');
const pageCopy=require('../data/page-metadata.json');

test('every public cake has unique factual copy without changing its URL or tier choices',()=>{
 const ctx=buildCatalog(loadCatalog(),{curated:true});
 const before=require('../artifacts/copy-audit/before.json');
 const titles=new Set(),descriptions=new Set();
 const additions=require('../data/downloaded-additions.json').products;
 assert.equal(ctx.catalog.products.length,before.length+additions.length);
 for(const original of before)assert.ok(ctx.byId.has(original.id),'Existing cake removed: '+original.id);
 for(const p of ctx.catalog.products){
  const previous=before.find(row=>row.id===p.id);
  if(previous){
   assert.equal(p.handle,previous.handle,p.id+' URL changed');
   assert.equal(tierCount(p,p.variants[0]),previous.tiers,p.id+' tier choices changed');
  }else assert.ok(additions.some(a=>a.id===p.id),'Unreviewed addition: '+p.id);
  assert.ok(p.metaTitle&&p.metaDescription&&p.description);
  assert.ok(!titles.has(p.metaTitle),p.title+' duplicate meta title');titles.add(p.metaTitle);
  assert.ok(!descriptions.has(p.metaDescription),p.title+' duplicate description');descriptions.add(p.metaDescription);
  assert.ok(!/free tastings|finest ingredients|masterpiece|perfect gift|extraordinary|beautifully considered/i.test(p.title+' '+p.description));
 }
});

test('all public routes render distinct metadata; variants canonicalise and pagination stays distinct',async t=>{
 const catalog=loadCatalog(),ctx=buildCatalog(catalog,{curated:true});
 const server=makeServer({catalog,config:{...config,siteUrl:'https://example.com'}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const origin='http://127.0.0.1:'+server.address().port;
 const routes=[...Object.keys(pageCopy),...ctx.catalog.products.map(p=>'/cakes/'+p.handle)];
 const titles=new Set(),descriptions=new Set(),report=[];
 for(const path of routes){
  const res=await fetch(origin+path),html=await res.text();
  assert.equal(res.status,path==='/404'?404:200,path);
  const title=[...html.matchAll(/<title>(.*?)<\/title>/g)];
  const description=[...html.matchAll(/<meta name="description" content="([^"]*)">/g)];
  assert.equal(title.length,1,path);assert.equal(description.length,1,path);
  assert.ok(description[0][1].length>30,path);
  assert.ok(!titles.has(title[0][1]),path+' duplicates title');titles.add(title[0][1]);
  assert.ok(!descriptions.has(description[0][1]),path+' duplicates description');descriptions.add(description[0][1]);
  const p=ctx.byHandle.get(path.slice('/cakes/'.length));
  if(p){assert.ok(html.includes('<h1>'+esc(p.title)+'</h1>'));assert.equal(description[0][1],esc(p.metaDescription));}
  assert.ok(!/beautifully considered|entirely yours|something wonderful|your perfect cake|finest ingredients|free tastings/i.test(html),path);
  const visibleCopy=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ');
  assert.ok(!/\bbespoke\b|About our images/i.test(visibleCopy),path);
  assert.ok(html.includes('Powered by <a href="https://hyperhive.ae">Hyperhive</a>'),path);
  assert.ok(!html.includes('href="/photography"'),path);
  assert.ok(!html.includes('class="breadcrumbs"'),path);
  assert.ok(!html.includes('CAKE PHOTOS')&&!html.includes('class="photo-note"'),path);
  if(['/cart','/bag','/checkout','/wishlist','/search','/404'].includes(path))assert.ok(html.includes('noindex, follow'),path);
  report.push({path,title:title[0][1],description:description[0][1],status:res.status});
 }
 const p=ctx.catalog.products[0],variantPath='/cakes/'+p.handle+'?variant='+p.variants[0].id;
 assert.equal((await fetch(origin+'/photography')).status,404);
 assert.ok(!(await(await fetch(origin+'/sitemap.xml')).text()).includes('/photography'));
 assert.ok((await(await fetch(origin+variantPath)).text()).includes('href="https://example.com/cakes/'+p.handle+'"'));
 const pagination=await(await fetch(origin+'/collections/wedding-cakes?page=2')).text();
 assert.ok(pagination.includes('— Page 2 | Maison Zavi</title>'));
 assert.ok(pagination.includes('content="Page 2. Browse tiered wedding cakes'));
 assert.ok(pagination.includes('href="https://example.com/collections/wedding-cakes?page=2"'));
 fs.mkdirSync('artifacts/copy-audit',{recursive:true});
 fs.writeFileSync('artifacts/copy-audit/seo-report.json',JSON.stringify({checked:report.length,uniqueTitles:titles.size,uniqueDescriptions:descriptions.size,pages:report},null,2));
});
