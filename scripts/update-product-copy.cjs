'use strict';
const fs=require('node:fs');
const products=JSON.parse(fs.readFileSync('artifacts/copy-audit/before.json','utf8'));
const words=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
const reviewed={
 '8957441278177':['White Piped Cake with Blue Ribbon Bows','Round white cake with blue ribbon bows, piped swags and shell borders.'],
 '9442929180897':['Long Raspberry Cake with White Piping','Long rectangular white cake topped with raspberries and decorated with piped swags and shell borders.'],
 '8957444653281':['White Piped Cake with Red Ribbon Bows','Round ivory cake with red ribbon bows, piped floral details and shell borders.'],
 '8962586804449':['2-Tier Ivory Heart Lambeth Cake','Two-tier ivory cake with a heart-shaped top, piped swags, shell borders and pearl-like decorations.'],
 '8957434069217':['Pink Piped Cake with White Ribbon Bows','Pink cake with white ribbon bows and pink piped borders.'],
 '9442928197857':['Round Raspberry-Topped White Cake','Round white cake covered with red raspberries across the top.'],
 '8961211990241':['Black & White Heart Lambeth Cake','Heart-shaped ivory cake with black ribbon bows, black piping and white shell borders.'],
 '8961203994849':['Pink Cherry Heart Cake','Pink heart-shaped cake with red cherries, white piped swags and pink shell borders.'],
 '8491017404641':['Pink Rose Cake with Textured Icing','Round pink cake with ridged icing, pink roses and green stems.'],
 '8232863629537':['Pink Heart Cake with Butterfly Decorations','Pink heart-shaped cake with piped shell borders, butterfly decorations and a written message.'],
 '8028661645537':['3-Tier Pink Marble & Sugar Rose Wedding Cake','Three-tier ivory cake with a pink marble base, pale pink sugar roses and pearl details.'],
 '8028660433121':['3-Tier Pink Rose Wedding Cake with Gold Scrollwork','Three-tier ivory wedding cake with pink roses, open peonies, trailing leaves and gold scrollwork.'],
 '8028660367585':['3-Tier White Rose Wedding Cake','Three-tier white wedding cake with a cascade of white roses, lisianthus and green leaves.'],
 '8028660203745':['4-Tier White & Blush Rose Wedding Cake','Four-tier white wedding cake with a winding cascade of ivory and blush sugar roses.'],
 '8028660039905':['2-Tier Semi-Naked Wedding Cake with Ivory Roses','Two-tier semi-naked white wedding cake with ivory roses and green leaves.'],
 '8028659941601':['2-Tier Wedding Cake with Blush & Ivory Roses','Two-tier ivory wedding cake with blush and ivory roses.'],
 '8028655845601':['2-Tier Semi-Naked Mixed Berry Cake','Two-tier semi-naked cake with strawberries, raspberries, blueberries and blackberries.']
};
const titleEdits={
 '9800000000069':'10-Tier Blush & Gold Floral Wedding Cake',
 '9800000000071':'9-Tier Ivory, Black & Gold Wedding Cake',
 '9920000000001':'6-Tier Floating Ivory Blossom Cake',
 '9920000000002':'6-Tier Black & Ivory Lace Cake',
 '9920000000003':'2-Tier Blue Filigree & Floral Cake',
 '9920000000004':'5-Tier Ivory Rose & Sculpted Sail Cake',
 '9920000000006':'2-Tier Blush Ruffle & Flower Cascade Cake',
 '9920000000007':'3-Tier Blue Tile & Lemon Cake',
 '9920000000008':'5-Tier Black & Gold Star Cake',
 '9920000000009':'2-Tier Gold & Burgundy Rose Cake',
 '9920000000010':'2-Tier Gold Leaf & Pink Sugar Peony Cake'
};
const copy={};
for(const p of products){
 let title=p.title.replace(/\b(?:Luxury|Elegantly|Grand|Couture|Regal)\s+/g,'')
  .replace(/\bMidnight\b/g,/black/i.test(p.description)?'Black':'Navy')
  .replace(/\bAzure\b/g,'Blue').replace(/\bAmethyst\b/g,'Purple').replace(/\bScarlet\b/g,'Red')
  .replace(/\bGilded\b/g,'Gold').replace(/\bBotanical\b/g,'Floral').replace(/\s+Tower\b/g,'')
  .replace(/\s+/g,' ').trim();
 if(p.tiers>1&&!/\b(?:\d+|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)[ -]Tier/i.test(title))title=p.tiers+'-Tier '+title;
 title=titleEdits[p.id]||reviewed[p.id]?.[0]||title;
 let description=reviewed[p.id]?.[1]||p.description.split(/Dimensions, flavours|Your cake size, flower|Size, colour|Size, colours|Your final design/)[0].trim();
 if(/^\d+ tiers with /i.test(description)){
  const detail=p.title.replace(/\s*(?:Wedding|Celebration)?\s*Cake$/i,'').replace(/\b(?:Grand|Regal)\s+/g,'').replaceAll('&','and').toLowerCase();
  description=/^(burgundy|ivory|pink|navy blue|grey marble)$/.test(detail)
   ?words[p.tiers]+'-tier '+detail+' wedding cake.'
   :words[p.tiers]+'-tier wedding cake with '+detail+'.';
  description=description.replace('with garden rose.','with garden roses.')
   .replace('with monogram and lace.','with a monogram and lace decoration.')
   .replace('with ivory rose cascade.','with a cascade of ivory roses.')
   .replace('with white floral spiral.','with white flowers arranged in a spiral.')
   .replace('with lilac rose cascade.','with a cascade of lilac roses.')
   .replace('with blush roses and initial.','with blush roses and an initial decoration.')
   .replace('with white floral appliqué.','with white floral appliqué decoration.');
 }
 description=description.replace(/\bclouds of translucent\b/g,'translucent').replace(/\bsweeping\s+/g,'').replace(/\babundant\s+/g,'')
  .replace(/\s*Details, dimensions and flavours[^.]*\./g,'').replace(/\s+/g,' ').trim();
 if(!description.endsWith('.'))description+='.';
 const first=description.split('. ')[0]+(description.split('. ')[0].endsWith('.')?'':'.');
 const metaDescription=first+(first.length<=110?' Request sizes, flavours and a quote from Maison Zavi.':' Request a quote from Maison Zavi.');
 const metaTitle=title.replace(/ with /g,' & ');
 copy[p.id]={title,description:first+' Select your flavours and request a quote. Size, decoration and delivery are confirmed before ordering.',metaTitle,metaDescription,
  ...(reviewed[p.id]?{imageAlt:reviewed[p.id][1].replace(/\.$/,'')}:{} )};
}
const titles=new Set();
for(const [id,p]of Object.entries(copy)){if(titles.has(p.title))throw Error('Duplicate title '+id+' '+p.title);titles.add(p.title);}
fs.writeFileSync('data/product-copy.json',JSON.stringify(copy,null,2)+'\n');
fs.writeFileSync('artifacts/copy-audit/product-changes.json',JSON.stringify(products.map(p=>({id:p.id,url:'/cakes/'+p.handle,oldTitle:p.title,...copy[p.id]})),null,2));
console.log(JSON.stringify({products:products.length,titlesChanged:products.filter(p=>p.title!==copy[p.id].title).length,maxMetaTitle:Math.max(...Object.values(copy).map(p=>p.metaTitle.length)),maxMetaDescription:Math.max(...Object.values(copy).map(p=>p.metaDescription.length))}));
