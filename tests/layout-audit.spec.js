const {test,expect}=require('@playwright/test');
const {buildCatalog}=require('../lib/catalog');
const catalog=require('../lib/load-catalog').loadCatalog();

test('all active collections expose only scoped filters and fit mobile and desktop',async({page})=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const ctx=buildCatalog(catalog,{curated:true});
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  for(const c of ctx.collections){
   const response=await page.goto('/collections/'+c.slug);expect(response.status()).toBe(200);
   await page.evaluate(()=>document.fonts.ready);
   await expect(page.locator('.collection-intro img, .wedding-subcategories, #filters [name=category]')).toHaveCount(0);
   await expect(page.locator('#filters .sidebar-service')).toHaveCount(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),c.slug+' at '+width).toBeTruthy();
   if(width<=760){
    const cards=page.locator('.product-card');
    await cards.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();})));
    const rows=await cards.evaluateAll(cards=>cards.map(c=>['.product-image-link','h3','.card-price','.card-actions'].map(s=>{
     const el=c.querySelector(s),r=el.getBoundingClientRect();return{y:r.y,width:r.width,height:r.height};
    })));
    for(let i=0;i<rows.length;i++){
     expect(rows[i][0].width/rows[i][0].height).toBeCloseTo(.8,2);
     if(i%2)rows[i].forEach((box,j)=>expect(box.y,c.slug).toBeCloseTo(rows[i-1][j].y,0));
    }
   }
   const facets=ctx.query(c.slug,new URLSearchParams()).facets;
   for(const group of facets.features)await expect(page.locator('#filters [name="'+group.key+'"]')).toHaveCount(group.items.length);
   if(c.slug!=='wedding-cakes')await expect(page.locator('#filters [name=style]')).toHaveCount(0);
  }
 }
 expect(errors).toEqual([]);
});

test('internal headers, branding, alignment and photos pass the responsive audit',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 const active=buildCatalog(catalog,{curated:true});
 const routes=['/','/collections','/bespoke','/contact','/atelier','/delivery','/privacy','/faq','/cart','/wishlist','/checkout','/cakes/'+active.byId.get(active.catalog.featuredId).handle,'/cakes/'+active.byId.get('8028660203745').handle];
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const url of routes){
   const response=await page.goto(url);expect(response.status()).toBe(200);await page.evaluate(()=>document.fonts.ready);
   await expect(page.locator('.masthead .wordmark-name')).toHaveText('ZAVI');
   if(url!=='/')await expect(page.locator('main h1')).toHaveCSS('text-align',url.startsWith('/cakes/')?'start':'center');
   if(url.startsWith('/cakes/')){
    await expect(page.locator('.photo-note')).toHaveCount(0);
    const gap=await page.evaluate(()=>document.querySelector('.product-gallery').getBoundingClientRect().top-document.querySelector('.site-header').getBoundingClientRect().bottom);
    expect(gap).toBeGreaterThanOrEqual(width<=760?24:40);expect(gap).toBeLessThanOrEqual(64);
   }
   const house=await page.locator('.masthead .wordmark-house').boundingBox(),wordmark=await page.locator('.masthead .wordmark-name').boundingBox();
   expect(wordmark.y-(house.y+house.height)).toBeGreaterThanOrEqual(13);
   await expect(page.locator('.atelier-hero img')).toHaveCount(0);
   if(['/contact','/bespoke'].includes(url))await expect(page.locator('.enquiry-visual')).toBeVisible({visible:width>760});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),url+' at '+width).toBeTruthy();
   const overlaps=await page.locator('.masthead').evaluate(el=>{const brand=el.querySelector('.brand').getBoundingClientRect(),actions=el.querySelector('.header-actions').getBoundingClientRect();return brand.left<actions.right&&brand.right>actions.left+1&&brand.top<actions.bottom&&brand.bottom>actions.top;});expect(overlaps,url+' at '+width).toBeFalsy();
   for(const img of await page.locator('main img:visible').all()){
    if(await img.evaluate(el=>el.getBoundingClientRect().top<innerHeight))expect(await img.evaluate(el=>el.complete?el.naturalWidth>0:new Promise(resolve=>{el.onload=()=>resolve(el.naturalWidth>0);el.onerror=()=>resolve(false);})),url).toBeTruthy();
   }
  }
 }
});
