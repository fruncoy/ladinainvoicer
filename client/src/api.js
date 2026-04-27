const base = import.meta.env.VITE_API_URL || '';

export async function request(path, options = {}) {
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
  saveInvoice: (body) => request('/api/invoices', { method: 'POST', body: JSON.stringify(body) }),
  deleteInvoice: (id) => request(`/api/invoices/${id}`, { method: 'DELETE' }),
  receiptFromInvoice: (invoiceId) =>
    request(`/api/receipts/from-invoice/${invoiceId}`, { method: 'POST' }),
  saveBankDetails: (body) => request('/api/bank-details', { method: 'PUT', body: JSON.stringify(body) }),
  saveClient: (body) => request('/api/clients', { method: 'POST', body: JSON.stringify(body) }),
};
