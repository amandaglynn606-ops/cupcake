"""Download reviewed Pexels photos and keep source / licence metadata."""
import hashlib
import json
import html
import re
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'data/licensed-images.json'
def main():
 records=json.loads(MANIFEST.read_text(encoding='utf-8'))
 for record in records:
  if not record.get('downloadUrl'):
   with urlopen(Request(record['sourceUrl'],headers={'User-Agent':'Mozilla/5.0'}),timeout=45) as response:
    page=response.read().decode('utf-8')
   match=re.search(r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"',page)
   if not match:raise ValueError('Missing source image: '+record['id'])
   original=html.unescape(match.group(1)).split('?')[0]
   if not original.startswith('https://images.unsplash.com/'):raise ValueError('Unexpected image host')
   record['downloadUrl']=original+'?auto=format&fm=jpg&q=85&w=1800'
  destination=ROOT/record['path'];destination.parent.mkdir(parents=True,exist_ok=True)
  if not destination.exists():
   request=Request(record['downloadUrl'],headers={'User-Agent':'Mozilla/5.0'})
   with urlopen(request,timeout=45) as response:
    content=response.read()
   if not content.startswith(b'\xff\xd8\xff'):raise ValueError('Expected a JPEG: '+record['id'])
   destination.write_bytes(content)
  record['sha256']=hashlib.sha256(destination.read_bytes()).hexdigest()
  print(record['id'],destination.stat().st_size,flush=True)
 MANIFEST.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
