const fs = require('node:fs');
const { chromium } = require('@playwright/test');
(async () => {
  const products = require('../data/catalog.json').products.slice(0, 50);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    for (let start = 0; start < products.length; start += 25) {
      await page.setContent(`<style>body{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;font:14px Arial}article{border:1px solid #ddd;padding:6px}img{width:250px;height:205px;object-fit:contain}p{height:34px}</style>` + products.slice(start, start + 25).map((p, i) => `<article><img src="data:image/${p.image.endsWith('.png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(p.image).toString('base64')}"><p>${start + i + 1}. ${p.title}</p></article>`).join(''));
      await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
      await page.screenshot({ path: `artifacts/image-batch-001-originals-${start + 1}.jpg`, fullPage: true });
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
