"""Download public bakery product snapshots and their selected original photographs.

Run without arguments to refresh snapshots; --images downloads only curated photos.
No generated imagery, source text rewriting or automatic catalogue publication.
"""
import concurrent.futures, hashlib, json, pathlib, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = {
    'cakebloom': 'https://cakebloom.com',
    'cedars': 'https://cedarscakes.com',
    'yummytecture': 'https://www.yummytecture.com',
    'dbakers': 'https://dbakers.us',
    'butterbaker': 'https://www.butter-baker.com',
}
SNAPSHOTS = ROOT / 'data' / 'sources'

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()

def snapshot(item):
    key, origin = item
    content = fetch(origin + '/products.json?limit=250')
    products = json.loads(content)['products']
    (SNAPSHOTS / (key + '.json')).write_bytes(content)
    print(key, len(products), flush=True)

def extras():
    urls = {
        'sweetes': 'https://www.sweetesbakeshop.com/collections/wedding-cakes/products.json?limit=250',
        'butterbaker-cakes': 'https://www.butter-baker.com/collections/cakes/products.json?limit=250',
        'yummytecture-2': 'https://www.yummytecture.com/products.json?limit=250&page=2',
        'fx': 'https://centralbank.ae/umbraco/Surface/Exchange/GetExchangeRateAllCurrency',
    }
    for key, url in urls.items():
        content = fetch(url)
        (SNAPSHOTS / (key + ('.html' if key == 'fx' else '.json'))).write_bytes(content)
        print(key, len(content), flush=True)

def photo(row):
    target = ROOT / row['image']
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        content = fetch(row['sourceImage'])
        target.write_bytes(content)
    return {**row, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}

if __name__ == '__main__':
    SNAPSHOTS.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        if '--extras' in sys.argv:
            extras()
        elif '--images' in sys.argv:
            selection = json.loads((ROOT / 'data' / 'verified-selection.json').read_text(encoding='utf-8'))
            rows = list(pool.map(photo, selection))
            (ROOT / 'data' / 'verified-photo-audit.json').write_text(json.dumps(rows, indent=2), encoding='utf-8')
            print('Downloaded', len(rows), 'original photographs')
        else:
            for result in pool.map(snapshot, SOURCES.items()):
                pass
