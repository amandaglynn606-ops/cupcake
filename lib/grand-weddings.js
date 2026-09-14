'use strict';
const designs=require('../data/grand-weddings.json');
function grandWeddings(){
 return designs.map(d=>{
  const priceFils=d.priceAED*100,image='assets/studio/'+d.imageId+'.webp';
  const specification=d.tiers+' tiers'+(d.imageId==='grand-floral-palace'?' in the central tower; two five-tier side cakes':'');
  return {...d,kind:'cake',categories:['wedding-cake-dubai','tiered-cake'],image,images:[image],imageAlt:(d.referencePhoto?'Style reference: ':'Design concept: ')+d.title+', '+specification+', '+d.flowers.toLowerCase(),imageNote:d.referencePhoto?'Licensed style reference with an edited studio background. Final design confirmed on WhatsApp; this is not a photograph of a completed Maison Zavi order.':'Original design concept, digitally visualised. Final appearance, scale and construction are agreed on WhatsApp.',priceOnConsultation:true,available:true,minPriceFils:priceFils,maxPriceFils:priceFils,optionNames:['Design'],variants:[{id:String(Number(d.id)+100),title:'Starting design — final specification by consultation',options:['Starting design — final specification by consultation'],priceFils,compareAtFils:null,available:true,image}],specification};
 });
}
module.exports={grandWeddings};
