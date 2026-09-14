const fs=require('node:fs');
const {chromium}=require('@playwright/test');
const catalog=require('../data/catalog.json');
const matches=require('../data/image-matches.json');
const entries=catalog.products.flatMap((p,i)=>matches[p.id]?[{n:i+1,title:p.title,...matches[p.id]}]:[]);
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}});
  fs.mkdirSync('artifacts/image-audit',{recursive:true});
  for(let start=0;start<entries.length;start+=6){
   const cards=entries.slice(start,start+6).map(r=>'<article><p>'+r.n+'. '+escape(r.title)+'</p><img src="data:image/'+(r.image.endsWith('.jpg')?'jpeg':r.image.split('.').pop())+';base64,'+fs.readFileSync(r.image).toString('base64')+'"></article>');
   await page.setContent('<style>body{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font:16px Arial}article{margin:0}img{width:480px;height:480px;object-fit:contain}p{height:40px}</style>'+cards.join(''));
   await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
   await page.screenshot({path:'artifacts/image-audit/applied-'+(start+1)+'.jpg',fullPage:true});
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
