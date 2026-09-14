const fs = require('node:fs');
const { chromium } = require('@playwright/test');
const pinterest = process.argv.includes('--pinterest');
const batch = require(pinterest ? '../data/image-batch-001-pinterest.json' : '../data/image-batch-001.json');
const prefix = pinterest ? 'image-batch-001-pinterest' : 'image-batch-001';
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data = file => 'data:image/' + (file.endsWith('.jpg') ? 'jpeg' : file.split('.').pop()) + ';base64,' + fs.readFileSync(file).toString('base64');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
    const style = '<style>body{font:14px Arial;margin:16px;background:#eee}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}article{background:white;padding:8px}img{width:132px;height:180px;object-fit:contain}p{min-height:34px}.pair{display:flex;gap:6px}small{display:block;color:#666}</style>';
    const cards = batch.records.map(r => `<article><p>${r.n}. ${esc(r.title)}</p><div class="pair"><div><small>Original</small><img src="${data(r.originalImage)}"></div><div><small>${r.localImage ? (r.status === 'applied' ? 'Replacement' : 'Candidate') : 'Retained'}</small><img src="${data(r.localImage || r.originalImage)}"></div></div><small>${esc(r.status)}</small>${r.selected ? `<a href="${esc(r.selected.sourceUrl)}">Source</a>` : ''}</article>`);
    fs.writeFileSync(`artifacts/${prefix}-review.html`, '<!doctype html><meta charset="utf-8"><title>Image batch 001 review</title>' + style + '<h1>Product images 1–50</h1><p>Original on the left; current image on the right. Pinterest replacements checked for tier count, shape, colour and named details. '+batch.summary.replaced+' replacements; '+batch.summary.retained+' originals retained or restored.</p><div class="grid">' + cards.join('') + '</div>');
    for (let start = 0; start < cards.length; start += 10) {
      await page.setContent(style + '<div class="grid">' + cards.slice(start, start + 10).join('') + '</div>');
      await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
      await page.screenshot({ path: `artifacts/${prefix}-comparison-${start + 1}.jpg`, fullPage: true });
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
