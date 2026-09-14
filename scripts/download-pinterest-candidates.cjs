const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..');
const number=Number(process.argv[2]);
if(!Number.isInteger(number)||number<1||number>22)throw Error('Batch must be 1–22');
const key=String(number).padStart(3,'0');
const file=path.join(root,'data/image-batches',key+'.json');
const batch=JSON.parse(fs.readFileSync(file));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const jobs=batch.records.flatMap(r=>r.candidates.map((c,i)=>({r,c,i}))).filter(({c})=>!c.localImage||!fs.existsSync(path.join(root,c.localImage)));
  let next=0;
  await Promise.all(Array.from({length:3},async()=>{
   while(next<jobs.length){
    const {r,c,i}=jobs[next++];let page;
    try{
     if(!/^https:\/\/(?:[\w-]+\.)?pinterest\.com\//.test(c.sourceUrl))throw Error('Expected Pinterest source');
     page=await browser.newPage();
     if(!c.imageUrl){
      await page.goto(c.sourceUrl,{timeout:25000,waitUntil:'domcontentloaded'});
      c.imageUrl=await page.locator('meta[property="og:image"]').getAttribute('content',{timeout:5000});
     }
     if(!/^https:\/\/i\.pinimg\.com\//.test(c.imageUrl))throw Error('Expected Pinterest image');
     const response=await page.goto(c.imageUrl,{timeout:25000,waitUntil:'load'});
     if(!response.ok()||!response.headers()['content-type']?.startsWith('image/'))throw Error('Image response '+response.status());
     const bytes=await response.body();
     const ext=bytes.subarray(0,3).equals(Buffer.from([255,216,255]))?'jpg':bytes.subarray(1,4).toString()==='PNG'?'png':bytes.subarray(8,12).toString()==='WEBP'?'webp':null;
     if(!ext)throw Error('Unsupported image');
     const imageHash=crypto.createHash('sha256').update(bytes).digest('hex');
     c.localImage=`assets/products/matches/batch-${key}-pinterest/${r.productId}-${imageHash.slice(0,12)}.${ext}`;
     fs.mkdirSync(path.dirname(path.join(root,c.localImage)),{recursive:true});fs.writeFileSync(path.join(root,c.localImage),bytes);
     c.sha256=imageHash;delete c.error;
    }catch(e){c.error=e.message.split('\n')[0];}
    finally{if(page)await page.close();}
   }
  }));
  fs.writeFileSync(file,JSON.stringify(batch,null,2)+'\n');
  console.log(JSON.stringify({batch:number,downloaded:batch.records.flatMap(r=>r.candidates).filter(c=>c.localImage).length,failed:batch.records.flatMap(r=>r.candidates).filter(c=>c.error).length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
