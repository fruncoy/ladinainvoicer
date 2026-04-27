import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large HTML/PDF payloads

// Serve static files from the React app
const clientDistPath = join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// GET /api/data
app.get('/api/data', async (req, res) => {
  try {
    const [invoices, receipts, bankDetails, clients] = await Promise.all([
      prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.receipt.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.bankDetails.findUnique({ where: { id: 'current' } }),
      prisma.client.findMany({ orderBy: { name: 'asc' } })
    ]);

    res.json({
      invoices: invoices.map(inv => ({
        ...inv,
        lineItems: typeof inv.lineItems === 'string' ? JSON.parse(inv.lineItems) : inv.lineItems
      })),
      receipts,
      bankDetails: bankDetails || {},
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

// PUT /api/bank-details
app.put('/api/bank-details', async (req, res) => {
  try {
    const result = await prisma.bankDetails.upsert({
      where: { id: 'current' },
      update: req.body,
      create: { id: 'current', ...req.body },
    });
    res.status(200).json(result);
  } catch (e) {
    console.error('Error updating bank details:', e);
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
    console.error('PDF ERROR: BROWSERLESS_TOKEN is missing in environment variables');
    return res.status(500).json({ 
      error: 'BROWSERLESS_TOKEN is missing. Please add it to Railway variables.',
      details: 'Check your Railway dashboard -> Variables tab.'
    });
  }

  let browser;
  try {
    console.log('PDF: Connecting to Browserless...');
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
    });

    const page = await browser.newPage();
    console.log('PDF: Setting content...');
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    
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
      details: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
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
