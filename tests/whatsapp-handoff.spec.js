const {test,expect}=require('./whatsapp-fixture');
const path=require('node:path');
const cake=require('../data/extravagant-additions.json').products[0];

test('custom enquiry opens the connected WhatsApp with all details and keeps photos local',async({page,context})=>{
 await page.goto('/bespoke');
 for(const [name,value]of Object.entries({name:'Custom Cake Test',email:'custom@example.com',phone:'+971500000000',date:'2099-12-01',guests:'75',brief:'Ivory sugar roses, four tiers, chocolate sponge, gold initials.'}))await page.locator('[name='+name+']').fill(value);
 await page.locator('[name=occasion]').selectOption('Wedding');await page.locator('[name=budget]').selectOption('AED 4,000+');await page.locator('[name=consent]').check();
 await page.locator('#reference-images').setInputFiles(path.join(__dirname,'..',cake.image));
 await expect(page.locator('.reference-preview')).toHaveCount(1);
 const request=page.waitForRequest(r=>r.url().endsWith('/api/enquiries'));
 const popupPromise=context.waitForEvent('page');
 await page.locator('#enquiry-form button[type=submit]').click();
 const sent=(await request).postDataJSON();
 expect(sent.referenceImages[0]).toMatchObject({name:path.basename(cake.image),type:'image/webp'});
 expect(sent.referenceImages[0].data).toBeUndefined();
 const popup=await popupPromise;
 await expect(popup).toHaveURL(/^https:\/\/wa.me\/971545974005\?text=/);
 const message=new URL(popup.url()).searchParams.get('text');
 for(const value of ['Custom Cake Test','custom@example.com','+971500000000','Wedding','2099-12-01','75','AED 4,000+','Ivory sugar roses, four tiers, chocolate sponge, gold initials.',path.basename(cake.image)])expect(message).toContain(value);
 await expect(page.locator('#enquiry-success')).toContainText('Your message has not been sent yet');
 await expect(page.locator('#enquiry-success')).toContainText('Attach the original photos in WhatsApp');
 await expect(page.locator('#enquiry-success a[href^="mailto:"]')).toHaveCount(0);
 await popup.close();
});

test('blocked popups retain the WhatsApp link and complete message',async({page})=>{
 await page.goto('/contact');await page.evaluate(()=>{window.open=()=>null;});
 for(const [name,value]of Object.entries({name:'Contact Test',email:'contact@example.com',phone:'+971500000000',brief:'Please quote for a gold floral wedding cake.'}))await page.locator('[name='+name+']').fill(value);
 await page.locator('[name=consent]').check();await page.locator('#enquiry-form button[type=submit]').click();
 await expect(page.locator('#send-whatsapp-enquiry')).toHaveAttribute('href',/^https:\/\/wa.me\/971545974005\?text=/);
 await expect(page.locator('.order-message pre')).toContainText('Please quote for a gold floral wedding cake.');
 await expect(page.getByRole('button',{name:'Copy full message'})).toBeVisible();
});
