'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');

async function buildVercel(output=path.join(ROOT,'.vercel','output')){
 const {loadCatalog}=require('../lib/load-catalog');
 const {buildCatalog}=require('../lib/catalog');
 const config=require('../store.config.json');
 const original=loadCatalog();
 const {catalog}=buildCatalog(original,{curated:config.collectionScope==='curated'});
 const photos=products=>products.flatMap(p=>[p.image,...(p.images||[]),...(p.variants||[]).map(v=>v.image)]).filter(Boolean);
 const active=new Set(photos(catalog.products));
 const retired=new Set(photos(original.products).filter(file=>!active.has(file)));
 const functionDir=path.join(output,'functions','storefront.func');
 const staticDir=path.join(output,'static');
 // Remove only the generated output, after verifying its exact location.
 const resolved=path.resolve(output);
 const allowed=path.join(ROOT,'.vercel','output');
 if(resolved!==allowed)throw new Error('Build output must be '+allowed);
 await fs.rm(resolved,{recursive:true,force:true});
 await fs.mkdir(functionDir,{recursive:true});
 await fs.mkdir(staticDir,{recursive:true});
 for(const file of ['server.js','vercel-handler.js','store.config.json','lib','pages','data']){
  await fs.cp(path.join(ROOT,file),path.join(functionDir,file),{recursive:true});
 }
 // Assets are served by the CDN, never included in the function bundle.
 await fs.cp(path.join(ROOT,'assets'),path.join(staticDir,'assets'),{
  recursive:true,
  filter:source=>{
   const relative=path.relative(ROOT,source).split(path.sep).join('/');
   return !retired.has(relative)&&!/^assets\/(?:licensed|studio)(?:\/|$)/.test(relative);
  }
 });
 await fs.copyFile(path.join(ROOT,'favicon.svg'),path.join(staticDir,'favicon.svg'));
 await fs.writeFile(path.join(functionDir,'.vc-config.json'),JSON.stringify({
  runtime:'nodejs22.x',handler:'vercel-handler.js',launcherType:'Nodejs',shouldAddHelpers:false,maxDuration:30
 },null,2));
 await fs.writeFile(path.join(output,'config.json'),JSON.stringify({version:3,routes:[
  {handle:'filesystem'},
  {src:'/(.*)',dest:'/storefront'}
 ]},null,2));
 return {functionDir,staticDir};
}
if(require.main===module)buildVercel().then(()=>console.log('Vercel function and static assets built.')).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={buildVercel};
