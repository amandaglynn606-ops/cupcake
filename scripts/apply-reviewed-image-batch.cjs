const fs=require('node:fs');
const crypto=require('node:crypto');
const {compatibleImageMatch}=require('../lib/image-matches');
const catalog=require('../data/catalog.json');
const number=Number(process.argv[2]);
if(!Number.isInteger(number)||number<1||number>22)throw Error('Batch must be 1–22');
const key=String(number).padStart(3,'0');
const file=`data/image-batches/${key}.json`;
const batch=JSON.parse(fs.readFileSync(file));
const decisions=JSON.parse(fs.readFileSync(`data/image-batches/${key}-decisions.json`));
const matches=JSON.parse(fs.readFileSync('data/image-matches.json'));
for(const r of batch.records){
 const d=decisions[r.n];
 if(!d){if(r.status!=='applied')r.status='needs-better-match';continue;}
 const [index,tierCount,shape,notes,originalTierCount]=d;
 const c=r.candidates[index];
 if(c?.businessNameVisible)throw Error('Visible third-party branding '+r.n);
 if(!c?.localImage||!fs.existsSync(c.localImage))throw Error('Missing image '+r.n);
 if(crypto.createHash('sha256').update(fs.readFileSync(c.localImage)).digest('hex')!==c.sha256)throw Error('Image changed since review '+r.n);
 const visualReview={verified:true,tierCount,shape,notes,...(originalTierCount?{originalTierCount}:{} )};
 const match={batch:number,title:r.title,originalImage:r.originalImage,image:c.localImage,sourceUrl:c.sourceUrl,visualReview};
 const product=catalog.products.find(p=>p.id===r.productId);
 if(!compatibleImageMatch(product,match))throw Error('Incompatible reviewed replacement '+r.n);
 matches[r.productId]=match;
 Object.assign(r,{selected:c,localImage:c.localImage,sha256:c.sha256,visualReview,status:'applied',reviewNote:notes});
}
batch.reviewedAt=new Date().toISOString();
batch.summary={reviewed:batch.records.length,replaced:batch.records.filter(r=>r.status==='applied').length,pending:batch.records.filter(r=>r.status!=='applied').length};
fs.writeFileSync(file,JSON.stringify(batch,null,2)+'\n');
fs.writeFileSync('data/image-matches.json',JSON.stringify(matches,null,2)+'\n');
console.log(batch.summary);
