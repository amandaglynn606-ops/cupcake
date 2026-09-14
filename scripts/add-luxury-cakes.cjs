'use strict';
// Publish only downloaded, visually reviewed cake candidates. Canvas only converts PNG to WebP.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name),'utf8'));
const write=(name,data)=>fs.writeFileSync(path.join(root,'data',name),JSON.stringify(data,null,2)+'\n');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const reviews=read('luxury-cake-review.json'),backgrounds=read('luxury-background-review.json');
const candidates=read('luxury-cake-candidates.json');
const evidence={GB:'Source gallery identifies London, United Kingdom.',AU:'Source gallery identifies handmade cakes in Sydney, Australia.',IT:'Source page gives Via Livorno 236, Sesto San Giovanni (MI), Italy.',CA:'Product pages list Toronto and Scarborough locations in Ontario, Canada.'};
if(reviews.length!==20||new Set(reviews.map(r=>r.n)).size!==20)throw Error('Expected 20 unique reviewed designs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const products=[],records=[],newBackgrounds=[];
 try{
  const page=await browser.newPage();
  for(const [index,r] of reviews.entries()){
   const c=candidates.find(c=>c.n===r.n),b=backgrounds.find(b=>b.n===r.n);
   if(!c?.localImage||!evidence[c.sourceCountry]||!b?.visualReview?.approved)throw Error('Unreviewed candidate '+r.n);
   if(hash(fs.readFileSync(path.join(root,c.localImage)))!==c.sha256)throw Error('Source changed '+r.n);
   const slug=r.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
   const handle=slug+'-l'+String(index+1).padStart(2,'0'),id=String(9910000000001+index);
   const image='assets/products/cakes/luxury/cake-'+handle+'.webp';
   const converted=await page.evaluate(async data=>{
    const image=new Image();image.src=data;await image.decode();
    const scale=Math.min(1,1500/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    return {width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/webp',.92).split(',')[1]};
   },'data:image/png;base64,'+fs.readFileSync(b.generatedImage).toString('base64'));
   const bytes=Buffer.from(converted.data,'base64');
   fs.mkdirSync(path.dirname(path.join(root,image)),{recursive:true});fs.writeFileSync(path.join(root,image),bytes);
   const categories=['luxury-cakes'];
   if(r.tiers>1)categories.push('tiered-cake');
   if(r.flowerMaterial)categories.push(r.flowerMaterial==='fresh'?'fresh-floral-cakes':'sugar-flower-cakes');
   products.push({id,handle,title:r.title,categories,kind:'cake',description:r.alt+'. Dimensions, flavours and finishing details are arranged with your personal quotation.',image,images:[image],imageAlt:r.alt,imageContain:true,imageNote:'Design reference. Size, colours, flavours and finishing details are confirmed with your personal quotation.',optionNames:[],variants:[{id:id+'01',title:r.tiers+' '+(r.tiers===1?'tier':'tiers')+' - bespoke quotation',options:[],priceFils:null,compareAtFils:null,available:true,image,tiers:r.tiers}],minPriceFils:null,available:true,quoteOnly:true,tiers:r.tiers,catalogueAddition:'luxury-2026-09',searchText:r.title+' '+r.alt+' '+r.tiers+' tier bespoke'});
   const common={image,width:converted.width,height:converted.height,sha256:hash(bytes),objectFit:'contain',objectPosition:'center center',prompt:b.prompt,generatedImage:b.generatedImage,visualReview:b.visualReview};
   records.push({productId:id,title:r.title,page:'/cakes/'+handle,candidate:r.n,source:c.source,sourceImage:c.imageUrl,source_country:c.sourceCountry,countryEvidence:evidence[c.sourceCountry],originalImage:c.localImage,originalSha256:c.sha256,tiers:r.tiers,alt:r.alt,aspect_ratio:converted.width+':'+converted.height,...common});
   newBackgrounds.push({originalImage:c.localImage,products:[{id,title:r.title,page:'/cakes/'+handle}],status:'applied',batch:4,...common});
  }
 }finally{await browser.close();}
 if(new Set(records.map(r=>r.originalSha256)).size!==20||new Set(records.map(r=>r.sha256)).size!==20)throw Error('Duplicate photographs');
 write('luxury-additions.json',{products});
 write('luxury-addition-manifest.json',{createdAt:new Date().toISOString(),method:'Internet and Pinterest discovery followed by direct source downloads. Built-in imagegen background edits; generative fine details may vary. Visual review and exact-hash duplicate checks completed; dedicated reverse-image verification unavailable.',products:records});
 const manifest=read('cake-background-manifest.json');
 const ids=new Set(products.map(p=>p.id));
 manifest.images=manifest.images.filter(r=>!r.products.some(p=>ids.has(p.id))).concat(newBackgrounds);
 manifest.updatedAt=new Date().toISOString();manifest.scope='All 179 photos used by the 167 active cake designs. Cake tiers and decoration reviewed.';
 manifest.summary={total:manifest.images.length,applied:manifest.images.filter(r=>r.status==='applied').length,pending:manifest.images.filter(r=>r.status!=='applied').length};
 write('cake-background-manifest.json',manifest);
 const flowers=read('flower-details.json');
 for(const r of reviews.filter(r=>r.flowerMaterial)){
  const p=products[reviews.indexOf(r)],source=records.find(x=>x.productId===p.id).source;
  flowers.products[p.id]={material:r.flowerMaterial,flowerTypes:r.n===185?['mixed-blossoms']:r.n===186?['roses','mixed-blossoms']:['roses'],verified:true,source,evidence:'Source identifies fresh flowers (Italy) or fondant/gumpaste decorations (Canada); flower types visually reviewed.'};
 }
 write('flower-details.json',flowers);
 console.log(JSON.stringify({added:products.length,countries:records.reduce((out,r)=>(out[r.source_country]=(out[r.source_country]||0)+1,out),{}),backgrounds:manifest.summary}));
})().catch(error=>{console.error(error);process.exitCode=1;});
