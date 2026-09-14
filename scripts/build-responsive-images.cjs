'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {createHash}=require('node:crypto');
const sharp=require('sharp');
const ROOT=path.resolve(__dirname,'..');
async function buildResponsiveImages(){
 const config=require('../store.config.json');
 const {catalog}=require('../lib/catalog').buildCatalog(require('../lib/load-catalog').loadCatalog(),{curated:config.collectionScope==='curated'});
 const files=[...new Set(catalog.products.flatMap(p=>[p.image,...p.images,...p.variants.map(v=>v.image)]).filter(p=>/^assets\/.+\.(webp|png|jpe?g)$/.test(p)))];
 const directory=path.join(ROOT,'assets','responsive');await fs.mkdir(directory,{recursive:true});
 const manifest={},backgrounds=[];
 for(const file of files){
  const source=await fs.readFile(path.join(ROOT,file));
  const hash=createHash('sha256').update(source).update('webp82-v1').digest('hex').slice(0,12);
  const meta=await sharp(source).metadata(),variants=[];
  const edge=async left=>{
   const pixels=await sharp(source).extract({left,top:0,width:Math.min(4,meta.width),height:meta.height}).resize(1,5,{fit:'fill'}).removeAlpha().toColourspace('srgb').raw().toBuffer();
   return 'linear-gradient('+Array.from({length:5},(_,i)=>'#'+pixels.subarray(i*3,i*3+3).toString('hex')+' '+i*25+'%').join(',')+')';
  };
  const left=await edge(0),right=await edge(meta.width-Math.min(4,meta.width));
  backgrounds.push('body img.cake-image[src$="/'+file+'"]{background:'+left+' left/50.1% 100% no-repeat,'+right+' right/50.1% 100% no-repeat!important}');
  for(const width of [320,640,960].filter(w=>w<meta.width)){
   const url='assets/responsive/'+path.basename(file,path.extname(file))+'-'+hash+'-'+width+'.webp';
   try{await fs.access(path.join(ROOT,url));}catch{
    await sharp(source).resize({width,withoutEnlargement:true}).webp({quality:82,effort:4}).toFile(path.join(ROOT,url));
   }
   variants.push({url,width});
  }
  manifest[file]={width:meta.width,height:meta.height,variants};
 }
 const css='@media(min-width:761px){'+backgrounds.join('')+'}';
 const stylesheet='assets/responsive/photo-backgrounds-'+createHash('sha256').update(css).digest('hex').slice(0,12)+'.css';
 await fs.writeFile(path.join(ROOT,stylesheet),css);
 await fs.writeFile(path.join(ROOT,'data','responsive-image-styles.json'),JSON.stringify({stylesheet}));
 await fs.writeFile(path.join(ROOT,'data','responsive-images.json'),JSON.stringify(manifest));
 return manifest;
}
if(require.main===module)buildResponsiveImages().then(m=>console.log('Responsive photos ready: '+Object.keys(m).length)).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={buildResponsiveImages};
