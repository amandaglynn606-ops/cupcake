'use strict';
const fs=require('node:fs');
function replace(file,pairs){
 let source=fs.readFileSync(file,'utf8');
 for(const [from,to]of pairs){if(!source.includes(from))throw Error(file+' missing '+from);source=source.replaceAll(from,to);}
 fs.writeFileSync(file,source);
}
replace('lib/product-customisation.js',[
 [" return '<div class=\"cake-choices\"", " return '<label class=\"cake-guests\">Number of guests <small>Optional</small><input type=\"number\" name=\"guests\" min=\"1\" max=\"99999\" step=\"1\" inputmode=\"numeric\" placeholder=\"e.g. 80\" aria-describedby=\"cake-size-note\"></label><p id=\"cake-size-note\" class=\"cake-size-note\">Share your guest count for sizing guidance. Final weight and price are confirmed with you.</p><div class=\"cake-choices\""]
]);
replace('assets/js/tier-configurator.js',[
 ["{type:row.querySelector('[data-tier-type]').value,sponge:","{type:row.querySelector('[data-tier-type]').value,weightLb:row.querySelector('[data-tier-weight]').value,sponge:"],
 ["{type:'edible',sponge:'',filling:''}","{type:'edible',sponge:'',filling:'',weightLb:''}"],
 ['<div class="tier-content"><label>Tier type','<div class="tier-content"><div class="tier-size-fields"><label>Tier type'],
 ['</select></label><div class="tier-flavours"', '</select></label><label>Weight (lb) <small>Optional</small><input type="number" data-tier-weight name="tier-\'+(i+1)+\'-weight" min="0.5" max="500" step="0.5" inputmode="decimal" placeholder="e.g. 5" value="\'+esc(value.weightLb??\'\')+\'"\'+(value.type===\'dummy\'?\' disabled\':\'\')+\'></label></div><div class="tier-flavours"'],
 ["row.querySelectorAll('select')","row.querySelectorAll('input,select')"],
 ["row.querySelector('.tier-flavours').hidden=dummy;","row.querySelector('.tier-flavours').hidden=dummy;\n  row.querySelector('[data-tier-weight]').disabled=dummy;"],
 ["const sponge=row.querySelector('[data-tier-sponge]').value,filling=row.querySelector('[data-tier-filling]').value;", "const sponge=row.querySelector('[data-tier-sponge]').value,filling=row.querySelector('[data-tier-filling]').value;\n  const weight=row.querySelector('[data-tier-weight]');"],
 ["row.dataset.complete=String(dummy||!!(sponge&&filling));", "if(!dummy&&weight.value&&weight.validity.valid)row.querySelector('[data-tier-summary]').textContent+=' · '+weight.value+' lb';\n  row.dataset.complete=String(dummy||!!(sponge&&filling&&weight.validity.valid));"],
 ["const type=row.querySelector('[data-tier-type]').value;", "const type=row.querySelector('[data-tier-type]').value;\n  const weight=type==='edible'?row.querySelector('[data-tier-weight]').value:'';"],
 ["return {tier:Number(row.dataset.tierRow),type,sponge:", "return {tier:Number(row.dataset.tierRow),type,...(weight?{weightLb:Number(weight)}:{}),sponge:"]
]);
replace('assets/js/product.js',[
 [" personalisation.tiers=selectedTiers();"," personalisation.tiers=selectedTiers();\n if(fields.get('guests'))personalisation.guests=Number(fields.get('guests'));"],
 ["['message','instructions','colouring','allergens']","['message','instructions','colouring','allergens','guests']"],
 ["row.querySelector('[data-tier-type]').value=tier.type;","row.querySelector('[data-tier-type]').value=tier.type;\n  row.querySelector('[data-tier-weight]').value=tier.weightLb??'';"]
]);
replace('assets/js/product-customisation.js',[
 ["[...row.querySelectorAll('.tier-flavours select')].every(s=>s.value)", "[...row.querySelectorAll('.tier-flavours select')].every(s=>s.value)&&row.querySelector('[data-tier-weight]').validity.valid"]
]);
replace('assets/js/app.js',[
 ["return [item.message?", "return [p.guests?'Number of guests: '+p.guests:'',item.message?"],
 ["'Edible cake · '+t.sponge+' sponge · '+t.filling", "'Edible cake'+(t.weightLb?' · '+t.weightLb+' lb':'')+' · '+t.sponge+' sponge · '+t.filling"]
]);
console.log('Added tier weights and guest counts, including cart editing and request summaries.');
