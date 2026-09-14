const fs=require('node:fs');
const {chromium}=require('@playwright/test');
const records=JSON.parse(fs.readFileSync(process.argv[2]||'data/curated-cake-candidates.json')).filter(r=>r.localImage&&(!process.argv[4]||r.n>=Number(process.argv[4])));
const outputDir=process.argv[3]||'artifacts/curated-cake-candidates';
fs.mkdirSync(outputDir,{recursive:true});
const dataUrl=r=>'data:image/'+(r.localImage.endsWith('.jpg')?'jpeg':r.localImage.split('.').pop())+';base64,'+fs.readFileSync(r.localImage).toString('base64');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:1000}});
  for(let start=0;start<records.length;start+=6){
   await page.setContent('<style>body{margin:0;background:#f6f2ed;font:14px Arial}.grid{display:grid;grid-template-columns:repeat(3,1fr)}article{padding:12px;border:1px solid #ccc}img{width:100%;height:450px;object-fit:contain}p{height:42px;margin:8px 0}</style><div class="grid">'+records.slice(start,start+6).map(r=>'<article><img src="'+dataUrl(r)+'"><p>'+r.n+' | '+r.sourceAlt.replace(/[<>]/g,'')+'</p></article>').join('')+'</div>');
   await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   await page.screenshot({path:outputDir+'/review-'+String(start/6+1).padStart(2,'0')+'.jpg',fullPage:true});
  }
  console.log(records.length+' candidates previewed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
