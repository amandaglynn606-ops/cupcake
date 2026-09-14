import json
from pathlib import Path
p=Path('data/grand-weddings.json');designs=json.loads(p.read_text(encoding='utf-8'))
new=[
 ['blush-garden','Blush Garden Wedding Cake',2,10000,'Ivory & blush roses','Pearl borders & soft ivory buttercream','Two ivory tiers carry a generous crown of blush and white roses, with a smaller floral arrangement at the base. Pearl borders define the soft silhouette.','blush-roses'],
 ['ivory-gilded','Ivory Gilded Wedding Cake',3,20000,'Ivory peonies & white flowers','Gold edges & ivory buttercream','Three ivory tiers are edged with irregular gold detailing and a restrained arrangement of white flowers. A floral crown and lower clusters balance the clean stacked silhouette.','ivory-gilded'],
 ['peony-ballet','Peony Ballet Wedding Cake',4,35000,'Blush peonies & ivory roses','Soft sugar draping & pearls','Four graduated tiers are wrapped in soft ivory draping. A generous diagonal trail of blush peonies and ivory garden roses runs from the floral crown to the base, with fine pearl accents between the folds.','peony-ballet'],
 ['orchid-reverie','Orchid Reverie Wedding Cake',5,50000,'Cascading white orchids','Draped ivory panels & pearls','Five tiers combine smooth ivory panels and delicate draping. A long cascade of white orchids traces one side of the cake, giving the tall silhouette a graceful asymmetry.','orchid-reverie'],
 ['rose-pavilion','Rose Pavilion Wedding Cake',5,75000,'Blush roses & ivory peonies','Floral collars, lattice & leaf relief','Five substantial tiers are separated by full collars of blush roses and ivory peonies. Alternating lattice and botanical relief panels create a richly detailed garden-inspired centrepiece.','rose-pavilion']]
for i,(slug,title,tiers,price,flowers,finish,description,imageId) in enumerate(new):
 designs.append(dict(id=str(9900000000007+i),handle=slug+'-wedding-cake',title=title,tiers=tiers,priceAED=price,flowers=flowers,finish=finish,description=description,imageId=imageId,referencePhoto=i<2))
p.write_text(json.dumps(designs,indent=2),encoding='utf-8')
p=Path('data/studio-images.json');entries=json.loads(p.read_text(encoding='utf-8'))+json.loads(Path('data/studio-middle.json').read_text(encoding='utf-8'));p.write_text(json.dumps(entries,indent=2),encoding='utf-8')
