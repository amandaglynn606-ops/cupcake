const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const rows=require('../data/wedding-source-images.json');
const review=require('../data/wedding-addition-review.json');
const products=[];
const provenance=[];
fs.mkdirSync('assets/products/wedding-cakes',{recursive:true});
for(const [n,tiers,label,extras=[],detail] of review.designs){
 const selected=[n,...extras].map(number=>rows.find(r=>r.n===number));
 const main=selected[0];
 const images=selected.map(r=>{
  if(!r?.localImage||!fs.existsSync(r.localImage))throw Error('Missing photograph '+n);
  const bytes=fs.readFileSync(r.localImage);
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==r.sha256)throw Error('Photograph changed '+n);
  const file='assets/products/wedding-cakes/'+r.sha256.slice(0,18)+path.extname(r.localImage);
  fs.copyFileSync(r.localImage,file);return file;
 });
 const id=String(9800000000000+n),title=label+(label.endsWith('Wedding Cake')?'':' Wedding Cake');
 const handle=title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-w'+n;
 const description=detail||`${tiers} tiers with ${label.toLowerCase().replace(/ & /g,' and ')} details. Cake dimensions, flavours and finishing materials are arranged for your wedding.`;
 const p={id,handle,title,categories:['wedding-cake-dubai','tiered-cake'],kind:'cake',description,images:[...new Set(images)],image:images[0],imageAlt:title+' — '+tiers+' cake tiers',imageContain:true,imageNote:'Wedding design reference. Size, colours, flavours and finishing details are confirmed with your personal quotation.',optionNames:[],variants:[{id:id+'01',title:tiers+' tiers — bespoke quotation',options:[],priceFils:null,compareAtFils:null,available:true,image:images[0],tiers}],minPriceFils:null,available:true,quoteOnly:true,tiers,catalogueAddition:'wedding-2026-09',searchText:title+' '+tiers+' tier wedding floral bespoke'};
 products.push(p);provenance.push({productId:id,sourceUrl:main.sourceUrl,source:main.source,sourceProductId:main.sourceProductId,photoNumbers:[n,...extras],tierCount:tiers,reviewed:true,images:selected.map(r=>({url:r.imageUrl,sha256:r.sha256,credit:r.credit}))});
}
fs.writeFileSync('data/wedding-additions.json',JSON.stringify({products},null,2)+'\n');
fs.writeFileSync('data/wedding-addition-provenance.json',JSON.stringify(provenance,null,2)+'\n');
console.log(products.length+' wedding designs added; '+products.reduce((s,p)=>s+p.images.length,0)+' gallery photographs.');
