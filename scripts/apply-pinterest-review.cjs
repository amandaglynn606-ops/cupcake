const fs=require('node:fs');
const catalog=require('../data/catalog.json');
const file='data/image-batch-001-pinterest.json';
const batch=JSON.parse(fs.readFileSync(file));
// These observations were recorded after viewing the downloaded photographs.
// A cake tier is a separate stacked cake, not a band of decorative piping.
const reviewed={
 1:[1,'round','White cake, pink ribbon bows; one cylindrical tier.'],
 2:[1,'round','White cake, blue ribbon bows; one cylindrical tier.'],
 3:[1,'round','One pink cylindrical tier with Lambeth piping and a crown.'],
 4:[1,'long rectangle','One long rectangular white cake topped with raspberries.'],
 5:[1,'round','One round white cake with red ribbon bows.'],
 6:[2,'heart','Two separate, differently sized stacked heart tiers with white Lambeth piping.'],
 7:[1,'round','One small white bento cake with black ribbon bows.'],
 9:[1,'round','One wide round white cake covered with raspberries.'],
 10:[1,'round','One round raspberry-topped cake with white ribbons and tall candles.'],
 11:[1,'heart','One heart-shaped cake covered with raspberries and a white bow.'],
 13:[null,'cake pops','Pink cake pops with pink bows.'],
 22:[null,'cakesicles','Pink cakesicles decorated with butterflies.'],
 25:[null,'cupcakes','Blue and white baby cupcakes with teddy bears and booties.'],
 27:[null,'cake pops','White round cake pops with white bows and drizzled decoration.'],
 28:[null,'bear cake pops','Bear-shaped cake pops with pink bows.'],
 29:[null,'bear-face cookies','Iced cookies shaped like teddy bear faces.'],
 31:[null,'rocking-horse cookies','Iced rocking-horse cookies in cream and pastel blue.'],
 33:[null,'onesie and bottle cookies','Baby cookie assortment includes onesies and bottles.'],
 37:[null,'onesie cookies','Pink and white baby onesie cookies with piping and floral details.'],
 38:[null,'baby cookies','Blue and white baby cookie assortment with carriage and decorated onesie.'],
 39:[null,'bunny and name cookies','Bunny cookies, floral details and personalised name plaques.'],
 43:[null,'unicorn cakesicles','White cakesicles with unicorn horns, eyes and pastel manes.'],
 44:[1,'round cake and cupcakes','One round Stitch bento cake with coordinating character cupcakes.'],
 45:[1,'number eight','One number-eight cake with green Minecraft decorations.'],
 46:[1,'round','One pink cylindrical cake with Roblox girl characters.'],
 47:[null,'cupcakes','Cupcakes with LOL character and logo toppers.'],
 48:[1,'round','One round green Minecraft cake with block-pattern sides and character figures.'],
 49:[null,'cake pops','Purple cake pops with flowers and butterflies.'],
 50:[null,'unicorn cake pops','White unicorn cake pops with gold horns and pastel flowers.']
};
const reasons={
 8:'Rejected a heart-shaped pink cake: the original design is round. Other Pinterest options had large fondant bows rather than the small ribbon bows.',
 12:'No Pinterest candidate matched both the crescent-shaped cake and sheep cake pops.',
 14:'Pinterest cookie sets did not show the complete named combination of name, carriage and rattle.',
 15:'The candidate lacked a clearly visible baby bunny and personalised name combination.',
 16:'No close Pinterest match for round cookies with sculpted baby bear and stars.',
 17:'Wing-only cookies did not match the dress-and-wings set.',
 18:'Pinterest bear cupcakes lacked the named rainbow decoration.',
 19:'Rejected rounded cakesicles: the product calls for square cakesicles.',
 20:'Plaque and letter cakes did not match the freestanding floral initial cookie.',
 21:'Flat rocking-horse cookies did not match a three-dimensional carousel.',
 23:'Rejected rounded rectangular cakesicles: the product calls for square cakesicles.',
 24:'Kept the original baby onesie cupcakes; no closer Pinterest match was selected.',
 26:'No close Pinterest match for the white and gold angel-shaped macarons.',
 30:'Kept the original teddy-bear and baby-name cookie set; no closer Pinterest match was selected.',
 32:'Pinterest carriage cookie sets did not preserve the named carriage-and-bottle pair.',
 34:'Rejected a mixed rounded-rectangle treat set: the named cookie shape is oval.',
 35:'No close Pinterest match combining angel and carousel cookies.',
 36:'Rocking-horse cookies did not match the complete carousel shape.',
 40:'Teddy-only cake pops did not match the named onesie-and-bear set.',
 41:'Pinterest chocolate cake options did not match the Ferrero-shaped smash shell.',
 42:'No Pinterest match preserving the red anniversary bomb-shaped chocolate shell.'
};
const matches={};
for(const r of batch.records){
 const observation=reviewed[r.n];
 if(!observation){
  r.status='retained-original';r.reviewNote=reasons[r.n];
  if(r.selected)r.rejectedCandidate={...r.selected,localImage:r.localImage};
  r.selected=null;delete r.localImage;delete r.sha256;delete r.visualReview;
  continue;
 }
 if(!r.localImage||!fs.existsSync(r.localImage))throw Error('Missing reviewed image '+r.n);
 if(!/(^|\.)pinterest\.com$/.test(new URL(r.selected.sourceUrl).hostname))throw Error('Source must be Pinterest '+r.n);
 const [tierCount,shape,notes]=observation;
 const product=catalog.products.find(p=>p.id===r.productId);
 if(tierCount!==null&&!product.variants.every(v=>require('../lib/tier-options').tierCount(product,v)===tierCount))throw Error('Tier mismatch '+r.n);
 r.visualReview={verified:true,tierCount,shape,notes};r.status='applied';r.reviewNote=notes;
 matches[r.productId]={batch:1,revision:2,title:r.title,originalImage:r.originalImage,image:r.localImage,sourceUrl:r.selected.sourceUrl,visualReview:r.visualReview};
}
batch.reviewedAt=new Date().toISOString();
batch.summary={reviewed:50,replaced:Object.keys(matches).length,retained:50-Object.keys(matches).length};
fs.writeFileSync(file,JSON.stringify(batch,null,2)+'\n');
fs.writeFileSync('data/image-batch-001.json',JSON.stringify(batch,null,2)+'\n');
fs.writeFileSync('data/image-matches.json',JSON.stringify(matches,null,2)+'\n');
console.log(batch.summary);
