'use strict';
const {siteOrigin}=require('./seo');
const {EMIRATES,totals}=require('./pricing');
const privatePaths=new Set(['/search','/wishlist','/cart','/bag','/checkout','/404']);
const country={'@type':'Country',name:'United Arab Emirates',identifier:'AE'};
const regions=()=>EMIRATES.map(name=>({'@type':'AdministrativeArea',name,containedInPlace:country}));
const reference=id=>({'@id':id});
const serialize=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');

function structuredData(config,{path='/',canonicalPath=path,title,description,noindex=false,product,collection,collections=[],faq}={}){
 const origin=siteOrigin(config);
 if(!origin||noindex||privatePaths.has(path))return null;
 const name=config.name||'Maison Zavi',url=origin+canonicalPath;
 const organizationID=origin+'/#organization',websiteID=origin+'/#website',pageID=url+'#webpage';
 const organization={'@type':'Organization','@id':organizationID,name,url:origin+'/',
  logo:{'@type':'ImageObject',url:origin+'/assets/brand/site-logo.png',width:512,height:512},
  areaServed:regions()};
 if(/^971\d{8,10}$/.test(config.whatsapp||''))organization.contactPoint={
  '@type':'ContactPoint',telephone:'+'+config.whatsapp,contactType:'WhatsApp cake enquiries',areaServed:country,url:origin+'/contact'
 };
 const website={'@type':'WebSite','@id':websiteID,name,alternateName:'weddingcakes.ae',url:origin+'/',inLanguage:'en-AE',publisher:reference(organizationID)};
 const page={'@type':path==='/contact'?'ContactPage':path==='/atelier'?'AboutPage':path.startsWith('/collections')?'CollectionPage':faq?'FAQPage':'WebPage',
  '@id':pageID,url,name:title||name,description:description||name,inLanguage:'en-AE',isPartOf:reference(websiteID),publisher:reference(organizationID),spatialCoverage:country};
 const graph=[organization,website,page];
 const crumbs=[{name:'Home',url:origin+'/'}];
 const productCollection=product&&(collections.find(item=>item.group==='Design collections'&&product.categories.includes(item.id))||collections.find(item=>product.categories.includes(item.id)));
 if(product||path.startsWith('/collections/'))crumbs.push({name:'Collections',url:origin+'/collections'});
 if(productCollection)crumbs.push({name:productCollection.title,url:origin+'/collections/'+productCollection.slug});
 if(path!=='/'){
  crumbs.push({name:product?.title||collection?.title||title||name,url});
  const breadcrumbID=url+'#breadcrumb';
  page.breadcrumb=reference(breadcrumbID);
  graph.push({'@type':'BreadcrumbList','@id':breadcrumbID,itemListElement:crumbs.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:item.url}))});
 }
 if(product){
  const productURL=origin+'/cakes/'+product.handle,entityID=productURL+(product.quoteOnly||product.priceOnConsultation?'#cake-service':'#product');
  const images=[...new Set([product.image,...(product.images||[])].filter(Boolean))].map(image=>new URL(image,origin+'/').href);
  const entity={'@type':product.quoteOnly||product.priceOnConsultation?'Service':'Product','@id':entityID,url:productURL,name:product.title,
   description:product.description,image:images,mainEntityOfPage:reference(pageID)};
  if(entity['@type']==='Service'){
   entity.serviceType='Custom wedding and celebration cake design';entity.provider=reference(organizationID);entity.areaServed=regions();
  }else{
   entity.sku=String(product.id);
   if(productCollection)entity.category=productCollection.title;
   const selected=product.variants.filter(variant=>variant.available).sort((a,b)=>(a.priceFils??0)-(b.priceFils??0))[0]||product.variants[0];
   if(Number.isSafeInteger(selected?.priceFils)&&selected.priceFils>0){
    entity.offers={'@type':'Offer',url:productURL+'?variant='+encodeURIComponent(selected.id),sku:String(selected.id),
     price:(selected.priceFils/100).toFixed(2),priceCurrency:'AED',eligibleRegion:country,seller:reference(organizationID),
     description:'Listed price for the selected cake configuration. Final design, availability and delivery date are confirmed on WhatsApp.',
     shippingDetails:[['Dubai'],EMIRATES.filter(emirate=>emirate!=='Dubai')].map(emirates=>({
      '@type':'OfferShippingDetails',shippingDestination:{'@type':'DefinedRegion',addressCountry:'AE',addressRegion:emirates},
      shippingRate:{'@type':'MonetaryAmount',currency:'AED',value:(totals(1,'delivery',emirates[0]).deliveryFeeFils/100).toFixed(2)},shippingSettingsLink:origin+'/delivery'
     }))};
   }
  }
  page.mainEntity=reference(entityID);graph.push(entity);
 }else if(collection||path==='/collections'){
  const items=collection?collection.items.map(item=>({name:item.title,url:origin+'/cakes/'+item.handle})):collections.map(item=>({name:item.title,url:origin+'/collections/'+item.slug}));
  const listID=url+'#items';page.mainEntity=reference(listID);
  graph.push({'@type':'ItemList','@id':listID,name:collection?.title||title,numberOfItems:items.length,itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,url:item.url}))});
 }else if(faq){
  page.mainEntity=faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}));
 }else if(['/','/bespoke','/delivery'].includes(path)){
  const serviceID=origin+'/#cake-service';
  graph.push({'@type':'Service','@id':serviceID,name:'Custom wedding and celebration cakes',serviceType:'Custom cake design and UAE delivery',
   url:origin+'/bespoke',provider:reference(organizationID),areaServed:regions(),description:'Wedding, luxury and engagement cakes, with delivery across all seven UAE emirates. Designs, prices and dates are confirmed on WhatsApp.'});
  page.about=reference(serviceID);
 }
 return {'@context':'https://schema.org','@graph':graph};
}
module.exports={structuredData,serialize};
