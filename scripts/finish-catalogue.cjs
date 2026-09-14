const fs=require('fs');
function change(file,old,value){let s=fs.readFileSync(file,'utf8');if(!s.includes(old))throw Error(file+': '+old);fs.writeFileSync(file,s.replaceAll(old,value));}
change('lib/ui.js','<link rel="stylesheet" href="/assets/css/floral.css">','<link rel="stylesheet" href="/assets/css/floral.css"><link rel="stylesheet" href="/assets/css/catalogue.css">');
change('scripts/build-verified-catalog.cjs',"28:['White Bloom & Gold Drip Cake',1,'sugar'],29:['Red Rose & Gold Drip Cake',1,'sugar']","28:['White Bloom & Gold Drip Cake',1,'silk'],29:['Red Rose & Gold Drip Cake',1,'silk']");
change('scripts/build-verified-catalog.cjs',"31:['Orchid Watercolour Cake',1,'fresh'],32:['Rose Garden Celebration Cake',1,'fresh']","31:['Orchid Watercolour Cake',1,'decorative'],32:['Rose Garden Celebration Cake',1,'sugar']");
change('scripts/build-verified-catalog.cjs',"46:['Bunny & Floral Cake',1,'fresh']","46:['Bunny & Floral Cake',1,'decorative']");
change('scripts/build-verified-catalog.cjs',"14:['Ribbed Ivory & Greenery Wedding Cake',3,'fresh']","14:['Ribbed Ivory & Greenery Wedding Cake',3,'mixed']");
change('assets/js/cart-page.js',"(result.hasStartingPrices?'From ':'')","(result.hasStartingPrices&&!result.hasUnpricedItems?'From ':'')");
change('assets/js/cart-page.js','Please confirm each cake’s colouring and allergen details in your cart.','Please confirm each cake’s colouring, allergens and tier choices. Use Edit cake & tier details to choose your tiers.');
