const {test,expect}=require('@playwright/test');
const ctx=require('../lib/catalog').buildCatalog(require('../lib/load-catalog').loadCatalog(),{curated:true});
const additions=require('../data/wedding-additions.json').products.map(p=>ctx.byId.get(p.id));

test('new wedding photos load, remain uncropped, and use their reviewed tier options',async({page})=>{
 await page.goto('/collections/wedding-cakes');
 await expect(page.locator('.product-card').first()).toHaveAttribute('data-product-id',additions[0].id);
 await expect(page.locator('.product-card').first().locator('.card-price')).toHaveText('Price on request');
 await expect(page.locator('.product-card').first().locator('img')).toHaveCSS('object-fit','contain');
 const decoded=await page.evaluate(async urls=>Promise.all(urls.map(url=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>100&&i.naturalHeight>100);i.onerror=()=>resolve(false);i.src=url;}))),[...new Set(additions.flatMap(p=>p.images))].map(f=>'/'+f));
 expect(decoded.every(Boolean)).toBe(true);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.goto('/collections/wedding-cakes');
  await page.screenshot({path:`artifacts/wedding-sources/listing-${width}.png`,fullPage:true});
  for(const p of [additions[0],additions.find(p=>p.tiers===10),additions.find(p=>p.title==='Burgundy Wedding Cake')]){
   await page.goto('/cakes/'+p.handle);await page.locator('#product-image').evaluate(i=>i.decode());
   await expect(page.locator('#product-image')).toHaveCSS('object-fit','contain');
   await expect(page.locator('[data-tier-row]')).toHaveCount(p.tiers);
   await expect(page.locator('#product-price')).toHaveText('Price on request');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await page.screenshot({path:`artifacts/wedding-sources/product-${p.id}-${width}.png`,fullPage:true});
  }
 }
});

test('new wedding design can be configured and added to a quote with no invented total',async({page})=>{
 const p=additions.find(p=>p.title==='Burgundy Wedding Cake');await page.goto('/cakes/'+p.handle);
 if(!await page.locator('[data-choice="preferences"]').evaluate(e=>e.open))await page.locator('[data-choice="preferences"] > summary').click();
 await page.locator('[name=colouring]').selectOption('natural');await page.locator('[name=allergens]').selectOption('accept');
 if(await page.locator('[data-tier-row]').count()&&!await page.locator('[data-choice="tiers"]').evaluate(e=>e.open))await page.locator('[data-choice="tiers"] > summary').click();
 for(const row of await page.locator('[data-tier-row]').all()){if(!await row.evaluate(e=>e.open))await row.locator('summary').click();await row.locator('[data-tier-sponge]').selectOption('Vanilla');await row.locator('[data-tier-filling]').selectOption('Swiss Vanilla cream');}
 await page.locator('#add-to-cart').click();await expect(page.locator('#bag-drawer')).toContainText('Price on request');
 await page.locator('#bag-drawer .button[href="/cart"]').click();await expect(page.locator('.cart-products')).toContainText(p.title);
 await expect(page.locator('#cart-total')).toContainText('Price on request');
});
