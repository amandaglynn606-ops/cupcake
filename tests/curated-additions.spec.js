const {test,expect}=require('@playwright/test');
const additions=require('../data/curated-additions.json').products;
const manifest=require('../data/curated-addition-manifest.json');
test('all added cake pages load with accurate tiers, local photos and no source credits',async({page})=>{
 test.setTimeout(180000);
 expect(additions.length).toBeGreaterThanOrEqual(40);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const p of additions){
  const response=await page.goto('/cakes/'+p.handle);expect(response.status()).toBe(200);
  const img=page.locator('#product-image');await img.evaluate(i=>i.decode());
  await expect(img).toHaveAttribute('alt',p.imageAlt);
  await expect(img).toHaveCSS('object-fit','contain');await expect(img).toHaveCSS('object-position','50% 50%');
  await expect(page.locator('[data-tier-row]')).toHaveCount(p.tiers>1?p.tiers:0);
  await expect(page.locator('#product-price')).toHaveText('Price on request');
  expect(await page.locator('body').innerText()).not.toMatch(/Rosewood|Annie.s Creative|GC Couture|Perfect Gift|Apple Tree Cake|Goldfinch Kitchen|Sugar Peony Leamington|Etoile Bakery|Cakes By Anusha/i);
  const record=manifest.products.find(r=>r.productId===p.id);expect(record.source_country).toBe('GB');
 }
 expect(errors).toEqual([]);
});
test('six collections and new photo compositions work on desktop, tablet and mobile',async({page})=>{
 const slugs=['wedding-cakes','luxury-cakes','engagement-cakes','tiered-cakes','fresh-floral-cakes','sugar-flower-cakes'];
 for(const width of [1440,820,390]){
  await page.setViewportSize({width,height:1000});
  for(const route of ['/','/collections',...slugs.map(s=>'/collections/'+s)]){
   const res=await page.goto(route);expect(res.status()).toBe(200);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' at '+width).toBe(true);
   if(route==='/collections')await expect(page.locator('.collection-tile')).toHaveCount(6);
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.locator('main img').evaluateAll(imgs=>Promise.all(imgs.map(async i=>{i.loading='eager';await i.decode();})));
   const framing=await page.locator('main img.cake-image').evaluateAll(imgs=>imgs.map(i=>{
    const css=getComputedStyle(i);
    return {fit:css.objectFit,padding:css.padding,backdrop:css.getPropertyValue('--cake-backdrop').trim().length>0};
   }));
   for(const frame of framing)expect(frame,route+' at '+width).toEqual({fit:'contain',padding:'0px',backdrop:true});
   await page.screenshot({animations:'disabled',path:'artifacts/curated-storefront/'+(route.replace(/\//g,'-')||'home')+'-'+width+'.png',fullPage:true});
  }
  for(const p of [additions[0],additions.find(p=>p.tiers===2),additions.find(p=>p.categories.includes('fresh-floral-cakes')),additions.find(p=>p.tiers===4)]){
   await page.goto('/cakes/'+p.handle);await page.locator('#product-image').evaluate(i=>i.decode());
   await expect(page.locator('#product-image')).toHaveCSS('object-fit','contain');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
 }
});
