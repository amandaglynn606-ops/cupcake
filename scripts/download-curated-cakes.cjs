const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const file='data/curated-cake-candidates.json';
const records=JSON.parse(fs.readFileSync(file));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 let next=0;
 try{await Promise.all(Array.from({length:3},async()=>{
  let page=await browser.newPage();
  while(next<records.length){const r=records[next++];
   if(r.localImage&&fs.existsSync(r.localImage))continue;
   if(r.status.startsWith('rejected-'))continue;
   try{
    if(!/^https:\/\/(images\.squarespace-cdn\.com|i\.pinimg\.com|thesugarpeony\.com|etoilebakery\.co\.uk|cakesbyanusha\.co\.uk|static\.wixstatic\.com|mybaker\.co|images\.sumup\.com)\//.test(r.imageUrl))throw Error('Unexpected image host');
    const response=await page.goto(r.imageUrl,{waitUntil:'load',timeout:30000});
    if(!response.ok())throw Error('Image status '+response.status());
    const bytes=await response.body(),mime=response.headers()['content-type']?.split(';')[0];
    const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}[mime];
    if(!ext)throw Error('Unsupported image '+mime);
    r.sha256=crypto.createHash('sha256').update(bytes).digest('hex');
    r.localImage='artifacts/curated-cake-candidates/candidate-'+String(r.n).padStart(3,'0')+'.'+ext;
    fs.mkdirSync('artifacts/curated-cake-candidates',{recursive:true});fs.writeFileSync(r.localImage,bytes);delete r.error;
   }catch(e){r.error=e.message;await page.close();page=await browser.newPage();}
  }
  await page.close();
 }));}finally{await browser.close();fs.writeFileSync(file,JSON.stringify(records,null,2)+'\n');}
 console.log(JSON.stringify({candidates:records.length,downloaded:records.filter(r=>r.localImage).length,failed:records.filter(r=>r.error).length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
