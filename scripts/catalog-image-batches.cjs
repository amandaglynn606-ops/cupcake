const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const catalog=require('../data/catalog.json');
const folder=path.join(root,'data/image-batches');
fs.mkdirSync(folder,{recursive:true});
for(let start=0;start<catalog.products.length;start+=50){
 const number=Math.floor(start/50)+1;
 const file=path.join(folder,String(number).padStart(3,'0')+'.json');
 if(fs.existsSync(file))continue;
 const previous=number===1?require('../data/image-batch-001.json').records:[];
 const records=catalog.products.slice(start,start+50).map((p,i)=>{
  const old=previous.find(r=>r.productId===p.id);
  return old?{...old,status:old.status==='applied'?'applied':'needs-search'}:{n:start+i+1,productId:p.id,title:p.title,originalImage:p.image,status:'needs-search',candidates:[]};
 });
 fs.writeFileSync(file,JSON.stringify({batch:number,size:records.length,sourcePreference:'Pinterest',records},null,2)+'\n');
}
const batches=fs.readdirSync(folder).filter(f=>/^\d{3}\.json$/.test(f)).sort().map(file=>{
 const b=JSON.parse(fs.readFileSync(path.join(folder,file)));
 return {batch:b.batch,total:b.records.length,applied:b.records.filter(r=>r.status==='applied').length,searched:b.records.filter(r=>r.query||r.status==='applied'||r.candidates.length).length,pending:b.records.filter(r=>r.status!=='applied').length,file:'data/image-batches/'+file};
});
const progress={updatedAt:new Date().toISOString(),total:catalog.products.length,applied:batches.reduce((s,b)=>s+b.applied,0),pending:batches.reduce((s,b)=>s+b.pending,0),batches};
const imagePaths=products=>products.flatMap(p=>[p.image,...p.images,...p.variants.map(v=>v.image)]).filter(Boolean);
const originalFiles=new Set(imagePaths(catalog.products));
const publicFiles=new Set(imagePaths(require('../lib/catalog').buildCatalog(require('../lib/load-catalog').loadCatalog()).catalog.products));
progress.originalImageFiles=originalFiles.size;
progress.originalImageFilesStillUsed=[...originalFiles].filter(file=>publicFiles.has(file)).length;
progress.originalImageFilesRetired=progress.originalImageFiles-progress.originalImageFilesStillUsed;
progress.productsWithTemporaryPlaceholder=require('../lib/catalog').buildCatalog(catalog).catalog.products.filter(p=>p.image==='assets/maison-photo-pending.svg').length;
fs.writeFileSync(path.join(root,'data/image-replacement-progress.json'),JSON.stringify(progress,null,2)+'\n');
console.log(JSON.stringify(progress));
