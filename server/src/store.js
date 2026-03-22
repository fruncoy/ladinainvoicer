import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DATA_PATH = join(__dirname, '..', 'data', 'store.json');

const defaultData = () => ({
  invoices: [],
  receipts: [],
  clients: [],
  bankDetails: {
    bankName: '',
    bankCode: '',
    branch: '',
    accountName: '',
    accountNumberUSD: '',
    accountNumberKES: '',
    swiftCode: '',
  },
  settings: {
    endpoint: '',
    projectId: '',
    databaseId: '',
    invoicesCollectionId: '',
    receiptsCollectionId: '',
    apiKey: '',
  },
});

export async function loadStore() {
  try {
    const raw = await readFile(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultData(), ...parsed, settings: { ...defaultData().settings, ...parsed.settings } };
  } catch {
    return defaultData();
  }
}

export async function saveStore(data) {
  await mkdir(dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}
