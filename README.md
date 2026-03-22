# Ladina Invoicer — React + Node

Invoicing and receipts with a **React (Vite)** frontend and **Node (Express)** API. Data is stored in `server/data/store.json`. Optional **Appwrite** sync runs on the server with an API key (not bundled in the client).

## Run on localhost (easiest)

From the project root `Ladina Invoicer`:

```bash
npm install
cd server && npm install && cd ../client && npm install && cd ..
npm run dev
```

This starts **both** the API and the React app. Then:

- **Open the app in your browser** at the URL Vite prints (usually **http://localhost:5173**).
- The API runs at **http://localhost:3001** (Vite proxies `/api` there automatically).

Check the API: [http://localhost:3001/api/health](http://localhost:3001/api/health) should return `{"ok":true}`.

### Two terminals instead

**Terminal 1 — API**

```bash
cd server
npm run dev
```

**Terminal 2 — React**

```bash
cd client
npm run dev
```

## Prerequisites

- Node.js 18+

## Install (first time only)

```bash
npm install
cd server && npm install
cd ../client && npm install
```

## Files you can delete

| Path | Notes |
|------|--------|
| `client/dist/` | Production build output. Safe to delete anytime; recreate with `cd client && npm run build`. (Already in `client/.gitignore`.) |
| `**/node_modules/` | Reinstall with `npm install` in each folder that has a `package.json`. |
| `server/data/store.json` | **Only if you want to wipe all invoices/receipts/settings.** It is created when you first use the app. Keep `server/data/.gitkeep`. |

Do **not** delete `server/src/`, `client/src/`, `package.json` files, or `vite.config.js` unless you know you don’t need them.

## Build (production)

```bash
cd client
npm run build
```

Serve `client/dist` with any static host, and point `VITE_API_URL` to your API origin, **or** run the API on the same host and configure your reverse proxy so `/api` hits Express.

Example production env for the built client:

```env
VITE_API_URL=https://your-api.example.com
```

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/data` | Invoices + receipts + settings (no API key returned) |
| PUT | `/api/settings` | Save Appwrite settings; send `apiKey` only when changing it |
| POST | `/api/invoices` | Create or update invoice (body includes optional `id`) |
| DELETE | `/api/invoices/:id` | Delete invoice |
| POST | `/api/receipts/from-invoice/:invoiceId` | Create receipt, mark invoice paid |
| POST | `/api/sync/appwrite` | Push all data to Appwrite (requires server API key) |

## Appwrite

1. Create a project and database; add collections `invoices` and `receipts` with attributes matching the JSON fields (or use flexible schema if available).
2. Create an **API key** with permission to read/write those collections.
3. In the app: **Appwrite Sync** → enter endpoint, project, database, collection IDs → **Save settings** → **Sync now**.

The API key is stored only in `server/data/store.json` on your machine/server — never in the React build.

## Project layout

```
client/          Vite + React + React Router
server/          Express API + JSON persistence
```
