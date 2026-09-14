const {test,expect}=require('@playwright/test');
const products=[...require('../data/luxury-additions.json').products,...require('../data/extravagant-additions.json').products];
test('all 30 added designs load with correct tiers and complete framing on three viewport sizes',async({page})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,820,390]){
  await page.setViewportSize({width,height:1000});
  for(const p of products){
   expect((await page.goto('/cakes/'+p.handle)).status()).toBe(200);
   const img=page.locator('#product-image');await img.evaluate(i=>i.decode());
   await expect(img).toHaveAttribute('alt',p.imageAlt);
   await expect(img).toHaveCSS('object-fit','contain');await expect(img).toHaveCSS('object-position','50% 50%');
   expect(await img.evaluate(i=>getComputedStyle(i).getPropertyValue('--cake-backdrop').trim().length)).toBeGreaterThan(0);
   await expect(page.locator('[data-tier-row]')).toHaveCount(p.tiers>1?p.tiers:0);
   await expect(page.locator('#product-price')).toHaveText('Price on request');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   expect(await page.locator('body').innerText()).not.toMatch(/Simon's Bakery|Artisienne|Daan Go|Delizie di Jho|Perfect Gift/i);
  }
 }
 expect(errors).toEqual([]);
});
test('only extravagant reviewed designs appear in Luxury and its search results',async({page})=>{
 const selected=require('../data/luxury-selection.json').approvedProductIds;
 const seen=new Set();
 for(let n=1;n<=Math.ceil(selected.length/12);n++){
  expect((await page.goto('/collections/luxury-cakes?page='+n)).status()).toBe(200);
  for(const id of await page.locator('[data-product-id]').evaluateAll(cards=>cards.map(c=>c.dataset.productId)))seen.add(id);
 }
 expect([...seen].sort()).toEqual([...selected].sort());
 await page.goto('/collections/luxury-cakes?q=butterfly');
 await expect(page.locator('.shop-results .product-card')).toHaveCount(0);
});
