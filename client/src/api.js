const base = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
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
