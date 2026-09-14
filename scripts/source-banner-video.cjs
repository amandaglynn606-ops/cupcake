'use strict';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/banner-video');
const ids=['5698558','5698562'];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 if(process.argv.includes('--download')){
  const url=process.argv[process.argv.indexOf('--download')+1];
  if(new URL(url).hostname!=='videos.pexels.com'||!url.endsWith('.mp4'))throw Error('Expected Pexels MP4');
  const response=await fetch(url);if(!response.ok)throw Error('Video download HTTP '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());fs.writeFileSync(path.join(out,path.basename(new URL(url).pathname)),bytes);console.log(JSON.stringify({url,bytes:bytes.length}));return;
 }
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();
  for(const id of ids){
   const url='https://www.pexels.com/video/'+id+'/';
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
   const html=await page.content();fs.writeFileSync(path.join(out,id+'.html'),html);
   const result=await page.evaluate(()=>({title:document.title,videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc||v.src,poster:v.poster})),media:[...new Set(document.documentElement.innerHTML.match(/https[^"\s<>]+\.mp4/g)||[])].slice(0,25)}));
   console.log(JSON.stringify({id,...result}));
   const poster=result.videos[0]?.poster;if(poster){const response=await page.request.get(poster);if(response.ok())fs.writeFileSync(path.join(out,id+'.jpg'),await response.body());}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
