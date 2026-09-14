const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const {makeServer}=require('../server');
const catalog=require('../lib/load-catalog').loadCatalog();
const config=require('../store.config.json');
(async()=>{
 const server=makeServer({catalog,config});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const dir='artifacts/mobile-'+(process.argv[2]||'audit');await fs.mkdir(dir,{recursive:true});
 const base='http://127.0.0.1:'+server.address().port;
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:dir+'/home.png'});
 await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.waitForTimeout(400);await page.screenshot({path:dir+'/menu.png'});
 if(await page.locator('.mobile-cake-menu').count()){await page.locator('.mobile-cake-menu>summary').click();await page.screenshot({path:dir+'/menu-expanded.png'});}
 console.log('MENU',await page.locator('#mobile-navigation').evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,height:el.clientHeight,scrollHeight:el.scrollHeight,links:[...el.querySelectorAll('a')].slice(0,4).map(a=>({text:a.innerText,width:a.clientWidth,height:a.clientHeight,font:getComputedStyle(a).fontSize}))})));
 await page.getByRole('button',{name:'Close menu',exact:true}).click();
 await page.locator('.wedding-photo').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/wedding.png'});
 const collections=page.locator('.collection-showcase');await collections.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();})));
 await collections.screenshot({path:dir+'/collections.png'});
 console.log('COLLECTIONS',await collections.locator('.collection-tile').evaluateAll(cards=>cards.map(c=>{const i=c.querySelector('img');return{title:c.innerText,src:i.getAttribute('src'),natural:[i.naturalWidth,i.naturalHeight],height:c.clientHeight};})));
 await page.locator('.site-footer').screenshot({path:dir+'/footer.png'});
 await page.setViewportSize({width:320,height:740});await page.locator('.site-footer').screenshot({path:dir+'/footer-320.png'});await page.setViewportSize({width:390,height:844});
 await page.setViewportSize({width:1440,height:1000});await page.locator('.site-footer').screenshot({path:dir+'/footer-desktop.png'});await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/collections/all');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:dir+'/collection.png'});
 const url=await page.locator('.product-image-link').first().getAttribute('href');await page.goto(base+url);await page.locator('#product-image').evaluate(i=>i.decode());await page.screenshot({path:dir+'/product.png'});
 console.log('PHOTO',await page.locator('#product-image').evaluate(i=>({src:i.getAttribute('src'),natural:[i.naturalWidth,i.naturalHeight],box:[i.clientWidth,i.clientHeight],fit:getComputedStyle(i).objectFit})));
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
