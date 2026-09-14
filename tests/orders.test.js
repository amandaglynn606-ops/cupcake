'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createOrder, OrderError } = require('../lib/orders');
const { makeServer } = require('../server');
const catalog = require('../data/archive/original-catalog.json');
const audit = require('../data/archive/original-price-audit.json');
const now = new Date('2026-09-11T12:00:00Z');
const product = catalog.products.find(p => p.available && p.variants.length > 1);
const variant = product.variants.find(v => v.available);
const payload = () => ({ items: [{ productId: product.id, variantId: variant.id, quantity: 2, message: 'Happy birthday!', personalisation: { instructions: 'Gold detail', colouring: 'natural', allergens: 'accept' } }], customer: { name: 'Test Customer', phone: '+971 50 000 0000', email: 'test@example.com', address: 'Test building, Dubai', date: '2099-12-01', notes: '' }, consent: true });

test('every imported variation adds exactly AED 300 to its source price', () => {
  const variants = new Map(catalog.products.flatMap(p => p.variants.map(v => [v.id, v])));
  assert.equal(variants.size, audit.length);
  for (const row of audit) {
    const expected = Math.round(Number(row.sourcePriceAED) * 100) + 30000;
    assert.equal(variants.get(row.variantId).priceFils, expected, row.variantId);
    assert.equal(row.sellingPriceFils, expected);
  }
});

test('catalog categories, prices, options, and identifiers are consistent', () => {
  assert.equal(new Set(catalog.products.map(p => p.id)).size, catalog.products.length);
  for (const p of catalog.products) {
    assert.ok(p.variants.length);
    const prices = p.variants.filter(v => v.available).map(v => v.priceFils);
    assert.equal(p.minPriceFils, Math.min(...(prices.length ? prices : p.variants.map(v => v.priceFils))));
    for (const v of p.variants) assert.equal(v.options.length, p.optionNames.length);
    for (const category of p.categories) assert.ok(catalog.categories.some(c => c.id === category));
  }
  for (const c of catalog.categories) assert.equal(c.count, catalog.products.filter(p => p.categories.includes(c.id)).length);
});

test('orders calculate prices from the selected variation, ignoring client totals', () => {
  const input = payload();
  input.items[0].priceFils = 1;
  input.subtotalFils = 1;
  const order = createOrder(input, catalog, now);
  assert.equal(order.subtotalFils, variant.priceFils * 2);
  assert.equal(order.items[0].unitPriceFils, variant.priceFils);
  assert.equal(order.paymentStatus, 'not-collected');
  assert.equal(order.customer.name, 'Test Customer');
});

test('invalid orders cannot bypass quantities, variants, consent, or dates', () => {
  const cases = [
    p => { p.items = []; }, p => { p.items = [null]; }, p => { p.items[0].quantity = -1; },
    p => { p.items[0].quantity = 1.5; }, p => { p.items[0].quantity = 21; },
    p => { p.items[0].variantId = 'missing'; }, p => { p.consent = false; },
    p => { p.customer.date = '2020-01-01'; }, p => { p.customer.date = '2099-02-30'; },
    p => { p.customer.email = 'invalid'; }, p => { p.customer.phone = 'abc'; },
    p => { p.items[0].message = 'x'.repeat(101); }
  ];
  for (const change of cases) { const input = payload(); change(input); assert.throws(() => createOrder(input, catalog, now), OrderError); }
  const unavailableCatalog = { products: [{ ...product, variants: [{ ...variant, available: false }] }] };
  assert.throws(() => createOrder(payload(), unavailableCatalog, now), OrderError);
});

test('HTTP checkout persists once, survives retry, blocks private files and cross-origin posts', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'cake-test-'));
  const server = makeServer({ catalog, orderDir: directory });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(directory, { recursive: true, force: true }); });
  const base = 'http://127.0.0.1:' + server.address().port;
  const headers = { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() };
  const body = JSON.stringify(payload());
  const response = await fetch(base + '/api/orders', { method: 'POST', headers, body });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.order.subtotalFils, variant.priceFils * 2);
  const repeated = await fetch(base + '/api/orders', { method: 'POST', headers, body });
  assert.equal(repeated.status, 200);
  assert.equal((await repeated.json()).order.id, result.order.id);
  assert.equal((await fs.readdir(directory)).length, 1);
  const altered = payload(); altered.items[0].quantity = 3;
  assert.equal((await fetch(base + '/api/orders', { method: 'POST', headers, body: JSON.stringify(altered) })).status, 409);
  assert.equal((await fetch(base + '/api/orders', { method: 'POST', headers: { ...headers, Origin: 'https://unrelated.example' }, body })).status, 403);
  for (const route of ['/private/orders', '/categories.csv', '/data/price-audit.json', '/server.js', '/assets/..%2fserver.js']) assert.equal((await fetch(base + route)).status, 404, route);
  assert.equal((await fetch(base + '/')).status, 200);
  assert.equal((await fetch(base + '/api/orders', { method: 'POST', headers, body: 'broken' })).status, 400);
});
