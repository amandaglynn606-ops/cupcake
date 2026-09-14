const fs=require('node:fs');
const {chromium}=require('@playwright/test');
(async()=>{
 const first=Number(process.argv[2]||0),last=Number(process.argv[3]||Infinity);
 const rows=require('../data/luxury-cake-candidates.json').filter(r=>r.localImage&&r.n>=first&&r.n<=last);
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1450}});
  for(let i=0;i<rows.length;i+=12){
   await page.setContent('<style>body{margin:0;background:#eee;font:14px sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}figure{margin:0}img{width:100%;height:420px;object-fit:contain}figcaption{height:50px}</style><main>'+rows.slice(i,i+12).map(r=>'<figure><img src="data:image/'+(r.localImage.endsWith('.jpg')?'jpeg':r.localImage.split('.').pop())+';base64,'+fs.readFileSync(r.localImage).toString('base64')+'"><figcaption>'+r.n+' '+r.sourceCountry+' '+r.sourceAlt.replaceAll('&','&amp;').replaceAll('<','&lt;')+'</figcaption></figure>').join('')+'</main>');
   await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   await page.screenshot({path:'artifacts/luxury-cake-candidates/review-'+(first?first+'-':'')+String(i+1).padStart(3,'0')+'.png',fullPage:true});
  }
  console.log('Reviewed candidates: '+rows.length);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
