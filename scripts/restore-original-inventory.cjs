'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const file of ['catalog.json','price-audit.json']){
 fs.copyFileSync(path.join(root,'data','archive','original-'+file),path.join(root,'data',file));
}
console.log('Restored original The Perfect Gift inventory and AED 300 markup audit.');
