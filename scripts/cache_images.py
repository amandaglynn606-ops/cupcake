"""Cache the imported catalog's supplied photos locally, with resumable downloads."""
import concurrent.futures
import csv
import hashlib
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def main():
    catalog = json.loads((ROOT / 'data/catalog.json').read_text(encoding='utf-8'))
    ids = {p['id'] for p in catalog['products']}
    folder = ROOT / 'assets/products'
    folder.mkdir(parents=True, exist_ok=True)
    map_path = ROOT / 'assets/image-map.json'
    mapping = json.loads(map_path.read_text(encoding='utf-8')) if map_path.exists() else {}
    urls = []
    with (ROOT / 'products.csv').open(encoding='utf-8-sig', newline='') as source:
        for row in csv.DictReader(source):
            if row['Product_ID'] in ids:
                urls.extend(u.strip() for u in (row['Primary_Image_URL'] + ';' + row['All_Image_URLs']).split(';') if u.strip().startswith('https://'))
    pending = [u for u in dict.fromkeys(urls) if u not in mapping or not (ROOT / mapping[u]).exists()]
    print('Downloading', len(pending), 'uncached catalog photos.', flush=True)
    def fetch(url):
        request = urllib.request.Request(url + ('&' if '?' in url else '?') + 'width=1100&format=jpg', headers={'User-Agent': 'CakeWebsite/1.0'})
        for attempt in range(2):
            try:
                with urllib.request.urlopen(request, timeout=25) as response:
                    mime = response.headers.get('Content-Type', '')
                    if not mime.startswith('image/'):
                        raise ValueError('Image response expected')
                    image = response.read()
                extension = '.png' if 'png' in mime else '.webp' if 'webp' in mime else '.gif' if 'gif' in mime else '.jpg'
                target = folder / (hashlib.sha256(url.encode()).hexdigest()[:20] + extension)
                target.write_bytes(image)
                return url, 'assets/products/' + target.name
            except Exception:
                if attempt:
                    raise
                time.sleep(0.5)
    errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        tasks = {pool.submit(fetch, url): url for url in pending}
        for index, task in enumerate(concurrent.futures.as_completed(tasks), 1):
            try:
                url, local = task.result()
                mapping[url] = local
            except Exception as error:
                errors.append({'url': tasks[task], 'error': str(error)})
            if index % 50 == 0:
                map_path.write_text(json.dumps(mapping, indent=2), encoding='utf-8')
                print('Processed', index, '/', len(pending), 'photos.', flush=True)
    map_path.write_text(json.dumps(mapping, indent=2), encoding='utf-8')
    (ROOT / 'data/image-report.json').write_text(json.dumps({'cached': len(mapping), 'errors': errors}, indent=2), encoding='utf-8')
    print('Cached', len(mapping), 'photos;', len(errors), 'download errors.', flush=True)
    if errors and not mapping:
        raise SystemExit(1)

if __name__ == '__main__':
    main()

