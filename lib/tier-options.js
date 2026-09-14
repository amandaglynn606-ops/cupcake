'use strict';
// Use the original imported wedding cake menu, preserving its exact option values.
const source=require('../data/catalog.json').products.find(p=>p.id==='8028660433121');
const values=pattern=>[...new Set(source.variants.map(v=>v.options[source.optionNames.findIndex(name=>pattern.test(name))]))];
const choices={sponges:values(/sponge/i),fillings:values(/cream/i)};
function tierCount(product,variant){
 const text=[variant.title,product.title].join(' ');
 const match=text.match(/\b(two|three|four|five|six|seven|eight|nine|ten|[2-9]|10)[ -]*tier(?:ed|s)?\b/i);
 const words={two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
 return variant.tiers||product.tiers||(match?(words[match[1].toLowerCase()]||Number(match[1])):1);
}
function variationLabel(product,variant,tiers){
 if(!tiers?.length)return variant.title;
 const options=variant.options.filter((_,i)=>!/flavo[u]?r|sponge|filling|cream/i.test(product.optionNames[i]));
 return options.join(' / ')||tierCount(product,variant)+' tiers · personalised flavours';
}
function validateTiers(value,product,variant,{required=false}={}){
 const count=tierCount(product,variant);
 if(value===undefined||value===null||Array.isArray(value)&&!value.length){
  if(required&&count>1)throw new Error('Please choose edible or display tiers and the sponge and filling for each edible tier.');
  return [];
 }
 if(!Array.isArray(value)||count<2||value.length!==count||count>10)throw new Error('Please review the number of cake tiers.');
 return value.map((tier,index)=>{
  if(!tier||!['edible','dummy'].includes(tier.type))throw new Error('Choose edible cake or a display (dummy) tier.');
  if(tier.type==='dummy')return {tier:index+1,type:'dummy',sponge:'',filling:''};
  if(!choices.sponges.includes(tier.sponge)||!choices.fillings.includes(tier.filling))throw new Error('Choose a valid sponge and filling for every edible tier.');
  const weightLb=require('./cake-size').requestedWeight(tier.weightLb);
  return {tier:index+1,type:'edible',sponge:tier.sponge,filling:tier.filling,...(weightLb!==undefined?{weightLb}:{})};
 });
}
module.exports={choices,tierCount,validateTiers,variationLabel};
