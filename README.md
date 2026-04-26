# Ladina Invoicer — React + Node + PostgreSQL

Invoicing and receipts with a **React (Vite)** frontend and **Node (Express)** API, powered by **Prisma** and **PostgreSQL**.

## Run on localhost

1.  **Prerequisites**:
    *   Node.js 18+
    *   PostgreSQL running locally or a connection string to a remote DB.

2.  **Setup Environment**:
    Create a `.env` file in the root directory:
    ```env
    PORT=3001
    DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ladina"
    BROWSERLESS_TOKEN="your_browserless_token"
    VITE_API_URL=http://localhost:3001
    ```

3.  **Install & Start**:
    ```bash
    npm install
    npm run build
    npm run dev
    ```

This starts **both** the API and the React app using `concurrently`.

## Deployment (Railway)

This project is optimized for [Railway](https://railway.app/).

1.  **Connect GitHub**: Create a new project on Railway and link your repository.
2.  **Add PostgreSQL**: Add a PostgreSQL plugin to your Railway project.
3.  **Variables**: Add `DATABASE_URL` (linked to Postgres), `BROWSERLESS_TOKEN`, and `VITE_API_URL` (your app's public URL).
4.  **Automatic Build**: Railway will use the `build` and `start` scripts in `package.json` to generate the Prisma client, run migrations, and start the server.

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/data` | Invoices + receipts + bank details |
| POST | `/api/invoices` | Create or update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| POST | `/api/receipts/from-invoice/:invoiceId` | Create receipt, mark invoice paid |
| PUT | `/api/bank-details` | Update company bank info |
| POST | `/api/pdf` | Generate PDF via Browserless |

## Project layout

```
client/          Vite + React (Frontend)
server/          Express API + Prisma + PostgreSQL (Backend)
```
