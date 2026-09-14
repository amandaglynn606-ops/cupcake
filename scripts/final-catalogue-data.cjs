const fs=require('fs');
function change(file,old,value){let s=fs.readFileSync(file,'utf8');if(!s.includes(old))throw Error(file+': '+old);fs.writeFileSync(file,s.replaceAll(old,value));}
change('scripts/build-verified-catalog.cjs',"68:['Red Rose & Gold Wedding Cake',5,'mixed']","68:['Red Rose & Gold Wedding Cake',4,'mixed']");
change('scripts/build-verified-catalog.cjs',"34:['Blue Pearl Heart Cake',1]","34:['Blue Pearl & Bow Cake',1]");
change('scripts/build-verified-catalog.cjs',"11:['White Rose & Baby’s Breath Wedding Cake',3,'mixed']","11:['White Rose Wedding Cake',3,'mixed']");
change('scripts/build-verified-catalog.cjs',"The photograph shows '+(tiers>1?tiers+' tiers':'the single-tier design')","The photograph shows '+(/Cupcake/.test(title)?'the cupcake decoration':tiers>1?tiers+' tiers':'the single-tier design')");
const masks=JSON.parse(fs.readFileSync('data/photo-masks.json'));delete masks['58'];fs.writeFileSync('data/photo-masks.json',JSON.stringify(masks,null,2));
const pkg=JSON.parse(fs.readFileSync('package.json'));pkg.scripts.import='node scripts/build-verified-catalog.cjs';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
change('pages/photography.js','Displayed AED prices use the matching source variation’s published price, converted using our dated reference exchange rates, plus AED 300.','Prices reflect your selected size and variation. Currency conversions are approximate; your personal quotation is confirmed in AED.');
