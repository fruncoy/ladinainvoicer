import express from 'express';
import cors from 'cors';
import { Client, Databases } from 'node-appwrite';
import { loadStore, saveStore } from './store.js';
import 'dotenv/config';

// Load Cloud Settings from environment variables
const CLOUD_SETTINGS = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: process.env.VITE_APPWRITE_PROJECT_ID || '69be7af8000af63ab779',
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID || 'default',
  invoicesCollectionId: process.env.VITE_APPWRITE_INVOICES_COL_ID || 'invoices',
  receiptsCollectionId: process.env.VITE_APPWRITE_RECEIPTS_COL_ID || 'receipts',
  bankDetailsCollectionId: process.env.VITE_APPWRITE_BANK_COL_ID || 'bankDetails',
  apiKey: process.env.APPWRITE_API_KEY,
  browserlessToken: process.env.BROWSERLESS_TOKEN
};

const PORT = Number(process.env.PORT) || 3001;
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

function uid() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/data', async (_req, res) => {
  const data = await loadStore();
  const s = CLOUD_SETTINGS;

  // Try to pull latest Bank Details from Appwrite if configured
  if (s.endpoint && s.projectId && s.databaseId && s.bankDetailsCollectionId && s.apiKey) {
    try {
      const client = new Client().setEndpoint(s.endpoint).setProject(s.projectId).setKey(s.apiKey);
      const databases = new Databases(client);
      const doc = await databases.getDocument(s.databaseId, s.bankDetailsCollectionId, 'current');
      if (doc) {
        data.bankDetails = {
          bankName: doc.bankName,
          bankCode: doc.bankCode,
          branch: doc.branch,
          accountName: doc.accountName,
          accountNumberUSD: doc.accountNumberUSD,
          accountNumberKES: doc.accountNumberKES,
          swiftCode: doc.swiftCode,
        };
        saveStore(data).catch(() => {});
      }
    } catch (e) {
      console.log('Appwrite pull skipped:', e.message);
    }
  }

  const { settings, ...rest } = data;
  res.json({
    ...rest,
    settings: CLOUD_SETTINGS,
  });
});

// Clients API
app.post('/api/clients', async (req, res) => {
  const data = await loadStore();
  const body = req.body || {};
  const client = {
    id: body.id || uid(),
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    phone: String(body.phone || '').trim(),
    address: String(body.address || '').trim(),
    updatedAt: new Date().toISOString(),
  };
  if (!client.name) return res.status(400).json({ error: 'Client name is required' });
  const idx = data.clients.findIndex((c) => c.id === client.id);
  if (idx >= 0) data.clients[idx] = client;
  else data.clients.push(client);
  await saveStore(data);
  res.json(client);
});

app.delete('/api/clients/:id', async (req, res) => {
  const data = await loadStore();
  data.clients = data.clients.filter((c) => c.id !== req.params.id);
  await saveStore(data);
  res.json({ ok: true });
});

// Bank Details API
app.put('/api/bank-details', async (req, res) => {
  const data = await loadStore();
  const b = req.body || {};
  data.bankDetails = {
    bankName: String(b.bankName || '').trim(),
    bankCode: String(b.bankCode || '').trim(),
    branch: String(b.branch || '').trim(),
    accountName: String(b.accountName || '').trim(),
    accountNumberUSD: String(b.accountNumberUSD || '').trim(),
    accountNumberKES: String(b.accountNumberKES || '').trim(),
    swiftCode: String(b.swiftCode || '').trim(),
  };
  await saveStore(data);

  // Proactive sync to Appwrite if configured
  const s = CLOUD_SETTINGS;
  if (s.endpoint && s.projectId && s.databaseId && s.bankDetailsCollectionId && s.apiKey) {
    try {
      const client = new Client().setEndpoint(s.endpoint).setProject(s.projectId).setKey(s.apiKey);
      const databases = new Databases(client);
      try {
        await databases.createDocument(s.databaseId, s.bankDetailsCollectionId, 'current', data.bankDetails);
      } catch {
        await databases.updateDocument(s.databaseId, s.bankDetailsCollectionId, 'current', data.bankDetails);
      }
    } catch (e) {
      console.error('Bank details sync failed:', e.message);
    }
  }

  res.json({ ok: true });
});

// Settings API - Simplified as settings are now in .env
app.put('/api/settings', async (req, res) => {
  res.status(403).json({ error: 'Settings are now managed via environment variables (.env)' });
});

