'use strict';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('@playwright/test');
const products=require('../data/extravagant-additions.json').products;
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/extravagant-additions');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1100}});
  for(let start=0;start<products.length;start+=8){
   await page.setContent('<style>body{margin:0;background:#efedeb;font:16px Arial}main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0}img{width:100%;height:460px;object-fit:contain}figcaption{padding:8px;height:46px}</style><main>'+products.slice(start,start+8).map(p=>'<figure><img src="data:image/webp;base64,'+fs.readFileSync(path.join(root,p.image)).toString('base64')+'"><figcaption>'+p.title+' Â· '+p.tiers+' tier(s)</figcaption></figure>').join('')+'</main>');
   await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   await page.screenshot({path:path.join(out,'review-'+String(start+1).padStart(2,'0')+'.png'),fullPage:true});
  }
 }finally{await browser.close();}
 console.log('Saved 10-design contact sheets to artifacts/extravagant-additions.');
})().catch(error=>{console.error(error);process.exitCode=1;});
