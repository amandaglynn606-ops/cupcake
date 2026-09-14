const {test,expect}=require('./whatsapp-fixture');
const path=require('node:path');
const cake=require('../data/extravagant-additions.json').products[0];

test('custom enquiry opens the connected WhatsApp with all details and keeps photos local',async({page})=>{
 await page.goto('/bespoke');
 for(const [name,value]of Object.entries({name:'Custom Cake Test',email:'custom@example.com',phone:'+971500000000',date:'2099-12-01',guests:'75',brief:'Ivory sugar roses, four tiers, chocolate sponge, gold initials.'}))await page.locator('[name='+name+']').fill(value);
 await page.locator('[name=occasion]').selectOption('Wedding');await page.locator('[name=budget]').selectOption('AED 4,000+');await page.locator('[name=consent]').check();
 await page.locator('#reference-images').setInputFiles(path.join(__dirname,'..',cake.image));
 await expect(page.locator('.reference-preview')).toHaveCount(1);
 const request=page.waitForRequest(r=>r.url().endsWith('/api/enquiries'));
 await page.locator('#enquiry-form button[type=submit]').click();
 const sent=(await request).postDataJSON();
 expect(sent.referenceImages[0]).toMatchObject({name:path.basename(cake.image),type:'image/webp'});
 expect(sent.referenceImages[0].data).toBeUndefined();
 await expect.poll(()=>page.evaluate(()=>window.whatsappAttempts.length)).toBe(1);
 const attempt=await page.evaluate(()=>window.whatsappAttempts[0]);
 expect(attempt.target).toBe('_self');
 const destination=new URL(attempt.url);expect(destination.protocol).toBe('whatsapp:');
 expect(destination.searchParams.get('phone')).toBe('971545974005');
 const message=destination.searchParams.get('text');
 for(const value of ['Custom Cake Test','custom@example.com','+971500000000','Wedding','2099-12-01','75','AED 4,000+','Ivory sugar roses, four tiers, chocolate sponge, gold initials.',path.basename(cake.image)])expect(message).toContain(value);
 await expect(page.locator('#enquiry-success')).toContainText('Your message has not been sent yet');
 await expect(page.locator('#enquiry-success')).toContainText('Attach the original photos in WhatsApp');
 await expect(page.locator('#enquiry-success a[href^="mailto:"]')).toHaveCount(0);
 await page.waitForTimeout(2200);await expect(page).toHaveURL(/\/bespoke$/);
});

test('blocked app launches retain the message and fall back without a popup',async({page})=>{
 await page.goto('/contact');await page.evaluate(()=>{window.open=()=>null;});
 for(const [name,value]of Object.entries({name:'Contact Test',email:'contact@example.com',phone:'+971500000000',brief:'Please quote for a gold floral wedding cake.'}))await page.locator('[name='+name+']').fill(value);
 await page.locator('[name=consent]').check();await page.locator('#enquiry-form button[type=submit]').click();
 await expect(page.locator('#send-whatsapp-enquiry')).toHaveAttribute('href',/^https:\/\/wa.me\/971545974005\?text=/);
 await expect(page.locator('.order-message pre')).toContainText('Please quote for a gold floral wedding cake.');
 await expect(page.getByRole('button',{name:'Copy full message'})).toBeVisible();
 await expect(page).toHaveURL(/^https:\/\/wa.me\/971545974005\?text=/);
 expect(new URL(page.url()).searchParams.get('text')).toContain('Please quote for a gold floral wedding cake.');
});

for(const width of [390,1440])test('floating WhatsApp link launches the app directly at '+width,async({page,context})=>{
 await page.setViewportSize({width,height:844});await page.goto('/contact');
 const button=page.getByRole('link',{name:'Chat with Maison Zavi on WhatsApp'});
 const message=new URL(await button.getAttribute('href')).searchParams.get('text');
 await button.click();
 const attempts=await page.evaluate(()=>window.whatsappAttempts);
 expect(attempts).toHaveLength(1);expect(attempts[0].target).toBe('_self');
 expect(new URL(attempts[0].url).searchParams.get('text')).toBe(message);
 expect(context.pages()).toHaveLength(1);
});

test('missing WhatsApp app falls back to the web link',async({page})=>{
 await page.goto('/contact');await page.evaluate(()=>{window.whatsappAppAvailable=false;});
 await page.getByRole('link',{name:'Chat with Maison Zavi on WhatsApp'}).click();
 await expect(page).toHaveURL(/^https:\/\/wa.me\/971545974005\?text=/);
});

test('failed enquiry validation never launches WhatsApp',async({page})=>{
 await page.goto('/contact');
 await page.route('**/api/enquiries',route=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'Please check your enquiry.'})}));
 await page.locator('#enquiry-form button[type=submit]').click();
 await expect(page.locator('#enquiry-form .form-error')).toHaveText('Please check your enquiry.');
 expect(await page.evaluate(()=>window.whatsappAttempts)).toEqual([]);
});

test('handoff rejects untrusted destinations and preserves encoded message text',async({page})=>{
 await page.goto('/contact');
 const attempts=await page.evaluate(async()=>{
  const {prepareWhatsAppHandoff}=await import('/assets/js/whatsapp-handoff.js');
  const handoff=prepareWhatsAppHandoff();
  for(const url of ['javascript:alert(1)','data:text/html,test','http://wa.me/971545974005','https://wa.me.attacker.invalid/971545974005','https://user:pass@wa.me/971545974005','https://wa.me/invalid','https://wa.me/123','https://wa.me:8443/971545974005'])handoff.open(url);
  const rejected=window.whatsappAttempts.length;
  handoff.open('https://wa.me/971545974005?text='+encodeURIComponent('Cake & roses + chocolate\nمرحبا 🎂'));
  return {rejected,last:window.whatsappAttempts.at(-1)};
 });
 expect(attempts.rejected).toBe(0);
 expect(new URL(attempts.last.url).searchParams.get('text')).toBe('Cake & roses + chocolate\nمرحبا 🎂');
 await page.waitForTimeout(2200);await expect(page).toHaveURL(/\/contact$/);
});
