const fs=require('fs');
function edit(file,from,to){const s=fs.readFileSync(file,'utf8');if(!s.includes(from))throw Error(file+': expected text missing');fs.writeFileSync(file,s.replace(from,to));}
edit('pages/product.js','product:{...p,searchText:undefined,originalTitle:undefined}',"product:{...p,tiers:require('../lib/tier-options').tierCount(p,selected),variants:p.variants.map(v=>({...v,tiers:require('../lib/tier-options').tierCount(p,v)})),searchText:undefined,originalTitle:undefined}");
edit('pages/home-content.js',"'birthday-cakes','fresh-flower-cakes','childrens-cakes'","'birthday-cakes','wedding-cakes','childrens-cakes'");
edit('tests/storefront.spec.js',"catalog.products.find(p=>p.tiers===1&&p.variants.length>1&&p.variants.every(v=>v.tiers===1)).id","catalog.featuredId");
edit('tests/storefront.spec.js',"['/collections/fresh-flower-cakes','Fresh flower cakes']","['/collections/wedding-cakes','Wedding cakes']");
edit('tests/layout-audit.spec.js',"catalog.products.find(p=>p.tiers===4)","catalog.products.find(p=>p.id==='8028660203745')");
edit('tests/atelier-checkout.spec.js',"p.kind==='cake'&&p.available&&p.tiers===1&&p.variants[0].tiers===1","p.kind==='cake'&&p.available&&require('../lib/tier-options').tierCount(p,p.variants[0])===1");
fs.mkdirSync('tests/archive',{recursive:true});
for(const name of ['verified-catalogue.test.js','currency-tiers.spec.js'])fs.copyFileSync('tests/'+name,'tests/archive/'+name+'.txt');
fs.writeFileSync('pages/photography.js',`'use strict';
const {crumb,shell}=require('../lib/ui');
function photography(ctx){
 const body='<main id="main" class="wrap photography-page">'+crumb([['Image sources']])+'<header class="page-intro"><p class="eyebrow">MAISON XAVI</p><h1>Design<br><em>references.</em></h1></header><div class="photography-copy"><section><h2>Catalogue photography</h2><p>The catalogue uses the original product photographs and variations from <a href="https://theperfectgift.ae/" target="_blank" rel="noopener noreferrer">The Perfect Gift</a>. These photographs illustrate the selected designs; they are not photographs of completed Maison Xavi orders.</p><p>Your cake size, colours, flavours and finishing details are confirmed with Maison Xavi before your order.</p></section></div></main>';
 return shell(ctx,{title:'Cake photograph sources',body,path:'/photography'});
}
module.exports={photography};
`);
