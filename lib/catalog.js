'use strict';
const {STYLES,TIERS,weddingMeta,matchesTier}=require('./weddings');
const {filterProfile}=require('./filter-profiles');
const {isCakeProduct,assignProductCategories,NON_CAKE_CATEGORIES}=require('./product-categories');
const DEFINITIONS = [
  ['birthday-cakes','birthday-cake-dubai','Birthday cakes','Celebrations','From candlelit dinners to milestone birthdays. Choose the cake, then make the details your own.'],
  ['wedding-cakes','wedding-cake-dubai','Wedding cakes','Celebrations','Sculptural tiers, delicate piping and considered finishes for your wedding table.'],
  ['fresh-flower-cakes','fresh-flower-cakes','Fresh flower cakes','Design collections','Real blooms, soft colour and natural movement. Explore cakes decorated with fresh flowers.'],
  ['childrens-cakes','birthday-cake-for-children-kids-dubai','Children’s cakes','Celebrations','Favourite characters, imaginative themes and cakes for their most anticipated day.'],
  ['baby-showers','cake-for-baby-shower-gender-reveal','Baby showers & reveals','Celebrations','A collection for new beginnings, from a first gathering to the moment of the reveal.'],
  ['cakes-for-her','dubai-cake-for-her-woman','For her','Celebrations','Florals, ribbons and statement designs, ready for a personal finishing touch.'],
  ['cakes-for-him','dubai-cake-for-him-men','For him','Celebrations','A considered selection of designs for his birthday, milestone or celebration.'],
  ['newborn-cakes','cake-for-newborn-baby-dubai','Welcome, little one','Celebrations','Cakes for welcoming the newest member of the family.'],
  ['christening-cakes','baptism-cake-dubai','Christenings & communions','Celebrations','Thoughtful designs for family ceremonies and meaningful first occasions.'],
  ['graduation-cakes','graduation-cake-dubai','Graduation','Celebrations','A cake to mark the achievement and the chapter ahead.'],
  ['corporate-cakes','corporate-branded-cakes','Corporate celebrations','Celebrations','Logo-led designs and celebration cakes for launches, teams and business milestones.'],
  ['signature-cakes','birthday-cakes-dubai','Signature cakes','Design collections','Explore a collection of classic celebration cakes and distinctive finishes.'],
  ['ribbon-cakes','birthday-cake-with-ribbon-bows-dubai','Ribbons & bows','Design collections','Soft ribbons, intricate piping and a palette of delicate colours.'],
  ['lambeth-cakes','lambeth-birthday-cake-dubai','Lambeth & vintage','Design collections','Layered piping and ornamental detail, inspired by traditional celebration cakes.'],
  ['heart-cakes','heart-shaped-cake-dubai','Heart-shaped cakes','Design collections','Romantic silhouettes for birthdays, anniversaries and gestures of affection.'],
  ['tiered-cakes','tiered-cake','Tiered cakes','Design collections','Statement cakes with height, presence and room for the details.'],
  ['crown-cakes','crown-birthday-cake-dubai','Crown cakes','Design collections','A regal finish for the guest of honour.'],
  ['butterfly-cakes','butterfly-cake-dubai','Butterfly cakes','Design collections','Delicate winged details and soft colour palettes.'],
  ['balloon-cakes','balloon-birthday-cake-dubai','Balloon cakes','Design collections','Playful, balloon-inspired cake designs for the celebration table.'],
  ['glitter-cakes','glitter-shiny-birthday-cakes-dubai','Glitter & shimmer','Design collections','Light-catching finishes with a touch of theatre.'],
  ['number-letter-cakes','letter-number-shaped-cakes-dubai','Letters & numbers','Design collections','Make a name, an age or a milestone the centrepiece.'],
  ['photo-cakes','photo-birthday-cake-dubai','Photo cakes','Design collections','A favourite image becomes part of the celebration. Image details are arranged after your request.'],
  ['cupcakes-and-treats','cupcakes-cookies-cakepops','Cupcakes & petite treats','Pâtisserie & seasonal','Cupcakes, decorated cookies and cakepops for gifting and dessert tables.'],
  ['chocolate-smash','choco-smash-cakes','Chocolate smash cakes','Pâtisserie & seasonal','Chocolate shells and surprise-filled designs made for an occasion.'],
  ['diwali-cakes','diwali-cakes-dubai','Diwali collection','Pâtisserie & seasonal','A festive selection to share with family, friends and colleagues.'],
  ['football-cakes','fifa-world-cup-football-cake-gift-dubai','Football collection','Pâtisserie & seasonal','For match days, team celebrations and devoted supporters.'],
  ['candles','birthday-candles','Birthday candles','Pâtisserie & seasonal','The finishing touch for a birthday wish.'],
  ['cake-toppers','cake-toppers','Cake toppers','Pâtisserie & seasonal','Choose a finishing detail for your celebration cake.']
];
const FLAVOURS = [['chocolate','Chocolate'],['vanilla','Vanilla'],['red-velvet','Red velvet'],['strawberry','Strawberry'],['pistachio','Pistachio'],['lemon','Lemon'],['caramel','Caramel'],['coconut','Coconut']];
const SIZE_RULES = [['1-kg','1 kg',/\b1\s*(?:kg|kilo)/i],['2-kg','2 kg',/\b2\s*(?:kg|kilo)/i],['3-kg','3 kg',/\b3\s*(?:kg|kilo)/i],['small','Small',/\bsmall\b/i],['medium','Medium',/\bmedium\b/i],['large','Large',/\blarge\b/i]];
const searchTerms=text=>text.toLowerCase().replace(/\b(roses|flowers|cakes|tiers)\b/g,word=>word.slice(0,-1));
function buildCatalog(catalog,{curated=false}={}) {
  // Apply individually reviewed image matches without altering imported inventory or pricing.
  const cakeCategoryIds=new Set(DEFINITIONS.map(([,id])=>id).filter(id=>!NON_CAKE_CATEGORIES.has(id)));
  catalog = {...catalog, products:catalog.products.map(p=>require('./image-matches').applyImageMatch(assignProductCategories(p,cakeCategoryIds)))};
  catalog.categories=(catalog.categories||[]).map(c=>({...c,count:catalog.products.filter(p=>p.categories.includes(c.id)).length}));
  if(curated){
    catalog=require('./storefront-selection').selectStorefront(catalog);
    catalog={...catalog,products:catalog.products.map(require('./cake-backgrounds').applyCakeBackground)};
    const copy=require('../data/product-copy.json');
    catalog={...catalog,products:catalog.products.map(p=>copy[p.id]?{...p,...copy[p.id],searchText:copy[p.id].title+' '+copy[p.id].description}:p)};
  }
  const definitions=curated?require('./storefront-selection').DEFINITIONS:DEFINITIONS;
  const additionPriority=p=>p.collectionBatch==='downloads-2026-09-14'?4:p.collectionBatch==='extravagant-2026-09'?3:p.catalogueAddition==='luxury-2026-09'?2:Number(!!p.catalogueAddition);
  const collections = definitions.map(([slug,id,title,group,description]) => ({slug,id,title,group,description,products:catalog.products.filter(p=>p.categories.includes(id)).sort((a,b)=>additionPriority(b)-additionPriority(a))})).filter(c=>curated||c.products.length);
  const bySlug = new Map(collections.map(c=>[c.slug,c]));
  const byId = new Map(catalog.products.map(p=>[p.id,p]));
  const byHandle = new Map(catalog.products.map(p=>[p.handle,p]));
  const variantMeta = new Map();
  for(const p of catalog.products) for(const v of p.variants){
    const flavorOptions = p.optionNames.some(name=>/flavo[u]?r|sponge|filling|cream|base|chocolate/i.test(name));
    const flavorText = (flavorOptions?v.options.filter((_,i)=>/flavo[u]?r|sponge|filling|cream|base|chocolate/i.test(p.optionNames[i])).join(' '):p.title).toLowerCase();
    const sizeText = v.options.filter((_,i)=>/size|weight/i.test(p.optionNames[i])).join(' ');
    variantMeta.set(v.id,{flavours:FLAVOURS.filter(([id])=>flavorText.includes(id.replace('-',' '))).map(([id])=>id),sizes:SIZE_RULES.filter(([, ,re])=>re.test(sizeText)).map(([id])=>id)});
  }
  function query(slug, params, {includeAllProducts=false}={}) {
    const collection = slug === 'all' ? null : bySlug.get(slug);
    if(slug !== 'all' && !collection) return null;
    const q = (params.get('q')||'').trim().slice(0,120);
    const selectedCategories = slug==='all'?params.getAll('category').filter(s=>bySlug.has(s)):[];
    const flavours = params.getAll('flavour').filter(s=>FLAVOURS.some(([id])=>id===s));
    const sizes = params.getAll('size').filter(s=>SIZE_RULES.some(([id])=>id===s));
    const wedding=slug==='wedding-cakes';
    const tiered=wedding||['tiered-cakes','crown-cakes','luxury-cakes','engagement-cakes','fresh-floral-cakes','sugar-flower-cakes'].includes(slug);
    const profile=filterProfile(slug);
    const selectedFeatures=profile.map(group=>({...group,selected:params.getAll(group.key).filter(id=>group.items.some(item=>item.id===id))}));
    const styles=wedding?params.getAll('style').filter(s=>STYLES.some(([id])=>id===s)):[];
    const tiers=tiered?params.getAll('tier').filter(s=>TIERS.some(([id])=>id===s)):[];
    const parsePrice = key => {const value=params.get(key);return value!==null&&value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0?Math.round(Number(value)*100):null;};
    const min = parsePrice('min'), max = parsePrice('max');
    const available = params.get('available') === '1';
    const sort = ['featured','price-asc','price-desc','name'].includes(params.get('sort'))?params.get('sort'):'featured';
    const base=(collection?collection.products:catalog.products.filter(p=>includeAllProducts||isCakeProduct(p))).filter(p=>!q||searchTerms(q).split(/\s+/).every(term=>searchTerms(p.title+' '+p.description+' '+(p.searchText||'')).includes(term)));
    const matches=[];
    for(const p of base){
      if(wedding||tiered){const meta=weddingMeta(p);if(styles.length&&!styles.some(s=>meta.styles.includes(s)))continue;if(tiers.length&&!tiers.some(t=>matchesTier(p,t)))continue;}
      if(selectedFeatures.some(group=>group.selected.length&&!group.items.some(item=>group.selected.includes(item.id)&&item.matches(p))))continue;
      if(selectedCategories.length&&!selectedCategories.some(s=>p.categories.includes(bySlug.get(s).id)))continue;
      if(p.quoteOnly){
        if(min!==null||max!==null||flavours.length||sizes.length)continue;
        matches.push({...p,listingVariantId:p.variants[0].id,listingPriceFils:null,listingMaxFils:null});continue;
      }
      const variants=p.variants.filter(v=>{
        const meta=variantMeta.get(v.id);
        const count=v.tiers||weddingMeta(p).tierCount;
        const tierMatches=!tiers.length||tiers.some(t=>t==='6-plus'?count>=6:t==='4-plus'?count>=4:String(count)===t);
        return tierMatches&&(!available||v.available)&&(min===null||v.priceFils>=min)&&(max===null||v.priceFils<=max)&&(!flavours.length||flavours.some(f=>meta.flavours.includes(f)))&&(!sizes.length||sizes.some(s=>meta.sizes.includes(s)));
      });
      if(!variants.length)continue;
      const active=variants.filter(v=>v.available);
      const shown=active.length?active:variants;
      const listingVariant=shown.reduce((a,b)=>a.priceFils<=b.priceFils?a:b);
      matches.push({...p,listingVariantId:listingVariant.id,listingPriceFils:Math.min(...shown.map(v=>v.priceFils)),listingMaxFils:Math.max(...shown.map(v=>v.priceFils))});
    }
    if(sort==='price-asc')matches.sort((a,b)=>a.quoteOnly?1:b.quoteOnly?-1:a.listingPriceFils-b.listingPriceFils);
    if(sort==='price-desc')matches.sort((a,b)=>a.quoteOnly?1:b.quoteOnly?-1:b.listingPriceFils-a.listingPriceFils);
    if(sort==='name')matches.sort((a,b)=>a.title.localeCompare(b.title));
    const pageCount=Math.max(1,Math.ceil(matches.length/12));
    const page=Math.min(pageCount,Math.max(1,parseInt(params.get('page'))||1));
    const facets={
      availableCount:base.filter(p=>p.available).length,
      styles:wedding?STYLES.map(([id,label])=>({id,label,count:base.filter(p=>weddingMeta(p).styles.includes(id)).length})).filter(f=>f.count):[],
      tiers:tiered?TIERS.map(([id,label])=>({id,label,count:base.filter(p=>matchesTier(p,id)).length})).filter(f=>f.count):[],
      features:selectedFeatures.map(group=>({...group,items:group.items.map(item=>({...item,count:base.filter(item.matches).length})).filter(item=>item.count)})).filter(group=>group.items.length),
      categories:collections.filter(c=>c.slug!==slug).map(c=>({...c,count:base.filter(p=>p.categories.includes(c.id)).length})).filter(c=>c.count),
      flavours:FLAVOURS.map(([id,label])=>({id,label,count:base.filter(p=>p.variants.some(v=>variantMeta.get(v.id).flavours.includes(id))).length})).filter(f=>f.count),
      sizes:SIZE_RULES.map(([id,label])=>({id,label,count:base.filter(p=>p.variants.some(v=>variantMeta.get(v.id).sizes.includes(id))).length})).filter(f=>f.count)
    };
    return {collection,q,selectedCategories,flavours,sizes,styles,tiers,selectedFeatures,min,max,available,sort,facets,page,pageCount,total:matches.length,products:matches.slice((page-1)*12,page*12),params};
  }
  return {catalog,collections,bySlug,byId,byHandle,query};
}
module.exports={buildCatalog};
