const {test,expect}=require('@playwright/test');
test('mobile cart preferences use the full width with compact text and working selections',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});await page.goto('/collections/wedding-cakes');
  await page.locator('.product-card').first().getByRole('link',{name:'Add to quote'}).click();
  for(const surface of ['#bag-drawer','.cart-products']){
   if(surface==='.cart-products')await page.goto('/cart');
   const root=page.locator(surface),item=root.locator('.cart-item').first();
   await expect(item.locator('.cart-preferences')).toBeVisible();
   await expect(item.locator('h3')).toHaveCSS('font-size','16px');
   await expect(item.locator('.cart-edit')).toHaveCSS('font-size','12px');
   const frame=await item.boundingBox(),panel=await item.locator('.cart-preferences').boundingBox();
   expect(panel.width).toBeCloseTo(frame.width,0);
   for(const field of await item.locator('.cart-preferences select').all()){
    await expect(field).toHaveCSS('font-size','14px');const box=await field.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x+box.width).toBeLessThanOrEqual(width);
   }
   await item.locator('[data-cart-preference=colouring]').selectOption('natural');
   await expect(item.locator('[data-cart-preference=colouring]')).toHaveValue('natural');
   await item.locator('[data-cart-preference=allergens]').selectOption('accept');
   await expect(item.locator('[data-cart-preference=allergens]')).toHaveValue('accept');
  }
  await page.locator('.cart-edit').first().click();
  const choices=page.locator('.cake-choice').filter({has:page.locator('#tier-configurator')});
  if(!await choices.evaluate(el=>el.open))await choices.locator('summary').first().click();
  const tier=page.locator('[data-tier-row="1"]');
  if(!await tier.evaluate(el=>el.open))await tier.locator('summary').click();
  const type=tier.locator('[data-tier-type]');await expect(type).toHaveCSS('font-size','14px');
  await type.selectOption('dummy');await expect(tier.locator('[data-tier-weight]')).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
