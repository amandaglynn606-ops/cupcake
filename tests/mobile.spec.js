const {test,expect}=require('@playwright/test');
const active=require('../lib/catalog').buildCatalog(require('../lib/load-catalog').loadCatalog(),{curated:true});

test('homepage collection cards have equal dimensions and complete square photographs on phones',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,360,390,430]){
  await page.setViewportSize({width,height:844});await page.goto('/');
  const cards=page.locator('.collection-showcase-grid .collection-tile');
  await cards.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();})));
  await page.evaluate(()=>document.fonts.ready);
  const sizes=await cards.evaluateAll(cards=>cards.map(c=>{
   const image=c.querySelector('img'),box=c.getBoundingClientRect(),photo=image.getBoundingClientRect();
   return{width:box.width,height:box.height,photoWidth:photo.width,photoHeight:photo.height,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight};
  }));
  expect(sizes).toHaveLength(6);
  for(const size of sizes){
   expect(Math.abs(size.height-sizes[0].height)).toBeLessThan(1);
   expect(Math.abs(size.width-sizes[0].width)).toBeLessThan(1);
   expect(Math.abs(size.photoWidth-size.photoHeight)).toBeLessThan(1);
   expect(size.naturalWidth).toBe(size.naturalHeight);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('touch menu slides in and out without fading or scaling and honours reduced motion',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
 const page=await context.newPage();
 try{
  await page.goto('/');
  const opening=await page.evaluate(()=>{
   const button=document.querySelector('[data-open="mobile-navigation"]');button.focus();button.click();
   const dialog=document.querySelector('#mobile-navigation'),animation=dialog.getAnimations()[0];
   return{coarse:matchMedia('(pointer:coarse)').matches,duration:animation?.effect.getTiming().duration,frames:animation?.effect.getKeyframes()};
  });
  expect(opening.coarse).toBe(true);expect(opening.duration).toBe(220);
  expect(opening.frames[0].transform).toBe('translateX(-100%)');expect(opening.frames.at(-1).transform).toBe('none');
  expect(opening.frames.every(f=>f.opacity===undefined)).toBe(true);
  await page.locator('#mobile-navigation').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  await page.locator('.mobile-cake-menu>summary').click();
  await page.locator('.mobile-cake-menu').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  await page.locator('.mobile-cake-menu').evaluate(async el=>{
   el.querySelector('summary').click();el.querySelector('summary').click();
   await Promise.all(el.getAnimations().map(a=>a.finished));
  });
  await expect(page.locator('.mobile-cake-menu')).toHaveAttribute('open','');
  const closing=await page.evaluate(()=>{
   const dialog=document.querySelector('#mobile-navigation');dialog.querySelector('[data-close]').click();
   const animation=dialog.getAnimations()[0];return{open:dialog.open,duration:animation?.effect.getTiming().duration};
  });
  expect(closing).toEqual({open:true,duration:180});
  await expect(page.locator('#mobile-navigation')).toBeHidden();
  await expect(page.getByRole('button',{name:'Open menu',exact:true})).toBeFocused();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'Open menu',exact:true}).click();
  expect(await page.locator('#mobile-navigation').evaluate(el=>el.getAnimations().length)).toBe(0);
  await page.keyboard.press('Escape');await expect(page.locator('#mobile-navigation')).toBeHidden();
 }finally{await context.close();}
});

test('phone menu expands All cakes, fits small screens and restores focus and scrolling',async({page})=>{
 for(const viewport of [{width:320,height:568},{width:360,height:740},{width:390,height:844},{width:430,height:932}]){
  await page.setViewportSize(viewport);await page.goto('/');
  const open=page.getByRole('button',{name:'Open menu',exact:true});await open.click();
  const menu=page.locator('#mobile-navigation'),group=menu.locator('.mobile-cake-menu');
  await expect(menu.locator('img')).toHaveCount(0);
  await expect(menu).toContainText('Find a cake for your occasion');
  await expect(group).not.toHaveAttribute('open','');
  await expect(group.getByRole('link',{name:'Wedding cakes',exact:true})).toBeHidden();
  await group.locator('summary').click();
  await expect(group.locator('a')).toHaveCount(7);
  for(const item of await menu.locator('a,summary,button').all()){
   const rect=await item.boundingBox();expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(viewport.width+1);expect(rect.height).toBeGreaterThanOrEqual(43);
  }
  await expect(page.locator('html')).toHaveClass(/mobile-menu-open/);
  await menu.evaluate(el=>el.scrollTop=el.scrollHeight);
  await expect(menu.getByRole('button',{name:'Close menu',exact:true})).toBeInViewport();
  await menu.getByRole('button',{name:'Close menu',exact:true}).click();
  await expect(menu).toBeHidden();await expect(open).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/mobile-menu-open/);
  await open.click();await page.keyboard.press('Escape');await expect(open).toBeFocused();
 }
});

