const {test,expect}=require('@playwright/test');
const catalog=require('../data/catalog.json');
const rates=require('../lib/exchange').aedPerUnit;
const product=catalog.products.find(p=>p.id==='8028660203745');
const format=(fils,currency)=>currency+' '+new Intl.NumberFormat('en',{minimumFractionDigits:2,maximumFractionDigits:2}).format(fils/100/rates[currency]);
async function configure(page){
 if(!await page.locator('[data-choice="preferences"]').evaluate(e=>e.open))await page.locator('[data-choice="preferences"] > summary').click();
 await page.locator('[name=colouring]').selectOption('natural');await page.locator('[name=allergens]').selectOption('accept');
 if(await page.locator('[data-tier-row]').count()&&!await page.locator('[data-choice="tiers"]').evaluate(e=>e.open))await page.locator('[data-choice="tiers"] > summary').click();
 for(const row of await page.locator('[data-tier-row]').all()){if(!await row.evaluate(e=>e.open))await row.locator('summary').click();
  await row.locator('[data-tier-sponge]').selectOption('Chocolate');await row.locator('[data-tier-filling]').selectOption('Berries cream');
 }
 await page.locator('[data-tier-row="2"] > summary').click();
 await page.locator('[data-tier-row="2"] [data-tier-type]').selectOption('dummy');
}
test('CAD, USD and EUR persist across navigation and convert dynamically updated prices',async({page})=>{
 await page.goto('/cakes/'+product.handle);
 const selector=page.getByLabel('Display currency');await expect(selector.locator('option')).toHaveText(['AED','CAD','USD','EUR']);
 for(const currency of ['CAD','USD','EUR']){await selector.selectOption(currency);await expect(page.locator('#product-price')).toHaveText(format(product.minPriceFils,currency));}
 await page.reload();await expect(selector).toHaveValue('EUR');await expect(page.locator('#product-price')).toHaveText(format(product.minPriceFils,'EUR'));
 const variant=product.variants[1];
 await page.goto('/cakes/'+product.handle+'?variant='+variant.id);
 await expect(page.locator('#product-price')).toHaveText(format(variant.priceFils,'EUR'));
 await expect(page.locator('[data-tier-row]')).toHaveCount(4);
 await selector.selectOption('AED');await expect(page.locator('#product-price')).toContainText('AED');
});
test('edible and dummy tiers survive cart edits and the final AED WhatsApp request',async({page})=>{
 await page.goto('/cakes/'+product.handle);await configure(page);
 await expect(page.locator('[data-tier-row="2"] [data-tier-sponge]')).toBeDisabled();
 await page.locator('#add-to-cart').click();await expect(page.locator('#bag-drawer')).toContainText('Tier 2: Display (dummy) tier');
 await page.locator('#bag-drawer .cart-edit').click();
 await expect(page.locator('[data-tier-row="2"] [data-tier-type]')).toHaveValue('dummy');
 await page.locator('[data-tier-row="3"] > summary').click();
 await page.locator('[data-tier-row="3"] [data-tier-sponge]').selectOption('Red velvet');
 await page.locator('#add-to-cart').click();await expect(page.locator('#bag-drawer .cart-item')).toHaveCount(1);
 await expect(page.locator('#bag-drawer')).toContainText('Red velvet sponge');
 await page.goto('/checkout');await page.getByLabel('Display currency').selectOption('CAD');
 for(const [name,value] of Object.entries({name:'Tier',lastName:'Test',phone:'+971500000000',city:'Dubai',area:'Jumeirah',address:'Building 1',date:'2099-12-01'}))await page.locator('[name='+name+']').fill(value);
 await page.locator('[name=consent]').check();
 const pending=page.waitForResponse(r=>r.url().endsWith('/api/orders'));await page.locator('#submit-order').click();const response=await pending;expect(response.status()).toBe(201);
 const order=(await response.json()).order;expect(order.currency).toBe('AED');expect(order.items[0].personalisation.tiers[1]).toEqual({tier:2,type:'dummy',sponge:'',filling:''});expect(order.items[0].personalisation.tiers[2].sponge).toBe('Red velvet');
 const text=new URL(await page.locator('#send-whatsapp-order').getAttribute('href')).searchParams.get('text');expect(text).toContain('Tier 2: Display (dummy) tier');expect(text).toContain('Red velvet sponge');expect(text).toContain('Total: AED');expect(text).not.toContain('Total: CAD');
});
test('a filtered card opens the exact original priced variation',async({page})=>{
 await page.goto('/collections/wedding-cakes?min=2000');const card=page.locator('.shop-results .product-card').first();const variant=await card.locator('[data-quote]').getAttribute('data-quote-variant');const expected=Number(await card.locator('[data-quote]').getAttribute('data-quote-price'));await card.locator('.card-details').click();await expect(page).toHaveURL(new RegExp('variant='+variant));
 const shown=await page.locator('#product-price').textContent();expect(Number(shown.replace(/[^\d.]/g,''))).toBe(expected/100);
 
});
