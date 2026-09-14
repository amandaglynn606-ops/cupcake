const {test,expect}=require('@playwright/test');
test('mobile cart has compact text, optional preferences and working cake edits',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});await page.goto('/collections/wedding-cakes');
  await page.locator('.product-card').first().getByRole('link',{name:'Add to quote'}).click();
  for(const surface of ['#bag-drawer','#checkout-summary']){
   if(surface==='#checkout-summary')await page.goto('/cart');
   const root=page.locator(surface),item=root.locator('.cart-item,.summary-item').first();
   await expect(item.locator('h3')).toBeVisible();
   const edit=item.locator('.cart-edit,.summary-edit');await expect(edit).toHaveCSS('font-size','12px');
   const frame=await item.boundingBox();expect(frame.x+frame.width).toBeLessThanOrEqual(width);
   await expect(item.locator('[required]')).toHaveCount(0);
  }
  await page.locator('#checkout-summary .summary-edit').first().click();
  const choices=page.locator('.cake-choice').filter({has:page.locator('#tier-configurator')});
  if(!await choices.evaluate(el=>el.open))await choices.locator('summary').first().click();
  const tier=page.locator('[data-tier-row="1"]');
  if(!await tier.evaluate(el=>el.open))await tier.locator('summary').click();
  const type=tier.locator('[data-tier-type]');await expect(type).toHaveCSS('font-size','14px');
  await type.selectOption('dummy');await expect(tier.locator('[data-tier-weight]')).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
