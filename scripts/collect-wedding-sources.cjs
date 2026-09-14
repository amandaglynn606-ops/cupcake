const fs=require('node:fs');
const {chromium}=require('@playwright/test');
const sources=[
 ['rosewood','https://www.rosewoodcakes.com/luxury-wedding-cakes'],
 ['gc-bespoke','https://shop.gccouture.co.uk/pages/luxury-bespoke-wedding-cakes'],
 ['gc-collection','https://shop.gccouture.co.uk/collections/luxury-wedding-cake-delivery-in-london']
];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const pages=[];
  for(const [name,url] of sources){
   const page=await browser.newPage();
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   if(!response.ok())throw Error(name+' HTTP '+response.status());
   const data=await page.evaluate(()=>({
    title:document.title,
    images:[...document.querySelectorAll('main img, #page img, article img')].map(img=>({imageUrl:img.getAttribute('data-src')||img.currentSrc||img.src,alt:img.alt,width:img.getAttribute('data-image-dimensions')||img.naturalWidth,height:img.naturalHeight,href:img.closest('a')?.href,caption:img.closest('figure')?.querySelector('figcaption')?.innerText||''})),
    productUrls:[...new Set([...document.querySelectorAll('main a[href*="/products/"]')].map(a=>a.href.split('?')[0]))]
   }));
   if(name==='gc-collection'){
    const jsonPage=await browser.newPage();
    const jsonResponse=await jsonPage.goto(url+'/products.json?limit=250',{waitUntil:'domcontentloaded',timeout:60000});
    if(jsonResponse.ok())data.products=JSON.parse((await jsonResponse.body()).toString()).products;
    await jsonPage.close();
   }
   pages.push({name,url,...data});console.log(name+': '+data.images.length+' images, '+(data.products?.length||0)+' products');await page.close();
  }
  fs.writeFileSync('data/wedding-source-pages.json',JSON.stringify({retrievedAt:new Date().toISOString(),pages},null,2)+'\n');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
