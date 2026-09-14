const {chromium}=require('@playwright/test');
const fs=require('node:fs/promises');
const {buildCatalog}=require('../lib/catalog');
const ctx=buildCatalog(require('../lib/load-catalog').loadCatalog(),{curated:true});
const routes=[...new Set(['/', '/collections','/collections/all','/search?q=floral','/bespoke','/contact','/atelier','/delivery','/privacy','/faq','/cart','/wishlist','/checkout',...Object.keys(require('../pages/policies').policies),...ctx.collections.map(c=>'/collections/'+c.slug),...ctx.catalog.products.map(p=>'/cakes/'+p.handle)])];
(async()=>{
 const dir='artifacts/alignment-audit';await fs.mkdir(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const widths=process.argv.includes('--tablet')?[768]:[320,390,768,1024,1440];
 const previous=process.argv.includes('--tablet')?JSON.parse(await fs.readFile(dir+'/report.json','utf8')):null;
 const page=await browser.newPage({reducedMotion:'reduce'}),issues=previous?previous.issues.filter(i=>!widths.includes(i.width)):[];
 let checked=previous?previous.checked-routes.length:0;
 for(const width of widths){
  await page.setViewportSize({width,height:1000});
  for(const route of routes){
   const response=await page.goto('http://localhost:3000'+route);
   await page.evaluate(()=>document.fonts.ready);
   const faults=await page.evaluate(()=>{
    const faults=[],rect=s=>document.querySelector(s).getBoundingClientRect();
    if(document.documentElement.scrollWidth>innerWidth+1)faults.push('Page overflows horizontally');
    const controls=['.header-search','.currency-selector select','.header-actions .wishlist-link','.header-actions .bag-button'].map(rect);
    if(Math.max(...controls.map(r=>r.bottom))-Math.min(...controls.map(r=>r.bottom))>1)faults.push('Header controls have different baselines');
    const brand=rect('.masthead .brand'),actions=rect('.header-actions');
    if(brand.left<actions.right&&brand.right>actions.left&&brand.top<actions.bottom&&brand.bottom>actions.top)faults.push('Brand overlaps header controls');
    if(controls.some(r=>r.left<0||r.right>innerWidth+1))faults.push('Header controls overflow');
    for(let i=0;i<controls.length-1;i++)if(controls[i].right>controls[i+1].left+1)faults.push('Header controls overlap');
    for(const grid of document.querySelectorAll('.form-grid,.product-grid:not(.carousel-track),.collection-grid,.process-grid')){
     const children=[...grid.children].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect());
     for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){
      const a=children[i],b=children[j];if(a.width&&b.width&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)faults.push('Overlapping content in '+grid.className);
     }
    }
    return [...new Set(faults)];
   });
   if(response.status()!==200)faults.push('HTTP '+response.status());
   if(faults.length)issues.push({width,route,faults});
   checked++;
   if(['/', '/contact','/collections/tiered-cakes','/cakes/'+ctx.catalog.products[0].handle].includes(route)){
    await page.screenshot({path:dir+'/'+(route==='/'?'home':route.split('/').pop())+'-'+width+'.png',fullPage:true});
   }
  }
  console.log('Checked '+routes.length+' pages at '+width+'px; '+issues.length+' issues so far');
 }
 await fs.writeFile(dir+'/report.json',JSON.stringify({routeCount:routes.length,viewports:[320,390,768,1024,1440],checked,issues},null,2));
 await browser.close();console.log(JSON.stringify({checked,issueCount:issues.length}));
 if(issues.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
