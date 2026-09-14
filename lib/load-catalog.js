'use strict';
function loadCatalog(){
 const original=require('../data/catalog.json');
 const additions=require('../data/wedding-additions.json').products;
 const curated=require('../data/curated-additions.json').products;
 const luxury=require('../data/luxury-additions.json').products;
 const extravagant=require('../data/extravagant-additions.json').products;
 const downloaded=require('../data/downloaded-additions.json').products;
 const products=[...original.products,...additions,...curated,...luxury,...extravagant,...downloaded];
 for(const field of ['id','handle'])if(new Set(products.map(p=>p[field])).size!==products.length)throw Error('Duplicate product '+field);
 return {...original,products,categories:original.categories.map(c=>({...c,count:products.filter(p=>p.categories.includes(c.id)).length}))};
}
module.exports={loadCatalog};
