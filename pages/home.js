'use strict';
const {cakeImageClass}=require('../lib/cake-images');
const {esc,img,link,card,shell,crumb,icon}=require('../lib/ui');
function collectionCard(c,ctx,large=false,eligible=()=>true){
 const theme=c.slug==='childrens-cakes'?/teddy|bunny|rainbow/i:c.slug==='cupcakes-and-treats'?/cupcakes|cakepops/i:null;
 const photographed=c.products.filter(p=>eligible(p)&&p.available&&p.image!=='assets/maison-photo-pending.svg');
 const descriptions={'wedding-cakes':'Floral, piped and tiered wedding designs.','luxury-cakes':'Tall cakes and sculpted decorations.','engagement-cakes':'Cakes for proposals and engagement parties.','tiered-cakes':'Two tiers and above, with flavours by tier.','fresh-floral-cakes':'Fresh flowers in single or mixed arrangements.','sugar-flower-cakes':'Sugar roses, peonies and other flowers.'};
 const covers={'wedding-cakes':'9900000000038','luxury-cakes':'9920000000003','engagement-cakes':'9900000000001','tiered-cakes':'9900000000032','fresh-floral-cakes':'9900000000015','sugar-flower-cakes':'9900000000010'};
 const p=photographed.find(p=>p.id===covers[c.slug])||(theme&&photographed.find(p=>theme.test(p.title)))||photographed[0]||c.products.find(eligible);
 if(!p)return '';
 return '<article class="collection-tile'+(large?' collection-feature':'')+'"><div class="collection-image"><a href="/collections/'+c.slug+'" aria-label="Explore '+esc(c.title)+'"><img class="'+cakeImageClass(p)+'" src="'+esc(img(p.image,900))+'" alt="'+esc(p.imageAlt||p.title)+'" width="800" height="950" loading="lazy"></a><button type="button" class="image-zoom collection-zoom" data-collection-zoom aria-label="Enlarge '+esc(c.title)+' photo">'+icon('zoom')+'</button></div><a href="/collections/'+c.slug+'" class="collection-caption"><div><span class="eyebrow">'+c.products.length+' DESIGNS</span><h3>'+esc(c.title)+'</h3>'+(large?'<p class="collection-description">'+esc(descriptions[c.slug]||c.description)+'</p>':'')+'</div></a></article>';
}
function home(ctx){return require('./home-content').home(ctx,collectionCard);}
function directory(ctx){
 const groups=[...new Set(ctx.collections.map(c=>c.group))].map((group,i)=>[group,'collection-group-'+i]);
 const body='<main id="main" class="wrap">'+crumb([['The collections']])+'<section class="directory-intro"><p class="eyebrow">THE MAISON COLLECTIONS</p><h1>Browse our<br><em>cake collections.</em></h1><p>Find wedding, luxury and engagement cakes, plus tiered, fresh floral and sugar flower designs.</p></section><nav class="directory-nav" aria-label="Collection groups">'+groups.map(([group,id])=>'<a href="#'+id+'">'+esc(group)+'</a>').join('')+link('/collections/all','Shop all cakes')+'</nav>'+groups.map(([group,id])=>'<section class="directory-group" id="'+id+'"><div class="section-heading"><h2>'+esc(group)+'</h2><span class="eyebrow">'+ctx.collections.filter(c=>c.group===group).length+' COLLECTIONS</span></div><div class="collection-grid">'+ctx.collections.filter(c=>c.group===group).map(c=>collectionCard(c,ctx)).join('')+'</div></section>').join('')+'</main>';
 return shell(ctx,{title:'The collections',body,path:'/collections',scripts:['collection-zoom']});
}
module.exports={home,directory,collectionCard};
