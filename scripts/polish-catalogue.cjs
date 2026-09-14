const fs=require('fs');
function change(file,old,value){let s=fs.readFileSync(file,'utf8');if(!s.includes(old))throw Error(file+': '+old);fs.writeFileSync(file,s.replaceAll(old,value));}
change('server.js','totals(items.reduce((sum,item)=>sum+item.lineTotalFils,0),','totals(items.some(i=>i.quoteOnly)?null:items.reduce((sum,item)=>sum+item.lineTotalFils,0),');
change('lib/orders.js','totals(items.reduce((sum,item)=>sum+(item.lineTotalFils??0),0),','totals(items.some(i=>i.quoteOnly)?null:items.reduce((sum,item)=>sum+(item.lineTotalFils??0),0),');
change('lib/orders.js','variation: variant.title,','variation: require(\'./tier-options\').variationLabel(product,variant,tiers),');
change('server.js','variation:v.title,quantity:','variation:require(\'./lib/tier-options\').variationLabel(p,v,tiers),quantity:');
change('server.js','(?:products|licensed)','(?:products|licensed|studio)');
change('pages/policies.js','Images labelled as references or digitally visualised concepts are a starting point for discussion, not photographs of completed Maison Xavi orders.','The catalogue uses real cake photographs credited to their original bakeries. They are design references, not photographs of completed Maison Xavi orders.');
change('tests/cart-page.spec.js','/collections/candles','/collections/cupcakes-and-treats');
change('tests/storefront.spec.js',"['/privacy','Privacy & your details'],['/collections/candles','Birthday candles'],['/collections/cake-toppers','Cake toppers']","['/privacy','Privacy policy'],['/collections/fresh-flower-cakes','Fresh flower cakes'],['/collections/tiered-cakes','Tiered cakes']");
const masks=JSON.parse(fs.readFileSync('data/photo-masks.json'));
masks['2'].polygon=[[48,4],[54,3],[60,9],[66,12],[65,19],[70,21],[71,31],[70,37],[75,40],[78,45],[89,45],[95,53],[95,61],[90,66],[85,70],[83,78],[75,80],[74,84],[56,85],[49,82],[35,82],[25,78],[16,65],[14,58],[16,48],[20,39],[14,34],[11,28],[9,20],[8,13],[10,10],[14,12],[15,16],[22,18],[24,14],[32,10],[39,17],[46,14],[45,8]];
masks['2'].exclude=[[[0,88],[100,88],[100,100],[0,100]]];
masks['43'].polygon=[[40,13],[48,12],[55,14],[59,20],[66,21],[75,31],[79,45],[76,66],[73,77],[62,84],[43,85],[27,79],[24,67],[22,47],[21,35],[27,24],[30,17],[36,19],[40,21]];
masks['43'].include=[[[41,16],[48,14],[54,17],[57,22],[55,29],[48,31],[42,26]]];
masks['44'].polygon=[[23,41],[27,32],[32,28],[33,23],[40,20],[47,22],[50,27],[57,24],[65,26],[71,33],[74,45],[74,56],[72,70],[71,81],[63,86],[49,87],[36,84],[27,77],[25,65]];
masks['44'].include=[[[34,26],[40,22],[46,25],[49,31],[44,35],[37,33]]];
masks['10'].largest=true;
fs.writeFileSync('data/photo-masks.json',JSON.stringify(masks,null,2));
