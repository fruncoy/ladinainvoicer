import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Logging for debugging
console.log('Server starting...');
console.log('BROWSERLESS_TOKEN length:', process.env.BROWSERLESS_TOKEN ? process.env.BROWSERLESS_TOKEN.length : 'MISSING');

// Serve static files from the React app
const clientDistPath = join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// GET /api/data
app.get('/api/data', async (req, res) => {
  try {
    const [invoices, receipts, bankAccounts, clients] = await Promise.all([
      prisma.invoice.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: { bankAccount: true }
      }),
      prisma.receipt.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.bankAccount.findMany({ orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }),
      prisma.client.findMany({ orderBy: { name: 'asc' } })
    ]);

    res.json({
      invoices: invoices.map(inv => ({
        ...inv,
        lineItems: typeof inv.lineItems === 'string' ? JSON.parse(inv.lineItems) : inv.lineItems
      })),
      receipts,
      bankAccounts: bankAccounts || [],
      clients: clients || [],
      settings: {
        browserlessToken: process.env.BROWSERLESS_TOKEN
      }
    });
  } catch (e) {
    console.error('Error fetching data:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/clients
app.post('/api/clients', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const client = await prisma.client.upsert({
      where: { name },
      update: { email, phone, address },
      create: { name, email, phone, address }
    });
    res.json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/invoices
app.post('/api/invoices', async (req, res) => {
  const { id, ...cleanBody } = req.body;
  try {
    const data = {
      ...cleanBody,
      lineItems: typeof cleanBody.lineItems !== 'string' ? JSON.stringify(cleanBody.lineItems) : cleanBody.lineItems
    };

    // Auto-save/update client
    if (cleanBody.billedTo) {
      await prisma.client.upsert({
        where: { name: cleanBody.billedTo },
        update: {},
        create: { name: cleanBody.billedTo }
      }).catch(err => console.error('Failed to auto-save client:', err));
    }

    let result;
    if (id) {
      result = await prisma.invoice.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
    } else {
      result = await prisma.invoice.create({ data });
    }
    res.status(200).json(result);
  } catch (e) {
    console.error('Error saving invoice:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bank-accounts
app.get('/api/bank-accounts', async (req, res) => {
  try {
    const bankAccounts = await prisma.bankAccount.findMany({ 
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] 
    });
    res.json(bankAccounts);
  } catch (e) {
    console.error('Error fetching bank accounts:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/bank-accounts
app.post('/api/bank-accounts', async (req, res) => {
  try {
    const { isDefault, ...data } = req.body;
    
    // If new account is default, unset others
    if (isDefault) {
      await prisma.bankAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const result = await prisma.bankAccount.create({ 
      data: { ...data, isDefault: isDefault || false } 
    });
    res.status(201).json(result);
  } catch (e) {
    console.error('Error creating bank account:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/bank-accounts/:id
app.put('/api/bank-accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault, ...data } = req.body;
    
    // If updating to default, unset others
    if (isDefault) {
      await prisma.bankAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const result = await prisma.bankAccount.update({ 
      where: { id }, 
      data: { ...data, isDefault: isDefault !== undefined ? isDefault : undefined }
    });
    res.status(200).json(result);
  } catch (e) {
    console.error('Error updating bank account:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/bank-accounts/:id
app.delete('/api/bank-accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.bankAccount.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting bank account:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/invoices/:id
app.delete('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.invoice.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting invoice:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/receipts
app.post('/api/receipts', async (req, res) => {
  try {
    const result = await prisma.receipt.create({ data: req.body });
    res.status(201).json(result);
  } catch (e) {
    console.error('Error creating receipt:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pdf
app.post('/api/pdf', async (req, res) => {
  const { html, filename } = req.body;
  const browserlessToken = process.env.BROWSERLESS_TOKEN;

  if (!browserlessToken) {
    console.error('PDF ERROR: BROWSERLESS_TOKEN is missing');
    return res.status(500).json({ 
      error: 'BROWSERLESS_TOKEN is missing in Railway Variables.',
      details: 'Please add BROWSERLESS_TOKEN to your Railway service variables.'
    });
  }

  let browser;
  try {
    // Dynamic import for better ESM compatibility
    const { default: puppeteer } = await import('puppeteer-core');
    
    console.log('PDF: Connecting to Browserless...');
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
    });

    const page = await browser.newPage();
    console.log('PDF: Setting content...');
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
    
    console.log('PDF: Generating binary...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '15mm', right: '15mm' },
    });
    
    await browser.disconnect();

    console.log('PDF: Success');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename || 'invoice.pdf'}"`,
    });
    res.send(Buffer.from(pdf));
  } catch (e) {
    console.error('PDF ERROR details:', e);
    if (browser) await browser.disconnect().catch(() => {});
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: e.message
    });
  }
});

// Fallback for SPA (React Router)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.sendFile(join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
