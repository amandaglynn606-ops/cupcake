const fs=require('fs');
const file='README.md';let s=fs.readFileSync(file,'utf8');
const start=s.indexOf('## Catalogue and pricing'),end=s.indexOf('## Currency display');
s=s.slice(0,start)+`## Catalogue and pricing

The active inventory has been restored exactly from the original The Perfect Gift spreadsheet import: 1,054 products, original titles, images, categories, options and availability. Each original source price includes the requested AED 300 markup once.

- Active inventory: \`data/catalog.json\`.
- Active pricing audit: \`data/price-audit.json\`.
- Original snapshots: \`data/archive/original-catalog.json\` and \`data/archive/original-price-audit.json\`.
- Product photos and galleries: \`assets/products\`.

Run \`npm.cmd run import\` to restore these original snapshots again. US/Canadian replacement catalogue scripts and image experiments remain on disk for history but are not the active import workflow. Do not run them to rebuild this inventory.

`+s.slice(end);
s=s.replace('validates pricing, provenance, unique photographs, tier data, regional fees, source records, private storage and HTTP routes','validates restored inventory, original pricing and image files, regional fees, private storage and HTTP routes');
fs.writeFileSync(file,s);
