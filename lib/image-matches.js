'use strict';
const matches = require('../data/image-matches.json');
const {tierCount}=require('./tier-options');
const {isCakeProduct}=require('./product-categories');
const originalPhotos=new Set(require('../data/catalog.json').products.flatMap(p=>[p.image,...p.images,...p.variants.map(v=>v.image)]).filter(Boolean));
const pendingPhoto='assets/maison-photo-pending.svg';
function compatibleImageMatch(product,match){
  if(!match||!match.visualReview?.verified||product.image!==match.originalImage)return false;
  try{if(!/(^|\.)pinterest\.com$/.test(new URL(match.sourceUrl).hostname))return false;}catch{return false;}
  const observed=match.visualReview.tierCount;
  // Non-tiered treats may have a null tier count; multi-tier cakes never may.
  return product.variants.every(variant=>{
    const declared=/\b(one|two|three|four|five|six|seven|eight|nine|ten|[1-9]|10)[ -]*tier(?:ed|s)?\b/i.test([variant.title,product.title].join(' '));
    const original=match.visualReview.originalTierCount;
    const required=!declared&&!variant.tiers&&!product.tiers&&Number.isInteger(original)&&original>1&&original<=10?original:tierCount(product,variant);
    return observed===null?required===1:Number.isInteger(observed)&&observed===required;
  });
}
function applyImageMatch(product) {
  const replacement=require('./cake-images').replaceCakeImage(product);
  if(replacement)return replacement;
  const match = matches[product.id];
  if (!compatibleImageMatch(product,match)) {
    // Keep the existing cake photograph until a reviewed replacement is ready.
    if(isCakeProduct(product))return product;
    if(![product.image,...(product.images||[]),...(product.variants||[]).map(v=>v.image)].some(image=>originalPhotos.has(image)))return product;
    return {...product,image:pendingPhoto,images:[pendingPhoto],variants:product.variants.map(variant=>({...variant,image:pendingPhoto})),imageAlt:product.title+' — photo coming soon',imageNote:'A new photo is being prepared for this design. Please confirm the details with Maison Zavi.'};
  }
  return {
    ...product,
    image: match.image,
    images: [match.image],
    variants: product.variants.map(variant => ({ ...variant, image: match.image })),
    imageAlt: product.title + ' — similar design reference',
    imageNote: 'Similar design reference. Colours, decoration and finishing details are confirmed with your order.'
  };
}
module.exports = { applyImageMatch, compatibleImageMatch };
