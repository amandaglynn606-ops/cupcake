from pathlib import Path
root=Path(__file__).resolve().parents[1]
def edit(file,old,new):
 p=root/file;s=p.read_text(encoding='utf-8');assert old in s,(file,old[:40]);p.write_text(s.replace(old,new),encoding='utf-8')
edit('server.js',"if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20)throw new OrderError('Choose a quantity between 1 and 20.');", "if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20)throw new OrderError('Choose a quantity between 1 and 20.');\n      let tiers;try{tiers=require('./lib/tier-options').validateTiers(item.personalisation?.tiers,p,v);}catch(error){throw new OrderError(error.message);}\n      const needsTiers=require('./lib/tier-options').tierCount(p,v)>1&&!tiers.length;")
edit('server.js',"personalisation:item.personalisation||{},needsPersonalisation:p.kind==='cake'&&", "personalisation:{...item.personalisation,tiers},needsTiers,needsPersonalisation:needsTiers||p.kind==='cake'&&")
edit('server.js',"priceOnConsultation:!!p.priceOnConsultation,unitPriceFils:v.priceFils,lineTotalFils:v.priceFils*item.quantity", "priceOnConsultation:!!p.priceOnConsultation||tiers.length>0,quoteOnly:!!p.quoteOnly,unitPriceFils:v.priceFils,lineTotalFils:p.quoteOnly?null:v.priceFils*item.quantity")
edit('server.js',"hasStartingPrices:items.some(i=>i.priceOnConsultation),...totals", "hasStartingPrices:items.some(i=>i.priceOnConsultation),hasUnpricedItems:items.some(i=>i.quoteOnly),...totals")
edit('server.js',"input.emirate||'Dubai'),canOrder:","input.emirate||'Dubai'),...(items.some(i=>i.quoteOnly)?{subtotalFils:null,totalFils:null}:{}),canOrder:")
edit('assets/js/app.js',"p.allergens==='accept'?'Allergen information acknowledged':''", "p.allergens==='accept'?'Allergen information acknowledged':'',...(p.tiers||[]).map(t=>'Tier '+t.tier+': '+(t.type==='dummy'?'Display (dummy) tier — not edible':'Edible cake · '+t.sponge+' sponge · '+t.filling))")
edit('assets/js/app.js',"+(!item.available?'<p class=\"form-error\">", "+'<a class=\"cart-edit\" href=\"/cakes/'+esc(item.handle)+'?variant='+esc(item.variantId)+'&amp;edit='+item.index+'\">'+(item.needsTiers?'Choose tier types & flavours':'Edit cake & tier details')+'</a>'+(!item.available?'<p class=\"form-error\">")
edit('assets/js/product.js',"let quantity=1;", "const editParam=new URLSearchParams(location.search).get('edit');\nconst editIndex=editParam!==null&&/^\\d+$/.test(editParam)?Number(editParam):-1;\nconst editing=getCart()[editIndex]?.productId===product.id?getCart()[editIndex]:null;\nlet quantity=editing?.quantity||1;")
edit('assets/js/product.js',"product.variants.find(v=>v.id===variantFromURL)", "product.variants.find(v=>v.id===(editing?.variantId||variantFromURL))")
edit('assets/js/product.js',"if(existing)existing.quantity+=quantity;else cart.push", "if(editing)cart[editIndex]={productId:product.id,variantId:selected.id,quantity,message,personalisation};else if(existing)existing.quantity+=quantity;else cart.push")
edit('assets/js/product.js',"update();\n", "update();\n")
with (root/'assets/js/product.js').open('a',encoding='utf-8') as f:f.write('''
if(editing){
 document.getElementById('product-quantity').textContent=quantity;
 document.getElementById('add-to-cart').textContent='Update your selection';
 for(const name of ['message','instructions','colouring','allergens']){
  const field=document.querySelector('[name="'+name+'"]');if(field)field.value=name==='message'?editing.message:editing.personalisation?.[name]||'';
 }
 for(const tier of editing.personalisation?.tiers||[]){
  const row=document.querySelector('[data-tier-row="'+tier.tier+'"]');if(!row)continue;
  row.querySelector('[data-tier-type]').value=tier.type;
  row.querySelector('[data-tier-sponge]').value=tier.sponge;
  row.querySelector('[data-tier-filling]').value=tier.filling;
  row.querySelector('[data-tier-type]').dispatchEvent(new Event('change',{bubbles:true}));
 }
}
''')
