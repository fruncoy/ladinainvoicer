import http from 'http';

const items = Array.from({ length: 18 }).map((_, i) => ({
  id: `item_${i}`,
  name: `Test Item ${i + 1}`,
  description: `This is a long description for test item ${i + 1} to ensure it wraps correctly and takes up space in the table row.`,
  amount: (10 * (i + 1)).toString(),
  fromDate: '2026-03-22',
  toDate: '2026-03-24'
}));

const data = JSON.stringify({
  invoiceNo: 'MULTi-PAGE-001',
  billedTo: 'Large Agency Corp',
  date: '2026-03-22',
  currency: 'USD Account',
  lineItems: items
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/invoices',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
