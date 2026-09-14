const fs=require('node:fs');
const crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const metadataOnly=process.argv.includes('--metadata');
const urls=process.argv.slice(2).filter(arg=>arg!=='--metadata');
if(!urls.length||urls.some(url=>!/^https:\/\//.test(url)))throw Error('Pass HTTPS source pages');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const url of urls){
   const page=await browser.newPage();
   try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    const info=await page.evaluate(()=>({url:location.href,title:document.title,ogImage:document.querySelector('meta[property="og:image"]')?.content,images:[...document.images].map(i=>({alt:i.alt||i.closest('.et_pb_gallery_item')?.innerText||'',src:i.dataset.src||i.currentSrc||i.src,srcset:i.srcset})).filter(i=>i.src),text:document.body.innerText.slice(-6000)}));
    fs.mkdirSync('artifacts/cake-sources',{recursive:true});
    const key=crypto.createHash('sha256').update(url).digest('hex').slice(0,16);
    if(info.ogImage&&!metadataOnly){
     try{
      const imageUrl=info.ogImage.replace(/^http:/,'https:');
      const imageResponse=await page.goto(imageUrl,{waitUntil:'load',timeout:30000});
      if(!imageResponse.ok()||!imageResponse.headers()['content-type']?.startsWith('image/'))throw Error('Invalid photo response');
      const bytes=await imageResponse.body(),mime=imageResponse.headers()['content-type'].split(';')[0];
      const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}[mime];
      if(!ext)throw Error('Unsupported format '+mime);
      info.localImage='artifacts/cake-sources/'+key+'.'+ext;
      fs.writeFileSync(info.localImage,bytes);
      info.imageSha256=crypto.createHash('sha256').update(bytes).digest('hex');
     }catch(e){info.imageError=e.message;}
    }
    fs.writeFileSync('artifacts/cake-sources/'+key+'.json',JSON.stringify(info,null,2)+'\n');
    console.log(JSON.stringify({status:response.status(),url,title:info.title,ogImage:info.ogImage,localImage:info.localImage,imageError:info.imageError,record:'artifacts/cake-sources/'+key+'.json'}));
   }catch(e){console.log(JSON.stringify({url,error:e.message}));}finally{await page.close();}
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
