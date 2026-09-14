const {test,expect}=require('@playwright/test');
const path=require('node:path');
const catalog=require('../data/catalog.json');
const product=catalog.products[0];

test('embedded search accepts typing, Enter and button submission on desktop and mobile',async({page})=>{
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto('/');
  const search=page.locator('.header-actions #site-search');await expect(search).toBeVisible();
  await expect(page.locator('.site-header > .header-search')).toHaveCount(0);
  if(width>1100){
   const positions=await page.locator('.header-actions').evaluate(el=>{const s=el.querySelector('form').getBoundingClientRect(),w=el.querySelector('.wishlist-link').getBoundingClientRect();return{searchRight:s.right,wishlistLeft:w.left,delta:Math.abs(s.y-w.y)};});expect(positions.searchRight).toBeLessThanOrEqual(positions.wishlistLeft);expect(positions.delta).toBeLessThan(10);
  }else{
   await expect(page.locator('.header-actions .wishlist-link')).toBeHidden();
   const box=await search.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
  }
  await search.fill('wedding roses');await search.press('Enter');
  await expect(page).toHaveURL(/\/search\?q=wedding\+roses/);
  await expect(page.locator('.shop-results .product-card').first()).toBeVisible();
  await expect(search).toHaveValue('wedding roses');
  await search.fill('no-such-cake-xyz');await page.locator('.header-search button').click();
  await expect(page.locator('.empty-state')).toBeVisible();
  await search.fill('');await search.press('Enter');await expect(page.locator('.shop-results .product-card')).toHaveCount(12);
 }
});
test('wedding filters live only in the sidebar and persist through reload and history',async({page})=>{
 await page.goto('/');await expect(page.locator('#wedding-heading')).toContainText('Wedding cakes');
 await expect(page.locator('.wedding-browse, .wedding-subcategories')).toHaveCount(0);
 await page.locator('.wedding-copy a[href="/collections/wedding-cakes"]').click();
 await page.locator('#filters [name=style][value=floral]').check();
 await expect(page).toHaveURL(/style=floral/);
 await page.locator('#filters [name=tier][value="3"]').check();
 await expect(page).toHaveURL(/style=floral/);await expect(page).toHaveURL(/tier=3/);
 await expect(page.locator('.filter-chip')).toHaveCount(2);
 await expect(page.locator('[name=tier][value="3"]')).toBeChecked();
 await page.reload();await expect(page.locator('[name=style][value=floral]')).toBeChecked();
 await page.getByRole('link',{name:'Remove Three tiers filter'}).click();
 await expect(page.locator('.filter-chip')).toHaveCount(1);
 await page.goBack();await expect(page.locator('.filter-chip')).toHaveCount(2);
 await page.screenshot({path:'artifacts/wedding-collection-desktop.png',fullPage:true,animations:'disabled'});
});
test('complete photos fit product cards and enlarged viewer has no empty side panels',async({page})=>{
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto('/collections/wedding-cakes');
  expect(await page.locator('.product-image-link img').first().evaluate(el=>getComputedStyle(el).objectFit)).toBe('contain');
  await page.goto('/cakes/'+product.handle);await page.getByRole('button',{name:'Enlarge product photo'}).click();
  const dialog=page.locator('#product-lightbox');await expect(dialog).toBeVisible();
  await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));
  const dims=await dialog.evaluate(el=>{const img=el.querySelector('img'),r=img.getBoundingClientRect(),d=el.getBoundingClientRect();return{width:r.width,height:r.height,dialogWidth:d.width,dialogHeight:d.height,ratio:img.naturalWidth/img.naturalHeight};});
  expect(Math.abs(dims.width-dims.dialogWidth)).toBeLessThan(2);expect(Math.abs(dims.height-dims.dialogHeight)).toBeLessThan(2);
  expect(Math.abs(dims.width/dims.height-dims.ratio)).toBeLessThan(.01);
  await page.screenshot({path:'artifacts/product-lightbox-'+width+'.png',animations:'disabled'});
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
 }
});
test('custom form uploads, previews, removes and saves references; whole date input opens picker',async({page})=>{
 await page.goto('/bespoke?occasion=Wedding');
 await expect(page.locator('[name=occasion]')).toHaveValue('Wedding');
 await page.evaluate(()=>{window.pickerCalls=0;HTMLInputElement.prototype.showPicker=function(){window.pickerCalls++;};});
 await page.locator('[name=date]').click({position:{x:20,y:20}});
 expect(await page.evaluate(()=>window.pickerCalls)).toBe(1);
 const image=path.join(__dirname,'..',product.image),upload=page.locator('#reference-images');
 await upload.setInputFiles(image);await expect(page.locator('.reference-preview')).toHaveCount(1);
 await page.locator('[data-remove-reference]').click();await expect(page.locator('.reference-preview')).toHaveCount(0);
 await upload.setInputFiles(image);await expect(page.locator('.reference-preview')).toHaveCount(1);
 await page.locator('[name=name]').fill('Reference test');await page.locator('[name=email]').fill('reference@example.com');await page.locator('[name=phone]').fill('+971500000000');await page.locator('[name=date]').fill('2099-01-01');await page.locator('[name=guests]').fill('75');await page.locator('[name=budget]').selectOption('AED 4,000+');await page.locator('[name=brief]').fill('White roses, as shown in my reference photo.');await page.locator('[name=consent]').check();
 await page.screenshot({path:'artifacts/custom-cake-desktop.png',fullPage:true,animations:'disabled'});
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/enquiries'));
 await page.locator('#enquiry-form button[type=submit]').click();const response=await responsePromise;
 expect(response.status()).toBe(201);expect((await response.json()).enquiry.referenceImages).toHaveLength(1);
 await expect(page.locator('#enquiry-success')).toContainText('1 reference image saved');
});
test('marketing headings stay within two lines and pages fit narrow screens with reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const url of ['/','/bespoke','/atelier']){
   await page.goto(url);await page.evaluate(()=>document.fonts.ready);
   const headings=await page.locator('main h1, main h2').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().height&& !el.closest('.product-card')).map(el=>({text:el.textContent,lines:el.getBoundingClientRect().height/parseFloat(getComputedStyle(el).lineHeight)})));
   expect(headings.filter(h=>h.lines>2.1),url+' at '+width).toEqual([]);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),url+' at '+width).toBeTruthy();
   expect(await page.evaluate(()=>document.getAnimations().length)).toBe(0);
   if(width===390&&url==='/bespoke')await page.screenshot({path:'artifacts/custom-cake-mobile.png',fullPage:true});
  }
 }
});
