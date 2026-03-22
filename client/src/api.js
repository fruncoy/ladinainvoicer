import { functions } from './lib/appwrite';

const base = import.meta.env.VITE_API_URL || '';
const functionId = import.meta.env.VITE_APPWRITE_FUNCTION_ID;

export async function request(path, options = {}) {
  // If in production and we have a function ID, use Appwrite Functions directly
  if (import.meta.env.PROD && functionId) {
    try {
      const execution = await functions.createExecution(
        functionId,
        options.body || '',
        false, // async = false (wait for result)
        path,
        options.method || 'GET',
        options.headers || {}
      );

      let data;
      const isBase64 = execution.responseHeaders?.some?.(h => 
        h.name?.toLowerCase() === 'x-appwrite-response-format' && h.value === 'base64'
      ) || execution.responseHeaders?.['x-appwrite-response-format'] === 'base64';

      if (isBase64) {
        data = execution.responseBody; // Return raw base64 string
      } else {
        try {
          data = execution.responseBody ? JSON.parse(execution.responseBody) : null;
        } catch {
          data = { error: execution.responseBody };
        }
      }

      if (execution.status === 'failed' || execution.responseStatusCode >= 400) {
        throw new Error(data?.error || `Function error: ${execution.responseStatusCode}`);
      }
      return data;
    } catch (e) {
      console.error('Appwrite Function Execution failed:', e);
      throw e;
    }
  }

  // Local development or backup: standard fetch
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (options.responseType === 'blob') {
    if (!res.ok) throw new Error(res.statusText);
    return res.blob();
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    throw new Error(data?.error || res.statusText || 'Request failed');
  }
  return data;
}

export const api = {
  getData: () => request('/api/data'),
  saveSettings: (body) => request('/api/settings', { method: 'PUT', body: JSON.stringify(body) }),
  saveInvoice: (body) => request('/api/invoices', { method: 'POST', body: JSON.stringify(body) }),
  deleteInvoice: (id) => request(`/api/invoices/${id}`, { method: 'DELETE' }),
  receiptFromInvoice: (invoiceId) =>
    request(`/api/receipts/from-invoice/${invoiceId}`, { method: 'POST' }),
  saveClient: (body) => request('/api/clients', { method: 'POST', body: JSON.stringify(body) }),
  deleteClient: (id) => request(`/api/clients/${id}`, { method: 'DELETE' }),
  saveBankDetails: (body) => request('/api/bank-details', { method: 'PUT', body: JSON.stringify(body) }),
  syncAppwrite: () => request('/api/sync/appwrite', { method: 'POST' }),
};
