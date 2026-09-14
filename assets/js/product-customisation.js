import {showTier} from './tier-configurator.js';
const form=document.getElementById('product-form');
const sections=[...form.querySelectorAll('[data-choice]')];
export function refreshChoices(){
 const rows=[...form.querySelectorAll('[data-tier-row]')];
 const tierSection=form.querySelector('[data-choice="tiers"]');
 tierSection.hidden=!rows.length;
 const complete=rows.filter(row=>row.querySelector('[data-tier-type]').value==='dummy'||[...row.querySelectorAll('.tier-flavours select')].every(s=>s.value)&&row.querySelector('[data-tier-weight]').validity.valid);
 form.querySelector('[data-choice-summary="tiers"]').textContent=complete.length===rows.length?'All '+rows.length+' tiers selected':complete.length+' of '+rows.length+' tiers selected';
 const message=form.elements.message.value.trim(),notes=form.elements.instructions.value.trim();
 form.querySelector('[data-choice-summary="details"]').textContent=message?'“'+message+'”'+(notes?' · Design notes added':''):notes?'Design notes added':'Optional · Message or design notes';
 const colouring=form.elements.colouring,allergens=form.elements.allergens;
 const summary=form.querySelector('[data-choice-summary="preferences"]');
 if(summary)summary.textContent=allergens.value==='decline'?'Please contact us before proceeding':colouring.value&&allergens.value==='accept'?(colouring.value==='natural'?'Natural cream colour':'Edible colouring')+' · Allergens acknowledged':'Two choices to confirm';
 const missing=rows.length-complete.length;
 document.getElementById('choice-progress').textContent=allergens?.value==='decline'?'Please contact us to discuss your requirements.':missing?'Choose flavours for '+missing+' remaining '+(missing===1?'tier.':'tiers.'):colouring&&(!colouring.value||allergens.value!=='accept')?'Confirm colour and allergens to continue.':'Your choices are ready. Final details are confirmed in your quotation.';
}
function openSection(section,focus=false){
 sections.forEach(s=>s.open=s===section);
 if(focus)section.querySelector('summary').focus();
}
export function validateChoices(container=form){
 const invalid=[...container.querySelectorAll('input,select,textarea')].find(el=>!el.disabled&&!el.validity.valid);
 if(!invalid)return true;
 const section=invalid.closest('[data-choice]');if(section)openSection(section);
 const tier=invalid.closest('[data-tier-row]');if(tier)showTier(Number(tier.dataset.tierRow));
 invalid.reportValidity();return false;
}
export function initChoices(){
 // Reveal missing fields before browser validation tries to focus a closed panel.
 form.noValidate=true;
 form.addEventListener('cake:tiers-saved',()=>{
  const tiers=form.querySelector('[data-choice="tiers"]');
  if(!validateChoices(tiers))return;
  refreshChoices();
  openSection(form.querySelector('[data-choice="details"]'),true);
 });
 sections.forEach(section=>section.querySelector('summary').addEventListener('click',()=>{
  if(!section.open)sections.filter(s=>s!==section).forEach(s=>s.open=false);
 }));
 form.addEventListener('click',event=>{
  const next=event.target.closest('[data-choice-next],[data-choice-done]');if(!next)return;
  const section=next.closest('[data-choice]');if(!validateChoices(section))return;
  if(section.querySelector('[name="allergens"]')?.value==='decline')return;
  refreshChoices();
  const target=sections.slice(sections.indexOf(section)+1).find(s=>!s.hidden);
  if(target)openSection(target,true);else{section.open=false;document.getElementById('add-to-cart').focus();}
 });
 form.addEventListener('input',refreshChoices);form.addEventListener('change',refreshChoices);
 refreshChoices();
 if(!sections.some(s=>s.open&&!s.hidden)){const first=sections.find(s=>!s.hidden);if(first)first.open=true;}
}
