const {test,expect}=require('@playwright/test');
const catalog=require('../lib/catalog').buildCatalog(require('../lib/load-catalog').loadCatalog(),{curated:true});
const cake=catalog.catalog.products.find(p=>p.id==='8028660433121');
const single=catalog.catalog.products.find(p=>require('../lib/tier-options').tierCount(p,p.variants[0])===1);
const recipient='https://wa.me/971545974005';

test('burgundy WhatsApp button remains fixed across pages and uses cake-specific messages',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:950});
  for(const route of ['/','/contact','/bespoke','/atelier','/cakes/'+cake.handle,'/cakes/'+single.handle,'/checkout']){
   await page.goto(route);
   const button=page.getByRole('link',{name:'Chat with Maison Zavi on WhatsApp'});
   await expect(button).toBeVisible();await expect(button).toHaveCSS('position','fixed');
   await expect(button).toHaveCSS('background-color','rgb(80, 38, 51)');
   const url=new URL(await button.getAttribute('href'));expect(url.origin+url.pathname).toBe(recipient);
   if(route==='/cakes/'+cake.handle)expect(url.searchParams.get('text')).toContain(cake.title);
   const start=await button.boundingBox();await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
   const end=await button.boundingBox();expect(end.y).toBeCloseTo(start.y,0);expect(end.x+end.width).toBeLessThan(width);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await page.goto('/contact');
  await expect(page.locator('.enquiry-help-links').getByRole('link',{name:/WhatsApp/})).toHaveAttribute('href',new RegExp('^'+recipient));
  await page.goto('/');await expect(page.locator('.maison-note')).toContainText('Born in the heart of Dubai');
  await expect(page.locator('main')).not.toContainText('fulfilment partner');
  await expect(page.locator('.site-footer')).toContainText('fulfilment partner');
  await page.locator('.maison-note').screenshot({path:'artifacts/copy-audit/about-whatsapp-'+width+'.png'});
 }
});

test('tier weights and guest counts survive cart editing, order saving and WhatsApp summaries',async({page})=>{
 await page.setViewportSize({width:390,height:950});await page.goto('/cakes/'+cake.handle);
 await page.locator('[name=guests]').fill('80');
 await page.evaluate(()=>document.fonts.ready);
 const rows=page.locator('[data-tier-row]'),first=rows.nth(0);
 const {type,weight}=await first.evaluate(row=>({type:row.querySelector('[data-tier-type]').getBoundingClientRect().toJSON(),weight:row.querySelector('[data-tier-weight]').getBoundingClientRect().toJSON()}));
 expect(type.y).toBeCloseTo(weight.y,0);expect(type.width).toBeCloseTo(weight.width,0);expect(weight.x).toBeGreaterThan(type.x+type.width);
 await first.locator('[data-tier-weight]').fill('5');
 await first.locator('[data-tier-sponge]').selectOption('Chocolate');await first.locator('[data-tier-filling]').selectOption('Coffee cream');
 await page.locator('[data-copy-flavours]').click();
 await rows.nth(1).locator('summary').click();await rows.nth(1).locator('[data-tier-type]').selectOption('dummy');
 await expect(rows.nth(1).locator('[data-tier-weight]')).toBeDisabled();
 await rows.nth(2).locator('summary').click();await rows.nth(2).locator('[data-tier-weight]').fill('3.5');
 await page.locator('[data-choice="preferences"]>summary').click();
 await page.locator('[name=colouring]').selectOption('natural');await page.locator('[name=allergens]').selectOption('accept');
 await page.locator('#add-to-cart').click();
 await expect(page.locator('#bag-drawer')).toContainText('Number of guests: 80');
 await expect(page.locator('#bag-drawer')).toContainText('5 lb');
 await page.goto('/cakes/'+cake.handle+'?edit=0');
 await expect(page.locator('[name=guests]')).toHaveValue('80');
 await expect(rows.nth(0).locator('[data-tier-weight]')).toHaveValue('5');
 await expect(rows.nth(2).locator('[data-tier-weight]')).toHaveValue('3.5');
 await page.locator('#product-form').screenshot({path:'artifacts/product-choices/weights-mobile.png'});
 await page.goto('/checkout');
 for(const [name,value]of Object.entries({name:'Size Test',lastName:'Customer',city:'Dubai',area:'Jumeirah',phone:'+971500000000',email:'test@example.com',date:'2099-12-01',address:'Test address, Dubai'}))await page.locator('[name='+name+']').fill(value);
 await page.locator('[name=consent]').check();
 const response=page.waitForResponse(r=>r.url().endsWith('/api/orders'));
 await page.locator('#submit-order').click();const result=await response;expect(result.status()).toBe(201);
 const {order}=await result.json();expect(order.items[0].personalisation.guests).toBe(80);
 expect(order.items[0].personalisation.tiers.map(t=>t.weightLb)).toEqual([5,undefined,3.5]);
 const url=new URL(await page.locator('#send-whatsapp-order').getAttribute('href'));
 expect(url.origin+url.pathname).toBe(recipient);
 expect(url.searchParams.get('text')).toContain('Number of guests: 80');expect(url.searchParams.get('text')).toContain('3.5 lb');
 await page.goto('/cakes/'+single.handle);await expect(page.locator('[name=guests]')).toBeVisible();
});
