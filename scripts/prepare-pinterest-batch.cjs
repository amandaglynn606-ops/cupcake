const fs=require('node:fs');
const file='data/image-batch-001.json';
const previous=JSON.parse(fs.readFileSync(file,'utf8'));
const archive='data/archive/image-batch-001-before-pinterest.json';
if(!fs.existsSync(archive))fs.writeFileSync(archive,JSON.stringify(previous,null,2)+'\n');
const choices={1:1,2:0,4:0,5:1,7:0,9:0,10:1,11:0,13:4,19:0,23:2,25:0,27:0,28:0,29:1,31:0,33:0,34:0,37:0,38:0,39:0,43:0,44:0,45:0,47:0,48:0,49:0};
const batch={batch:1,revision:2,size:50,sourcePreference:'Pinterest',rules:['Exact visible tier count for tiered cakes','Product type and named shape must match','Named decorations and colour combination must match','Keep original if no suitable match'],nextBatchStart:51,records:previous.records.map(r=>{
 const pins=r.candidates.filter(c=>/(^|\.)pinterest\.com$/.test(new URL(c.sourceUrl).hostname));
 return {n:r.n,productId:r.productId,title:r.title,originalImage:r.originalImage,selected:choices[r.n]===undefined?null:pins[choices[r.n]],candidates:pins,status:'needs-review'};
})};
fs.writeFileSync('data/image-batch-001-pinterest.json',JSON.stringify(batch,null,2)+'\n');
