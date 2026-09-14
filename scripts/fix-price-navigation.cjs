const fs=require('fs');
function change(file,old,value){let s=fs.readFileSync(file,'utf8');if(!s.includes(old))throw Error(file+': '+old);fs.writeFileSync(file,s.replaceAll(old,value));}
change('pages/product.js',"const selected=p.variants.find(v=>v.available)||p.variants[0];","const selected=p.variants.filter(v=>v.available).sort((a,b)=>(a.priceFils??0)-(b.priceFils??0))[0]||p.variants[0];");
change('assets/js/product.js',"||product.variants.find(v=>v.available)||product.variants[0]","||product.variants.filter(v=>v.available).sort((a,b)=>(a.priceFils??0)-(b.priceFils??0))[0]||product.variants[0]");
change('lib/ui.js',"function card(p,ctx,options={}){","function card(p,ctx,options={}){\n const productUrl='/cakes/'+esc(p.handle)+(p.listingVariantId?'?variant='+esc(p.listingVariantId):'');");
change('lib/ui.js',"'/cakes/'+esc(p.handle)+'\"", "productUrl+'\"");
