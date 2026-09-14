const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const catalog=require('../data/catalog.json');
const matches=require('../data/image-matches.json');
const originals=[...new Set(catalog.products.flatMap(p=>[p.image,...p.images,...p.variants.map(v=>v.image)]).filter(Boolean))];
const replacements=[...new Set(Object.values(matches).map(m=>m.image))];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();
  const fingerprints={};
  const files=[...originals,...replacements];
  for(let start=0;start<files.length;start+=50){
   const group=files.slice(start,start+50).map(file=>({file,url:'data:image/'+(path.extname(file).slice(1)==='jpg'?'jpeg':path.extname(file).slice(1))+';base64,'+fs.readFileSync(file).toString('base64')}));
   const result=await page.evaluate(async group=>Promise.all(group.map(async({file,url})=>{
    const img=new Image();img.src=url;
    try{await img.decode();}catch{return {file,error:'decode failed'};}
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,32,32);
    return {file,pixels:Array.from(ctx.getImageData(0,0,32,32).data)};
   })),group);
   for(const r of result){if(r.error)throw Error(r.file+' '+r.error);fingerprints[r.file]=r.pixels;}
  }
  const suspects=[];
  for(const replacement of replacements){
   const pixels=fingerprints[replacement];let nearest=null,error=Infinity;
   for(const original of originals){
    const reference=fingerprints[original];let total=0;
    for(let i=0;i<pixels.length;i++)if(i%4!==3)total+=Math.abs(pixels[i]-reference[i]);
    const distance=total/(32*32*3);
    if(distance<error){nearest=original;error=distance;}
   }
   if(error<14)suspects.push({replacement,original:nearest,meanPixelDifference:Number(error.toFixed(3)),products:Object.entries(matches).filter(([,m])=>m.image===replacement).map(([id,m])=>({id,title:m.title}))});
  }
  fs.mkdirSync('artifacts/image-audit',{recursive:true});
  fs.writeFileSync('artifacts/image-audit/original-duplicate-suspects.json',JSON.stringify({originals:originals.length,replacements:replacements.length,suspects},null,2)+'\n');
  console.log(JSON.stringify({originals:originals.length,replacements:replacements.length,suspects}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
