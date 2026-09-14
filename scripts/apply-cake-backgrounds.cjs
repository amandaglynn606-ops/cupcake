'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const file=path.join(__dirname,'../data/cake-background-manifest.json');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
for(const {n,...review} of require('../data/cake-background-review.json'))Object.assign(manifest.images[n-1],review);
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  let applied=0;
  try{
    const page=await browser.newPage();
    for(const [i,r] of manifest.images.entries()){
      if(r.status==='applied'||!r.generatedImage||!r.visualReview?.approved)continue;
      const bytes=fs.readFileSync(r.generatedImage);
      const converted=await page.evaluate(async data=>{
        const image=new Image();image.src=data;await image.decode();
        const scale=Math.min(1,1500/Math.max(image.naturalWidth,image.naturalHeight));
        const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        return {width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/webp',.92).split(',')[1]};
      },'data:image/png;base64,'+bytes.toString('base64'));
      const name=r.products[0].title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
      r.image=`assets/products/cakes/backgrounds/cake-${name}-${String(i+1).padStart(3,'0')}.webp`;
      fs.mkdirSync(path.dirname(path.join(root,r.image)),{recursive:true});
      const output=Buffer.from(converted.data,'base64');fs.writeFileSync(path.join(root,r.image),output);
      Object.assign(r,{width:converted.width,height:converted.height,sha256:crypto.createHash('sha256').update(output).digest('hex'),status:'applied',objectFit:'contain',objectPosition:'center center'});
      applied++;
    }
  }finally{await browser.close();}
  manifest.updatedAt=new Date().toISOString();
  manifest.summary={total:manifest.images.length,applied:manifest.images.filter(r=>r.status==='applied').length,pending:manifest.images.filter(r=>r.status!=='applied').length};
  fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({newlyApplied:applied,...manifest.summary}));
})().catch(e=>{console.error(e);process.exitCode=1;});
