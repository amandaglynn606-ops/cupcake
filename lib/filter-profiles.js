'use strict';
const {flowerFilters}=require('./flower-details');
// Collection-specific facets use catalog titles/categories, never unrelated collections.
const title=(id,label,re)=>({id,label,matches:p=>re.test(p.title+' '+(p.originalTitle||''))});
const group=(key,label,items)=>({key,label,items});
const colours=()=>group('colour','Colour',[
 title('white','White & ivory',/white|ivory/i),title('pink','Pink & blush',/pink|blush/i),title('blue','Blue',/blue/i),title('red','Red',/\bred\b/i),title('gold','Gold',/gold/i),title('silver','Silver',/silver/i),title('purple','Purple & lilac',/purple|lilac/i),title('black','Black',/black/i)
]);
const shapes=()=>group('shape','Shape',[
 title('heart','Heart-shaped',/heart/i),title('round','Round',/round/i),title('square','Square & rectangular',/square|rectang/i)
]);
const treats=()=>group('treat','Treat type',[
 title('cupcakes','Cupcakes',/cupcakes?/i),title('cookies','Cookies',/cookies?/i),title('cakepops','Cake pops',/cake\s?pops?/i),title('cakesicles','Cakesicles',/cakesicles?/i),title('macarons','Macarons',/macarons?/i),title('chocolates','Chocolates',/chocolate|choco-/i),title('cakes','Cakes',/\bcake\b/i)
]);
const finishes=()=>group('finish','Finishing details',[
 title('floral','Flowers',/floral|flower|rose|orchid|peon/i),title('ribbon','Ribbons & bows',/ribbon|bow/i),title('pearls','Pearls',/pearl/i),title('gold','Gold details',/gold/i),title('butterflies','Butterflies',/butterfl/i)
]);
const designs=()=>group('design','Cake design',[
 title('vintage','Vintage & Lambeth',/lambeth|vintage/i),title('ribbons','Ribbons & bows',/ribbon|bow/i),title('floral','Floral',/floral|flowers?|roses?/i),title('crown','Crowns',/crown/i),title('number','Numbers & letters',/number|letter|\bno\.?\s*\d/i),title('photo','Photo cakes',/photo/i),title('heart','Hearts',/heart/i)
]);
const children=()=>group('theme','Cake theme',[
 title('animals','Animals & teddy bears',/teddy|bear|bunny|rabbit|lion|safari|jungle|dinosaur|elephant|cat\b|dog\b|panda/i),title('princess','Princesses & fairytales',/princess|frozen|elsa|unicorn|mermaid|fairy|castle/i),title('superheroes','Superheroes',/superhero|spider.?man|batman|superman|avenger|hulk/i),title('vehicles','Cars & vehicles',/\bcars?\b|truck|train|plane|tractor|wheel/i),title('gaming','Gaming',/gaming|minecraft|roblox|playstation|fortnite|mario/i),title('cartoons','Cartoon characters',/mickey|minnie|peppa|paw patrol|cocomelon|pokemon|pikachu|sponge.?bob|minion/i),title('sport','Sports',/football|soccer|basketball|sports?/i)
]);
const baby=()=>group('theme','Baby celebration theme',[
 title('reveal','Gender reveal',/gender|reveal/i),title('teddy','Teddy bears',/teddy|bear/i),title('bunny','Bunnies',/bunny|rabbit/i),title('stars','Stars & moon',/star|moon/i),title('baby','Baby details',/carriage|rattle|dress|feet|foot|bottle|blanket/i)
]);
function filterProfile(slug){
 const profiles={
  'luxury-cakes':[finishes(),colours()],
  'engagement-cakes':[shapes(),finishes(),colours()],
  'fresh-floral-cakes':[...flowerFilters(),colours(),shapes()],
  'sugar-flower-cakes':[...flowerFilters(),colours()],
  'fresh-flower-cakes':[group('design','Floral design',[title('cascade','Cascading flowers',/cascade/i),title('semi-naked','Semi-naked finish',/semi.naked/i),title('tiered','Tiered designs',/wedding|cascade/i)])],
  'birthday-cakes':[designs()],
  'childrens-cakes':[children()],
  'baby-showers':[baby()],
  'cakes-for-her':[designs(),colours()],
  'cakes-for-him':[group('theme','Cake theme',[title('sport','Sports',/football|basketball|golf|sport/i),title('cars','Cars & motoring',/car\b|cars\b|ferrari|porsche|mercedes|bmw/i),title('gaming','Gaming',/gaming|playstation|xbox|console/i),title('travel','Travel',/travel|plane|luggage|passport/i),title('classic','Classic & chocolate',/ferrero|chocolate|classic/i)])],
  'newborn-cakes':[baby(),colours()],
  'christening-cakes':[group('theme','Celebration details',[title('angels','Angels',/angel|wing/i),title('cross','Crosses',/cross/i),title('names','Names & initials',/name|initial|personal/i)])],
  'graduation-cakes':[group('design','Graduation design',[title('cap','Graduation caps',/cap|hat/i),title('heart','Heart-shaped',/heart/i),title('floral','Floral',/floral|flower/i)])],
  'corporate-cakes':[group('design','Cake design',[title('logo','Company logo',/logo/i),title('photo','Corporate photo',/photo/i),title('berries','Berries',/berr/i)])],
  'signature-cakes':[group('recipe','Recipe',[title('chocolate','Chocolate',/chocolate|ferrero/i),title('pistachio','Pistachio',/pistachio/i),title('lemon','Lemon',/lemon/i),title('fruit','Fruit & berries',/berr|fruit|mango/i),title('vanilla','Vanilla',/vanilla/i)])],
  'ribbon-cakes':[colours(),shapes()],
  'lambeth-cakes':[shapes(),colours()],
  'heart-cakes':[group('design','Heart cake style',[title('vintage','Vintage piping',/lambeth|vintage/i),title('ribbons','Ribbons & bows',/ribbon|bow/i),title('berries','Berries',/berr/i),title('smash','Chocolate smash',/smash/i),title('glitter','Glitter',/glitter|shimmer|blow.?out/i)]),colours()],
  'tiered-cakes':[finishes()],
  'crown-cakes':[colours()],
  'butterfly-cakes':[colours()],
  'balloon-cakes':[colours()],
  'glitter-cakes':[colours(),shapes()],
  'number-letter-cakes':[group('design','Letter or number',[title('numbers','Number cakes',/number|\bno\.?\s*\d/i),title('letters','Letter cakes',/letter|initial/i)]),finishes()],
  'photo-cakes':[shapes()],
  'cupcakes-and-treats':[treats()],
  'chocolate-smash':[group('shape','Smash cake shape',[title('heart','Hearts',/heart/i),title('football','Footballs',/football/i),title('crescent','Crescents',/crescent/i),title('dome','Domes',/dome/i)])],
  'diwali-cakes':[group('theme','Diwali design',[title('elephant','Elephants',/elephant/i),title('peacock','Peacocks',/peacock/i),title('diya','Diyas & lights',/diya|light/i)])],
  'football-cakes':[group('design','Cake design',[title('football','Football',/football/i),title('smash','Chocolate smash',/smash/i)])],
  'candles':[group('design','Candle type',[title('numbers','Number candles',/\bno\.?\s*\d|number/i),title('long','Long candles',/long|tall/i)]),colours(),group('number','Candle number',Array.from({length:10},(_,i)=>title(String(i),String(i),new RegExp('\\b(?:no\\.?\\s*|number\\s*)'+i+'\\b','i'))))],
  'cake-toppers':[group('design','Topper type',[title('birthday','Happy birthday',/birthday/i),title('numbers','Numbers',/number/i),title('congratulations','Congratulations',/congrat/i),title('baby','Baby celebrations',/baby|boy|girl/i)]),group('material','Material',[title('acrylic','Acrylic',/acrylic/i),title('wood','Wood',/wood/i)]),colours()]
 };
 return profiles[slug]||[];
}
module.exports={filterProfile};
