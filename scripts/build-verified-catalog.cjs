'use strict';
const fs=require('node:fs');
const selection=require('../data/verified-selection.json');
const masks=require('../data/photo-masks.json');
const fx=require('../lib/exchange');
const meta={
2:['Fresh Flower Cascade Cake',2,'fresh'],3:['Pressed Flower Garden Cake',1,'pressed'],4:['Pressed Daisy Wedding Cake',2,'pressed'],5:['Ivory Piped Heart Wedding Cake',2],6:['Ivory Vintage Round Cake',1],7:['Pink Butterfly Heart Cake',1],8:['Pink Floral Vintage Wedding Cake',2],
10:['Blush Rose Cascade Wedding Cake',4,'mixed'],11:['White Rose Wedding Cake',3,'mixed'],12:['Peach Floral & Gold Wedding Cake',3,'sugar'],13:['White & Gold Wafer Wedding Cake',3],14:['Ribbed Ivory & Greenery Wedding Cake',3,'mixed'],15:['White Floral & Pearl Wedding Cake',3,'mixed'],16:['Purple Geometric Floral Wedding Cake',3,'sugar'],17:['Ivory Rose & Gold Wedding Cake',2,'mixed'],18:['White Ruffle Wedding Cake',1],21:['Pink Sugar Flower Lace Cake',1,'sugar'],
28:['White Bloom & Gold Drip Cake',1,'silk'],29:['Red Rose & Gold Drip Cake',1,'silk'],30:['Fresh Flower Semi-Naked Cake',1,'fresh'],31:['Orchid Watercolour Cake',1,'decorative'],32:['Rose Garden Celebration Cake',1,'sugar'],33:['Ivory Cloud & Blue Bow Cake',1],34:['Blue Pearl & Bow Cake',1],35:['Ivory Rosebud Vintage Cake',1,'piped'],36:['Pink & Red Ribbon Cake',1],37:['Pastel Ruffle & Cherry Cake',1],38:['Golden Vintage Cherry Cake',1],39:['Royal Blue & Gold Cake',1],40:['Black & Gold Celebration Cake',1],41:['Blush Heart & Black Bow Cake',1],42:['Purple Vintage Birthday Cake',1],43:['Strawberry Macaron Cake',1],44:['Pistachio Raspberry Macaron Cake',1],45:['Matcha Passion Fruit Cake',1],46:['Bunny & Floral Cake',1,'decorative'],48:['Tropical Dinosaur Birthday Cake',1],49:['Safari Animal Birthday Cake',1],50:['Pink Crown & Butterfly Cake',1],51:['Pastel Rainbow Unicorn Cake',1],52:['Blue & Pink Gender Reveal Cake',1],53:['Pink Hot-Air Balloon Cake',1],54:['Blue Hot-Air Balloon Cake',1],55:['Mini Cupcake Collection — 24 Pieces',1],56:['Pressed Flower Cupcakes',1,'pressed'],57:['Lilac Butterfly Cupcakes',1],58:['Assorted Cupcake Collection — 12 Pieces',1],59:['Blue Balloon Number Cake',1],60:['Strawberry Charlotte Cake',1],61:['Chocolate & Vanilla Drip Cake',1],
62:['Seven-Tier Floral Wedding Cake',7,'fresh'],63:['Pink Floral Showpiece Wedding Cake',5,'sugar'],64:['Pink Rose Cascade Wedding Cake',3,'fresh'],65:['Coral Sugar Flower Wedding Cake',3,'sugar'],68:['Red Rose & Gold Wedding Cake',4,'mixed']
};
const countries={cakebloom:['Cake Bloom','US','Charlottesville, Virginia'],yummytecture:['YummyTecture','US','Frisco, Texas'],dbakers:['dbakers','US','Miami, Florida'],butterbaker:['Butter Baker','CA','Toronto, Ontario'],sweetes:["Sweet E’s Bake Shop",'US','Los Angeles, California']};
const categoryNames={'wedding-cake-dubai':'Wedding cakes','birthday-cake-dubai':'Birthday cakes','birthday-cakes-dubai':'Signature cakes','fresh-flower-cakes':'Fresh flower cakes','tiered-cake':'Tiered cakes','birthday-cake-for-children-kids-dubai':'Children’s cakes','cake-for-baby-shower-gender-reveal':'Baby showers & reveals','dubai-cake-for-her-woman':'For her','dubai-cake-for-him-men':'For him','birthday-cake-with-ribbon-bows-dubai':'Ribbons & bows','lambeth-birthday-cake-dubai':'Lambeth & vintage','heart-shaped-cake-dubai':'Heart-shaped cakes','crown-birthday-cake-dubai':'Crown cakes','butterfly-cake-dubai':'Butterfly cakes','balloon-birthday-cake-dubai':'Balloon cakes','letter-number-shaped-cakes-dubai':'Letters & numbers','cupcakes-cookies-cakepops':'Cupcakes & petite treats'};
function categories(n,title,tiers,flowers){
 const c=[];
 if(n<=18||n>=62)c.push('wedding-cake-dubai');
 if(n>=21&&n<62)c.push('birthday-cake-dubai');
 if(n>=28&&n<62)c.push('birthday-cakes-dubai');
 if(flowers==='fresh')c.push('fresh-flower-cakes');
 if(tiers>1)c.push('tiered-cake');
 if([46,48,49,50,51].includes(n))c.push('birthday-cake-for-children-kids-dubai');
 if([46,52,53,54].includes(n))c.push('cake-for-baby-shower-gender-reveal');
 if([21,28,29,30,31,32,33,34,35,36,37,38,41,50].includes(n))c.push('dubai-cake-for-her-woman');
 if([39,40].includes(n))c.push('dubai-cake-for-him-men');
 if(/Bow|Ribbon/.test(title))c.push('birthday-cake-with-ribbon-bows-dubai');
 if(/Vintage|Piped|Ruffle/.test(title))c.push('lambeth-birthday-cake-dubai');
 if(/Heart/.test(title))c.push('heart-shaped-cake-dubai');
 if(/Crown/.test(title))c.push('crown-birthday-cake-dubai');
 if(/Butterfly/.test(title))c.push('butterfly-cake-dubai');
 if(/Balloon/.test(title))c.push('balloon-birthday-cake-dubai');
 if(/Number/.test(title))c.push('letter-number-shaped-cakes-dubai');
 if(/Cupcake/.test(title))return ['cupcakes-cookies-cakepops'];
 return c;
}
const audit=[];
const products=Object.keys(masks).map(key=>{
 const n=Number(key),row=selection[n-1],source=require('../data/sources/'+row.source+'.json').products.find(p=>p.handle===row.handle);
 const [title,tiers,flowerType]=meta[n];
 const [bakery,country,location]=countries[row.source];const currency=country==='CA'?'CAD':'USD';
 const quoteOnly=row.source==='sweetes';
 const image='assets/catalogue/'+row.source+'-'+row.handle+'.webp';
 const names=source.options.map(o=>o.name);const defaultOnly=names.length===1&&names[0]==='Title';
 const variants=source.variants.map(v=>{
  const original=Number(v.price);
  if(!quoteOnly&&(!Number.isFinite(original)||original<=0))throw Error('Unpriced variant '+v.id);
  const sourceMinor=Math.round(original*100),rate=fx.aedPerUnit[currency];
  const baseFils=Math.round(sourceMinor*rate),priceFils=quoteOnly?null:baseFils+30000;
  const tierMatch=v.title.match(/\b([2-9])[- ]?Tier/i)||v.title.match(/\b(Two) Tier/i);
  const variantTiers=tierMatch?(tierMatch[1]==='Two'?2:Number(tierMatch[1])):(names.some(x=>/size|tier/i.test(x))&&row.source==='dbakers'?1:tiers);
  audit.push({productId:String(source.id),variantId:String(v.id),sourceUrl:row.sourceUrl,sourceTitle:source.title,sourceVariant:v.title,country,currency,sourcePrice:original,rateDate:fx.date,aedPerUnit:rate,sourcePriceAED:quoteOnly?null:baseFils/100,markupAED:quoteOnly?null:300,sellingPriceFils:priceFils,quoteOnly});
  return {id:String(v.id),title:defaultOnly?'As pictured':v.title,options:defaultOnly?[]:names.map((_,i)=>v['option'+(i+1)]),priceFils,compareAtFils:null,available:true,image,tiers:variantTiers};
 });
 const cats=categories(n,title,tiers,flowerType);
 if(variants.some(v=>v.tiers>1)&&!cats.includes('tiered-cake'))cats.push('tiered-cake');
 const minPriceFils=quoteOnly?null:Math.min(...variants.map(v=>v.priceFils));
 const titleSlug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 return {id:String(source.id),handle:titleSlug,title,originalTitle:source.title,categories:cats,kind:/Cupcake/.test(title)?'treat':'cake',description:title+'. The photograph shows '+(/Cupcake/.test(title)?'the cupcake decoration':tiers>1?tiers+' tiers':'the single-tier design')+'. Choose your size and finishing details for a personal quotation. Flower varieties and personalised lettering are confirmed before your order.',images:[image],image,imageAlt:title+' — photographed cake',imageNote:'Reference design pictured with '+tiers+' tier'+(tiers===1?'':'s')+'. Size and decoration changes are confirmed with your quotation.',optionNames:defaultOnly?[]:names,variants,minPriceFils,available:true,tiers,picturedTiers:tiers,flowerType:flowerType||null,quoteOnly,source:{bakery,country,location,url:row.sourceUrl,originalTitle:source.title,originalImage:row.sourceImage,originalFile:row.image,sourceImageId:row.sourceImageId,sourceCurrency:currency,checkedAt:'2026-09-12',photoReviewNumber:n},searchText:[title,flowerType==='fresh'?'fresh flowers':'',source.title].join(' ')};
});
const categoriesOut=Object.entries(categoryNames).map(([id,title])=>({id,title,count:products.filter(p=>p.categories.includes(id)).length})).filter(c=>c.count);
const catalog={verified:true,importedAt:'2026-09-12',currency:'AED',markupAED:300,exchangeRates:fx,categories:categoriesOut,products};
fs.mkdirSync('data/archive',{recursive:true});
for(const file of ['catalog.json','price-audit.json'])if(!fs.existsSync('data/archive/original-'+file))fs.copyFileSync('data/'+file,'data/archive/original-'+file);
fs.writeFileSync('data/catalog.json',JSON.stringify(catalog));
fs.writeFileSync('data/price-audit.json',JSON.stringify(audit,null,2));
console.log({products:products.length,variants:audit.length,pricedVariants:audit.filter(v=>!v.quoteOnly).length,weddings:products.filter(p=>p.categories.includes('wedding-cake-dubai')).length,fresh:products.filter(p=>p.flowerType==='fresh').length});
