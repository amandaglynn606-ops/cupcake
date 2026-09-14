const {test,expect}=require('./whatsapp-fixture');
const catalog=require('../lib/catalog').buildCatalog(require('../lib/load-catalog').loadCatalog(),{curated:true}).catalog;
const cake=catalog.products.find(p=>(p.tiers||p.variants[0].tiers)>1);
async function seed(page){await page.goto('/');await page.evaluate(p=>localStorage.setItem('cake-cart-v1',JSON.stringify([{productId:p.id,variantId:p.variants[0].id,quantity:1}])),cake);await page.goto('/cart');await expect(page.locator('#submit-order')).toBeEnabled();}
for(const width of [390,1440])test('optional cart opens WhatsApp directly, with collapsible details at '+width,async({page})=>{
 await page.setViewportSize({width,height:900});await seed(page);
 await expect(page.locator('h1')).toHaveText('Your cart.');
 await expect(page.locator('#checkout-form [required],[name^=billing],[name=giftMessage]')).toHaveCount(0);
 await expect(page.locator('[data-grand-total]>span')).toHaveText('Total');
 await expect(page.locator('[data-grand-total] strong')).not.toContainText('AED');
 await page.getByLabel('Display currency').selectOption('CAD');await expect(page.locator('[data-grand-total] strong')).not.toContainText('CAD');
 await page.locator('[data-checkout-contact] summary').click();await expect(page.locator('[name=name]')).toBeHidden();
 await page.locator('[data-checkout-delivery] summary').click();await expect(page.locator('[name=date]')).toBeVisible();
 await page.locator('[data-checkout-delivery] summary').click();await expect(page.locator('[name=date]')).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/optional-cart-'+width+'.png',fullPage:true,animations:'disabled'});
 const response=page.waitForResponse(r=>r.url().endsWith('/api/orders'));
 await page.locator('#submit-order').click();expect((await response).status()).toBe(201);
 await expect.poll(()=>page.evaluate(()=>window.whatsappAttempts.length)).toBe(1);
 const destination=new URL(await page.evaluate(()=>window.whatsappAttempts[0].url));
 expect(destination.searchParams.get('phone')).toBe('971545974005');
 const text=destination.searchParams.get('text');expect(text).toContain(cake.title);expect(text).toContain('Name: To confirm');expect(text).toContain('Tier types and flavours to confirm');
 await expect(page).toHaveURL(/\/cart$/);await expect(page.locator('#success-title')).toBeVisible();
});
test('optional delivery information reaches WhatsApp and no billing address is collected',async({page})=>{
 await seed(page);await page.locator('[name=name]').fill('Aisha');await page.locator('[name=email]').fill('test@example.com');
 await page.locator('[data-next-delivery]').click();await page.locator('[name=fulfilment][value=pickup]').check();
 await page.locator('[name=time]').selectOption('10am-10pm');await page.locator('[name=notes]').fill('Please call on arrival.');
 await expect(page.locator('[data-delivery-fee]')).toContainText('AED 0');
 const pending=page.waitForResponse(r=>r.url().endsWith('/api/orders'));await page.locator('#submit-order').click();
 const response=await pending;expect(response.status()).toBe(201);const {order}=await response.json();expect(order.billingAddress).toBeUndefined();expect(order.customer.email).toBe('test@example.com');expect(order.customer.notes).toBe('Please call on arrival.');expect(order.preferredTime).toBe('10am-10pm');
});
test('unconfigured product tiers and direct drawer submission never require choices',async({page})=>{
 await page.goto('/cakes/'+cake.handle);await expect(page.locator('#product-form [required]')).toHaveCount(0);
 await page.locator('#add-to-cart').click();await expect(page.locator('#bag-drawer .cart-item')).toHaveCount(1);
 const response=page.waitForResponse(r=>r.url().endsWith('/api/orders'));
 await page.locator('[data-quick-whatsapp]').click();expect((await response).status()).toBe(201);
 await expect.poll(()=>page.evaluate(()=>window.whatsappAttempts.length)).toBe(1);
 const destination=new URL(await page.evaluate(()=>window.whatsappAttempts[0].url));
 expect(destination.searchParams.get('phone')).toBe('971545974005');expect(destination.searchParams.get('text')).toContain(cake.title);
});
for(const path of ['/contact','/bespoke'])test(path+' allows an enquiry with all fields blank',async({page})=>{
 await page.goto(path);await expect(page.locator('#enquiry-form [required]')).toHaveCount(0);
 const response=page.waitForResponse(r=>r.url().endsWith('/api/enquiries'));await page.locator('#enquiry-form button[type=submit]').click();expect((await response).status()).toBe(201);await expect(page.locator('#enquiry-success')).toBeVisible();
});
