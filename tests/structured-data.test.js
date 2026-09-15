'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeServer}=require('../server');
const {loadCatalog}=require('../lib/load-catalog');
const {buildCatalog}=require('../lib/catalog');
const {EMIRATES}=require('../lib/pricing');
const {structuredData,serialize}=require('../lib/structured-data');
const {esc}=require('../lib/ui');
const config=require('../store.config.json');
const origin=config.siteUrl;
const parse=html=>{
 const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 assert.equal(blocks.length,1);
 return JSON.parse(blocks[0][1])['@graph'];
};

test('every sitemap page has UAE-only identity and page-specific structured data matching its content',async t=>{
 const catalog=loadCatalog(),ctx=buildCatalog(catalog,{curated:true});
 const server=makeServer({catalog,config});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const sitemap=await(await fetch(base+'/sitemap.xml')).text();
 const paths=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([,url])=>new URL(url).pathname);
 let products=0,services=0;
 for(const path of paths){
  const response=await fetch(base+path);assert.equal(response.status,200,path);
  const html=await response.text(),graph=parse(html);
  assert.equal(new Set(graph.map(node=>node['@id'])).size,graph.length,path+' duplicates an entity ID');
  const organization=graph.find(node=>node['@type']==='Organization');
  assert.deepEqual(organization.areaServed.map(region=>region.name),EMIRATES,path);
  for(const region of organization.areaServed)assert.equal(region.containedInPlace.identifier,'AE');
  assert.equal(organization.contactPoint.areaServed.identifier,'AE');
  const website=graph.find(node=>node['@type']==='WebSite');
  assert.equal(website.inLanguage,'en-AE');assert.equal(website.url,origin+'/');
  const page=graph.find(node=>node['@id']===origin+path+'#webpage');
  assert.ok(page,path);assert.equal(page.url,origin+path);assert.equal(page.spatialCoverage.identifier,'AE');
  assert.ok(html.includes('<meta name="description" content="'+esc(page.description)+'">'));
  if(path!=='/'){
   const breadcrumb=graph.find(node=>node['@type']==='BreadcrumbList');
   assert.equal(breadcrumb.itemListElement[0].item,origin+'/');
   assert.equal(breadcrumb.itemListElement.at(-1).item,origin+path);
   breadcrumb.itemListElement.forEach((entry,index)=>assert.equal(entry.position,index+1));
  }
  const source=ctx.byHandle.get(path.replace('/cakes/',''));
  if(source){
   const entity=graph.find(node=>node['@id']===page.mainEntity['@id']);
   assert.equal(entity.name,source.title);assert.equal(entity.description,source.description);
   assert.ok(html.includes('<h1>'+esc(entity.name)+'</h1>'));
   assert.ok(html.includes('<p>'+esc(entity.description)+'</p>'));
   assert.equal(entity.image[0],new URL(source.image,origin+'/').href);
   assert.equal(entity.aggregateRating,undefined);assert.equal(entity.review,undefined);
   if(source.quoteOnly||source.priceOnConsultation){
    services++;assert.equal(entity['@type'],'Service');assert.equal(entity.offers,undefined);
    assert.deepEqual(entity.areaServed.map(region=>region.name),EMIRATES);
   }else{
    products++;assert.equal(entity['@type'],'Product');
    const selected=source.variants.filter(v=>v.available).sort((a,b)=>(a.priceFils??0)-(b.priceFils??0))[0]||source.variants[0];
    assert.equal(entity.offers.price,(selected.priceFils/100).toFixed(2));
    assert.equal(entity.offers.priceCurrency,'AED');assert.equal(entity.offers.eligibleRegion.identifier,'AE');
    assert.ok(entity.offers.url.endsWith('?variant='+selected.id));
    assert.deepEqual(entity.offers.shippingDetails.flatMap(rate=>rate.shippingDestination.addressRegion),EMIRATES);
    for(const rate of entity.offers.shippingDetails){
     assert.equal(rate.shippingDestination.addressCountry,'AE');assert.equal(rate.shippingRate.currency,'AED');
     assert.equal(rate.shippingRate.value,rate.shippingDestination.addressRegion.includes('Dubai')?'100.00':'200.00');
    }
   }
  }
  if(path.startsWith('/collections/')){
   assert.equal(page['@type'],'CollectionPage');
   const items=graph.find(node=>node['@type']==='ItemList');
   const expected=ctx.query(path.slice('/collections/'.length),new URLSearchParams()).products;
   assert.deepEqual(items.itemListElement.map(item=>item.name),expected.map(item=>item.title));
   assert.equal(items.numberOfItems,expected.length);
   const linkedPaths=new Set([...html.matchAll(/href="([^"]+)"/g)].map(([,href])=>new URL(href,origin).pathname));
   for(const item of items.itemListElement)assert.ok(linkedPaths.has(new URL(item.url).pathname));
  }
  if(path==='/faq'){
   assert.equal(page['@type'],'FAQPage');assert.equal(page.mainEntity.length,9);
   for(const question of page.mainEntity)assert.ok(html.includes('<summary>'+question.name+'</summary><p>'+question.acceptedAnswer.text+'</p>'));
  }
 }
 assert.equal(products+services,ctx.catalog.products.length);assert.ok(products>0&&services>0);
 const pagination=parse(await(await fetch(base+'/collections/wedding-cakes?page=2')).text());
 const page= pagination.find(node=>node['@type']==='CollectionPage');
 assert.equal(page.url,origin+'/collections/wedding-cakes?page=2');
 assert.equal(pagination.find(node=>node['@type']==='BreadcrumbList').itemListElement.at(-1).item,page.url);
 const expected=ctx.query('wedding-cakes',new URLSearchParams('page=2')).products;
 assert.deepEqual(pagination.find(node=>node['@type']==='ItemList').itemListElement.map(item=>item.name),expected.map(item=>item.title));
 const variant=parse(await(await fetch(base+'/cakes/'+ctx.catalog.products[0].handle+'?variant=example')).text());
 assert.equal(variant.find(node=>node['@type']==='WebPage').url,origin+'/cakes/'+ctx.catalog.products[0].handle);
 for(const path of ['/search','/cart','/bag','/checkout','/wishlist','/does-not-exist']){
  const html=await(await fetch(base+path)).text();assert.ok(!html.includes('application/ld+json'),path);
 }
 console.log('Structured data checked: '+paths.length+' public pages, '+products+' priced products, '+services+' quote-only designs.');
});

test('structured data safely encodes text, excludes private pages and never invents a quote price',()=>{
 const unsafe='</script><img src=x onerror=alert(1)>';
 const product={id:'test',handle:'test',title:unsafe,description:unsafe,categories:[],image:'assets/brand/site-logo.png',images:[],quoteOnly:true,variants:[{id:'test',priceFils:12345,available:true}]};
 const graph=structuredData(config,{path:'/cakes/test',product,title:unsafe,description:unsafe});
 const json=serialize(graph);assert.ok(!json.includes('<'));assert.ok(!json.includes('>'));
 const parsed=JSON.parse(json),service=parsed['@graph'].find(node=>node['@type']==='Service');
 assert.equal(service.name,unsafe);assert.equal(service.offers,undefined);
 assert.equal(structuredData(config,{path:'/cart'}),null);
 assert.equal(structuredData(config,{path:'/example',noindex:true}),null);
 assert.equal(structuredData({...config,siteUrl:''},{path:'/'}),null);
});
