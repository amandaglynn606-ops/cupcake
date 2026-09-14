"""Self-host the Maison Xavi display, editorial and interface typefaces."""
import re
import urllib.request
from pathlib import Path

folder = Path(__file__).resolve().parent.parent / 'assets/fonts'
url = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Italiana&family=Jost:wght@400;500;600&display=swap'
request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(request, timeout=30) as response:
    css = response.read().decode()
for index, source in enumerate(dict.fromkeys(re.findall(r'url\((https://[^)]+)\)', css))):
    extension = '.woff2' if '.woff2' in source else '.ttf'
    name = 'atelier-' + str(index) + extension
    with urllib.request.urlopen(source, timeout=30) as response:
        (folder / name).write_bytes(response.read())
    css = css.replace(source, '/assets/fonts/' + name)
for family in ['cormorantgaramond', 'italiana', 'jost']:
    with urllib.request.urlopen('https://raw.githubusercontent.com/google/fonts/main/ofl/' + family + '/OFL.txt', timeout=30) as response:
        (folder / (family + '-LICENSE.txt')).write_bytes(response.read())
(folder / 'atelier-fonts.css').write_text(css, encoding='utf-8')
print('Maison Xavi typefaces saved locally with their licenses.')
