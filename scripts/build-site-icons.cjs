'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('sharp');
const ROOT=path.resolve(__dirname,'..');

async function buildSiteIcons(){
 const source=await fs.readFile(path.join(ROOT,'favicon.svg'));
 for(const [file,size]of [['favicon-48.png',48],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]){
  await sharp(source).resize(size,size).png().toFile(path.join(ROOT,file));
 }
 // ICO permits PNG entries. Include native small sizes for browser tabs.
 const sizes=[16,32,48],images=[];
 for(const size of sizes)images.push(await sharp(source).resize(size,size).png().toBuffer());
 const header=Buffer.alloc(6+16*sizes.length);
 header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
 let offset=header.length;
 images.forEach((buffer,index)=>{
  const entry=6+16*index;
  header[entry]=header[entry+1]=sizes[index];
  header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);
  header.writeUInt32LE(buffer.length,entry+8);header.writeUInt32LE(offset,entry+12);
  offset+=buffer.length;
 });
 await fs.writeFile(path.join(ROOT,'favicon.ico'),Buffer.concat([header,...images]));
 await sharp(path.join(ROOT,'assets/brand/site-logo.svg')).png().toFile(path.join(ROOT,'assets/brand/site-logo.png'));
}
if(require.main===module)buildSiteIcons().then(()=>console.log('Site logo and browser icons built.')).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={buildSiteIcons};
