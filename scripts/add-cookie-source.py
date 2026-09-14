import json
from pathlib import Path
p=Path('data/licensed-images.json');data=json.loads(p.read_text(encoding='utf-8'))
data.append(dict(id='unsplash-90esXrHPGPk',path='assets/licensed/unsplash-90esXrHPGPk.jpg',sourceUrl='https://unsplash.com/photos/cookies-on-white-ceramic-plate-90esXrHPGPk',downloadUrl='https://images.unsplash.com/photo-1579618385552-046edd29f899?auto=format&fm=jpg&q=85&w=1800',creator='Mae Mu',description='Chocolate chip cookies on a white plate',location='Edmonton, AB, Canada',country='CA',license='Unsplash License',licenseUrl='https://unsplash.com/license',reviewedOn='2026-09-12',usage='Style reference, not a photograph of a Maison Xavi completed order'))
p.write_text(json.dumps(data,indent=2),encoding='utf-8')
