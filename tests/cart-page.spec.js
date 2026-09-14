const {test,expect}=require('./whatsapp-fixture');

test('gift, anonymous sender, instructions and pickup flow persist from cart to saved quote',async({page})=>{
 await page.goto('/collections/all?q=Pink+Piped+Cake+with+White+Ribbon+Bows');await page.locator('.card-quote').first().click();
 await page.locator('#bag-drawer .button[href="/cart"]').click();
 await expect(page.locator('h1')).toHaveText('Your cart.');
 await expect(page.locator('#cart-delivery')).toHaveText('AED 100');
 await page.locator('[name=emirate]').selectOption('Ajman');await expect(page.locator('#cart-delivery')).toHaveText('AED 200');
 await page.locator('.cart-products [data-cart-preference=colouring]').selectOption('natural');
 await expect(page.locator('.cart-products [data-cart-preference=colouring]')).toHaveValue('natural');
 await page.locator('.cart-products [data-cart-preference=allergens]').selectOption('accept');
 await page.locator('[name=giftMessage]').fill('With love on your wedding day.');
 await page.locator('[name=senderDisplay]').selectOption('anonymous');await page.locator('#cart-details-form [name=instructions]').fill('Please pack the message separately.');
 await page.locator('[name=fulfilment]').selectOption('pickup');await page.locator('[name=date]').fill('2099-12-01');await page.locator('[name=time]').selectOption('10am-10pm');await page.locator('[name=leadTimeAccepted]').check();
 await expect(page.locator('#same-day-option')).toHaveJSProperty('disabled',true);
 await expect(page.locator('#cart-delivery')).toHaveText('AED 0');
 await page.reload();await expect(page.locator('[name=giftMessage]')).toHaveValue('With love on your wedding day.');await expect(page.locator('[name=time]')).toHaveValue('10am-10pm');
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'artifacts/xavi-cart-desktop.png',fullPage:true,animations:'disabled'});
 await page.locator('#cart-details-form button[type=submit]').click();await expect(page).toHaveURL(/checkout$/);
 await expect(page.locator('[name=date]')).toHaveValue('2099-12-01');await expect(page.locator('#checkout-gift-details')).toContainText('Anonymous sender');
 await page.locator('[name=name]').fill('Xavi Cart');await page.locator('[name=lastName]').fill('Test');await page.locator('[name=phone]').fill('+971500000000');await page.locator('[name=consent]').check();
 const pending=page.waitForResponse(r=>r.url().endsWith('/api/orders'));await page.locator('#submit-order').click();const response=await pending;expect(response.status()).toBe(201);
 const {order}=await response.json();expect(order.cartDetails).toMatchObject({giftMessage:'With love on your wedding day.',senderDisplay:'anonymous',fulfilment:'pickup',time:'10am-10pm',instructions:'Please pack the message separately.'});
 await expect(page.locator('#success-title')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('xavi-cart-details-v1'))).toBeNull();
});
test('mobile cart keeps one cake per request and supports removal',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/cart');await expect(page.locator('.cart-products .cart-empty')).toBeVisible();await expect(page.locator('.cart-details-panel')).toBeHidden();
 await page.goto('/collections/engagement-cakes');await page.locator('.card-quote').first().click();await page.locator('#bag-drawer .button[href="/cart"]').click();
 await expect(page.locator('.cart-products [data-cart-quantity]')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('cake-cart-v1'))[0].quantity)).toBe(1);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'artifacts/xavi-cart-mobile.png',fullPage:true,animations:'disabled'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.locator('.cart-products .cart-remove').click();await expect(page.locator('.cart-products .cart-empty')).toBeVisible();await expect(page.locator('.cart-details-panel')).toBeHidden();
});
