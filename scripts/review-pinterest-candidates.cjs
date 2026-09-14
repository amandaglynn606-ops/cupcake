const fs=require('node:fs');
const {chromium}=require('@playwright/test');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const rows=require('../data/pinterest-pages-001.json');
 const page=await browser.newPage({viewport:{width:1400,height:700}});
 await page.setContent('<style>body{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font:18px Arial}img{width:320px;height:310px;object-fit:contain}</style>'+rows.filter(r=>r.localImage).map((r,i)=>'<article><p>'+i+' / Product '+r.n+'</p><img src="data:image/jpeg;base64,'+fs.readFileSync(r.localImage).toString('base64')+'"></article>').join(''));
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 await page.screenshot({path:'artifacts/pinterest-candidates-review.jpg',fullPage:true});
}finally{await browser.close();}})();
