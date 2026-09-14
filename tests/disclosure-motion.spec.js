const {test,expect}=require('@playwright/test');
const product=require('../data/extravagant-additions.json').products.find(p=>p.tiers===4);

for(const width of [1440,390])test('tier expansion stays smooth and reversible at '+width,async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width,height:1000},hasTouch:width<500,isMobile:width<500,reducedMotion:'no-preference'});
 try{
  const page=await context.newPage();await page.goto('/cakes/'+product.handle);await page.evaluate(()=>document.fonts.ready);
  const rows=page.locator('[data-tier-row]'),second=rows.nth(1);
  await second.locator('summary').scrollIntoViewIfNeeded();
  // Sample the rendered height each frame, rather than only checking CSS settings.
  const heights=await second.evaluate(async row=>{
   const samples=[row.getBoundingClientRect().height];row.querySelector('summary').click();
   const start=performance.now();
   while(performance.now()-start<460){await new Promise(requestAnimationFrame);samples.push(row.getBoundingClientRect().height);}
   return samples;
  });
  const first=heights[0],last=heights.at(-1);
  expect(last-first).toBeGreaterThan(100);
  expect(heights.filter(h=>h>first+2&&h<last-2).length).toBeGreaterThan(3);
  expect(Math.max(...heights.slice(1).map((h,i)=>Math.abs(h-heights[i])))).toBeLessThan((last-first)*.6);
  await expect(page.locator('[data-tier-row][open]')).toHaveCount(1);
  await second.evaluate(async row=>{const summary=row.querySelector('summary');summary.click();await new Promise(r=>setTimeout(r,60));summary.click();});
  await expect(second).toHaveAttribute('open','');
  await expect.poll(()=>second.evaluate(el=>el.getAnimations().length)).toBe(0);
  expect(await second.evaluate(el=>Math.abs(el.scrollHeight-el.clientHeight))).toBeLessThanOrEqual(1);
  await second.locator('summary').focus();await page.keyboard.press('Enter');await expect(second).not.toHaveAttribute('open','');
  await page.emulateMedia({reducedMotion:'reduce'});await second.locator('summary').click();
  await expect(second).toHaveAttribute('open','');expect(await second.evaluate(el=>el.getAnimations().length)).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }finally{await context.close();}
});

test('FAQ and mobile footer panels remain usable through repeated toggles',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.goto('/faq');
 const faq=page.locator('.faq-layout details').first();await faq.locator('summary').click();
 await expect(faq.locator('p')).toBeVisible();await faq.locator('summary').click();await expect(faq.locator('p')).toBeHidden();
 const footer=page.locator('.footer-toggle').first();await footer.click();await expect(footer).toHaveAttribute('aria-expanded','true');
 const id=await footer.getAttribute('aria-controls'),panel=page.locator('#'+id);
 await expect(panel).toBeVisible();await footer.click();await expect(panel).toBeHidden();
 await footer.click();await page.setViewportSize({width:1440,height:900});await expect(panel).toBeVisible();
 expect(await panel.evaluate(el=>el.inert)).toBe(false);
});
