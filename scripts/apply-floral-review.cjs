// Apply only the individually reviewed rows; preserve catalog titles, variants and prices.
const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const batch=require('../data/floral-batch-review.json');
const candidates=require('../data/curated-cake-candidates.json');
const originals=require('../artifacts/remaining-perfect-gift.json');
const raw=require('../data/catalog.json').products;
const manifest=require('../data/cake-image-manifest.json');
const additions=require('../data/curated-addition-manifest.json').products;
const flowers=require('../data/flower-details.json');
const selection=require('../data/storefront-selection.json');
const {validReplacement}=require('../lib/cake-images');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const save=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
(async()=>{
 for(const row of batch.additions){
  const p=additions.find(p=>p.visualReview.candidate===row[0]);
  if(!p)throw Error('Addition not built '+row[0]);
  flowers.products[p.productId]={material:row[3],flowerTypes:row[5],verified:true,source:p.source,evidence:'Source gallery material description and visual review in data/floral-batch-review.json.'};
 }
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const reviewed=[];
 try{
  const page=await browser.newPage();
  for(const row of batch.replacements){
   const original=originals.find(p=>p.n===row.originalNumber),p=raw.find(p=>p.id===original?.id),r=candidates.find(c=>c.n===row.candidate);
   if(!p||!r?.localImage||r.sourceCountry!=='GB')throw Error('Missing review data');
   const bytes=fs.readFileSync(r.localImage);
   const converted=await page.evaluate(async data=>{
    const image=new Image();image.src=data;await image.decode();
    const scale=Math.min(1,1500/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    return {width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/webp',.9).split(',')[1]};
   },'data:image/'+(r.localImage.endsWith('.jpg')?'jpeg':r.localImage.split('.').pop())+';base64,'+bytes.toString('base64'));
   if(Math.min(converted.width,converted.height)<450||Math.max(converted.width,converted.height)<800)throw Error('Low resolution '+r.n);
   const image='assets/products/cakes/cake-'+p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')+'-replacement-'+p.id+'.webp';
   const output=Buffer.from(converted.data,'base64');
   const record={...manifest.products.find(x=>x.productId===p.id),productId:p.id,title:p.title,page:'/cakes/'+p.handle,image,alt:row.alt,source:r.source,sourceImage:r.imageUrl,source_country:r.sourceCountry,countryEvidence:r.countryEvidence,originalImage:p.image,oldImages:[...new Set([p.image,...p.images,...p.variants.map(v=>v.image)])],sourceSha256:r.sha256,sha256:hash(output),width:converted.width,height:converted.height,verified:true,status:'replaced',reason:row.match,currentImages:[image],object_fit:'contain',object_position:'center center',aspect_ratio:'1:1',visualReview:{verified:true,tierCount:row.tiers,originalTierCount:row.tiers,watermarkVisible:false,obviouslyAiGenerated:false,fullCakeVisible:true,candidate:r.n,match:row.match},reverseSearch:batch.reverseSearch};
   if(!validReplacement(p,record))throw Error('Rejected replacement for '+p.title);
   reviewed.push({record,output});
   if(row.material){
    flowers.products[p.id]={material:row.material,flowerTypes:row.flowerTypes,verified:true,source:r.source,evidence:row.match};
    selection.flowerMaterials[p.id]={material:row.material,evidence:'Reviewed replacement photograph and source gallery description.',sourceUrl:r.source};
   }
  }
 }finally{await browser.close();}
 for(const {record,output} of reviewed){
  fs.writeFileSync(record.image,output);
  const index=manifest.products.findIndex(r=>r.productId===record.productId);
  if(index<0)manifest.products.push(record);else manifest.products[index]=record;
 }
 manifest.updatedAt=new Date().toISOString();
 manifest.workflowStatus='Active: replace remaining Perfect Gift photos in the six curated storefront collections; retain originals until a reviewed title-matched photo is available.';
 manifest.summary.replaced=manifest.products.filter(r=>r.status==='replaced'&&r.verified).length;
 manifest.summary.pending=manifest.products.length-manifest.summary.replaced;
 manifest.currentStorefrontManifest='data/floral-expansion-report.json';
 save('data/cake-image-manifest.json',manifest);save('data/flower-details.json',flowers);save('data/storefront-selection.json',selection);
 console.log(JSON.stringify({addedFlowerMetadata:batch.additions.length,replaced:reviewed.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
