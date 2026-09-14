import urllib.request, re
from html import unescape
from pathlib import Path
url='https://theperfectgift.ae/'
s=urllib.request.urlopen(url).read().decode()
print('\n'.join(sorted(set(unescape(x) for x in re.findall(r'href="([^"]+)"',s) if any(k in x for k in ['pages/','policies/'])))))
for route in ['policies/refund-policy','policies/terms-of-service','policies/privacy-policy','pages/edible-items-policy','pages/substitution-policy']:
    html=urllib.request.urlopen(url+route).read().decode()
    html=re.sub(r'<(script|style)\b[^>]*>.*?</\1>','',html,flags=re.S)
    plain=unescape(re.sub(r'<[^>]+>',' ',html))
    plain=re.sub(r'\s+',' ',plain)
    Path('artifacts/source-'+route.split('/')[-1]+'.txt').write_text(plain,encoding='utf-8')
    print(route,plain[plain.find('Search...')+9:][:14500])
