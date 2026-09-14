'use strict';
const {chromium}=require('@playwright/test');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const source='https://cdn.shopify.com/s/files/1/0542/9434/7965/files/cake-ribbon-dubai.png?v=1772456381';
  await page.goto('https://lens.google.com/uploadbyurl?url='+encodeURIComponent(source),{timeout:30000,waitUntil:'domcontentloaded'});
  const body=await page.locator('body').innerText();
  fs.writeFileSync('artifacts/lens-probe.txt',body);
  await page.screenshot({path:'artifacts/lens-probe.png'});
  console.log(page.url());console.log(body.slice(0,6000));
 }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
