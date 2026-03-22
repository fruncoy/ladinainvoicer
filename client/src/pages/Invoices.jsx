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


  const openNew = () => {
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (id) => {
    setEditingId(id);
    setShowModal(true);
  };

  const onSaved = () => {
    setShowModal(false);
    refresh();
  };

  const invoices = data?.invoices || [];

  return (
    <div style={{ maxWidth: '1300px' }}>
      {showModal && (
        <InvoiceEditor 
          invoiceId={editingId} 
          onClose={() => setShowModal(false)} 
          onSaved={onSaved} 
          onPreview={(html) => setPreviewHtml(html)}
        />
      )}

      {/* IN-APP PREVIEW MODAL */}
      {previewHtml && (
        <div
          onClick={() => setPreviewHtml(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'flex-start', padding: '1rem', gap: '0.75rem',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: '0.85rem', opacity: 0.7 }}>Click outside to close</span>
            <button
              onClick={() => setPreviewHtml(null)}
              style={{ background: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, cursor: 'pointer', color: '#334155' }}
            >
              ✕ Close
            </button>
          </div>
          <div
            style={{
              /* Scale A4 (794px) to fit the viewport */
              width: '210mm',
              transformOrigin: 'top center',
              transform: `scale(${Math.min(1, (window.innerWidth - 16) / 794)})`,
              marginBottom: `calc((297mm * ${Math.min(1, (window.innerWidth - 16) / 794)} - 297mm))`,
            }}
          >
            <iframe
              onClick={(e) => e.stopPropagation()}
              srcDoc={previewHtml}
              style={{
                width: '210mm',
                minHeight: '297mm',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                background: '#fff',
                display: 'block',
              }}
              title="Invoice Preview"
            />
          </div>
        </div>
      )}

      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Invoices</h2>
        <p className="muted">Manage your billing and outgoing invoices accurately.</p>
      </header>

      {err && <p className="error" style={{ marginBottom: '1rem' }}>{err}</p>}

      <section className="card" style={{ padding: 0 }}>
        <header style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3 style={{ margin: 0 }}>Invoice Archive</h3>
           <button className="btn btn-primary" onClick={openNew}>+ New Invoice</button>
        </header>
        
        {!invoices.length ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
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
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
                        <button className="btn btn-sm" onClick={() => openEdit(inv.id)} style={{ fontSize: '0.8rem' }}>
                          Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => setPreviewHtml(previewInvoice(inv, data?.bankDetails))}
                          style={{ fontSize: '0.8rem', background: '#f8f9fa', border: '1px solid #ddd' }}
                        >
                          Preview
                        </button>

                        <button 
                          disabled={downloadingId === inv.id} 
                          onClick={() => handleDownload(inv)} 
                          title="Download PDF"
                          style={{ 
                            cursor: downloadingId === inv.id ? 'not-allowed' : 'pointer', 
                            background: '#f0fdf4', 
                            border: '1px solid #bbf7d0', 
                            borderRadius: '8px', 
                            padding: '5px 12px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            color: '#16a34a', 
                            opacity: downloadingId === inv.id ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                            minWidth: downloadingId === inv.id ? '135px' : 'auto'
                          }}
                        >
                          {downloadingId === inv.id ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                              </svg>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Downloading...</span>
                            </>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          )}
                        </button>
                        <button 
                          disabled={busy === inv.id} 
                          onClick={() => onDelete(inv.id)}
                          title="Delete"
                          style={{ cursor: 'pointer', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '5px 8px', display: 'inline-flex', alignItems: 'center', color: '#dc2626', opacity: busy === inv.id ? 0.3 : 1 }}
                        >
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
