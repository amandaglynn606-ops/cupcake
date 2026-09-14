"""Import the supplied CSV snapshots; add AED 300 once to every variant price."""
import csv
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
MARKUP = Decimal('300')

def read(name):
    with (ROOT / (name + '.csv')).open(encoding='utf-8-sig', newline='') as source:
        return list(csv.DictReader(source))

def split(value):
    return [part.strip() for part in value.split(';') if part.strip()]

def image_url(value):
    return value if urlparse(value).scheme == 'https' else ''

def money(value):
    price = Decimal(value.strip())
    if not price.is_finite() or price < 0:
        raise ValueError('Invalid source price')
    return int(((price + MARKUP) * 100).quantize(Decimal('1')))

def description(value):
    # Keep the product description without copying the supplier's delivery promises,
    # contact instructions, gifts, or prices into this independent store.
    sentences = re.split(r'(?<=[.!?])\s+', value)
    useful = [s for s in sentences if not re.search(r'\b(delivery|deliver|whatsapp|shop our|contact|gift bag|gift card|payment|AED|rental|deposit|same.day|next.day)\b', s, re.I)]
    return ' '.join(useful)[:1800].strip() or 'Choose your preferred variation and add a personal message for your celebration.'

def main():
    source_categories, source_products, source_variants = read('categories'), read('products'), read('variations')
    image_map_path = ROOT / 'assets/image-map.json'
    image_map = json.loads(image_map_path.read_text(encoding='utf-8')) if image_map_path.exists() else {}
    cake_categories = [c for c in source_categories if 'cake' in (c['Category_Title'] + c['Category_Handle']).lower() or c['Category_Handle'] == 'birthday-candles']
    by_title = {c['Category_Title']: c for c in cake_categories}
    grouped = defaultdict(list)
    for row in source_variants:
        grouped[row['Product_ID']].append(row)
    products, issues, audit = [], [], []
    seen_products, seen_variants = set(), set()
    for row in source_products:
        if row['Product_Type'].strip().lower() == 'additional fee':
            continue
        categories = [by_title[name]['Category_Handle'] for name in split(row['Categories']) if name in by_title]
        title = row['Product_Title']
        accessory = any(c in ('cake-toppers', 'birthday-candles') for c in categories)
        edible = bool(re.search(r'cake|cupcake|cakepop|cakesicle|cookie|macaron|chocolate|brownie|strawberr|meringue|truffle|smash', title, re.I))
        excluded = bool(re.search(r'diaper|nappy|latex|foil balloon|balloon backdrop|balloon garland|balloon arrangement|balloon bouquet|cake shape balloon|cake-shaped balloon', title, re.I))
        if not accessory and (not edible or excluded):
            continue
        if not categories and not re.search(r'cake|cupcake|cakepop', title, re.I):
            continue
        if not accessory and re.search(r'\b(?:toppers?|stands?)\b|balloon.*package|package.*balloon', title, re.I):
            continue
        pid = row['Product_ID']
        if pid in seen_products:
            raise ValueError('Duplicate product ID: ' + pid)
        seen_products.add(pid)
        variants = []
        options = []
        rows = grouped[pid]
        if not rows:
            issues.append({'id': pid, 'reason': 'No matching variation rows'})
            continue
        for index in range(1, 4):
            if any(v[f'Option{index}_Value'] and v[f'Option{index}_Value'] != 'Default Title' for v in rows):
                name = next(v[f'Option{index}_Name'] for v in rows if v[f'Option{index}_Value'])
                options.append({'name': name, 'sourceIndex': index})
        for variant in rows:
            vid = variant['Variant_ID']
            if vid in seen_variants:
                raise ValueError('Duplicate variation ID: ' + vid)
            seen_variants.add(vid)
            try:
                price = money(variant['Price_AED'])
            except (InvalidOperation, ValueError):
                issues.append({'id': pid, 'variantId': vid, 'reason': 'Invalid or missing price'})
                continue
            compare = None
            if variant['Compare_At_Price_AED']:
                compare = money(variant['Compare_At_Price_AED'])
            variants.append({'id': vid, 'title': variant['Variant_Title'] if variant['Variant_Title'] != 'Default Title' else 'Standard',
                             'options': [variant[f'Option{o["sourceIndex"]}_Value'] for o in options],
                             'priceFils': price, 'compareAtFils': compare,
                             'available': variant['Available'].strip().lower() == 'true',
                             'image': image_map.get(variant['Variant_Image_URL'], image_url(variant['Variant_Image_URL']))})
            audit.append({'productId': pid, 'variantId': vid, 'sourcePriceAED': variant['Price_AED'], 'sellingPriceFils': price})
        if not variants:
            continue
        images = list(dict.fromkeys(filter(None, [image_url(row['Primary_Image_URL'])] + [image_url(i) for i in split(row['All_Image_URLs'])])))
        images = [image_map.get(image, image) for image in images]
        available = [v['priceFils'] for v in variants if v['available']]
        products.append({'id': pid, 'handle': row['Product_Handle'], 'title': title, 'categories': categories,
                         'kind': 'accessory' if accessory else ('cake' if re.search(r'cake|cupcake|cakepop|cakesicle', title, re.I) else 'patisserie'),
                         'description': description(row['Description_Clean']), 'images': images,
                         'image': images[0] if images else 'assets/placeholder.svg',
                         'optionNames': [o['name'] for o in options], 'variants': variants,
                         'minPriceFils': min(available or [v['priceFils'] for v in variants]),
                         'available': bool(available)})
    featured = ['8957439181025', '8957441278177', '8961075151073', '9442929180897', '8957444653281', '8962586804449', '8957376921825', '8957434069217']
    products.sort(key=lambda p: (featured.index(p['id']) if p['id'] in featured else len(featured), not p['available']))
    categories = []
    for category in cake_categories:
        count = sum(category['Category_Handle'] in p['categories'] for p in products)
        if count:
            categories.append({'id': category['Category_Handle'], 'title': category['Category_Title'], 'count': count})
    catalog = {'currency': 'AED', 'importedAt': datetime.now(timezone.utc).isoformat(), 'featuredId': products[0]['id'], 'categories': categories, 'products': products}
    (ROOT / 'data').mkdir(exist_ok=True)
    serialized = json.dumps(catalog, ensure_ascii=True, separators=(',', ':'))
    (ROOT / 'data/catalog.json').write_text(serialized, encoding='utf-8')
    (ROOT / 'data/price-audit.json').write_text(json.dumps(audit, indent=2), encoding='utf-8')
    report = {'sourceProducts': len(source_products), 'sourceVariants': len(source_variants), 'importedProducts': len(products),
              'importedVariants': len(audit), 'importedCategories': len(categories), 'markupAED': str(MARKUP), 'issues': issues,
              'scope': 'Edible celebration products plus candles and cake toppers. Excludes additional fees, stands, diapers, balloon decorations, packages, and unrelated gifts.'}
    (ROOT / 'data/import-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report))

if __name__ == '__main__':
    main()
