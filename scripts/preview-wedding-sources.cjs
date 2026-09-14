const fs=require('node:fs');
const {chromium}=require('@playwright/test');
const rows=require('../data/wedding-source-images.json');
const esc=t=>String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}});
  const style='<style>body{font:14px Arial;background:#eee;margin:12px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}article{padding:10px;background:white}img{width:265px;height:325px;object-fit:contain}p{height:38px;overflow:hidden;margin:5px 0}</style>';
  const cards=rows.map(r=>'<article><p><b>'+r.n+' — '+esc(r.source)+'</b><br>'+esc(r.alt)+'</p>'+(r.localImage?'<img src="data:image/'+(r.localImage.endsWith('.jpg')?'jpeg':r.localImage.split('.').pop())+';base64,'+fs.readFileSync(r.localImage).toString('base64')+'">':'Download failed')+'<a href="'+esc(r.sourceUrl)+'">Source</a></article>');
  fs.mkdirSync('artifacts/wedding-sources',{recursive:true});
  fs.writeFileSync('artifacts/wedding-sources/review.html','<!doctype html><meta charset="utf-8"><title>Wedding source photographs</title>'+style+'<h1>Wedding source photographs</h1><div class="grid">'+cards.join('')+'</div>');
  for(let start=0;start<cards.length;start+=10){await page.setContent(style+'<div class="grid">'+cards.slice(start,start+10).join('')+'</div>');await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.screenshot({path:`artifacts/wedding-sources/${start+1}.jpg`,fullPage:true});}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
