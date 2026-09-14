'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
async function main() {
  const directory = path.join(__dirname, '..', 'private', 'orders');
  let files;
  try { files = await fs.readdir(directory); } catch (error) { if (error.code === 'ENOENT') return console.log('No order requests yet.'); throw error; }
  const orders = [];
  for (const file of files.filter(file => file.endsWith('.json'))) {
    const { order } = JSON.parse(await fs.readFile(path.join(directory, file), 'utf8'));
    orders.push({ reference: order.id, name: order.customer.name, phone: order.customer.phone, date: order.customer.date, subtotalAED: order.subtotalFils / 100, status: order.status });
  }
  console.table(orders);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
