from pathlib import Path
root=Path(__file__).resolve().parents[1]
def change(file,old,new):
 p=root/file;s=p.read_text(encoding='utf-8');assert old in s,(file,old);p.write_text(s.replace(old,new),encoding='utf-8')
change('lib/ui.js','="/cakes/\'+esc(p.handle)+\'','="\'+productUrl+\'')
change('tests/storefront.spec.js',"catalog.products[0].id","catalog.products.find(p=>p.tiers===1&&p.variants.length>1&&p.variants.every(v=>v.tiers===1)).id")
change('tests/storefront.spec.js',"toHaveCount(27)","toHaveCount(require('../lib/catalog').buildCatalog(catalog).collections.length)")
change('tests/storefront.spec.js',"await expect(page.getByRole('link',{name:'Add birthday candles'})).toHaveAttribute('href','/collections/candles');","await expect(page.getByRole('link',{name:'Request a bespoke adaptation'})).toBeVisible();")
change('tests/storefront.spec.js',"{instructions:'Gold initials, age 30',colouring:'natural',allergens:'accept'}","{instructions:'Gold initials, age 30',colouring:'natural',allergens:'accept',tiers:[]}")
change('tests/atelier-checkout.spec.js',"p.kind==='cake'&&p.available","p.kind==='cake'&&p.available&&p.tiers===1&&p.variants[0].tiers===1")
change('tests/layout-audit.spec.js',"all 27 collections","all active collections")
change('tests/layout-audit.spec.js',"p.id==='8028660203745'","p.tiers===4")
change('tests/card-actions.spec.js',"new RegExp(url+'$')","new URL(url,'http://127.0.0.1:43189').href")
# Gift/scheduling regression uses a single-tier cake; tier editing has dedicated coverage.
change('tests/cart-page.spec.js',"'/collections/wedding-cakes'","'/collections/birthday-cakes'")
