'use strict';
// Local browser encoding of licensed footage; preserve its aspect ratio and remove audio.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const http=require('node:http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/videos');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const input=process.argv[2]||path.join(root,'artifacts/banner-video/5698558-uhd_3840_2160_25fps.mp4');
 const stem=process.argv[3]||'wedding-floral-banner';
 if(!/^[a-z0-9-]+$/.test(stem))throw Error('Invalid output name');
 const videoBytes=fs.readFileSync(input);
 const server=http.createServer((req,res)=>{if(req.url==='/clip.mp4'){res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':videoBytes.length});res.end(videoBytes);}else{res.writeHead(200,{'Content-Type':'text/html'});res.end('<video muted playsinline preload="auto" src="/clip.mp4"></video>');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const records=[];
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
  const dimensions=await page.evaluate(async()=>{const v=document.querySelector('video');if(v.readyState<1)await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=reject;});return {width:v.videoWidth,height:v.videoHeight};});
  for(const [width,bitrate,name] of [[1920,3000000,stem+'.mp4'],[960,1100000,stem+'-mobile.mp4']]){
   const height=Math.round(width*dimensions.height/dimensions.width/2)*2;
   const result=await page.evaluate(async({width,height,bitrate})=>{
    const video=document.querySelector('video');video.muted=true;video.pause();
    if(video.readyState<2)await new Promise(resolve=>video.onloadeddata=resolve);
    await new Promise(resolve=>{video.onseeked=resolve;video.currentTime=1;});
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,width,height);
    const poster=canvas.toDataURL('image/webp',.9).split(',')[1];
    const stream=canvas.captureStream(25),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/mp4;codecs=avc1.42001f',videoBitsPerSecond:bitrate});
    const stopped=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=reject;});
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    let frame;
    const draw=()=>{ctx.drawImage(video,0,0,width,height);if(video.currentTime>=11){video.pause();recorder.stop();return;}frame=video.requestVideoFrameCallback(draw);};
    recorder.start(500);frame=video.requestVideoFrameCallback(draw);await video.play();
    await stopped;video.cancelVideoFrameCallback(frame);stream.getTracks().forEach(t=>t.stop());
    const blob=new Blob(chunks,{type:'video/mp4'});
    const base64=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(blob);});
    return {base64,poster};
   },{width,height,bitrate});
   const bytes=Buffer.from(result.base64,'base64');fs.writeFileSync(path.join(out,name),bytes);
   if(width===1920)fs.writeFileSync(path.join(out,stem+'-poster.webp'),Buffer.from(result.poster,'base64'));
   records.push({file:'assets/videos/'+name,width,height,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});console.log(JSON.stringify(records.at(-1)));
  }
 }finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(root,'artifacts/banner-video/encoded.json'),JSON.stringify(records,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
