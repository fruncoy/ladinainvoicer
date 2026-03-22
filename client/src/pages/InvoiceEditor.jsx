import { useEffect, useMemo, useState, useRef } from 'react';
import { api } from '../api';
import { previewInvoice } from '../utils/export';

function uid() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function InvoiceEditor({ invoiceId, onClose, onSaved, onPreview }) {
  const isNew = !invoiceId;

  function money(n, cur = 'USD') {
    return `${cur} ${Number(n || 0).toFixed(2)}`;
  }

  const [loading, setLoading] = useState(!!invoiceId);
  const [err, setErr] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billedTo, setBilledTo] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [lineItems, setLineItems] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [clients, setClients] = useState([]);
  
  const [itemCategory, setItemCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemFromDate, setItemFromDate] = useState('');
  const [itemToDate, setItemToDate] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const editFormRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api.getData().then(d => {
      if (cancelled) return;
      setClients(d.clients || []);
      setBankDetails(d.bankDetails);
      
      if (invoiceId) {
        const inv = d.invoices?.find((i) => i.id === invoiceId);
        if (!inv) {
          setErr('Invoice not found');
          return;
        }
        setInvoiceNo(inv.invoiceNo);
        setBilledTo(inv.billedTo);
        setDate(inv.date);
        setCurrency(inv.currency || 'USD');
        setLineItems(inv.lineItems || []);
      } else {
        const lastNo = d.invoices?.[d.invoices.length - 1]?.invoiceNo;
        if (lastNo && lastNo.includes('-')) {
          const parts = lastNo.split('-');
          const num = parseInt(parts[parts.length - 1]);
          if (!isNaN(num)) {
            setInvoiceNo(parts.slice(0, -1).join('-') + '-' + String(num + 1).padStart(3, '0'));
          }
        }
      }
    }).catch(e => {
       if (!cancelled) setErr(e.message);
    }).finally(() => {
       if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [invoiceId]);

  const total = useMemo(() => lineItems.reduce((s, i) => s + Number(i.amount || 0), 0), [lineItems]);

  function addItem() {
    if (!itemName.trim() || !itemAmount || Number(itemAmount) <= 0) return alert('Enter name and valid amount');
    
    const itemData = { 
      id: editIdx !== null ? lineItems[editIdx].id : uid(), 
      category: itemCategory, 
      name: itemName.trim(), 
      description: itemDescription.trim(), 
      amount: Number(itemAmount),
      fromDate: itemFromDate,
      toDate: itemToDate
    };

    if (editIdx !== null) {
      const newList = [...lineItems];
      newList[editIdx] = itemData;
      setLineItems(newList);
      setEditIdx(null);
    } else {
      setLineItems((prev) => [...prev, itemData]);
    }

    setItemName(''); setItemDescription(''); setItemAmount(''); setItemFromDate(''); setItemToDate('');
  }

  function editItem(idx) {
    const it = lineItems[idx];
    setItemCategory(it.category || '');
    setItemName(it.name);
    setItemDescription(it.description);
    setItemAmount(it.amount);
    setItemFromDate(it.fromDate || '');
    setItemToDate(it.toDate || '');
    setEditIdx(idx);
    if (editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function cancelEdit() {
    setItemName(''); setItemDescription(''); setItemAmount(''); setItemFromDate(''); setItemToDate('');
    setEditIdx(null);
  }

  function duplicateItem(idx) {
    const item = lineItems[idx];
    const copy = { ...item, id: uid() };
    const newList = [...lineItems];
    newList.splice(idx + 1, 0, copy);
    setLineItems(newList);
  }

  function moveItem(idx, direction) {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === lineItems.length - 1) return;
    const newList = [...lineItems];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    setLineItems(newList);
  }

  const handleSave = async () => {
    if (!invoiceNo.trim() || !billedTo.trim() || !date || !lineItems.length) {
      alert('All fields and at least one item required.');
      return;
    }
    setLoading(true);
    try {
      const saved = await api.saveInvoice({
        id: invoiceId || undefined,
        invoiceNo: invoiceNo.trim(),
        billedTo: billedTo.trim(),
        date,
        currency,
        lineItems,
      });
      onSaved(saved);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && invoiceId) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 46, 22, 0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '15px'
    }} onClick={onClose}>
      <section className="card" style={{ 
        maxWidth: '1000px', width: '100%', maxHeight: '95vh', overflowY: 'auto', padding: '0',
        background: '#fff', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
      }} onClick={e => e.stopPropagation()}>
        
        <header style={{ 
          padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 10
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand)' }}>{isNew ? 'New Invoice' : 'Edit Invoice'}</h2>
            <p className="muted" style={{ fontSize: '0.75rem' }}>{invoiceNo || 'Draft'}</p>
          </div>
          <button className="btn" onClick={onClose} style={{ border: 'none', background: '#f8fafc', width: '32px', height: '32px', borderRadius: '50%', padding: 0 }}>×</button>
        </header>

        <div style={{ padding: '2rem' }}>
          {err && <p className="error" style={{ marginBottom: '1.5rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fee2e2' }}>{err}</p>}

          <div className="invoice-sections" style={{ display: 'grid', gap: '2rem' }}>
            
            {/* SECTION 1: OVERALL */}
            <div className="section-block" style={{ border: '1px solid #e2e8f0', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--brand)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--brand-soft)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', border: '1px solid var(--brand-mid)' }}>1</span>
                Overall Settings
              </h3>
              <div className="grid-2">
                <div>
                  <label>Service Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                    <option value="">None / Plain</option>
                    <option value="Safari">Safari</option>
                    <option value="Transfers">Transfers</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label>Bank Details</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="USD">USD Account</option>
                      <option value="KES">KES Account</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: BILLED TO & DATE */}
            <div className="section-block" style={{ border: '1px solid #e2e8f0', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--brand)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--brand-soft)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', border: '1px solid var(--brand-mid)' }}>2</span>
                Billed To & Date
              </h3>
              <div className="grid-2">
                <div>
                  <label>Client Name</label>
                  <input 
                    list="clients-list" 
                    value={billedTo} 
                    onChange={(e) => setBilledTo(e.target.value)} 
                    placeholder="Search or enter client name..." 
                  />
                  <datalist id="clients-list">
                    {clients.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
                <div>
                  <label>Invoice Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* SECTION 3: DETAILS */}
            <div className="section-block" ref={editFormRef} style={{ border: '1px solid #e2e8f0', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--brand)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--brand-soft)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', border: '1px solid var(--brand-mid)' }}>3</span>
                Line Items
              </h3>
              
              <div className="card" style={{ background: '#fcfcfc', border: '1px dashed #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label>Item Name / Name</label>
                    <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. 3-Day Maasai Mara Safari" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label>Description / Details</label>
                    <input value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="e.g. Full board, Land Cruiser with guide" />
                  </div>
                  <div className="mobile-full-row">
                    <label>Amount</label>
                    <input type="number" value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="grid-2 mobile-full-row" style={{ gap: '0.5rem', gridColumn: 'span 1' }}>
                    <div>
                      <label>From Date</label>
                      <input type="date" value={itemFromDate} onChange={(e) => setItemFromDate(e.target.value)} />
                    </div>
                    <div>
                      <label>To Date</label>
                      <input type="date" value={itemToDate} onChange={(e) => setItemToDate(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={addItem}>
                    {editIdx !== null ? 'Update Item' : '+ Add Item'}
                  </button>
                  {editIdx !== null && (
                    <button type="button" className="btn" style={{ flex: 0.3 }} onClick={cancelEdit}>Cancel</button>
                  )}
                </div>
              </div>

              {lineItems.length > 0 && (
                <div className="table-wrap">
                  <table style={{ background: '#fff' }}>
                    <thead>
                      <tr>
                        <th>Item Details</th>
                        <th className="right">Dates</th>
                        <th className="right">Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((it, idx) => (
                        <tr key={it.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{it.name}</div>
                            <div className="muted line-item-desc-text" style={{ fontSize: '0.7rem' }}>{it.description}</div>
                          </td>
                          <td className="right small muted">
                            {it.fromDate && <div>{it.fromDate}</div>}
                            {it.toDate && <div>to {it.toDate}</div>}
                          </td>
                          <td className="right" style={{ fontWeight: 700 }}>{Number(it.amount).toFixed(2)}</td>
                          <td className="right">
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button type="button" className="btn btn-sm" onClick={() => editItem(idx)} style={{ padding: '3px 10px', background: '#e2e8f0', color: '#334155', fontWeight: 600, fontSize: '0.75rem' }}>Edit</button>
                              <button type="button" className="btn btn-sm" onClick={() => moveItem(idx, 'up')} disabled={idx === 0} style={{ padding: '2px 6px', background: '#f1f5f9', color: '#475569' }}>↑</button>
                              <button type="button" className="btn btn-sm" onClick={() => moveItem(idx, 'down')} disabled={idx === lineItems.length - 1} style={{ padding: '2px 6px', background: '#f1f5f9', color: '#475569' }}>↓</button>
                              <button type="button" className="btn btn-sm" onClick={() => duplicateItem(idx)} style={{ padding: '2px 8px', background: '#f1f5f9', color: 'var(--brand)' }} title="Duplicate">❐</button>
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => setLineItems(l => l.filter((_, i) => i !== idx))} style={{ padding: '2px 8px', fontSize: '1rem' }}>×</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--brand-soft)', borderRadius: '0 0 12px 12px', marginTop: '-1px', border: '1px solid var(--brand-mid)' }}>
                    <span style={{ fontWeight: 800, color: 'var(--brand-dark)' }}>TOTAL</span>
                    <span style={{ color: 'var(--brand-dark)', fontSize: '1.35rem', fontWeight: 900 }}>{money(total, currency)}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="btn-row" style={{ marginTop: '3rem', justifyContent: 'flex-end', gap: '1rem' }}>
             <button type="button" className="btn" onClick={() => onPreview && onPreview(previewInvoice({ invoiceNo, billedTo, date, currency, lineItems, total }, bankDetails))} style={{ padding: '0.75rem 1.5rem' }}>Preview PDF</button>
             <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ padding: '0.75rem 2.5rem' }}>{loading ? 'Saving...' : 'Save Invoice'}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

