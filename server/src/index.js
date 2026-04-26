import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/pdf' }));
app.use(express.text({ type: 'text/html' }));

// Serve static files from the React app in production
const clientDistPath = join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Helper for logging (matches Appwrite function signature if needed, but here we just use console)
const log = console.log;
const error = console.error;

// GET /api/data
app.get('/api/data', async (req, res) => {
  try {
    const [invoices, receipts, bankDetails] = await Promise.all([
      prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.receipt.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.bankDetails.findUnique({ where: { id: 'current' } })
    ]);

    res.json({
      invoices,
      receipts,
      bankDetails: bankDetails || {},
      clients: [],
      settings: {
        // We can keep this empty or remove it if frontend doesn't strictly need it
        browserlessToken: process.env.BROWSERLESS_TOKEN
      }
    });
  } catch (e) {
    error('Error fetching data:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/invoices
app.post('/api/invoices', async (req, res) => {
  const { id, ...cleanBody } = req.body;
  
  try {
    const data = {
      ...cleanBody,
      lineItems: typeof cleanBody.lineItems === 'string' ? JSON.parse(cleanBody.lineItems) : cleanBody.lineItems
    };

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
    error('Error saving invoice:', e);
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
    error('Error updating bank details:', e);
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
    error('Error deleting invoice:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/receipts
app.post('/api/receipts', async (req, res) => {
  try {
    const result = await prisma.receipt.create({ data: req.body });
    res.status(201).json(result);
  } catch (e) {
    error('Error creating receipt:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/receipts/from-invoice/:invoiceId
app.post('/api/receipts/from-invoice/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const [receipt] = await prisma.$transaction([
      prisma.receipt.create({
        data: {
          receiptNo: `REC-${invoice.invoiceNo}`,
          invoiceId: invoice.id,
          amount: invoice.total,
          date: new Date().toISOString().split('T')[0],
        }
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'paid' }
      })
    ]);

    res.status(201).json(receipt);
  } catch (e) {
    error('Error generating receipt from invoice:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pdf
app.post('/api/pdf', async (req, res) => {
  const { html, filename } = req.body;
  const browserlessToken = process.env.BROWSERLESS_TOKEN;

  if (!browserlessToken) {
    return res.status(500).json({ error: 'BROWSERLESS_TOKEN is missing' });
  }

  try {
    const mod = await import('puppeteer-core');
    const puppeteer = mod.default || mod;
    
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '15mm', right: '15mm' },
    });
    
    await browser.disconnect();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename || 'invoice.pdf'}"`,
    });
    res.send(Buffer.from(pdf));
  } catch (e) {
    error('PDF Error:', e);
    res.status(500).json({ error: e.message });
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
  log(`Server running on port ${port}`);
});

export default app;
