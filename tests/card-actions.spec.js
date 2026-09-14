const {test,expect}=require('@playwright/test');
const catalog=require('../lib/catalog').buildCatalog(require('../lib/load-catalog').loadCatalog(),{curated:true}).catalog;

test('cards add directly to the cart, persist, and support sending the quote',async({page})=>{
 await page.goto('/collections/wedding-cakes');
 const card=page.locator('.product-card').first();
 const id=await card.getAttribute('data-product-id');
 const product=catalog.products.find(p=>p.id===id);
 const rawPrice=await card.locator('[data-quote]').getAttribute('data-quote-price'),price=rawPrice==='null'?null:Number(rawPrice);
 await card.getByRole('link',{name:'Add to quote'}).click();
 await expect(page.locator('#bag-drawer')).toBeVisible();
 await expect(page.locator('#bag-drawer .cart-item h3')).toHaveText(product.title);
 await expect(page).toHaveURL(/collections\/wedding-cakes$/);
 await expect(page.locator('#quick-quote')).toHaveCount(0);
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cake-cart-v1')));
 expect(saved).toHaveLength(1);expect(saved[0].quantity).toBe(1);
 expect(product.variants.find(v=>v.id===saved[0].variantId).priceFils).toBe(price);
 await page.keyboard.press('Escape');await page.reload();
 await page.locator('.product-card').first().getByRole('link',{name:'Add to quote'}).click();
 await expect(page.locator('#bag-drawer')).toBeVisible();
 await expect(page.locator('#bag-drawer .quantity-control')).toHaveCount(0);
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cake-cart-v1')));
 expect(saved).toHaveLength(1);expect(saved[0].quantity).toBe(1);
 await page.locator('#bag-drawer [data-cart-preference=colouring]').selectOption('natural');
 await expect(page.locator('#bag-drawer [data-cart-preference=colouring]')).toHaveValue('natural');
 await page.locator('#bag-drawer [data-cart-preference=allergens]').selectOption('accept');
 await expect(page.locator('#bag-drawer .button[href="/cart"]')).toBeVisible();
 await page.locator('#bag-drawer .button[href="/cart"]').click();
 await expect(page.locator('.cart-products')).toContainText(product.title);
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cake-cart-v1')));
 expect(saved[0].personalisation).toEqual({colouring:'natural',allergens:'accept'});
});

test('image, title, card body and View cake navigate to the product; wishlist stays separate',async({page})=>{
 for(const target of ['.product-image-link','.product-caption h3 a','.card-price','.card-details']){
  await page.goto('/collections/wedding-cakes');
  const card=page.locator('.product-card').first(),url=await card.getAttribute('data-product-url');
  await card.locator(target).click();await expect(page).toHaveURL(new URL(url,'http://127.0.0.1:43189').href);await expect(page.locator('#product-form')).toBeVisible();
 }
 await page.goto('/collections/wedding-cakes');
 await page.locator('.product-card .save-button').first().click();
 await expect(page).toHaveURL(/collections\/wedding-cakes$/);
 await expect(page.locator('.product-card .save-button').first()).toHaveAttribute('aria-pressed','true');
});

test('mobile cards and inline search fit and add directly to the cart',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/collections/wedding-cakes');
 await expect(page.locator('.header-actions #site-search')).toBeVisible();
 await page.getByRole('button',{name:'Open menu',exact:true}).click();
 await expect(page.locator('#mobile-navigation').getByRole('link',{name:'Your wishlist',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Close menu',exact:true}).click();
 await expect(page.locator('.wedding-subcategories')).toHaveCount(0);
 await page.locator('#toggle-filters').click();await page.locator('#filters [name=tier][value="3"]').check();
 await expect(page).toHaveURL(/tier=3/);await page.getByRole('button',{name:'View cakes',exact:true}).click();
 await page.locator('.product-card').first().getByRole('link',{name:'Add to quote'}).click();
 await expect(page.locator('#bag-drawer .cart-item')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:'artifacts/direct-quote-mobile.png',animations:'disabled'});
});
