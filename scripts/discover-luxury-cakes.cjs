const fs=require('node:fs');
const crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const sources=process.argv.includes('--bespoke')?[
 ['https://rosalindmillercakes.com/cakes/','GB']
]:process.argv.includes('--extravagant')?[
 ['https://confectionbyrosalindmiller.com/collections/the-celebration-collection','GB'],
 ['https://www.fayecahill.com.au/custom-cakes/special-event-cakes','AU'],
 ['https://www.cakedelightbyfarah.ca/','CA']
]:process.argv.includes('--extra')?[
 ['https://daango.com/products/black-gold','CA'],
 ['https://www.galluccipasticceria.it/gallery-cakedesign.asp','IT']
]:[
 ['https://www.simonsbakery.co.uk/birthday-cakes-london','GB'],
 ['https://artisiennecakes.com.au/pages/celebration-cakes-gallery','AU'],
 ['https://deliziedijho.it/torte-compleanno-milano/','IT'],
 ['https://www.theplacetoronto.com/pages/custom-cake-toronto','CA']
];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const records=process.argv.includes('--bespoke')||process.argv.includes('--extravagant')||process.argv.includes('--extra')||process.argv.includes('--download')?JSON.parse(fs.readFileSync('data/luxury-cake-candidates.json')):[];
 try{
  const page=await browser.newPage();
  if(process.argv.includes('--download')){
   const ids=new Set(process.argv.at(-1).split(',').map(Number));
   fs.mkdirSync('artifacts/luxury-cake-candidates',{recursive:true});
   for(const r of records.filter(r=>ids.has(r.n))){
    if(r.localImage&&fs.existsSync(r.localImage))continue;
    try{
     const host=new URL(r.imageUrl).hostname;
     if(!['static.wixstatic.com','artisiennecakes.com.au','cdn.shopify.com','deliziedijho.it','daango.com','www.galluccipasticceria.it','images.squarespace-cdn.com','confectionbyrosalindmiller.com','rosalindmillercakes.com'].includes(host))throw Error('Unexpected image host');
     const res=await page.request.get(r.imageUrl,{timeout:30000});
     if(!res.ok())throw Error('HTTP '+res.status());
     const bytes=await res.body(),mime=res.headers()['content-type'].split(';')[0];
     const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime];if(!ext)throw Error('Not an image: '+mime);
     r.localImage='artifacts/luxury-cake-candidates/candidate-'+String(r.n).padStart(3,'0')+'.'+ext;
     r.sha256=crypto.createHash('sha256').update(bytes).digest('hex');
     fs.writeFileSync(r.localImage,bytes);delete r.error;
     console.log('Downloaded '+r.n);
    }catch(error){r.error=error.message.split('\n')[0];console.log(r.n+': '+r.error);}
    fs.writeFileSync('data/luxury-cake-candidates.json',JSON.stringify(records,null,2)+'\n');
   }
   return;
  }
  for(const [source,sourceCountry] of sources){
   try{
   await page.goto(source,{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('img').first().waitFor({timeout:10000});
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
   const found=await page.locator('img').evaluateAll(imgs=>imgs.map(i=>({src:i.getAttribute('data-src')||i.getAttribute('src'),alt:i.alt})));
   for(const r of found){
    if(!r.src||r.src.startsWith('data:'))continue;
    let imageUrl=new URL(r.src,source).href;
    imageUrl=imageUrl.match(/^https:\/\/static\.wixstatic\.com\/media\/[^/]+\.(?:jpg|jpeg|png|webp)/i)?.[0]||imageUrl;
    imageUrl=imageUrl.replace(/([?&])width=\d+/,'$1width=1600');
    if(imageUrl.includes('cdn.shopify.com'))imageUrl=imageUrl.replace(/_(?:\d+x\d*|small|medium|large|grande)(?=\.(?:jpg|png|webp))/i,'_1600x');
    if(!imageUrl||records.some(x=>x.imageUrl===imageUrl))continue;
    records.push({n:records.length+1,source,imageUrl,sourceAlt:r.alt,sourceCountry});
   }
   }catch(error){console.log(source+': '+error.message.split('\n')[0]);}
   fs.writeFileSync('data/luxury-cake-candidates.json',JSON.stringify(records,null,2)+'\n');
  }
  fs.writeFileSync('data/luxury-cake-candidates.json',JSON.stringify(records,null,2)+'\n');
  console.log(JSON.stringify({count:records.length,countries:[...new Set(records.map(r=>r.sourceCountry))]}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
