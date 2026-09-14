'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const {makeServer}=require('../server');
const manifest=require('../data/cake-background-manifest.json');
const {loadCatalog}=require('../lib/load-catalog');
const {buildCatalog}=require('../lib/catalog');
const ctx=buildCatalog(loadCatalog(),{curated:true});
(async()=>{
 const server=makeServer({catalog:loadCatalog(),config:require('../store.config.json')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const output=path.resolve(__dirname,'../artifacts/cake-background-audit');fs.mkdirSync(output,{recursive:true});
 const applied=manifest.images.filter(r=>r.status==='applied');
 const checked=[];
 try{
  const page=await browser.newPage();
  for(const width of [1440,820,390]){
   await page.setViewportSize({width,height:1000});
   for(const p of ctx.catalog.products){
    if(!applied.some(r=>r.products.some(row=>row.id===p.id)))continue;
    const response=await page.goto(base+'/cakes/'+p.handle);assert.equal(response.status(),200);
    const img=page.locator('#product-image');await img.evaluate(i=>i.decode());
    const rendered=await img.evaluate(i=>({src:i.getAttribute('src'),alt:i.alt,fit:getComputedStyle(i).objectFit,position:getComputedStyle(i).objectPosition}));
    assert.equal(rendered.src.replace(/^\//,''),p.image);assert.ok(rendered.alt);assert.equal(rendered.fit,'contain');assert.equal(rendered.position,'50% 50%');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('main img').evaluateAll(imgs=>Promise.all(imgs.map(async i=>{i.loading='eager';await i.decode();})));
    checked.push({page:'/cakes/'+p.handle,width,image:p.image});
   }
  }
  for(const r of applied){const res=await page.request.get(base+'/'+r.image);assert.equal(res.status(),200);}
  await page.goto('about:blank');
  for(let offset=0;offset<applied.length;offset+=12){
   await page.setViewportSize({width:1600,height:1500});
   await page.setContent('<style>body{margin:0;background:#f3f1ed;font:13px sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}figure{margin:0}img{width:100%;height:440px;object-fit:contain}figcaption{height:40px}</style><main>'+applied.slice(offset,offset+12).map(r=>'<figure><img src="data:image/webp;base64,'+fs.readFileSync(path.resolve(__dirname,'..',r.image)).toString('base64')+'"><figcaption>'+r.products[0].title+'</figcaption></figure>').join('')+'</main>');
   await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   await page.screenshot({path:path.join(output,'review-'+String(offset+1).padStart(3,'0')+'.png'),fullPage:true});
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({at:new Date().toISOString(),applied:applied.length,total:manifest.images.length,pending:manifest.images.length-applied.length,checked},null,2)+'\n');
  console.log(JSON.stringify({applied:applied.length,productViewportChecks:checked.length,viewports:[1440,820,390]}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
