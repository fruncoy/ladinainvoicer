import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

console.log('--- LOCAL SERVER STARTUP ---');
console.log('Project ID:', process.env.VITE_APPWRITE_PROJECT_ID);
console.log('Browserless Token:', process.env.BROWSERLESS_TOKEN ? '(PROVIDED)' : '(MISSING)');
console.log('------------------------------');

import express from 'express';
import cors from 'cors';
const { default: handler } = await import('./index.js');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/pdf' }));
app.use(express.text({ type: 'text/html' }));

// Helper to simulate Appwrite Function environment
app.all('*', async (req, res) => {
    const wrappedReq = {
        path: req.path,
        method: req.method,
        body: req.body,
        headers: req.headers,
    };

    const wrappedRes = {
        json: (obj, code = 200, headers = {}) => {
            res.set(headers).status(code).json(obj);
            return wrappedRes;
        },
        send: (data, status, headers = {}) => {
            let body = data;
            if (headers['X-Appwrite-Response-Format'] === 'base64') {
                body = Buffer.from(data, 'base64');
            }
            res.status(status || 200).set(headers).send(body);
            return wrappedRes;
        },
    };

    const log = (msg) => console.log(`[LOG] ${msg}`);
    const error = (msg) => console.error(`[ERROR] ${msg}`);

    try {
        await handler({ req: wrappedReq, res: wrappedRes, log, error });
    } catch (e) {
        console.error('Function execution failed:', e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Local dev server (Appwrite Function Sim) running at http://localhost:${port}`);
});
