const fs=require('node:fs');
const selections={
 cakebloom:['single-tier-celebration-cake','two-tier-celebration-cake','single-tier-garden-party-celebration-cake','two-tier-garden-party-celebration-cake','ornate-vintage-two-tier-heart','ornate-vintage-round','ornate-lambeth-heart','two-tier-lambeth-cake'],
 yummytecture:['bridal-cascading-flowers-3-tiers','bridal-cascading-flowers-4-tiers','bridal-cascading-flowers-baby-breath','bridal-cascading-flowers-rice-paper-art','bridal-cascading-flowers-wafer-paper','bridal-cascading-flowers-combed','bridal-cascading-flowers-pearls','square-cake-3-tier','lace-wrap-2tier-bridal','ruffled-wedding-cake','floral-cake-1','floral-cake-2','edible-flower-cake'],
 cedars:['luxury-floral-wedding-cake','vintage-heart-wedding-cake','luxury-red-gold-floral-wedding-cake','elegant-white-filigree-wedding-cake','classic-floral-wedding-cake','luxury-pearl-wedding-cake'],
 dbakers:['white-bloom-cake','red-bloom-cake','floral-naked-cake','white-orchid','garden-of-eden-cake','cloud-bow-cake','coquette-pearl-cake','rose-garden-vintage-cake','vintage-coquette-cake','vintage-ruffles-cake','vintage-cake','blue-gold-cake','black-gold-cake','coquette-cake','classic-birthday-cake','strawberry-shortcake','pistachio-raspberry','matcha-passion-fruit-cake','bunny-cake','golf-cake','baby-dinosaur-cake','wild-safari-adventure-cake','princess-cake','unicorn-cake','gender-reveal-cake','pink-cloud-nine','blue-cloud-nine','mini-cupcakes-box-of-24','pressed-flower-cupcakes','butterfly-cupcakes','box-of-12-cupcakes','balloon-number-minimalist-cake'],
 butterbaker:['bakers-strawberry-shortcake','black-white-chocolate-new'],
 sweetes:['7-tier-wedding-cake','showpiece-wedding-cake','fresh-flower-wedding-cake','coral-sugar-flowers-wedding-cake','claire-pettibone-wedding-cake','corbin-bleu-wedding','big-affair-wedding-cake','bachelor-tanner-jade-wedding-cake','petal-rose-ruffle-cake','gold-coral-pink-wedding-cake','erica-adi-wedding-cake']
};
const origins={cakebloom:'https://cakebloom.com',yummytecture:'https://www.yummytecture.com',cedars:'https://cedarscakes.com',dbakers:'https://dbakers.us',butterbaker:'https://www.butter-baker.com',sweetes:'https://www.sweetesbakeshop.com'};
const rows=[];
for(const [source,handles] of Object.entries(selections)){
 const products=require('../data/sources/'+source+'.json').products;
 for(const handle of handles){
  const product=products.find(p=>p.handle===handle);
  if(!product?.images?.length)throw Error('Missing photo '+source+'/'+handle);
  const photo=product.images[0];
  const ext=new URL(photo.src).pathname.split('.').pop().toLowerCase();
  rows.push({source,handle,title:product.title,sourceUrl:origins[source]+'/products/'+handle,sourceImage:photo.src,image:'assets/real/'+source+'-'+handle+'.'+ext,sourceImageId:String(photo.id),width:photo.width,height:photo.height});
 }
}
fs.writeFileSync('data/verified-selection.json',JSON.stringify(rows,null,2));
console.log(rows.length+' selected photographs');
