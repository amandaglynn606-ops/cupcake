const base=require('@playwright/test');
// Never send test customer data to WhatsApp or navigate test popups online.
const test=base.test.extend({
 context:async({context},use)=>{
  await context.route(/^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>WhatsApp test destination</title>'}));
  await use(context);
 }
});
module.exports={test,expect:base.expect};
