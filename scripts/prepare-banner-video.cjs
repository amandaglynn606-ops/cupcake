'use strict';
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'artifacts/banner-video');
const input=process.argv[2]||'5698558-uhd_3840_2160_25fps.mp4';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:960,height:540}});
  const html=path.join(folder,'review.html');
  fs.writeFileSync(html,'<!doctype html><style>html,body{margin:0;background:#111}video{display:block;width:960px;height:540px;object-fit:contain}</style><video muted playsinline preload="auto" src="'+input+'"></video>');
  await page.goto(pathToFileURL(html).href);
  const metadata=await page.evaluate(async()=>{const v=document.querySelector('video');if(v.readyState<1)await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=()=>reject(Error('Video decoding failed'));});return {width:v.videoWidth,height:v.videoHeight,duration:v.duration};});
  console.log(JSON.stringify(metadata));
  for(const time of [0.1,3,6,9].filter(t=>t<metadata.duration)){
   await page.evaluate(time=>new Promise(resolve=>{const v=document.querySelector('video');v.onseeked=resolve;v.currentTime=time;}),time);
   await page.screenshot({path:path.join(folder,'frame-'+time+'.png')});
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
