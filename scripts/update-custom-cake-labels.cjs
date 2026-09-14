'use strict';
const fs=require('node:fs');
function replace(file,pairs){
 let text=fs.readFileSync(file,'utf8');
 for(const [from,to]of pairs){if(!text.includes(from))throw Error(file+' missing '+from);text=text.replaceAll(from,to);}
 fs.writeFileSync(file,text);
}
replace('lib/ui.js',[
 ['Bespoke cakes','Custom cakes'],['Create a bespoke cake','Design your own cake'],
 ['WEDDING · LUXURY · BESPOKE','WEDDING · LUXURY · CUSTOM'],
 ["+navLink('/photography','About our images')",''],
 ['<span>Delivery across the UAE.</span></div></footer>','<span>Powered by <a href="https://hyperhive.ae">Hyperhive</a></span></div></footer>']
]);
replace('pages/home-content.js',[
 ['THE BESPOKE SERVICE','DESIGN YOUR OWN CAKE'],["'Create your own'","'Design your own cake'"],
 ['Create your custom cake','Design your own cake']
]);
replace('pages/forms.js',[['THE BESPOKE SERVICE','DESIGN YOUR OWN CAKE']]);
replace('pages/collection.js',[
 ['Discover bespoke','Design your own cake'],['Enquire about a bespoke cake','Request a custom cake']
]);
replace('pages/editorial.js',[
 ['the bespoke enquiry form','the custom cake enquiry form'],['Send a bespoke enquiry','Send a custom cake enquiry'],
 ['Begin a bespoke enquiry','Design your own cake']
]);
replace('pages/product.js',[[" <a href=\"/photography\">About our images</a>",'']]);
replace('server.js',[
 ["const {photography}=require('./pages/photography');\n",''],
 ["   if(pathname==='/photography')return page(photography(ctx));\n",''],
 [",'/photography'",'']
]);
replace('scripts/audit-site-alignment.cjs',[[",'/photography'",'']]);
replace('lib/enquiries.js',[["?'BESPOKE-'","?'CUSTOM-'"]]);
replace('tests/storefront.spec.js',[["toMatch(/^BESPOKE-/)","toMatch(/^CUSTOM-/)"]]);
const metadata=JSON.parse(fs.readFileSync('data/page-metadata.json','utf8'));
delete metadata['/photography'];
fs.writeFileSync('data/page-metadata.json',JSON.stringify(metadata,null,2)+'\n');
console.log('Updated custom cake labels, removed image information links and route, added Hyperhive footer credit.');
