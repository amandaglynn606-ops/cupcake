const base=require('@playwright/test');
// Never send test customer data to WhatsApp or navigate test popups online.
const test=base.test.extend({
 context:async({context},use)=>{
  await context.addInitScript(()=>{
   window.whatsappAttempts=[];
   window.whatsappAppAvailable=true;
   const open=window.open;
   window.open=function(url,target,...args){
    if(String(url).startsWith('whatsapp://')){
     window.whatsappAttempts.push({url,target});
     // Simulate leaving for the app without launching installed software.
     if(window.whatsappAppAvailable)window.dispatchEvent(new Event('pagehide'));
     return null;
    }
    return open.call(this,url,target,...args);
   };
  });
  await context.route(/^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>WhatsApp test destination</title>'}));
  await use(context);
 }
});
module.exports={test,expect:base.expect};
