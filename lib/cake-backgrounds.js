'use strict';
const manifest=require('../data/cake-background-manifest.json');
const replacements=new Map(manifest.images.filter(r=>r.status==='applied'&&r.visualReview?.approved&&r.image).map(r=>[r.originalImage,r.image]));
function applyCakeBackground(product){
  const replace=image=>replacements.get(image)||image;
  return {...product,image:replace(product.image),images:(product.images||[]).map(replace),variants:product.variants.map(v=>({...v,image:replace(v.image)}))};
}
module.exports={applyCakeBackground};
