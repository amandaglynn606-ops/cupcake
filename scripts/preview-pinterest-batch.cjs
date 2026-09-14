const fs=require('node:fs');
const {chromium}=require('@playwright/test');
const number=Number(process.argv[2]);
if(!Number.isInteger(number)||number<1||number>22)throw Error('Batch must be 1–22');
const key=String(number).padStart(3,'0');
const batch=require('../data/image-batches/'+key+'.json');
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=file=>'<img src="data:image/'+(file.endsWith('.jpg')?'jpeg':file.split('.').pop())+';base64,'+fs.readFileSync(file).toString('base64')+'">';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}});
  const style='<style>body{font:15px Arial;margin:12px;background:#eee}article{background:white;margin:10px 0;padding:10px}.images{display:flex;gap:10px}.images div{width:195px}img{width:190px;height:190px;object-fit:contain}p{margin:3px}small{font-size:12px}</style>';
  const cards=batch.records.map(r=>'<article><p><b>'+r.n+'. '+esc(r.title)+'</b> — '+esc(r.status)+'</p><div class="images"><div><small>Original</small>'+img(r.originalImage)+'</div>'+r.candidates.map((c,i)=>c.localImage?'<div><small>Candidate '+i+(r.selected?.imageUrl===c.imageUrl?' — SELECTED':'')+'</small>'+img(c.localImage)+'<a href="'+esc(c.sourceUrl)+'">Pinterest</a></div>':'').join('')+'</div></article>');
  fs.mkdirSync('artifacts/image-batches',{recursive:true});
  fs.writeFileSync(`artifacts/image-batches/${key}-review.html`,'<!doctype html><meta charset="utf-8"><title>Batch '+number+' image review</title>'+style+'<h1>Batch '+number+' — '+batch.records[0].n+'–'+batch.records.at(-1).n+'</h1>'+cards.join(''));
  for(let start=0;start<cards.length;start+=5){
   await page.setContent(style+cards.slice(start,start+5).join(''));
   await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   await page.screenshot({path:`artifacts/image-batches/${key}-${batch.records[start].n}.jpg`,fullPage:true});
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
