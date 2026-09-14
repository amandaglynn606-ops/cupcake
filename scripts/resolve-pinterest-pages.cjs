const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const file='data/pinterest-pages-001.json';
const rows=JSON.parse(fs.readFileSync(file));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(let start=0;start<rows.length;start+=3){await Promise.all(rows.slice(start,start+3).map(async row=>{
  if(row.localImage&&fs.existsSync(row.localImage))return;
  const page=await browser.newPage();try{
   if(!row.imageUrl){
    await page.goto(row.sourceUrl,{waitUntil:'domcontentloaded',timeout:20000});
    const meta=await page.evaluate(()=>({imageUrl:document.querySelector('meta[property="og:image"]')?.content,description:document.querySelector('meta[property="og:description"]')?.content||document.title}));
    if(!meta.imageUrl||!/^https:\/\/i\.pinimg\.com\//.test(meta.imageUrl))throw Error('No Pinterest image metadata');
    Object.assign(row,meta);
   }
   const response=await page.goto(row.imageUrl,{waitUntil:'load',timeout:20000});
   if(!response.ok())throw Error('Image HTTP '+response.status());
   const bytes=await response.body();
   if(!bytes.subarray(0,3).equals(Buffer.from([255,216,255])))throw Error('Expected JPEG');
   row.localImage='assets/products/matches/batch-001-pinterest/'+row.n+'-'+crypto.createHash('sha256').update(row.imageUrl).digest('hex').slice(0,10)+'.jpg';
   fs.mkdirSync(path.dirname(row.localImage),{recursive:true});fs.writeFileSync(row.localImage,bytes);
   row.sha256=crypto.createHash('sha256').update(bytes).digest('hex');delete row.error;
   console.log(row.n+': '+row.localImage);
  }catch(error){row.error=error.message;console.log(row.n+': '+error.message.split('\n')[0]);}finally{await page.close();}
 }));fs.writeFileSync(file,JSON.stringify(rows,null,2)+'\n');}
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
