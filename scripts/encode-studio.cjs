// Delivery encoding only: preserve dimensions/composition; originals stay beside WebP copies.
const fs=require('node:fs/promises');
const {chromium}=require('@playwright/test');
(async()=>{
 const files=await fs.readdir('assets/studio');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();let before=0,after=0;
  for(const file of files.filter(f=>f.endsWith('.png'))){
   const bytes=await fs.readFile('assets/studio/'+file);before+=bytes.length;
   const base64=await page.evaluate(async data=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL('image/webp',.9).split(',')[1];},bytes.toString('base64'));
   const encoded=Buffer.from(base64,'base64');after+=encoded.length;await fs.writeFile('assets/studio/'+file.replace('.png','.webp'),encoded);
  }
  console.log(JSON.stringify({files:files.filter(f=>f.endsWith('.png')).length,originalBytes:before,webpBytes:after}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
