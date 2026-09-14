import json
from pathlib import Path
p=Path('data/licensed-images.json');data=json.loads(p.read_text(encoding='utf-8'))
for number,creator,location,description,slug in [(15613457,'Thomas Beaman','Lancaster, PA, United States','Chocolate cake pops','photo-of-cake-pops-on-the-table'),(10479036,'Anastasiia Lopushynska','New York, NY, United States','Macarons in a white box','close-up-photo-of-macaroons-in-a-box')]:
 data.append(dict(id='pexels-'+str(number),path='assets/licensed/pexels-'+str(number)+'.jpg',sourceUrl='https://www.pexels.com/photo/'+slug+'-'+str(number)+'/',downloadUrl='https://images.pexels.com/photos/'+str(number)+'/pexels-photo-'+str(number)+'.jpeg?auto=compress&cs=tinysrgb&w=1800',creator=creator,description=description,location=location,country='US',license='Pexels License',licenseUrl='https://www.pexels.com/license/',reviewedOn='2026-09-12',usage='Style reference, not a photograph of a Maison Xavi completed order'))
p.write_text(json.dumps(data,indent=2),encoding='utf-8')
