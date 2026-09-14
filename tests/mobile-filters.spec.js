const {test,expect}=require('@playwright/test');

test('compact phone controls open filters without shifting the cake grid',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:740});await page.goto('/collections/all');
  const toggle=page.locator('#toggle-filters'),sort=page.getByLabel('Sort cakes');
  await toggle.scrollIntoViewIfNeeded();
  const filterBox=await toggle.boundingBox(),sortBox=await sort.boundingBox();
  expect(filterBox.width).toBeLessThan(110);expect(sortBox.width).toBeLessThanOrEqual(155);
  expect(filterBox.y).toBe(sortBox.y);expect(sortBox.x+sortBox.width).toBeLessThanOrEqual(width);
  const before=await page.locator('.product-grid').boundingBox(),scroll=await page.evaluate(()=>scrollY);
  await toggle.click();const panel=page.getByRole('dialog',{name:'Filters',exact:true});
  await expect(panel).toBeVisible();expect((await panel.boundingBox()).x).toBe(0);
  await expect(panel.locator('.collection-search')).toBeHidden();
  expect((await page.locator('.product-grid').boundingBox()).y).toBeCloseTo(before.y,0);
  await expect(page.locator('html')).toHaveClass(/mobile-filters-open/);
  await panel.getByRole('button',{name:'View cakes'}).click();
  await expect(panel).toBeHidden();await expect(toggle).toBeFocused();
  expect(await page.evaluate(()=>scrollY)).toBeCloseTo(scroll,0);
  await toggle.click();await page.mouse.click(width-10,200);await expect(panel).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('phone filters preserve selections and panel state through updates and desktop resizing',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/collections/all');
 await page.locator('#toggle-filters').click();
 const category=page.locator('#filters input[name=category]').first(),value=await category.inputValue();
 await category.check();await expect(page).toHaveURL(new RegExp('category='+value));
 await expect(page.locator('#mobile-filters')).toBeVisible();await expect(category).toBeChecked();
 await expect(category).toBeFocused();
 await page.locator('#mobile-filters').getByRole('link',{name:'Clear all'}).click();
 await expect(page).toHaveURL(/\/collections\/all$/);await expect(category).not.toBeChecked();
 await page.keyboard.press('Escape');await expect(page.locator('#mobile-filters')).toBeHidden();
 await expect(page.locator('#toggle-filters')).toBeFocused();
 await page.getByLabel('Sort cakes').selectOption('price-asc');
 await expect(page).toHaveURL(/sort=price-asc/);await expect(page.getByLabel('Sort cakes')).toHaveValue('price-asc');
 await page.locator('#toggle-filters').click();await page.setViewportSize({width:1440,height:1000});
 await expect(page.locator('#mobile-filters')).toHaveCount(0);await expect(page.locator('#filters')).toBeVisible();
 await expect(page.locator('#filters .collection-search')).toBeVisible();
 await expect(page.locator('html')).not.toHaveClass(/mobile-filters-open/);
 await page.setViewportSize({width:390,height:844});await page.locator('#toggle-filters').click();
 await expect(page.locator('#mobile-filters')).toBeVisible();
 await page.locator('#mobile-filters').getByRole('button',{name:'Close filters'}).click();
 await expect(page.locator('#mobile-filters')).toBeHidden();
});

test('touch filters slide from the left and respect reduced motion',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  const page=await context.newPage();await page.goto('/collections/all');
  const frames=await page.evaluate(()=>{
   document.querySelector('#toggle-filters').click();
   return document.querySelector('#mobile-filters').getAnimations()[0].effect.getKeyframes();
  });
  expect(frames[0].transform).toBe('translateX(-100%)');expect(frames.at(-1).transform).toBe('none');
  await page.keyboard.press('Escape');await expect(page.locator('#mobile-filters')).toBeHidden();
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#toggle-filters').click();
  expect(await page.locator('#mobile-filters').evaluate(el=>el.getAnimations().length)).toBe(0);
  await page.keyboard.press('Escape');await expect(page.locator('#mobile-filters')).toBeHidden();
 }finally{await context.close();}
});

test('closing filters during a slow update keeps the panel closed',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/collections/all');
 let release;const pending=new Promise(resolve=>release=resolve);
 await page.route('**/collections/all?**',async route=>{await pending;await route.continue();});
 await page.locator('#toggle-filters').click();await page.locator('#filters input[name=category]').first().check();
 await page.getByRole('button',{name:'Close filters'}).click();await expect(page.locator('#mobile-filters')).toBeHidden();
 release();await expect(page).toHaveURL(/category=/);
 await expect(page.locator('#mobile-filters')).toBeHidden();await expect(page.locator('html')).not.toHaveClass(/mobile-filters-open/);
});