// Invoices API
app.post('/api/invoices', async (req, res) => {
  const data = await loadStore();
  const body = req.body || {};
  const lineItems = Array.isArray(body.lineItems) ? body.lineItems : [];
  const total = lineItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const inv = {
    id: body.id || uid(),
    invoiceNo: String(body.invoiceNo || '').trim(),
    billedTo: String(body.billedTo || '').trim(),
    date: String(body.date || '').trim(),
    currency: String(body.currency || 'USD').trim(),
    status: body.status || 'draft',
    lineItems,
    total,
    updatedAt: new Date().toISOString(),
  };
  if (!inv.invoiceNo || !inv.billedTo || !inv.date || !lineItems.length) {
    return res.status(400).json({ error: 'invoiceNo, billedTo, date, lineItems required' });
  }
  const idx = data.invoices.findIndex((i) => i.id === inv.id);
  if (idx >= 0) data.invoices[idx] = inv;
  else data.invoices.push(inv);
  await saveStore(data);
  res.json(inv);
});

app.delete('/api/invoices/:id', async (req, res) => {
  const data = await loadStore();
  data.invoices = data.invoices.filter((i) => i.id !== req.params.id);
  await saveStore(data);
  res.json({ ok: true });
});

app.post('/api/receipts/from-invoice/:invoiceId', async (req, res) => {
  const data = await loadStore();
  const inv = data.invoices.find((i) => i.id === req.params.invoiceId);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const rcpt = {
    id: uid(),
    receiptNo: `RCPT-${String(data.receipts.length + 1).padStart(4, '0')}`,
    invoiceId: inv.id,
    invoiceNo: inv.invoiceNo,
    billedTo: inv.billedTo,
    amount: inv.total,
    date: new Date().toISOString().split('T')[0],
  };
  data.receipts.push(rcpt);
  inv.status = 'paid';
  inv.updatedAt = new Date().toISOString();
  await saveStore(data);
  res.json(rcpt);
});

// Sync
app.post('/api/sync/appwrite', async (_req, res) => {
  const data = await loadStore();
  const s = CLOUD_SETTINGS;
  if (!s.endpoint || !s.projectId || !s.databaseId || !s.invoicesCollectionId || !s.receiptsCollectionId || !s.bankDetailsCollectionId) {
    return res.status(400).json({ error: 'Appwrite cloud environment variables incomplete' });
  }
  if (!s.apiKey) {
    return res.status(400).json({ error: 'APPWRITE_API_KEY environment variable missing' });
  }
  try {
    const client = new Client().setEndpoint(s.endpoint).setProject(s.projectId).setKey(s.apiKey);
    const databases = new Databases(client);
    for (const inv of data.invoices) {
      try {
        await databases.createDocument(s.databaseId, s.invoicesCollectionId, inv.id, inv);
      } catch {
        await databases.updateDocument(s.databaseId, s.invoicesCollectionId, inv.id, inv);
      }
    }
    for (const r of data.receipts) {
      try {
        await databases.createDocument(s.databaseId, s.receiptsCollectionId, r.id, r);
      } catch {
        await databases.updateDocument(s.databaseId, s.receiptsCollectionId, r.id, r);
      }
    }
    // Sync Bank Details
    try {
      await databases.createDocument(s.databaseId, s.bankDetailsCollectionId, 'current', data.bankDetails);
    } catch {
      await databases.updateDocument(s.databaseId, s.bankDetailsCollectionId, 'current', data.bankDetails);
    }
    res.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Sync failed' });
  }
});

app.post('/api/pdf', async (req, res) => {
  const { html, filename } = req.body;
  if (!html) return res.status(400).json({ error: 'html required' });

  // Try common Chrome paths on Windows
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH,
  ].filter(Boolean);

  let executablePath = null;
  for (const p of chromePaths) {
    try {
      const { existsSync } = await import('fs');
      if (existsSync(p)) { executablePath = p; break; }
    } catch { /* continue */ }
  }

  if (!executablePath) {
    return res.status(500).json({ error: 'Chrome not found. Set CHROME_PATH env variable.' });
  }

  let browser;
  try {
    const puppeteer = (await import('puppeteer-core')).default;
    const browserlessToken = CLOUD_SETTINGS.browserlessToken;
    
    if (browserlessToken) {
      // PRO SOLUTION: Connect to a remote browser (Browserless.io)
      // This works on ANY cloud host (Vercel, Appwrite, etc.)
      browser = await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
      });
    } else if (executablePath) {
      // FALLBACK: Use local Chrome (for local development)
      browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    } else {
      throw new Error('No browser available. Provide BROWSERLESS_TOKEN or install Chrome.');
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '15mm', right: '15mm' },
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'invoice.pdf'}"`);
    res.send(Buffer.from(pdf));
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (browser) {
      if (process.env.BROWSERLESS_TOKEN) await browser.disconnect();
      else await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Ladina API http://localhost:${PORT}`);
});
