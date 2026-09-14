'use strict';
const {isCakeProduct}=require('./product-categories');
const {tierCount}=require('./tier-options');
const manifest=require('../data/cake-image-manifest.json');
const replacements=new Map(manifest.products.map(record=>[record.productId,record]));
function validReplacement(product,record){
 if(!isCakeProduct(product)||!record?.verified||record.status!=='replaced'||!record.alt||!record.image)return false;
 if(!record.source_country||/^(AE|ARE|UAE|United Arab Emirates)$/i.test(record.source_country)||!record.countryEvidence?.url||!record.countryEvidence?.text)return false;
 if(!record.visualReview?.verified||record.visualReview.watermarkVisible!==false||record.visualReview.obviouslyAiGenerated!==false)return false;
 if(!/^assets\/products\/cakes\/cake-[a-z0-9-]+\.webp$/.test(record.image))return false;
 try{if(new URL(record.source).protocol!=='https:'||/\.ae$/i.test(new URL(record.source).hostname))return false;}catch{return false;}
 return product.variants.every(v=>record.visualReview.tierCount===tierCount(product,v));
}
function replaceCakeImage(product){
 const record=replacements.get(product.id);
 if(!validReplacement(product,record))return null;
 return {...product,image:record.image,images:[record.image],imageAlt:record.alt,
  variants:product.variants.map(v=>({...v,image:record.image}))};
}
function cakeImageClass(product){return isCakeProduct(product)&&!product.image.endsWith('.svg')?'cake-image':'';}
module.exports={validReplacement,replaceCakeImage,cakeImageClass};
