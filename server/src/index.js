import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

// Load Cloud Settings
const CLOUD_SETTINGS = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: process.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID || 'default',
  invoicesCollectionId: process.env.VITE_APPWRITE_INVOICES_COL_ID || 'invoices',
  receiptsCollectionId: process.env.VITE_APPWRITE_RECEIPTS_COL_ID || 'receipts',
  bankDetailsCollectionId: process.env.VITE_APPWRITE_BANK_COL_ID || 'bankDetails',
  apiKey: process.env.APPWRITE_API_KEY,
  browserlessToken: process.env.BROWSERLESS_TOKEN
};

export default async ({ req, res, log, error }) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-appwrite-project, x-appwrite-key',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.send('', 204, headers);
  }

  const s = CLOUD_SETTINGS;
  if (!s.apiKey || !s.projectId) {
    return res.json({ error: 'Backend configuration missing (API Key or Project ID)' }, 500, headers);
  }

  const client = new Client().setEndpoint(s.endpoint).setProject(s.projectId).setKey(s.apiKey);
  const databases = new Databases(client);

  try {
    // ROUTING
    const path = req.path.replace('/api', '');

    // GET /data (The main dashboard load)
    if (path === '/data' && req.method === 'GET') {
      const [invs, rcpts, bank] = await Promise.all([
        databases.listDocuments(s.databaseId, s.invoicesCollectionId),
        databases.listDocuments(s.databaseId, s.receiptsCollectionId),
        databases.getDocument(s.databaseId, s.bankDetailsCollectionId, 'current').catch(() => null)
      ]);

      const mapDoc = (d) => ({ ...d, lineItems: typeof d.lineItems === 'string' ? JSON.parse(d.lineItems) : d.lineItems });

      return res.json({
        invoices: invs.documents.map(mapDoc),
        receipts: rcpts.documents,
        bankDetails: bank || {},
        clients: [], // Todo: add clients collection if needed
        settings: CLOUD_SETTINGS
      }, 200, headers);
    }

    // POST /invoices
    if (path === '/invoices' && req.method === 'POST') {
      const { id: reqId, ...cleanBody } = req.body;
      const id = reqId || `id_${Date.now()}`;
      
      // Remove all Appwrite systemic fields if they accidentally leaked in
      Object.keys(cleanBody).forEach(key => {
        if (key.startsWith('$')) delete cleanBody[key];
      });

      if (cleanBody.lineItems && typeof cleanBody.lineItems !== 'string') {
        cleanBody.lineItems = JSON.stringify(cleanBody.lineItems);
      }
      
      try {
        const doc = await databases.createDocument(s.databaseId, s.invoicesCollectionId, id, cleanBody);
        return res.json(doc, 201, headers);
      } catch (e) {
        log(`Create failed, attempting update: ${e.message}`);
        const doc = await databases.updateDocument(s.databaseId, s.invoicesCollectionId, id, cleanBody);
        return res.json(doc, 200, headers);
      }
    }

    // PUT /bank-details
    if (path === '/bank-details' && req.method === 'PUT') {
      try {
        const doc = await databases.updateDocument(s.databaseId, s.bankDetailsCollectionId, 'current', req.body);
        return res.json(doc, 200, headers);
      } catch {
        const doc = await databases.createDocument(s.databaseId, s.bankDetailsCollectionId, 'current', req.body);
        return res.json(doc, 201, headers);
      }
    }

    // DELETE /invoices /:id
    if (path.startsWith('/invoices/') && req.method === 'DELETE') {
      const id = path.split('/').pop();
      try {
        await databases.deleteDocument(s.databaseId, s.invoicesCollectionId, id);
        return res.json({ success: true }, 200, headers);
      } catch (e) {
        error(`Delete failed: ${e.message}`);
        return res.json({ error: e.message }, 500, headers);
      }
    }

    // POST /pdf
    if (path === '/pdf' && req.method === 'POST') {
      const { html, filename } = req.body;
      try {
        log('Importing puppeteer-core...');
        const mod = await import('puppeteer-core');
        const puppeteer = mod.default || mod;
        
        let browser;
        try {
          const tokenStr = String(s.browserlessToken || '');
          const tokenDisplay = tokenStr ? tokenStr.substring(0, 5) : 'NONE';
          log(`Connecting to Browserless: wss://chrome.browserless.io?token=${tokenDisplay}...`);
          
          browser = await puppeteer.connect({
            browserWSEndpoint: `wss://chrome.browserless.io?token=${s.browserlessToken}`,
          });
          log('Browser connected');
        } catch (e) {
          error(`Connect error: ${e.message}`);
          throw new Error(`PDF Error: Browserless connection failed (${e.message}). Check your token.`);
        }

        const page = await browser.newPage();
        log('Page created, setting content...');
        // Using 'load' instead of 'networkidle0' because we inline most resources
        await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
        
        log('Generating PDF...');
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '12mm', bottom: '12mm', left: '15mm', right: '15mm' },
        });
        
        log('PDF OK');
        await browser.disconnect();

        return res.send(Buffer.from(pdf).toString('base64'), 200, {
          ...headers,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename || 'invoice.pdf'}"`,
          'X-Appwrite-Response-Format': 'base64'
        });
      } catch (e) {
        error(`PDF Fatal: ${e.message}`);
        throw e;
      }
    }

    return res.json({ error: `Not Found: ${req.method} ${req.path}` }, 404, headers);

  } catch (e) {
    error(e.message);
    return res.json({ error: e.message }, 500, headers);
  }
};
