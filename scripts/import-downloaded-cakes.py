"""Optimise user-selected cake photos without cropping or inventing detail."""
from pathlib import Path
from PIL import Image, ImageOps
import json, hashlib, re

root = Path(__file__).resolve().parent.parent
downloads = Path('C:/Users/Dania Muneer/Downloads')
inventory = json.loads((root/'artifacts/downloaded-cakes/inventory.json').read_text())
reviews = json.loads((root/'data/downloaded-cake-review.json').read_text())
products, records = [], []
for review in reviews:
    candidate = next(item for item in inventory if item['n'] == review['n'])
    original = downloads / candidate['filename']
    if hashlib.sha256(original.read_bytes()).hexdigest() != candidate['sha256']:
        raise ValueError('Downloaded image changed: ' + original.name)
    slug = re.sub(r'[^a-z0-9]+', '-', review['title'].lower()).strip('-')
    product_id = str(9930000000000 + review['n'])
    relative = 'assets/products/cakes/downloaded/cake-' + slug + '.webp'
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(original)).convert('RGB')
    im.thumbnail((1500, 1500), Image.Resampling.LANCZOS)
    im.save(target, 'WEBP', quality=94, method=6)
    categories = [review['collection'], 'tiered-cake']
    if review['material']:
        categories.append('fresh-floral-cakes' if review['material'] == 'fresh' else 'sugar-flower-cakes')
    description = review['alt'] + '. Request your preferred size, tier flavours and decorations. Final details and price are confirmed in your quote.'
    product = dict(id=product_id, handle=slug, title=review['title'], categories=categories,
        kind='cake', description=description, image=relative, images=[relative], imageAlt=review['alt'],
        imageContain=True, imageNote='Design reference. Size, flavours and decorations are confirmed with your quote.',
        optionNames=[], variants=[dict(id=product_id+'01', title=str(review['tiers'])+' tiers — custom quotation',
            options=[], priceFils=None, compareAtFils=None, available=True, image=relative, tiers=review['tiers'])],
        minPriceFils=None, available=True, quoteOnly=True, tiers=review['tiers'],
        catalogueAddition='downloaded-2026-09', collectionBatch='downloads-2026-09-14',
        metaTitle=review['title'].replace(' with ', ' & '),
        metaDescription=review['alt']+'. Request a quote from Maison Zavi.',
        searchText=review['title']+' '+description+(' fresh flowers' if review['material']=='fresh' else ''))
    products.append(product)
    host = re.search(r'HostUrl=(.+)',candidate['zone'])
    records.append(dict(productId=product_id, sourceFile=candidate['filename'], source=host[1] if host else None,
        source_country=None, originStatus='User-provided download; original photographer and country not verified',
        sourceSha256=candidate['sha256'], image=relative, sha256=hashlib.sha256(target.read_bytes()).hexdigest(),
        width=im.width, height=im.height, sourceWidth=candidate['width'], sourceHeight=candidate['height'],
        tiers=review['tiers'], categories=categories, flowerTypes=review['flowers'], flowerMaterial=review['material'],
        visualReview=dict(reviewed=True, fullCakeVisible=True, watermarkVisible=False),
        treatment='WebP conversion, no crop or upscale; centred contain presentation; original photo background retained'))

hashes = [item['sourceSha256'] for item in records]
if len(set(hashes)) != len(hashes):
    raise ValueError('Duplicate downloaded image')
for filename, data in [('downloaded-additions.json', {'products':products}),
                       ('downloaded-addition-manifest.json', {'products':records, 'held':[dict(n=3,reason='Appears AI-generated; awaiting user preference')]})]:
    (root/'data'/filename).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Prepared',len(products),'new cake listings and optimised local images.')
