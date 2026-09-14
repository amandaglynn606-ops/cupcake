const {test,expect}=require('@playwright/test');
test('stock banner plays silently without controls and uses mobile footage',async({page})=>{
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');await page.mouse.move(0,0);
  const video=page.locator('#hero-video');
  await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(.2);
  expect(await video.evaluate(v=>({muted:v.muted,inline:v.playsInline,controls:v.controls}))).toEqual({muted:true,inline:true,controls:false});
  await expect(video).toHaveAttribute('src',width<760?'/assets/videos/wedding-second-full-frame-mobile.mp4':'/assets/videos/wedding-second-full-frame.mp4');
  await expect(page.getByRole('button',{name:/play|pause/i})).toHaveCount(0);
  const headingBox=await page.locator('h1').boundingBox();expect(headingBox.x).toBeGreaterThanOrEqual(20);
  if(width<=760){
   const media=await page.locator('.hero-media').boundingBox();
   expect(headingBox.y+headingBox.height).toBeLessThan(media.y);
   await expect(page.locator('#hero-heading')).toHaveCSS('font-size','36px');
   await expect(page.locator('.hero-description')).toHaveCSS('text-align','center');
   await expect(page.locator('.hero-description')).toHaveCSS('font-size','14px');
   await expect(page.locator('.hero-footnote')).toBeHidden();
   await expect(page.locator('.hero-actions .text-link')).toHaveCSS('border-bottom-width','0px');
  }
  await page.screenshot({path:'artifacts/banner-video/home-'+width+'.png'});
  await page.keyboard.press('Escape');expect(await video.evaluate(v=>v.paused)).toBe(true);
 }
});
test('reduced motion and failed footage retain the poster; section backgrounds alternate',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.locator('#hero-video')).not.toHaveAttribute('src');
 await expect(page.locator('#hero-image')).toBeVisible();
 const colours=await page.locator('.maison-home > section,.maison-home > .maison-promises').evaluateAll(els=>els.map(e=>getComputedStyle(e).backgroundColor));
 expect(colours).toEqual(['rgb(243, 236, 223)','rgb(251, 247, 239)','rgb(243, 236, 223)','rgb(251, 247, 239)','rgb(243, 236, 223)','rgb(251, 247, 239)','rgb(243, 236, 223)','rgb(251, 247, 239)']);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.route('**/*.mp4',route=>route.abort());await page.reload();await page.mouse.move(0,0);
 await expect(page.locator('.video-hero')).toHaveAttribute('data-video-state','still');
 await expect(page.locator('#hero-image')).toBeVisible();
});
test('video assets support MIME, byte ranges and HEAD',async({request})=>{
 const url='/assets/videos/wedding-second-full-frame-mobile.mp4';
 const head=await request.head(url);expect(head.status()).toBe(200);expect(head.headers()['content-type']).toBe('video/mp4');
 const size=Number(head.headers()['content-length']);expect(size).toBeGreaterThan(500000);
 for(const [range,length] of [['bytes=0-99',100],['bytes=200-399',200],['bytes=-50',50]]){
  const result=await request.get(url,{headers:{Range:range}});expect(result.status()).toBe(206);expect((await result.body()).length).toBe(length);
 }
 for(const range of ['bytes='+size+'-','bytes=-0','bytes=20-10','bytes=abc']){
  expect((await request.get(url,{headers:{Range:range}})).status()).toBe(416);
 }
});

test('banner retains its original desktop height, full width and uninterrupted playback',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.goto('/');
  const video=page.locator('#hero-video');await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(.2);
  const dimensions=await video.evaluate(v=>{const r=v.getBoundingClientRect();return {width:r.width,height:r.height,ratio:r.width/r.height,native:v.videoWidth/v.videoHeight};});
  expect(dimensions.width).toBe(width);if(width>900)expect(dimensions.height).toBe(650);else expect(Math.abs(dimensions.ratio-dimensions.native)).toBeLessThan(.003);
  await expect(video).toHaveCSS('object-fit','cover');
  expect((await video.boundingBox()).x).toBe(0);
  await expect(video).toHaveCSS('transform','none');
  await page.locator('.hero-media').hover({position:{x:width-30,y:30}});
  const result=await video.evaluate(v=>new Promise(resolve=>{
   const start=v.currentTime,q=v.getVideoPlaybackQuality();let stalls=0;const waiting=()=>stalls++;v.addEventListener('waiting',waiting);
   setTimeout(()=>{v.removeEventListener('waiting',waiting);const end=v.getVideoPlaybackQuality();resolve({advance:v.currentTime-start,paused:v.paused,stalls,frames:end.totalVideoFrames-q.totalVideoFrames,dropped:end.droppedVideoFrames-q.droppedVideoFrames});},3000);
  }));
  expect(result.paused).toBe(false);expect(result.advance).toBeGreaterThan(2.5);expect(result.stalls).toBe(0);
  expect(result.frames).toBeGreaterThan(40);expect(result.dropped/result.frames).toBeLessThan(.1);
 }
});
