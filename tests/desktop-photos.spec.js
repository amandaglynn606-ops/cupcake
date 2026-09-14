const {test,expect}=require('@playwright/test');
test('desktop photos stay complete during hover and keyboard focus',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1024,1440,1920]){
  await page.setViewportSize({width,height:1000});
  for(const route of ['/','/collections','/collections/all','/collections/engagement-cakes']){
   await page.goto(route);
   for(const selector of ['.wedding-photo img','.collection-image img','.product-image-link img','.bespoke-photo img']){
    const image=page.locator(selector).first();if(!await image.count())continue;
    await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode());
    await image.hover();await expect(image).toHaveCSS('object-fit','contain');await expect(image).toHaveCSS('transform','none');
    await image.evaluate(i=>i.closest('a')?.focus());await expect(image).toHaveCSS('transform','none');
    const fit=await image.evaluate(i=>{const r=i.getBoundingClientRect(),p=i.parentElement.getBoundingClientRect();return{width:r.width,height:r.height,parentWidth:p.width,parentHeight:p.height};});
    expect(fit.width).toBeLessThanOrEqual(fit.parentWidth+1);expect(fit.height).toBeLessThanOrEqual(fit.parentHeight+1);
   }
  }
 }
});

test('card images select smaller files and mobile filter search is hidden',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/collections/all');
 const image=page.locator('.product-image-link img').first();await image.evaluate(i=>i.decode());
 expect(await image.evaluate(i=>i.currentSrc)).toContain('/assets/responsive/');
 expect(await image.evaluate(i=>i.naturalWidth)).toBeLessThanOrEqual(640);
 await page.locator('#toggle-filters').click();await expect(page.locator('#mobile-filters .collection-search')).toBeHidden();
});
