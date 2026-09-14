const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const pinterest = process.argv.includes('--pinterest');
const file = path.join(root, pinterest ? 'data/image-batch-001-pinterest.json' : 'data/image-batch-001.json');
const batch = JSON.parse(fs.readFileSync(file, 'utf8'));
const products = require('../data/catalog.json').products;
const { chromium } = require('@playwright/test');
let browser;
async function download(record) {
  const product = products[record.n - 1];
  Object.assign(record, { productId: product.id, title: product.title, originalImage: product.image });
  if (!record.selected) { record.status = 'retained-no-close-match'; return; }
  if (record.localImage && fs.existsSync(path.join(root, record.localImage))) return;
  let page;
  try {
    page = await browser.newPage();
    const response = await page.goto(record.selected.imageUrl, { timeout: 25000, waitUntil: 'load' });
    if (!response.ok()) throw Error(`HTTP ${response.status()}`);
    const mime = response.headers()['content-type'] || '';
    if (!mime.startsWith('image/')) throw Error('Response is not an image');
    const bytes = await response.body();
    const ext = bytes.subarray(0, 3).equals(Buffer.from([255,216,255])) ? 'jpg' : bytes.subarray(1, 4).toString() === 'PNG' ? 'png' : bytes.subarray(8,12).toString() === 'WEBP' ? 'webp' : ['avif','avis'].includes(bytes.subarray(8,12).toString()) ? 'avif' : null;
    if (!ext) throw Error('Unsupported image format: ' + mime);
    const suffix = pinterest ? '-' + crypto.createHash('sha256').update(record.selected.imageUrl).digest('hex').slice(0,10) : '';
    record.localImage = `assets/products/matches/${pinterest ? 'batch-001-pinterest' : 'batch-001'}/${record.productId}${suffix}.${ext}`;
    fs.mkdirSync(path.dirname(path.join(root, record.localImage)), { recursive: true });
    fs.writeFileSync(path.join(root, record.localImage), bytes);
    record.sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    record.status = 'downloaded-awaiting-review';
    delete record.error;
    console.log(`${record.n}: downloaded ${bytes.length} bytes`);
  } catch (error) { record.status = 'download-failed'; record.error = error.message; console.log(`${record.n}: ${error.message.split('\n')[0]}`); }
  finally { if (page) await page.close(); }
}
(async () => {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
  for (let start = 0; start < batch.records.length; start += 5) {
    await Promise.all(batch.records.slice(start, start + 5).map(download));
    fs.writeFileSync(file, JSON.stringify(batch, null, 2) + '\n');
  }
  console.log(JSON.stringify(batch.records.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {})));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
