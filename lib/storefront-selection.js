'use strict';
const selection=require('../data/storefront-selection.json');
const {isCakeProduct}=require('./product-categories');
const {tierCount}=require('./tier-options');
const DEFINITIONS=[
 ['wedding-cakes','wedding-cake-dubai','Wedding cakes','Occasions','Wedding cakes with floral arrangements, piped decoration and tiered designs.'],
 ['luxury-cakes','luxury-cakes','Luxury cakes','Occasions','Luxury cakes with tall tiers, sculpted decorations, metallic finishes and detailed flower arrangements.'],
 ['engagement-cakes','engagement-cakes','Engagement cakes','Occasions','Cakes for proposals and engagement parties, with floral, ring and engagement topper designs.'],
 ['tiered-cakes','tiered-cake','Tiered cakes','Design collections','Cakes with two or more tiers. Choose sponge and filling options for each edible tier.'],
 ['fresh-floral-cakes','fresh-floral-cakes','Fresh floral cakes','Design collections','Cakes decorated with fresh roses, peonies, dahlias and mixed flower arrangements.'],
 ['sugar-flower-cakes','sugar-flower-cakes','Sugar flower cakes','Design collections','Cakes decorated with sugar roses, peonies, magnolias and other flowers, in clusters or cascades.']
];
const luxury=new Set(selection.luxuryProductIds),engagement=new Set(selection.engagementProductIds);
const extravagantLuxury=new Set(require('../data/luxury-selection.json').approvedProductIds);
const importedPhotos=new Set(require('../data/catalog.json').products.flatMap(p=>[p.image,...p.images,...p.variants.map(v=>v.image)]).filter(Boolean));
const hasImportedPhoto=p=>[p.image,...(p.images||[]),...(p.variants||[]).map(v=>v.image)].some(image=>importedPhotos.has(image));
function selectStorefront(catalog){
 const products=catalog.products.filter(isCakeProduct).flatMap(p=>{
  // Image replacements are applied before selection. Hide any design still referencing an imported photo.
  if(selection.excludeUnreplacedPerfectGift&&hasImportedPhoto(p))return [];
  if(['curated-2026-09','luxury-2026-09','downloaded-2026-09'].includes(p.catalogueAddition))return [{...p,categories:p.categories.filter(id=>DEFINITIONS.some(([,allowed])=>allowed===id)&&!(id==='luxury-cakes'&&p.categories.includes('wedding-cake-dubai')))}];
  const wedding=p.categories.includes('wedding-cake-dubai')&&!/engagement/i.test(p.title);
  const material=selection.flowerMaterials[p.id]?.material;
  if(!wedding&&!luxury.has(p.id)&&!engagement.has(p.id)&&!material)return [];
  const categories=[];
  if(wedding)categories.push('wedding-cake-dubai');
  if(!wedding&&luxury.has(p.id))categories.push('luxury-cakes');
  if(engagement.has(p.id))categories.push('engagement-cakes');
  if(p.variants.some(v=>tierCount(p,v)>=2))categories.push('tiered-cake');
  if(material==='fresh')categories.push('fresh-floral-cakes');
  if(material==='sugar')categories.push('sugar-flower-cakes');
  return [{...p,categories}];
 }).map(p=>({...p,categories:p.categories.filter(id=>id!=='luxury-cakes'||extravagantLuxury.has(p.id))}));
 return {...catalog,products,featuredId:products.some(p=>p.id===catalog.featuredId)?catalog.featuredId:products[0]?.id,
  categories:DEFINITIONS.map(([,id,title])=>({id,title,count:products.filter(p=>p.categories.includes(id)).length}))};
}
module.exports={selectStorefront,DEFINITIONS};
