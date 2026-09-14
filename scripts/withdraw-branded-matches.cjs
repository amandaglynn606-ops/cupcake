const fs=require('node:fs');
const catalog=require('../data/catalog.json');
const file='data/image-matches.json';
const matches=require('../'+file);
const rejectedNumbers=[1,3,7,10,28,44,53,80,85,95,98,110,139,147,148,150,170,179,182,183];
const auditFile='data/image-brand-review.json';
const audit=fs.existsSync(auditFile)?JSON.parse(fs.readFileSync(auditFile)):{rejected:[]};
for(const n of rejectedNumbers){
 const p=catalog.products[n-1],match=matches[p.id];
 if(!match)continue;
 const previous=audit.rejected.find(r=>r.n===n);
 if(previous&&previous.image!==match.image)continue;
 if(!audit.rejected.some(r=>r.image===match.image))audit.rejected.push({n,productId:p.id,...match,reason:'Visible third-party bakery name, logo or photo credit in the full-size image.'});
 delete matches[p.id];
}
audit.reviewedAt=new Date().toISOString();
fs.writeFileSync(auditFile,JSON.stringify(audit,null,2)+'\n');
for(const name of fs.readdirSync('data/image-batches').filter(n=>/^00[1-4]\.json$/.test(n)).map(n=>'data/image-batches/'+n).concat(['data/image-batch-001.json','data/image-batch-001-pinterest.json'])){
 const b=JSON.parse(fs.readFileSync(name));
 for(const r of b.records){
  if(matches[r.productId])continue;
  const rejection=audit.rejected.find(x=>x.productId===r.productId);
  if(!rejection)continue;
  for(const c of r.candidates||[])if(c.localImage===rejection.image||c.imageUrl===r.selected?.imageUrl)c.businessNameVisible=true;
  r.status='needs-better-match';r.reviewNote=rejection.reason+' Replacement remains pending.';
  delete r.selected;delete r.localImage;delete r.sha256;delete r.visualReview;
 }
 b.summary={...b.summary,reviewed:b.records.length,replaced:b.records.filter(r=>r.status==='applied').length,pending:b.records.filter(r=>r.status!=='applied').length};
 fs.writeFileSync(name,JSON.stringify(b,null,2)+'\n');
}
for(const key of ['002','003','004']){
 const name='data/image-batches/'+key+'-decisions.json';const decisions=JSON.parse(fs.readFileSync(name));
 for(const n of rejectedNumbers)if(!matches[catalog.products[n-1].id])delete decisions[n];
 fs.writeFileSync(name,JSON.stringify(decisions,null,2)+'\n');
}
fs.writeFileSync(file,JSON.stringify(matches,null,2)+'\n');
console.log({withdrawn:audit.rejected.length,remainingApplied:Object.keys(matches).length});
