const {test,expect}=require('@playwright/test');
const source=require('../data/catalog.json').products.find(p=>p.id==='8028660433121');
const four=require('../data/extravagant-additions.json').products.find(p=>p.tiers===4);
test('collapsible tiers validate the next choice, retain summaries and copy only to edible tiers',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.goto('/cakes/'+four.handle);await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>document.fonts.ready);
  const rows=page.locator('[data-tier-row]'),first=rows.nth(0);
  await expect(rows).toHaveCount(4);await expect(page.locator('[data-tier-row][open]')).toHaveCount(1);
  await expect(page.locator('[data-choice="tiers"] [data-choice-next],#product-quantity,[data-product-quantity]')).toHaveCount(0);
  await expect(page.locator('#add-to-cart')).toHaveText('Add to quote');
  await expect(page.locator('#add-to-cart svg')).toHaveCount(0);
  await expect(page.locator('[data-choice-done]')).toHaveText('Save preferences');
  await expect(first.locator('[data-tier-sponge] option')).toHaveText(['Please select',...new Set(source.variants.map(v=>v.options[0]))]);
  await expect(first.locator('[data-tier-filling] option')).toHaveText(['Please select',...new Set(source.variants.map(v=>v.options[1]))]);
  await expect(first.locator('summary')).toHaveCSS('font-style','normal');
  expect(await first.locator('summary').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Manrope');
  await first.locator('[data-tier-next]').click();await expect(first).toHaveAttribute('open','');
  await first.locator('[data-tier-sponge]').selectOption('Chocolate');await first.locator('[data-tier-filling]').selectOption('Coffee cream');
  await first.locator('[data-tier-next]').click();await expect(rows.nth(1)).toHaveAttribute('open','');await expect(first).not.toHaveAttribute('open','');
  await expect(first.locator('[data-tier-summary]')).toHaveText('Chocolate · Coffee cream');
  await rows.nth(1).locator('[data-tier-type]').selectOption('dummy');await page.locator('[data-copy-flavours]').click();
  await expect(rows.nth(1).locator('[data-tier-type]')).toHaveValue('dummy');
  await expect(rows.nth(2).locator('[data-tier-filling]')).toHaveValue('Coffee cream');
  await rows.nth(3).locator('summary').click();
  await expect(rows.nth(3).locator('[data-tier-next]')).toHaveText('Save tier choices');
  await rows.nth(3).locator('[data-tier-next]').click();
  await expect(page.locator('[data-choice="details"]')).toHaveAttribute('open','');
  await page.locator('#add-to-cart').click();
  await expect(page.locator('[data-choice="preferences"]')).toHaveAttribute('open','');
  await page.locator('[name=colouring]').selectOption('natural');await page.locator('[name=allergens]').selectOption('accept');
  await page.locator('[data-choice-done]').click();await expect(page.locator('[data-choice-summary="preferences"]')).toContainText('Allergens acknowledged');
  await page.locator('[data-choice="tiers"] > summary').click();
  await page.locator('#product-form').screenshot({path:'artifacts/product-choices/form-'+width+'.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 expect(errors).toEqual([]);
});
test('collection cards stay readable at each width and images enlarge on hover',async({page})=>{
 for(const width of [1440,820,390]){
  await page.setViewportSize({width,height:1000});await page.goto('/');await page.emulateMedia({reducedMotion:'reduce'});
  const section=page.locator('.collection-showcase');await section.scrollIntoViewIfNeeded();
  await section.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.evaluate(()=>document.fonts.ready);
  await expect(section.locator('.collection-tile')).toHaveCount(6);
  await section.screenshot({path:'artifacts/product-choices/collections-'+width+'.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.setViewportSize({width:1440,height:1000});
 const image=page.locator('.collection-showcase img').first();await image.hover();
 expect(await image.evaluate(i=>new DOMMatrix(getComputedStyle(i).transform).a)).toBeGreaterThan(1);
 await page.goto('/cakes/'+source.handle);
 await expect(page.locator('h1')).toHaveText('3-Tier Pink Rose Wedding Cake with Gold Scrollwork');
 await expect(page.locator('#product-image')).toHaveAttribute('alt',/gold scrollwork/);
});
