const {chromium}=require('@playwright/test');
const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();
 await page.goto('https://theperfectgift.ae/cart',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForTimeout(3000);
 const empty=await page.locator('body').innerText();
 const response=await context.request.get('https://theperfectgift.ae/products/pink-white-birthday-cake-with-ribbon-bows-dubai.js');
 if(response.ok()){
  const product=await response.json(),variant=product.variants.find(v=>v.available);
  if(variant){await context.request.post('https://theperfectgift.ae/cart/add.js',{data:{items:[{id:variant.id,quantity:1}]}});await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(3000);}
 }
 const details=await page.evaluate(()=>({text:document.querySelector('main')?.innerText||document.body.innerText,fields:[...document.querySelectorAll('main input,main select,main textarea,main button')].map(el=>({tag:el.tagName,type:el.type,name:el.name,id:el.id,placeholder:el.placeholder,label:el.labels?.[0]?.textContent,text:el.tagName==='SELECT'?[...el.options].map(o=>o.text):el.textContent.trim(),required:el.required}))}));
 await fs.writeFile('data/reference-cart.json',JSON.stringify({empty,...details},null,2));
 await page.screenshot({path:'artifacts/reference-cart.png',fullPage:true});
 console.log(JSON.stringify(details));
 }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
