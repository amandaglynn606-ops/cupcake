const fs=require('node:fs');
const crypto=require('node:crypto');
const {loadCatalog}=require('../lib/load-catalog');
const {buildCatalog}=require('../lib/catalog');
const {isCakeProduct}=require('../lib/product-categories');
const baseline=require('../data/cake-image-audit-baseline.json');
const file='data/cake-image-manifest.json';
const previous=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
const raw=loadCatalog(),ctx=buildCatalog(raw);
const matches=require('../data/image-matches.json');
const assets=p=>[...new Set([p.image,...p.images,...p.variants.map(v=>v.image)].filter(Boolean))];
const products=raw.products.filter(isCakeProduct).map((p,i)=>{
 const shown=ctx.byId.get(p.id),old=previous?.products.find(r=>r.productId===p.id);
 return old||{productId:p.id,title:p.title,batch:Math.floor(i/50)+1,page:'/cakes/'+p.handle,
  collections:ctx.collections.filter(c=>c.products.some(item=>item.id===p.id)).map(c=>'/collections/'+c.slug),
  inventoryImages:assets(p),baselineImages:matches[p.id]?[matches[p.id].image]:p.catalogueAddition?assets(p):['assets/maison-photo-pending.svg'],
  currentImages:assets(shown),image:null,source:null,source_country:null,countryEvidence:null,
  aspect_ratio:'1:1',object_fit:'contain',object_position:'center center',verified:false,status:'awaiting-reviewed-replacement',
  reason:'Existing photo retained until a visually matching, non-UAE-source replacement is verified.'};
});
const nonCakeBaseline=previous?.nonCakeBaseline||raw.products.filter(p=>!isCakeProduct(p)).map(p=>({productId:p.id,images:assets(ctx.byId.get(p.id)).map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}))}));
const output={version:1,updatedAt:new Date().toISOString(),scope:'Cake photographs only; 50 products per batch',
 summary:{cakeProducts:products.length,baselineActivePhotoFiles:151,baselineProductsWithPhotos:139,baselineProductsWithPlaceholders:553,replaced:products.filter(p=>p.verified).length,pending:products.filter(p=>!p.verified).length},
 composition:{cards:'Existing square container',products:'Existing square container',editorial:'Preserve existing component dimensions',fit:'contain',position:'center center',nonCakeImages:'unchanged'},
 baselineAudit:'data/cake-image-audit-baseline.json',dimensions:baseline.dimensions,nonCakeBaseline,products};
fs.writeFileSync(file,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output.summary));
