import { useState, useEffect } from 'react';
import { api } from '../api';

export default function BankDetails() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    bankCode: '',
    branch: '',
    accountName: '',
    accountNumberUSD: '',
    accountNumberKES: '',
    swiftCode: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api.getData();
      if (data.bankDetails) {
        setBankDetails(data.bankDetails);
      }
    } catch (err) {
      console.error('Failed to load bank details', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.saveBankDetails(bankDetails);
      setEditing(false);
      setMessage('✓ Bank details saved and synced to cloud!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="card">Loading bank details...</div>;

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#111' }}>Payment Bank Accounts</h2>
          <p className="muted">These are your official bank details used for all outgoing invoices.</p>
        </div>
        {!editing && (
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Details</button>
        )}
      </header>

      {message && (
        <div style={{ padding: '1rem', background: '#ecfdf5', color: '#059669', borderRadius: '8px', marginBottom: '2rem', fontWeight: '500' }}>
          {message}
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="card" style={{ padding: '2.5rem' }}>
          <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Bank Name</label>
              <input 
                type="text" 
                value={bankDetails.bankName} 
                onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} 
                placeholder="e.g. NCBA, Kenya"
                required
              />
            </div>
            <div className="form-group">
              <label>Bank Code</label>
              <input 
                type="text" 
                value={bankDetails.bankCode} 
                onChange={e => setBankDetails({...bankDetails, bankCode: e.target.value})} 
                placeholder="e.g. 07000"
              />
            </div>
            <div className="form-group">
              <label>Branch</label>
              <input 
                type="text" 
                value={bankDetails.branch} 
                onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} 
                placeholder="e.g. Yaya Centre"
              />
            </div>
            <div className="form-group">
              <label>SWIFT Code</label>
              <input 
                type="text" 
                value={bankDetails.swiftCode} 
                onChange={e => setBankDetails({...bankDetails, swiftCode: e.target.value})} 
                placeholder="e.g. CBAFKENX"
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Account Name</label>
              <input 
                type="text" 
                value={bankDetails.accountName} 
                onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} 
                placeholder="e.g. Ladina Travel Safaris Ltd"
                required
              />
            </div>
            <div className="form-group">
              <label>USD Account Number</label>
              <input 
                type="text" 
                value={bankDetails.accountNumberUSD} 
                onChange={e => setBankDetails({...bankDetails, accountNumberUSD: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>KES Account Number</label>
              <input 
                type="text" 
                value={bankDetails.accountNumberKES} 
                onChange={e => setBankDetails({...bankDetails, accountNumberKES: e.target.value})} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); loadData(); }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="grid-2" style={{ gap: '2rem' }}>
          {/* USD CARD */}
          <div className="card" style={{ 
            borderTop: '5px solid var(--accent)', 
            background: '#fff',
            boxShadow: '0 4px 12px rgba(244, 139, 41, 0.1)',
            padding: '2.5rem'
          }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#111' }}>Dollar Account (USD)</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.95rem' }}>
              <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Bank Name:</span><strong>{bankDetails.bankName || '---'}</strong></div>
              <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Bank Code:</span><strong>{bankDetails.bankCode || '---'}</strong></div>
              <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Branch:</span><strong>{bankDetails.branch || '---'}</strong></div>
              <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>SWIFT Code:</span><strong>{bankDetails.swiftCode || '---'}</strong></div>
            </div>
            
            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fcfcfc', borderRadius: '8px' }}>
              <span className="muted" style={{ fontSize: '0.9rem' }}>Account Name:</span><br/>
              <strong style={{ fontSize: '1.1rem' }}>{bankDetails.accountName || '---'}</strong>
            </div>

            <div style={{ background: 'var(--accent)', color: 'white', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.9 }}>Account Number</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '4px', letterSpacing: '1px' }}>{bankDetails.accountNumberUSD || 'N/A'}</div>
            </div>
          </div>

          {/* KES CARD */}
          <div className="card" style={{ 
            borderTop: '5px solid #3b82f6', 
            background: '#fff',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
            padding: '2.5rem'
          }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#111' }}>Shilling Account (KES)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.95rem' }}>
              <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Bank Name:</span><strong>{bankDetails.bankName || '---'}</strong></div>
              <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Bank Code:</span><strong>{bankDetails.bankCode || '---'}</strong></div>
              <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Branch:</span><strong>{bankDetails.branch || '---'}</strong></div>
              <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>SWIFT Code:</span><strong>{bankDetails.swiftCode || '---'}</strong></div>
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fcfcfc', borderRadius: '8px' }}>
              <span className="muted" style={{ fontSize: '0.9rem' }}>Account Name:</span><br/>
              <strong style={{ fontSize: '1.1rem' }}>{bankDetails.accountName || '---'}</strong>
            </div>

            <div style={{ background: '#3b82f6', color: 'white', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.9 }}>Account Number</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '4px', letterSpacing: '1px' }}>{bankDetails.accountNumberKES || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
