from pathlib import Path
root=Path(__file__).resolve().parents[1]
def edit(file,changes):
    p=root/file;s=p.read_text(encoding='utf-8')
    for old,new in changes:
        if old not in s:raise RuntimeError('Missing target in '+file+': '+old[:70])
        s=s.replace(old,new)
    p.write_text(s,encoding='utf-8')
edit('lib/ui.js',[
 ("const money=fils=>'AED '","const money=fils=>fils===null?'Price on request':'AED '"),
 ('src="/assets/js/app.js"></script>','src="/assets/js/app.js"></script><script type="module" src="/assets/js/currency.js"></script>'),
 ("ctx.catalog.products[5].image","(ctx.catalog.products[5]||ctx.catalog.products[0]).image"),
 ('alt="A tiered cake with decorative piping"','alt="A cake from the bespoke collection"'),
 ("'+search+'<a href=\"/wishlist\"","'+search+'<label class=\"currency-selector\"><span class=\"sr-only\">Display currency</span><select data-currency-selector aria-label=\"Display currency\"><option value=\"AED\">AED</option><option value=\"CAD\">CAD</option><option value=\"USD\">USD</option><option value=\"EUR\">EUR</option></select></label><a href=\"/wishlist\""),
 ("json({...data,config:","json({...data,exchange:require('./exchange'),config:"),
 ('<div class="footer-bottom wrap">','<p class="currency-notice wrap" data-currency-notice data-currency-fixed>All orders are quoted in AED.</p><div class="footer-bottom wrap">'),
 ("const varies=p.priceOnConsultation||","const varies=!p.quoteOnly&&(p.priceOnConsultation||"),
 (".size>1);",".size>1));")
])
edit('pages/home.js',[("const p=c.slug==='wedding-cakes'?ctx.byId.get('9900000000003'):curated[c.slug]!==undefined&&curated[c.slug]!==null?ctx.catalog.products.filter(p=>!p.priceOnConsultation)[curated[c.slug]]:(theme&&c.products.find(p=>p.available&&theme.test(p.title)&&(c.slug!=='childrens-cakes'||p.kind==='cake'&&/\\bcake\\b/i.test(p.title))))||c.products.find(p=>p.available&&p.images.length)||c.products[0];","const p=c.products.find(p=>p.available&&p.images.length)||c.products[0];")])
edit('pages/home-content.js',[
 ("const wedding=ctx.byId.get('9900000000003');","const wedding=ctx.catalog.products.find(p=>p.source?.photoReviewNumber===64)||ctx.bySlug.get('wedding-cakes').products[0];"),
 ("const weddingEdit=['9900000000007','9900000000008','9900000000009','9900000000010','9900000000011','9900000000001','9900000000002','9900000000003','9900000000004','9900000000005','9900000000006'].map(id=>ctx.byId.get(id)).filter(Boolean);","const weddingEdit=ctx.bySlug.get('wedding-cakes').products.slice().sort((a,b)=>b.tiers-a.tiers).slice(0,12);"),
 ('src="/assets/studio/grand-floral-palace.webp" alt="Design concept for a grand floral wedding cake installation with three ivory cake towers"','src="${img(wedding.image)}" alt="${esc(wedding.title)}"'),
 ('From delicate rose tiers to a complete floral cake installation. Explore eleven wedding designs with starting estimates from AED 10,000 to AED 500,000, with every detail agreed in your personal consultation.','Fresh roses, sculptural tiers and delicate hand-finished details. Discover the wedding collection, from intimate celebrations to towering floral centrepieces.'),
 ("['birthday-cakes','wedding-cakes','childrens-cakes','cupcakes-and-treats'].map(s=>collectionCard(ctx.bySlug.get(s),ctx))","['birthday-cakes','fresh-flower-cakes','childrens-cakes','cupcakes-and-treats'].map(s=>ctx.bySlug.get(s)).filter(Boolean).map(c=>collectionCard(c,ctx))")
])
edit('assets/js/app.js',[("export const money=fils=>'AED '","export const money=fils=>fils===null?'Price on request':'AED '")])
edit('pages/product.js',[
 ("const finishingTouches='<div class=\"finishing-touches\"><p class=\"eyebrow\">COMPLETE THE OCCASION</p><a href=\"/collections/candles\">Add birthday candles ↗</a><a href=\"/collections/cake-toppers\">Explore cake toppers ↗</a></div>","const finishingTouches='"),
 ("'+customFields+'<div class=\"product-buy-row\">","'+customFields+'<div id=\"tier-configurator\"></div><div class=\"product-buy-row\">"),
 ("data:{product:{...p,searchText:undefined,originalTitle:undefined}}","data:{tierOptions:require('../lib/tier-options').choices,product:{...p,searchText:undefined,originalTitle:undefined}}")
])
