const {test,expect}=require('@playwright/test');
const catalog=require('../lib/catalog').buildCatalog(require('../lib/load-catalog').loadCatalog(),{curated:true}).catalog;
const products=catalog.products.filter(p=>p.available&&require('../lib/tier-options').tierCount(p,p.variants[0])===1).slice(0,3);
const items=products.map(p=>({productId:p.id,variantId:p.variants.find(v=>v.available).id,quantity:1,message:'Keep '+p.id,personalisation:{colouring:'natural',allergens:'accept',instructions:'Details for '+p.id}}));
test.beforeEach(async({page})=>{page.cartErrors=[];page.on('pageerror',error=>page.cartErrors.push(error.message));});
test.afterEach(async({page})=>{expect(page.cartErrors).toEqual([]);});

async function seed(page,count=3){
 await page.goto('/');await page.evaluate(items=>localStorage.setItem('cake-cart-v1',JSON.stringify(items)),items.slice(0,count));await page.goto('/cart');
 await expect(page.locator('#checkout-summary .summary-item')).toHaveCount(count);
}

for(const width of [1440,390])test('Remove preserves the other cart lines and their details at '+width,async({page})=>{
 await page.setViewportSize({width,height:1000});await seed(page);
 await page.locator('#checkout-summary .cart-remove').nth(1).click();
 await expect(page.locator('#checkout-summary .summary-item')).toHaveCount(2);
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cake-cart-v1')));
 expect(saved.map(i=>i.productId)).toEqual([items[0].productId,items[2].productId]);
 expect(saved[1]).toMatchObject(items[2]);
 await page.reload();await expect(page.locator('#checkout-summary .summary-item')).toHaveCount(2);
 await page.getByRole('button',{name:'Open shopping bag'}).click();await expect(page.locator('#bag-drawer .cart-item')).toHaveCount(2);
 await page.locator('#bag-drawer .cart-remove').first().click();await expect(page.locator('#bag-drawer .cart-item')).toHaveCount(1);
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cake-cart-v1')));expect(saved).toHaveLength(1);expect(saved[0]).toMatchObject(items[2]);
 await page.locator('#bag-drawer .cart-remove').click();await expect(page.locator('#bag-drawer .cart-empty')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.locator('#checkout-empty')).toBeVisible();
 await page.evaluate(items=>{localStorage.setItem('cake-cart-v1',JSON.stringify(items));window.dispatchEvent(new StorageEvent('storage',{key:'cake-cart-v1'}));},items.slice(0,1));
 await expect(page.locator('#checkout-summary .summary-item')).toHaveCount(1);await expect(page.locator('#submit-order')).toBeEnabled();
});

test('a repeated remove click before refresh cannot empty a two-item cart',async({page})=>{
 await seed(page,2);
 await page.route('**/api/quote',async route=>{await new Promise(resolve=>setTimeout(resolve,300));await route.continue();});
 await page.locator('#checkout-summary .cart-remove').first().evaluate(button=>{button.click();button.click();});
 await expect(page.locator('#checkout-summary .summary-item')).toHaveCount(1);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cake-cart-v1')));
 expect(saved).toHaveLength(1);expect(saved[0]).toMatchObject(items[1]);
});

test('stale row positions and duplicate drawer controls cannot remove the wrong item',async({page})=>{
 await seed(page);
 await page.route('**/api/quote',async route=>{await new Promise(resolve=>setTimeout(resolve,300));await route.continue();});
 await page.evaluate(()=>{
  const buttons=[...document.querySelectorAll('#checkout-summary .cart-remove')];
  const duplicate=document.querySelector('#bag-drawer .cart-remove');
  buttons[0].click();duplicate.click();buttons[2].click();
 });
 await expect(page.locator('#checkout-summary .summary-item')).toHaveCount(1);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cake-cart-v1')));
 expect(saved).toHaveLength(1);expect(saved[0]).toMatchObject(items[1]);
});
