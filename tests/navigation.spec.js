const {test,expect}=require('@playwright/test');
test('collections menu supports keyboard dismissal, links and mobile resizing',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:1000});await page.goto('/');
 await expect(page.locator('.desktop-nav').getByRole('link',{name:'Custom cakes',exact:true})).toHaveAttribute('href','/bespoke');
 await expect(page.locator('.site-footer').getByRole('link',{name:'Hyperhive',exact:true})).toBeVisible();
 const summary=page.locator('.desktop-nav summary'),menu=page.locator('.mega-menu');
 await summary.focus();await page.keyboard.press('Enter');await expect(menu).toBeVisible();
 await expect(menu.locator('.mega-collections>a')).toHaveCount(6);
 await page.keyboard.press('Escape');await expect(menu).toBeHidden();await expect(summary).toBeFocused();
 await summary.click();await page.locator('.announcement>span').click();await expect(menu).toBeHidden();
 await page.setViewportSize({width:390,height:900});const open=page.getByRole('button',{name:'Open menu',exact:true});
 await expect(page.locator('.site-footer').getByRole('link',{name:'Hyperhive',exact:true})).toBeVisible();
 await open.click();await expect(open).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('#mobile-navigation').getByRole('link',{name:'Design your own cake',exact:true})).toHaveAttribute('href','/bespoke');
 await expect(page.locator('#mobile-navigation .nav-dropdown')).toHaveCount(0);
 await page.locator('#mobile-navigation .mobile-cake-menu>summary').click();
 await page.locator('#mobile-navigation').getByRole('link',{name:'Tiered cakes',exact:true}).click();await expect(page).toHaveURL(/collections\/tiered-cakes$/);
 await open.click();await page.keyboard.press('Escape');await expect(open).toBeFocused();await expect(open).toHaveAttribute('aria-expanded','false');
 await open.click();await page.setViewportSize({width:1440,height:1000});await expect(page.locator('#mobile-navigation')).toBeHidden();
});
test('search and currency work together and cake titles use the upright serif',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.goto('/');
 await page.getByLabel('Display currency',{exact:true}).selectOption('CAD');
 await page.getByRole('searchbox',{name:'Search cakes',exact:true}).fill('floral');
 await page.getByRole('button',{name:'Search cakes',exact:true}).click();await expect(page).toHaveURL(/\/search\?q=floral/);
 await expect(page.getByLabel('Display currency',{exact:true})).toHaveValue('CAD');
 const title=page.locator('.product-caption h3').first();await expect(title).toHaveCSS('font-style','normal');await expect(title).toHaveCSS('font-family',/Bodoni Moda/);
});

test('desktop navigation remains legible on hover and collections display the redesigned dropdown',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/');
 for(const link of await page.locator('.desktop-nav>a').all()){
  await link.hover();await expect(link).toHaveCSS('color','rgb(251, 247, 239)');
 }
 await page.locator('.desktop-nav summary').click();const menu=page.locator('.mega-menu');
 expect((await menu.boundingBox()).width).toBeLessThanOrEqual(900);
 for(const link of await menu.locator('.mega-collections>a').all()){
  await link.hover();await expect(link).toHaveCSS('color','rgb(80, 38, 51)');
  await expect(link.locator('strong')).toHaveCSS('color','rgb(80, 38, 51)');
 }
 await expect(menu.locator('.menu-feature')).toBeVisible();
 await menu.locator('img').evaluate(i=>i.decode());
 await page.screenshot({path:'artifacts/alignment-audit/redesigned-dropdown-hover.png'});
});
