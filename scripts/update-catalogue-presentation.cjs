const fs=require('node:fs');
function replace(file,before,after){const text=fs.readFileSync(file,'utf8');if(text.includes(after))return;if(!text.includes(before))throw Error('Expected text missing: '+file);fs.writeFileSync(file,text.replace(before,after));}
replace('lib/ui.js',"'Image credits'","'About our images'");
replace('lib/ui.js','class="product-card"','class="product-card\'+(p.imageContain?\' full-cake-photo\':\'\')+\'"');
replace('pages/product.js','class="product-page"','class="product-page\'+(p.imageContain?\' full-cake-photo\':\'\')+\'"');