test('every catalogue photo uses its natural proportions on phones without side bars',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});const ids=new Set();
  for(let number=1;ids.size<active.catalog.products.length;number++){
   expect(number).toBeLessThan(20);await page.goto('/collections/all?page='+number);
   const photos=page.locator('.product-image-link>img');
   await photos.evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();})));
   for(const frame of await photos.evaluateAll(imgs=>imgs.map(i=>({src:i.src,ratio:i.naturalWidth/i.naturalHeight,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,parent:i.parentElement.getBoundingClientRect().width})))){
    expect(Math.abs(frame.width/frame.height-frame.ratio),frame.src).toBeLessThan(.015);
    expect(Math.abs(frame.width-frame.parent),frame.src).toBeLessThan(1);
   }
   for(const id of await page.locator('.product-card').evaluateAll(cards=>cards.map(c=>c.dataset.productId)))ids.add(id);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  expect(ids.size).toBe(active.catalog.products.length);
 }
});

test('mobile gallery, forms and empty states remain readable and functional',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 const products=[active.catalog.products[0],active.byId.get('9900000000032'),active.byId.get('9920000000001')];
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});
  for(const product of products){
   await page.goto('/cakes/'+product.handle);const img=page.locator('#product-image');await img.evaluate(i=>i.decode());
   const frame=await img.evaluate(i=>({ratio:i.naturalWidth/i.naturalHeight,width:i.clientWidth,height:i.clientHeight,parent:i.parentElement.clientWidth}));
   expect(Math.abs(frame.width/frame.height-frame.ratio)).toBeLessThan(.015);expect(frame.width).toBe(frame.parent);
   await page.getByRole('button',{name:'Enlarge product photo'}).click();await expect(page.locator('#product-lightbox')).toBeVisible();await page.keyboard.press('Escape');
  }
  for(const route of ['/','/collections','/contact','/bespoke','/cart','/checkout','/wishlist','/atelier']){
   await page.goto(route);await page.evaluate(()=>document.fonts.ready);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' '+width).toBe(true);
   await expect(page.locator('main')).not.toContainText(/Your next occasion|Your selection awaits|Find your occasion|Browse cakess/i);
   if(['/cart','/checkout'].includes(route))await expect(page.locator('main')).toContainText('Your cart is empty.');
   if(['/contact','/bespoke'].includes(route))await expect(page.locator('input[name=name]')).toHaveCSS('font-size','16px');
  }
 }
});

test('mobile footer groups expand accessibly and all links remain available on desktop',async({page})=>{
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});await page.goto('/');
  const footer=page.locator('.site-footer');
  await expect(footer.locator('.footer-toggle')).toHaveCount(4);
  for(const button of await footer.locator('.footer-toggle').all()){
   await expect(button).toHaveAttribute('aria-expanded','false');await button.click();
   const panel=page.locator('#'+await button.getAttribute('aria-controls'));
   await expect(panel).toBeVisible();
   for(const link of await panel.locator('a').all()){
    const box=await link.boundingBox();expect(box.height).toBeGreaterThanOrEqual(43);expect(box.x+box.width).toBeLessThanOrEqual(width);
   }
   await button.click();await expect(panel).toBeHidden();
  }
  await expect(footer.getByRole('link',{name:'Hyperhive',exact:true})).toBeVisible();
 }
 await page.setViewportSize({width:1440,height:1000});
 for(const panel of await page.locator('.site-footer .footer-links').all())await expect(panel).toBeVisible();
});
