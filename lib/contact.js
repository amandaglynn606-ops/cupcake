'use strict';
function whatsappUrl(config,message='Hello Maison Zavi, I would like to discuss a cake or an order.'){
 const number=config?.whatsapp||'';
 return /^\d{7,15}$/.test(number)?'https://wa.me/'+number+'?text='+encodeURIComponent(message):'';
}
module.exports={whatsappUrl};
