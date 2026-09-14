import {data,esc} from './app.js';
const host=document.getElementById('tier-configurator');
const choices=data.tierOptions;
let count=0,active=1;
const saved=new Map();
function capture(){
 host.querySelectorAll('[data-tier-row]').forEach(row=>saved.set(Number(row.dataset.tierRow),{type:row.querySelector('[data-tier-type]').value,weightLb:row.querySelector('[data-tier-weight]').value,sponge:row.querySelector('[data-tier-sponge]').value,filling:row.querySelector('[data-tier-filling]').value}));
}
const options=(values,selected)=>'<option value="">Please select</option>'+values.map(v=>'<option'+(v===selected?' selected':'')+'>'+esc(v)+'</option>').join('');
export function showTier(n,focus=false){
 active=n;
 host.querySelectorAll('[data-tier-row]').forEach(row=>{row.open=Number(row.dataset.tierRow)===n;if(row.open&&focus)row.querySelector('summary').focus();});
}
function refreshTiers(){
 host.querySelectorAll('[data-tier-row]').forEach(row=>{
  const dummy=row.querySelector('[data-tier-type]').value==='dummy';
  const sponge=row.querySelector('[data-tier-sponge]').value,filling=row.querySelector('[data-tier-filling]').value;
  const weight=row.querySelector('[data-tier-weight]');
  row.querySelector('[data-tier-summary]').textContent=dummy?'Display tier · Not edible':sponge&&filling?sponge+' · '+filling:'Choose sponge & cream';
  if(!dummy&&weight.value&&weight.validity.valid)row.querySelector('[data-tier-summary]').textContent+=' · '+weight.value+' lb';
  row.dataset.complete=String(dummy||!!(sponge&&filling&&weight.validity.valid));
 });
 const copy=host.querySelector('[data-copy-flavours]'),first=host.querySelector('[data-tier-row="1"]');
 if(copy)copy.disabled=first.querySelector('[data-tier-type]').value!=='edible'||![...first.querySelectorAll('.tier-flavours select')].every(s=>s.value);
}
export function renderTiers(product,variant){
 const next=variant.tiers||product.tiers||1;
 if(next===count)return;
 capture();count=next;
 if(next<2){host.replaceChildren();return;}
 host.innerHTML='<div class="tier-builder">'+Array.from({length:count},(_,i)=>{
  const value=saved.get(i+1)||{type:'edible',sponge:'',filling:'',weightLb:''};
  return '<details class="tier-row" data-tier-row="'+(i+1)+'"><summary><span>Tier '+(i+1)+(i===0?' · Bottom':i===count-1?' · Top':'')+'<small data-tier-summary>Choose sponge & cream</small></span><span class="tier-toggle" aria-hidden="true">+</span></summary><div class="tier-content"><div class="tier-size-fields"><label><span>Tier type</span><select data-tier-type name="tier-'+(i+1)+'-type"><option value="edible"'+(value.type==='edible'?' selected':'')+'>Edible cake</option><option value="dummy"'+(value.type==='dummy'?' selected':'')+'>Display tier · Not edible</option></select></label><label><span>Weight (lb) <small>Optional</small></span><input type="number" data-tier-weight name="tier-'+(i+1)+'-weight" min="0.5" max="500" step="0.5" inputmode="decimal" placeholder="e.g. 5" value="'+esc(value.weightLb??'')+'"'+(value.type==='dummy'?' disabled':'')+'></label></div><div class="tier-flavours"'+(value.type==='dummy'?' hidden':'')+'><label>Sponge<select data-tier-sponge name="tier-'+(i+1)+'-sponge"'+(value.type==='dummy'?' disabled':' required')+'>'+options(choices.sponges,value.sponge)+'</select></label><label>Filling / cream<select data-tier-filling name="tier-'+(i+1)+'-filling"'+(value.type==='dummy'?' disabled':' required')+'>'+options(choices.fillings,value.filling)+'</select></label></div><button type="button" class="tier-next" data-tier-next="'+(i+2)+'">'+(i<count-1?'Continue to tier '+(i+2)+' →':'Save tier choices')+'</button></div></details>';
 }).join('')+'<button type="button" class="copy-flavours" data-copy-flavours>Use tier 1 flavours for all edible tiers</button><p class="tier-feedback" aria-live="polite" data-tier-feedback></p><p class="tier-price-note">Display tiers are decorated to match and are not edible. Portions, supports and price are confirmed in your quote; display tiers do not apply an automatic discount.</p></div>';
 showTier(Math.min(active,count));refreshTiers();
}
host.addEventListener('click',event=>{
 const summary=event.target.closest('.tier-row > summary');
 if(summary){const row=summary.closest('[data-tier-row]');if(!row.open){host.querySelectorAll('[data-tier-row]').forEach(other=>{if(other!==row)other.open=false;});active=Number(row.dataset.tierRow);}}
 const next=event.target.closest('[data-tier-next]');
 if(next){
  const row=next.closest('[data-tier-row]'),invalid=[...row.querySelectorAll('input,select')].find(s=>!s.disabled&&!s.validity.valid);
  if(invalid){invalid.reportValidity();return;}
  const n=Number(next.dataset.tierNext);
  if(n<=count)showTier(n,true);else{
   const missing=[...host.querySelectorAll('[data-tier-row]')].find(r=>r.dataset.complete!=='true');
   if(missing){showTier(Number(missing.dataset.tierRow),true);return;}
   host.dispatchEvent(new CustomEvent('cake:tiers-saved',{bubbles:true}));
  }
 }
 if(event.target.closest('[data-copy-flavours]')){
  const first=host.querySelector('[data-tier-row="1"]');
  host.querySelectorAll('[data-tier-row]').forEach(row=>{
   if(row.querySelector('[data-tier-type]').value==='dummy')return;
   for(const field of ['sponge','filling'])row.querySelector('[data-tier-'+field+']').value=first.querySelector('[data-tier-'+field+']').value;
  });
  refreshTiers();host.querySelector('[data-tier-feedback]').textContent='Flavours copied. Open any tier to change it.';
  host.dispatchEvent(new Event('change',{bubbles:true}));
 }
});
host.addEventListener('change',event=>{
 if(event.target.matches('[data-tier-type]')){
  const row=event.target.closest('[data-tier-row]'),dummy=event.target.value==='dummy';
  row.querySelector('.tier-flavours').hidden=dummy;
  row.querySelector('[data-tier-weight]').disabled=dummy;
  row.querySelectorAll('.tier-flavours select').forEach(el=>{el.disabled=dummy;el.required=!dummy;});
 }
 refreshTiers();
});
export function selectedTiers(){
 if(count<2)return [];
 return [...host.querySelectorAll('[data-tier-row]')].map(row=>{
  const type=row.querySelector('[data-tier-type]').value;
  const weight=type==='edible'?row.querySelector('[data-tier-weight]').value:'';
  return {tier:Number(row.dataset.tierRow),type,...(weight?{weightLb:Number(weight)}:{}),sponge:type==='edible'?row.querySelector('[data-tier-sponge]').value:'',filling:type==='edible'?row.querySelector('[data-tier-filling]').value:''};
 });
}
