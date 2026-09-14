const {test,expect}=require('@playwright/test');

test('Add to quote opens the touch cart from the right and all dismissals slide it closed',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
 try{
  const page=await context.newPage();await page.goto('/collections/wedding-cakes');
  await page.evaluate(()=>{
   const original=Element.prototype.animate;
   Element.prototype.animate=function(frames,options){
    if(this.id==='bag-drawer')window.cartMotion={frames,options};
    return original.call(this,frames,options);
   };
  });
  const add=page.locator('.product-card').first().getByRole('link',{name:'Add to quote'});
  await add.click();const cart=page.locator('#bag-drawer');await expect(cart).toBeVisible();
  const opening=await page.evaluate(()=>window.cartMotion);
  expect(opening.frames).toEqual([{transform:'translateX(100%)'},{transform:'none'}]);
  expect(opening.options.duration).toBe(320);
  await expect(cart.locator('.cart-item')).toHaveCount(1);
  for(const close of ['button','escape','backdrop']){
   if(close!=='button'){await add.click();await expect(cart).toBeVisible();}
   await cart.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
   const bounds=await cart.boundingBox();expect(bounds.x+bounds.width).toBeCloseTo(390,0);
   if(close==='button')await cart.locator('[data-close]').click();
   else if(close==='escape')await page.keyboard.press('Escape');
   else{
    // A wider phone exposes the native backdrop beside the 480px drawer.
    await page.setViewportSize({width:600,height:844});await page.mouse.click(20,200);
   }
   const closing=await page.evaluate(()=>window.cartMotion);
   expect(closing.frames.at(-1).transform).toBe('translateX(100%)');expect(closing.options.duration).toBe(260);
   await expect(cart).toBeHidden();await expect(add).toBeFocused();
  }
  await page.emulateMedia({reducedMotion:'reduce'});await add.click();await expect(cart).toBeVisible();
  expect(await cart.evaluate(el=>el.getAnimations().length)).toBe(0);
  await page.keyboard.press('Escape');await expect(cart).toBeHidden();
 }finally{await context.close();}
});
