const {test,expect}=require('@playwright/test');
const batch=require('../data/image-batch-001.json');
const catalog=require('../lib/catalog').buildCatalog(require('../data/catalog.json')).catalog;
const matches=require('../data/image-matches.json');
test('all 50 batch images decode and matched product images render on desktop and mobile',async({page})=>{
 const products=batch.records.map(r=>catalog.products.find(p=>p.id===r.productId));
 await page.goto('/');
 const decoded=await page.evaluate(async urls=>Promise.all(urls.map(url=>new Promise(resolve=>{
  const image=new Image();image.onload=()=>resolve({url,width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>resolve({url,width:0,height:0});image.src=url;
 }))),[...new Set([...products.map(p=>'/'+p.image),...Object.values(matches).map(m=>'/'+m.image)])]);
 for(const image of decoded){expect(image.width,image.url).toBeGreaterThan(100);expect(image.height,image.url).toBeGreaterThan(100);}
 for(const p of [products[0],products.find(product=>product.title==='Two Tier Heart Lambeth Cake')]){
 expect(p).toBeTruthy();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.goto('/cakes/'+p.handle);
  await expect(page.locator('#product-image')).toHaveAttribute('src','/'+p.image);
  await expect(page.locator('#product-image')).toBeVisible();
  await page.locator('#product-image').evaluate(img=>img.decode());
  await page.screenshot({path:`artifacts/image-batch-001-product-${p.id}-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 }
});
