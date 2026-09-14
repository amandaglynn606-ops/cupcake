const fs=require('node:fs');
const crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const source=require('../data/wedding-source-pages.json');
const file='data/wedding-source-images.json';
const existing=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):[];
const rows=[];
for(const page of source.pages){
 const images=page.name==='gc-collection'?page.products.flatMap(p=>p.images.map(img=>({imageUrl:img.src,alt:p.title,productHandle:p.handle,productId:p.id}))):page.images;
 const seen=new Set();
 for(const img of images){
  if(!img.imageUrl||img.imageUrl.includes('/flags/'))continue;
  const url=new URL(img.imageUrl);url.searchParams.delete('width');
  const key=url.origin+url.pathname;
  if(seen.has(key))continue;seen.add(key);
  if(!['images.squarespace-cdn.com','shop.gccouture.co.uk','cdn.shopify.com'].includes(url.hostname))continue;
  const old=existing.find(r=>r.imageUrl===url.href);
  rows.push({...old,n:rows.length+1,source:page.name,sourceUrl:img.productHandle?'https://shop.gccouture.co.uk/products/'+img.productHandle:page.url,imageUrl:url.href,alt:img.alt,productHandle:img.productHandle,sourceProductId:img.productId,credit:img.caption||undefined});
 }
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 fs.mkdirSync('assets/products/wedding-sources',{recursive:true});
 try{
  for(let start=0;start<rows.length;start+=50){
   const chunk=rows.slice(start,start+50);let next=0;
   await Promise.all(Array.from({length:5},async()=>{
    while(next<chunk.length){const r=chunk[next++];if(r.localImage&&fs.existsSync(r.localImage))continue;let page;
     try{
      page=await browser.newPage();const response=await page.goto(r.imageUrl,{waitUntil:'load',timeout:45000});
      if(!response.ok()||!response.headers()['content-type']?.startsWith('image/'))throw Error('Image response '+response.status());
      const bytes=await response.body();const ext=bytes.subarray(0,3).equals(Buffer.from([255,216,255]))?'jpg':bytes.subarray(1,4).toString()==='PNG'?'png':bytes.subarray(8,12).toString()==='WEBP'?'webp':null;
      if(!ext)throw Error('Unsupported image');
      r.sha256=crypto.createHash('sha256').update(bytes).digest('hex');
      r.localImage=`assets/products/wedding-sources/${r.source}-${r.sha256.slice(0,14)}.${ext}`;fs.writeFileSync(r.localImage,bytes);delete r.error;
     }catch(e){r.error=e.message.split('\n')[0];}finally{if(page)await page.close();}
    }
   }));
   fs.writeFileSync(file,JSON.stringify(rows,null,2)+'\n');console.log('Downloaded batch '+(start/50+1)+': '+chunk.filter(r=>r.localImage).length+'/'+chunk.length);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
