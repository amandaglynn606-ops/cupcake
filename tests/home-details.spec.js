const {test,expect}=require('@playwright/test');
test('homepage details are grouped without section numbers, and collection controls share a baseline',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:950});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
  expect(await page.locator('main img').evaluateAll(images=>images.every(image=>! /\bblack\b/i.test(image.alt)))).toBe(true);
  await expect(page.locator('main .product-card h3')).not.toContainText([/\bblack\b/i]);
  const actions=await page.locator('.hero-actions>a').evaluateAll(links=>links.map(link=>link.getBoundingClientRect().toJSON()));
  expect(actions[0].y).toBeCloseTo(actions[1].y,0);expect(actions[1].x).toBeGreaterThan(actions[0].x+actions[0].width);
  await expect(page.locator('.card-details').first()).toHaveText('View Cake');
  await expect(page.locator('.card-quote svg')).toHaveCount(0);
  await expect(page.locator('.maison-home .eyebrow,.maison-home .section-number')).not.toContainText([/0[1-5] \//]);
  await expect(page.locator('.process-grid article>span')).toHaveCount(0);
  await expect(page.locator('.editorial-detail').getByRole('link',{name:'Tell us about your wedding'})).toBeVisible();
  await page.locator('.wedding-copy').screenshot({path:'artifacts/copy-audit/wedding-details-'+width+'.png'});
  await page.goto('/collections/wedding-cakes');await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.breadcrumbs')).toHaveCount(0);
  const controls=await page.locator('.shop-toolbar').evaluate(e=>['.mobile-filter-button','.sort-label select'].map(s=>{const el=e.querySelector(s),r=el.getBoundingClientRect();return{visible:!!r.height,y:r.y,h:r.height};}));
  if(controls[0].visible){expect(controls[0].y).toBeCloseTo(controls[1].y,0);expect(controls[0].h).toBe(controls[1].h);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
});
