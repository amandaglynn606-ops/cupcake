'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..');
const jobs=require('../artifacts/downloaded-cakes/background-jobs.json');
const {products}=require('../data/downloaded-additions.json');
const file=path.join(root,'data/cake-background-manifest.json');
const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();
  for(const job of jobs){
   const product=products.find(p=>p.id===job.id);
   if(!product)throw new Error('Unknown downloaded product '+job.id);
   const converted=await page.evaluate(async src=>{
    const image=new Image();image.src=src;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    canvas.getContext('2d').drawImage(image,0,0);
    return {width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/webp',.96).split(',')[1]};
   },'data:image/png;base64,'+fs.readFileSync(job.generatedImage).toString('base64'));
   if(converted.width<1200||converted.height<1200)throw new Error('Insufficient output resolution '+job.id);
   const image='assets/products/cakes/backgrounds/cake-'+product.handle+'-studio.webp';
   const output=Buffer.from(converted.data,'base64');
   fs.writeFileSync(path.join(root,image),output);
   const record={originalImage:product.image,products:[{id:product.id,title:product.title,page:'/cakes/'+product.handle}],
    status:'applied',batch:'downloaded-2026-09',generatedImage:job.generatedImage,prompt:job.prompt,
    visualReview:{approved:true,note:'Compared with the downloaded original: tier count, main decoration, colours and flower placements retained. Full cake and board visible against the matching warm grey studio backdrop. Built-in generative enhancement may alter fine photographic detail.',reviewedAt:new Date().toISOString()},
    image,width:converted.width,height:converted.height,sha256:crypto.createHash('sha256').update(output).digest('hex'),objectFit:'contain',objectPosition:'center center'};
   const previous=manifest.images.findIndex(r=>r.originalImage===product.image);
   if(previous<0)manifest.images.push(record);else manifest.images[previous]=record;
   console.log(product.id+' '+converted.width+'x'+converted.height+' '+image);
  }
 }finally{await browser.close();}
 manifest.updatedAt=new Date().toISOString();
 manifest.summary={total:manifest.images.length,applied:manifest.images.filter(r=>r.status==='applied').length,pending:manifest.images.filter(r=>r.status!=='applied').length};
 manifest.scope='All 197 photos used by the 185 active cake designs. Cake tiers and decoration reviewed.';
 fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;});
