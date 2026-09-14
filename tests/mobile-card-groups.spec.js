const {test,expect}=require('@playwright/test');
const cards=page=>page.locator('.shop-results .product-card');
const ids=page=>cards(page).evaluateAll(items=>items.map(c=>c.dataset.productId));
async function expectGrouped(page){
 await expect.poll(async()=>cards(page).evaluateAll(items=>items.every((c,i)=>!i||Number(items[i-1].dataset.imageRatio)<=Number(c.dataset.imageRatio)))).toBe(true);
}
test('mobile collections group photo shapes, align rows and restore desktop order',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const route of ['/collections/all','/collections/wedding-cakes','/collections/engagement-cakes']){
  await page.setViewportSize({width:1440,height:1000});await page.goto(route);
  const desktop=await ids(page);
  await page.setViewportSize({width:390,height:844});await expectGrouped(page);
  expect((await ids(page)).sort()).toEqual([...desktop].sort());
  const frames=await page.locator('.shop-results .product-image-link').evaluateAll(images=>images.map(i=>{const r=i.getBoundingClientRect();return {width:r.width,height:r.height,y:r.y};}));
  for(let i=0;i<frames.length;i++){
   expect(Math.abs(frames[i].width-frames[0].width)).toBeLessThan(1);
   expect(Math.abs(frames[i].height-frames[0].height)).toBeLessThan(1);
   if(i%2)expect(Math.abs(frames[i].y-frames[i-1].y)).toBeLessThan(1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:1440,height:1000});await expect.poll(()=>ids(page)).toEqual(desktop);
 }
});
test('mobile grouping preserves selected sort order and survives pagination and history',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/collections/all?sort=price-asc');
 const priceOrder=await ids(page);
 await page.goto('/collections/all?sort=name');const nameOrder=await ids(page);
 await page.setViewportSize({width:390,height:844});await page.goto('/collections/all');
 await page.locator('[name=sort]').selectOption('price-asc');await expect.poll(()=>ids(page)).toEqual(priceOrder);
 await page.locator('[name=sort]').selectOption('name');await expect.poll(()=>ids(page)).toEqual(nameOrder);
 await page.locator('[name=sort]').selectOption('featured');await expect(page).toHaveURL(/\/collections\/all$/);await expectGrouped(page);
 const firstPage=await ids(page);
 await page.locator('.pagination a').filter({hasText:/^2$/}).click();await expect(page).toHaveURL(/page=2/);await expectGrouped(page);
 expect((await ids(page)).some(id=>firstPage.includes(id))).toBe(false);
 await page.goBack();await expect.poll(()=>ids(page)).toEqual(firstPage);
});
