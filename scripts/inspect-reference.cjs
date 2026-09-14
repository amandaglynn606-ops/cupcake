const { chromium } = require('@playwright/test');
const fs = require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 await page.goto('https://theperfectgift.ae/products/pink-white-birthday-cake-with-ribbon-bows-dubai',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForTimeout(7000);
 await page.screenshot({path:'artifacts/reference-product.png',fullPage:true});
 const details=await page.evaluate(()=>({text:document.body.innerText,fields:[...document.querySelectorAll('main input,main select,main textarea,main button')].map(el=>({tag:el.tagName,type:el.type,name:el.name,id:el.id,placeholder:el.placeholder,text:el.tagName==='SELECT'?[...el.options].map(o=>o.text):el.textContent.trim(),label:el.labels?.[0]?.textContent,required:el.required}))}));
 await fs.writeFile('data/reference-product.json',JSON.stringify(details,null,2));
 console.log(JSON.stringify(details.fields));
 await browser.close();
})().catch(error=>{console.error(error.message);process.exit(1);});
