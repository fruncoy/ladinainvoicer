import { useEffect, useState } from 'react';
import { api } from '../api';
import { previewReceipt, downloadReceipt } from '../utils/export';

function money(n, currency = 'USD') {
  return `${currency} ${Number(n || 0).toFixed(2)}`;
}

export default function Receipts() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const refresh = () => {
    return api.getData().then(setData).catch((e) => setErr(e.message));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDownload = async (receipt) => {
    const inv = data?.invoices?.find(i => i.id === receipt.invoiceId);
    if (!inv) return alert("Invoice data missing");
    setDownloadingId(receipt.id);
    try {
      await downloadReceipt(inv, receipt, inv.bankAccount);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = (receipt) => {
    const inv = data?.invoices?.find(i => i.id === receipt.invoiceId);
    if (!inv) return alert("Invoice data missing");
    setPreviewHtml(previewReceipt(inv, receipt, inv.bankAccount));
  };

  const handleGenerateReceipt = async () => {
    if (!selectedInvoice) return;
    const inv = data?.invoices?.find(i => i.id === selectedInvoice);
    if (!inv || !confirm(`Generate receipt for invoice ${inv.invoiceNo}?`)) return;
    
    setBusy(true);
    try {
      await api.receiptFromInvoice(inv.id);
      setSelectedInvoice('');
      setShowModal(false);
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const receipts = data?.receipts || [];
  const unpaidInvoices = (data?.invoices || []).filter(i => i.status !== 'paid');

  return (
    <div style={{ maxWidth: '1300px' }}>
      {previewHtml && (
        <div
          onClick={() => setPreviewHtml(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'flex-start', padding: '1rem', gap: '1rem',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0, width: '100%', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '0.9rem', opacity: 0.8 }}>Preview Mode</span>
            <button
              onClick={() => setPreviewHtml(null)}
              style={{ background: '#fff', border: 'none', borderRadius: '12px', padding: '8px 20px', fontWeight: 700, cursor: 'pointer', color: '#1a1a1a', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            >
              ✕ Close
            </button>
          </div>
          <div
            style={{
              width: '210mm',
              maxWidth: '100%',
              transformOrigin: 'top center',
              transform: window.innerWidth < 794 ? `scale(${(window.innerWidth - 32) / 794})` : 'none',
              marginBottom: window.innerWidth < 794 ? `calc(297mm * ${(window.innerWidth - 32) / 794} - 297mm)` : '2rem',
            }}
          >
            <iframe
              onClick={(e) => e.stopPropagation()}
              srcDoc={previewHtml}
              style={{
                width: '210mm',
                minHeight: '297mm',
                border: 'none',
                borderRadius: '4px',
                boxShadow: '0 30px 90px rgba(0,0,0,0.4)',
                background: '#fff',
                display: 'block',
              }}
              title="Receipt Preview"
            />
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--brand)' }}>Generate Receipt</h2>
            <p className="muted" style={{ marginBottom: '1.5rem' }}>Select an unpaid invoice to generate a receipt.</p>
            <label>Unpaid Invoice</label>
            <select 
              value={selectedInvoice} 
              onChange={e => setSelectedInvoice(e.target.value)}
              style={{ width: '100%', marginBottom: '2rem', padding: '0.6rem' }}
            >
              <option value="">-- Select Unpaid Invoice --</option>
              {unpaidInvoices.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.invoiceNo} - {inv.billedTo} ({money(inv.total, inv.currency)})</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowModal(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" disabled={!selectedInvoice || busy} onClick={handleGenerateReceipt}>
                {busy ? 'Generating...' : 'Generate Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Receipts</h2>
        <p className="muted">Manage and generate receipts for paid invoices.</p>
      </header>

      {err && <p className="error">{err}</p>}
      
      <section className="card" style={{ padding: 0 }}>
        <header style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
           <h3 style={{ margin: 0 }}>All Receipts</h3>
           <button 
             className="btn btn-primary" 
             onClick={() => setShowModal(true)}
           >
             + Generate Receipt
           </button>
        </header>
        {!receipts.length ? (
          <p className="muted">No receipts yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600' }}>{r.receiptNo}</td>
                    <td>{r.invoiceNo}</td>
                    <td>{r.billedTo}</td>
                    <td>{r.date}</td>
                    <td style={{ fontWeight: '600' }}>{money(r.amount, data?.invoices?.find(i => i.id === r.invoiceId)?.currency)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handlePreview(r)}
                          style={{ fontSize: '0.8rem' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          Preview
                        </button>
                        
                        <button 
                          disabled={downloadingId === r.id} 
                          onClick={() => handleDownload(r)} 
                          title="Download PDF"
                          className={`btn btn-pdf ${downloadingId === r.id ? 'loading' : ''}`}
                          style={{ minWidth: downloadingId === r.id ? '135px' : 'auto', gap: '8px' }}
                        >
                          {downloadingId === r.id ? (
                            <>
                              <span className="spinner"></span>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              PDF
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
