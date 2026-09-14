'use strict';
const DELIVERY_FEE_FILS=10000;
const EMIRATES=['Dubai','Abu Dhabi','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah'];
function totals(subtotalFils,fulfilment='delivery',emirate='Dubai'){
 const deliveryFeeFils=(subtotalFils===null||subtotalFils>0)&&fulfilment!=='pickup'?(emirate==='Dubai'?DELIVERY_FEE_FILS:20000):0;
 return {subtotalFils,deliveryFeeFils,totalFils:subtotalFils===null?null:subtotalFils+deliveryFeeFils,fulfilment,emirate};
}
module.exports={DELIVERY_FEE_FILS,EMIRATES,totals};
