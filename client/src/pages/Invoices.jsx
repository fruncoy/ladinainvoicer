import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { previewInvoice, downloadInvoice } from '../utils/export';
import InvoiceEditor from './InvoiceEditor';

function money(n, currency = 'USD') {
  return `${currency} ${Number(n || 0).toFixed(2)}`;
}

export default function Invoices() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const refresh = useCallback(() => {
    return api.getData().then(setData).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onDelete(id) {
    if (!confirm('Delete this invoice?')) return;
    setBusy(id);
    try {
      await api.deleteInvoice(id);
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  }

  const handleDownload = async (inv) => {
    setDownloadingId(inv.id);
    try {
      await downloadInvoice(inv, data?.bankDetails);
    } finally {
      setDownloadingId(null);
    }
  };

  const openEdit = (id) => {
    setEditingId(id);
    setShowModal(true);
  };

  const invoices = data?.invoices || [];

  return (
    <div className="container">
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <InvoiceEditor 
              invoiceId={editingId} 
              onClose={() => { setShowModal(false); setEditingId(null); }} 
              onSaved={() => { setShowModal(false); setEditingId(null); refresh(); }} 
            />
          </div>
        </div>
      )}

      {previewHtml && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <header className="modal-header">
              <h3>Preview Invoice</h3>
              <button className="btn" onClick={() => setPreviewHtml(null)}>×</button>
            </header>
            <div className="preview-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}

      <header className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="muted">Manage and track your customer invoices</p>
        </div>
        <button className="btn btn-primary" onClick={() => openEdit(null)}>+ New Invoice</button>
      </header>

      {err && <p className="error-box">{err}</p>}

      <section className="card">
        {invoices.length === 0 && !data ? (
          <div className="empty-state">
            <p className="muted">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <p className="muted">No invoices yet. Click '+ New Invoice' to create one.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: '#fcfcfc', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '1.25rem' }}>#</th>
                  <th style={{ padding: '1.25rem' }}>Billed to</th>
                  <th style={{ padding: '1.25rem' }}>Total</th>
                  <th style={{ padding: '1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...invoices].reverse().map((inv, idx) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f9f9f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', background: 'var(--brand-soft)', color: 'var(--brand-dark)', textAlign: 'center', borderRight: '1px solid #eee' }}>{invoices.length - idx}</td>
                    <td style={{ padding: '1rem' }}>{inv.billedTo}</td>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{money(inv.total, inv.currency)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => openEdit(inv.id)} style={{ fontSize: '0.8rem' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit
                        </button>
                        
                        <button 
                          disabled={downloadingId === inv.id} 
                          onClick={() => handleDownload(inv)}
                          title="Download PDF"
                          className={`btn btn-pdf ${downloadingId === inv.id ? 'loading' : ''}`}
                          style={{ minWidth: downloadingId === inv.id ? '135px' : 'auto', gap: '8px' }}
                        >
                          {downloadingId === inv.id ? (
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

                        <button 
                          disabled={busy === inv.id} 
                          onClick={() => onDelete(inv.id)}
                          title="Delete"
                          className={`btn btn-delete ${busy === inv.id ? 'loading' : ''}`}
                        >
                          {busy === inv.id && <span className="spinner"></span>}
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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
