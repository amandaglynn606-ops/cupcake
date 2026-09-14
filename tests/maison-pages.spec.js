const {test,expect}=require('@playwright/test');
test('homepage and enquiry pages share the palette and work at desktop, tablet and mobile sizes',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1440,820,390,320]){
  await page.setViewportSize({width,height:1000});
  for(const route of ['/','/contact','/bespoke']){
   expect((await page.goto(route)).status()).toBe(200);await page.evaluate(()=>document.fonts.ready);
   await page.locator('main img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();})));
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' '+width).toBe(true);
   expect(await page.evaluate(()=>getComputedStyle(document.body).getPropertyValue('--wine').trim())).toBe('#502633');
   if(route==='/'){
    await expect(page.locator('.collection-showcase .collection-tile')).toHaveCount(6);
    await expect(page.locator('[data-motion="playing"]')).toHaveCount(0);
    const luxuryIds=require('../data/luxury-selection.json').approvedProductIds;
    for(const id of await page.locator('.signature-section [data-product-id]').evaluateAll(els=>els.map(e=>e.dataset.productId)))expect(luxuryIds).toContain(id);
   }else{
    await expect(page.locator('.enquiry-fieldset')).toHaveCount(route==='/contact'?2:3);
    for(const label of await page.locator('.enquiry-fieldset legend').all())await expect(label).toHaveCSS('font-style','normal');
   }
   if(width!==320)await page.screenshot({path:'artifacts/maison-pages/'+(route==='/'?'home':route.slice(1))+'-'+width+'.png',fullPage:true,animations:'disabled'});
  }
 }
 expect(errors).toEqual([]);
});
test('automatic galleries move only while visible and pause for hover, user choice and reduced motion',async({page})=>{
 test.setTimeout(40000);await page.setViewportSize({width:1440,height:1100});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
 const carousel=page.locator('[data-carousel]').first(),track=carousel.locator('[data-carousel-track]');
 await carousel.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
 await expect(carousel).toHaveAttribute('data-motion','playing');
 await expect.poll(()=>track.evaluate(e=>e.scrollLeft),{timeout:8500}).toBeGreaterThan(20);
 await carousel.hover();await expect(carousel).toHaveAttribute('data-motion','paused');
 await expect(page.locator('[data-carousel-auto]')).toHaveCount(0);
 await page.mouse.move(0,0);await expect(carousel).toHaveAttribute('data-motion','playing');
 await carousel.locator('[data-carousel-next]').click();await page.mouse.move(0,0);
 await expect(carousel).toHaveAttribute('data-motion','paused');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(carousel).toHaveAttribute('data-motion','paused');
});
