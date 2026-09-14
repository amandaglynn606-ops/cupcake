'use strict';
const {weddingMeta}=require('./weddings');
const descriptions={
 'rustic-floral':'Two-tier semi-naked cake with roses and greenery',
 'blush-roses':'Two-tier ivory cake with blush roses and pearl borders',
 'ivory-lace':'Three-tier ivory cake with delicate lace piping',
 'ivory-gilded':'Three-tier ivory floral cake with gold edges',
 'rose-rosette':'Round pink ombre cake with piped rosettes',
 'celestial':'Blue cake with an astronaut and planet decorations',
 'petite-cupcakes':'A selection of vanilla and chocolate cupcakes',
 'chocolate-rosette':'Chocolate-wrapped cake with pink rosettes and a brown ribbon',
 'classic-ivory':'A tall single-tier semi-naked cake',
 'butterfly-piping':'Round ivory cake with pink piping and gold butterflies',
 'berry-floral':'An overhead view of a round cake with berries and flowers',
 'cake-pops':'A group of chocolate cake pops',
 'macarons':'A selection of chocolate and pastel macarons',
 'cookies':'Six chocolate chip cookies',
 'candles':'Three slim birthday candles',
 'topper':'A silver Happy Birthday cake topper'
};
function referenceId(p){
 const text=(p.originalTitle||p.title||'').toLowerCase();
 if(p.kind==='accessory')return /candle/.test(text)?'candles':'topper';
 if(/macaron/.test(text))return 'macarons';
 if(/cookie|biscuit/.test(text))return 'cookies';
 if(/cake\s?pop|cakesicle/.test(text))return 'cake-pops';
 if(/cupcake/.test(text)||p.kind==='patisserie')return 'petite-cupcakes';
 const tiers=weddingMeta(p).tierCount;
 if(tiers>=3)return /gold/.test(text)?'ivory-gilded':'ivory-lace';
 if(tiers===2)return /rustic|naked/.test(text)?'rustic-floral':'blush-roses';
 if(/butterfl|lambeth|piping|ribbon|bow|crown/.test(text))return 'butterfly-piping';
 if(/choco|smash/.test(text))return 'chocolate-rosette';
 if(/berr|fruit/.test(text))return 'berry-floral';
 if(/space|astronaut|planet|blue/.test(text))return 'celestial';
 if(/pink|rose|floral|flower/.test(text))return 'rose-rosette';
 return 'classic-ivory';
}
function replaceImagery(p){
 const id=referenceId(p),image='assets/studio/'+id+'.webp';
 return {...p,image,images:[image],imageReference:true,imageAlt:'Collection reference: '+descriptions[id],imageNote:'Collection inspiration, not a photograph of this specific design or a completed Maison Zavi order. The named shape, colours, decorations and quantities are confirmed on WhatsApp. Reference photographs may be shared across designs.',variants:p.variants.map(v=>({...v,image}))};
}
module.exports={replaceImagery,referenceId,descriptions};
