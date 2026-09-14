import json
from pathlib import Path
def edit(file,old,new):
 p=Path(file);s=p.read_text(encoding='utf-8')
 if old not in s:raise RuntimeError(file+' '+old[:70])
 p.write_text(s.replace(old,new),encoding='utf-8')
p=Path('data/studio-images.json');entries=json.loads(p.read_text(encoding='utf-8'))
for file in ['data/studio-celebrations.json','data/studio-treats.json']:entries+=json.loads(Path(file).read_text(encoding='utf-8'))
for entry in entries:entry['webPath']=entry['path'].replace('.png','.webp')
p.write_text(json.dumps(entries,indent=2),encoding='utf-8')
edit('lib/grand-weddings.js',"d.imageId+'.png'","d.imageId+'.webp'")
edit('pages/home-content.js','/assets/studio/grand-floral-palace.png','/assets/studio/grand-floral-palace.webp')
edit('pages/home-content.js',"const p=ctx.catalog.products;","const p=ctx.catalog.products.filter(p=>!p.priceOnConsultation);")
edit('pages/home-content.js','[p[6],p[7],p[8],p[10],p[11],p[14]]','[p[0],p[1],p[2],p[4],p[5],p[8]]')
edit('pages/home-content.js',"['9900000000001','9900000000002','9900000000003','9900000000004','9900000000005','9900000000006']","['9900000000007','9900000000008','9900000000009','9900000000010','9900000000011','9900000000001','9900000000002','9900000000003','9900000000004','9900000000005','9900000000006']")
edit('pages/home-content.js','Six statement floral concepts, from six-tier orchids to a complete cake installation. Starting design estimates from AED 100,000 to AED 500,000, with every detail agreed in your personal consultation.','From delicate rose tiers to a complete floral cake installation. Explore eleven wedding designs with starting estimates from AED 10,000 to AED 500,000, with every detail agreed in your personal consultation.')
edit('lib/ui.js',"(!p.available?'<span class=\"sold-out\">", "(p.imageReference?'<span class=\"reference-badge\">Collection inspiration</span>':p.priceOnConsultation?'<span class=\"reference-badge\">'+(p.referencePhoto?'Style reference':'Design concept')+'</span>':'')+(!p.available?'<span class=\"sold-out\">")
edit('lib/ui.js',"navLink('/wishlist','Your wishlist')", "navLink('/wishlist','Your wishlist')+navLink('/photography','Image credits')")
edit('pages/product.js',"data:{product:p}","data:{product:{...p,searchText:undefined,originalTitle:undefined}}")
edit('pages/product.js',"esc(p.imageNote)+'</p>'", "esc(p.imageNote)+' <a href=\"/photography\">About our images</a></p>'")
edit('assets/js/app.js',"'<article class=\"cart-item\">", "'<article class=\"cart-item\">") if False else None
edit('assets/js/app.js',"<p class=\"cart-unit-price\">Unit price: ","<p class=\"cart-unit-price\">'+(item.priceOnConsultation?'Starting price: ':'Unit price: ')+'")
edit('assets/js/app.js',"money(quote.subtotalFils)+'</span></div><p class=\"summary-note\">", "money(quote.subtotalFils)+'</span></div>'+(quote.hasStartingPrices?'<p class=\"starting-price-note\">Starting estimate. Final design and quotation are agreed on WhatsApp.</p>':'')+'<p class=\"summary-note\">")
edit('assets/js/cart-page.js',"$('#cart-total').textContent=money(result.totalFils);", "$('#cart-total').textContent=(result.hasStartingPrices?'From ':'')+money(result.totalFils);")
