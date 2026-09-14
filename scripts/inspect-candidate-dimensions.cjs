const fs=require('node:fs');
const {chromium}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const out=[];
 try{const page=await browser.newPage();
  for(const r of require('../data/curated-cake-candidates.json').filter(r=>r.localImage&&r.n>=Number(process.argv[2]||1))){
   const dim=await page.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();return {width:i.naturalWidth,height:i.naturalHeight};},'data:image/'+(r.localImage.endsWith('.jpg')?'jpeg':r.localImage.split('.').pop())+';base64,'+fs.readFileSync(r.localImage).toString('base64'));
   out.push({n:r.n,...dim});
  }
 }finally{await browser.close();}
 fs.writeFileSync('artifacts/candidate-dimensions.json',JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({checked:out.length,reject:out.filter(r=>Math.min(r.width,r.height)<450||Math.max(r.width,r.height)<800)}));
})().catch(e=>{console.error(e);process.exitCode=1;});
