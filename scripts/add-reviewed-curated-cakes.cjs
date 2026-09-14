const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const candidates=require('../data/curated-cake-candidates.json');
const review=require('../data/curated-cake-review.json');
const priorProducts=require('../data/curated-additions.json').products;
const priorManifest=require('../data/curated-addition-manifest.json').products;
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const products=[],manifest=[];
 const existing=require('../lib/load-catalog').loadCatalog().products.filter(p=>p.catalogueAddition!=='curated-2026-09');
 const existingHashes=new Set([...new Set(existing.flatMap(p=>[p.image,...p.images]))].map(file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')));
 const selectedHashes=new Set();
 try{
  const page=await browser.newPage();
  for(const [index,row] of review.designs.entries()){
   const [n,tiers,title,material,alt]=row,r=candidates.find(c=>c.n===n);
   if(!r?.localImage||r.sourceCountry!=='GB'||existingHashes.has(r.sha256)||selectedHashes.has(r.sha256))throw Error('Missing or duplicate candidate '+n);
   selectedHashes.add(r.sha256);
   const previous=priorManifest.find(p=>p.visualReview.candidate===n);
   if(previous){
    const product=priorProducts.find(p=>p.id===previous.productId);
    if(product?.title!==title||previous.tiers!==tiers||previous.alt!==alt||previous.flowerMaterial!==material||!fs.existsSync(previous.image))throw Error('Existing design changed: '+n);
    products.push(product);manifest.push(previous);continue;
   }
   const bytes=fs.readFileSync(r.localImage),mime=r.localImage.endsWith('.jpg')?'jpeg':r.localImage.split('.').pop();
   const converted=await page.evaluate(async data=>{
    const image=new Image();image.src=data;await image.decode();
    const scale=Math.min(1,1500/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    return {width:canvas.width,height:canvas.height,originalWidth:image.naturalWidth,originalHeight:image.naturalHeight,data:canvas.toDataURL('image/webp',.9).split(',')[1]};
   },'data:image/'+mime+';base64,'+bytes.toString('base64'));
   if(Math.min(converted.width,converted.height)<450||Math.max(converted.width,converted.height)<800)throw Error('Resolution too low: '+n+' '+converted.width+'x'+converted.height);
   const key=String(index+1).padStart(2,'0'),handle=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')+'-c'+key;
   const image='assets/products/cakes/cake-'+handle+'.webp',id=String(9900000000000+index+1);
   const output=Buffer.from(converted.data,'base64');
   fs.mkdirSync('assets/products/cakes',{recursive:true});fs.writeFileSync(image,output);
   const engagement=/Engagement|Proposal/.test(title);
   const categories=[engagement?'engagement-cakes':'wedding-cake-dubai','luxury-cakes'];
   if(tiers>=2)categories.push('tiered-cake');
   if(material)categories.push(material==='fresh'?'fresh-floral-cakes':'sugar-flower-cakes');
   const product={id,handle,title,categories,kind:'cake',description:alt+'. Dimensions, flavours and finishing details are arranged with your personal quotation.',image,images:[image],imageAlt:alt,imageContain:true,imageNote:'Design reference. Size, colours, flavours and finishing details are confirmed with your personal quotation.',optionNames:[],variants:[{id:id+'01',title:tiers+' '+(tiers===1?'tier':'tiers')+' - bespoke quotation',options:[],priceFils:null,compareAtFils:null,available:true,image,tiers}],minPriceFils:null,available:true,quoteOnly:true,tiers,catalogueAddition:'curated-2026-09',searchText:title+' '+tiers+' tier '+(material||'')+' flowers bespoke'};
   products.push(product);
   manifest.push({productId:id,title,page:'/cakes/'+handle,image,source:r.source,sourceImage:r.imageUrl,source_country:r.sourceCountry,countryEvidence:r.countryEvidence,sourceSha256:r.sha256,sha256:crypto.createHash('sha256').update(output).digest('hex'),width:converted.width,height:converted.height,alt,tiers,flowerMaterial:material,sourceAlt:r.sourceAlt,object_fit:'contain',object_position:'center center',container_aspect_ratio:'1:1',verified:true,visualReview:{candidate:n,watermarkVisible:false,obviouslyAiGenerated:false,tierCount:tiers,fullCakeVisible:true},reverseSearch:review.reverseSearch});
  }
 }finally{await browser.close();}
 fs.writeFileSync('data/curated-additions.json',JSON.stringify({products},null,2)+'\n');
 fs.writeFileSync('data/curated-addition-manifest.json',JSON.stringify({addedAt:new Date().toISOString(),count:products.length,products:manifest},null,2)+'\n');
 console.log(JSON.stringify({added:products.length,photos:manifest.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
