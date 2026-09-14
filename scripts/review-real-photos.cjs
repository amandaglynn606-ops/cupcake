const fs=require('node:fs');
const {chromium}=require('@playwright/test');
(async()=>{const masked=process.argv.includes('--masked');const rows=masked?require('../data/catalog.json').products.map(p=>({image:p.image,title:p.source.photoReviewNumber+'. '+p.title,source:''})):require('../data/verified-selection.json');const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1100}});
for(let start=0;start<rows.length;start+=24){
const cards=rows.slice(start,start+24).map((r,i)=>`<article><img src="data:image/${r.image.split('.').pop()};base64,${fs.readFileSync(r.image).toString('base64')}"><p>${start+i+1}. ${r.source}: ${r.title}</p></article>`).join('');
await page.setContent(`<style>body{margin:12px;background:#eee;font:14px Arial;display:grid;grid-template-columns:repeat(6,1fr);gap:10px}article{background:white;padding:8px}img{width:210px;height:235px;object-fit:contain}p{height:45px;margin:5px}</style>${cards}`);
await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
await page.screenshot({path:`artifacts/${masked?'masked':'real'}-review-${start}.jpg`,fullPage:true});
} }finally{await browser.close();}})();
