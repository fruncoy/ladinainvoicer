const base = import.meta.env.VITE_API_URL || '';

export async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (options.responseType === 'blob') {
    if (!res.ok) {
      const text = await res.text();
      let msg = res.statusText;
      try { msg = JSON.parse(text).error || JSON.parse(text).details || msg; } catch {}
      throw new Error(msg);
    }
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
  saveInvoice: (body) => request('/api/invoices', { method: 'POST', body: JSON.stringify(body) }),
  deleteInvoice: (id) => request(`/api/invoices/${id}`, { method: 'DELETE' }),
  receiptFromInvoice: (invoiceId) =>
    request(`/api/receipts/from-invoice/${invoiceId}`, { method: 'POST' }),
  getBankAccounts: () => request('/api/bank-accounts'),
  createBankAccount: (body) => request('/api/bank-accounts', { method: 'POST', body: JSON.stringify(body) }),
  updateBankAccount: (id, body) => request(`/api/bank-accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBankAccount: (id) => request(`/api/bank-accounts/${id}`, { method: 'DELETE' }),
  saveClient: (body) => request('/api/clients', { method: 'POST', body: JSON.stringify(body) }),
};
