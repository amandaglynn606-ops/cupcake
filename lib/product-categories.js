'use strict';
const TREATS='cupcakes-cookies-cakepops';
const TOPPERS='cake-toppers';
const CANDLES='birthday-candles';
const SMASH='choco-smash-cakes';
const NON_CAKE_CATEGORIES=new Set([TREATS,TOPPERS,CANDLES,SMASH]);
// Reviewed exceptions whose titles say "cake", but describe cookies, a cupcake
// bouquet, dipped fruit, chocolate shells, or boxes of miniature treats.
const TREAT_PRODUCTS=new Set([
 '8693170798817','6541396345021','6541337034941',
 '8103212318945','8061928014049','8004182343905','8004182278369',
 '8004182180065','8004181459169'
]);
function isCakeProduct(product){
 if(product.kind==='accessory'||product.kind==='patisserie'||TREAT_PRODUCTS.has(product.id))return false;
 const title=product.title.replace(/\bcake[ -]?pops?\b/ig,'');
 return /\bcakes?\b/i.test(title)&&!/\bcake toppers?\b/i.test(title);
}
function assignProductCategories(product,cakeCategoryIds){
 if(isCakeProduct(product))return product;
 const categories=product.categories.filter(id=>!cakeCategoryIds.has(id));
 const target=product.kind==='accessory'
  ? (/topper/i.test(product.title)?TOPPERS:CANDLES)
  : /choco[ -]?smash/i.test(product.title)?SMASH:TREATS;
 if(!categories.includes(target))categories.push(target);
 return {...product,categories};
}
module.exports={isCakeProduct,assignProductCategories,NON_CAKE_CATEGORIES};
