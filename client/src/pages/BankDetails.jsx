import { useState, useEffect } from 'react';
import { api } from '../api';

export default function BankDetails() {
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    bankName: '',
    bankCode: '',
    branch: '',
    accountName: '',
    accountNumber: '',
    currency: 'USD',
    swiftCode: '',
    isDefault: false
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api.getData();
      if (data.bankAccounts) {
        setBankAccounts(data.bankAccounts);
      }
    } catch (e) {
      console.error('Failed to load bank accounts:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setEditingId(null);
    setFormData({
      bankName: '',
      bankCode: '',
      branch: '',
      accountName: '',
      accountNumber: '',
      currency: 'USD',
      swiftCode: '',
      isDefault: false
    });
    setShowForm(true);
  }

  function handleEdit(account) {
    setEditingId(account.id);
    setFormData({
      bankName: account.bankName,
      bankCode: account.bankCode || '',
      branch: account.branch || '',
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      currency: account.currency,
      swiftCode: account.swiftCode || '',
      isDefault: account.isDefault
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    try {
      await api.deleteBankAccount(id);
      setMessage('Account deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateBankAccount(editingId, formData);
      } else {
        await api.createBankAccount(formData);
      }
      setShowForm(false);
      setMessage('Account saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  const currencyColors = {
    USD: '#F48B29',
    KES: '#3b82f6'
  };

  if (loading) return <div className="card">Loading bank accounts...</div>;

  return (
    <div style={{ maxWidth: '1200px' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#111' }}>Payment Bank Accounts</h2>
          <p className="muted">Manage all your bank accounts for invoices</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>Add New Account</button>
      </header>

      {message && (
        <div style={{ padding: '1rem', background: '#ecfdf5', color: '#059669', borderRadius: '8px', marginBottom: '2rem', fontWeight: '600' }}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#111' }}>{editingId ? 'Edit Bank Account' : 'Add New Bank Account'}</h3>
          <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Bank Name *</label>
              <input 
                type="text" 
                value={formData.bankName} 
                onChange={e => setFormData({...formData, bankName: e.target.value})} 
                placeholder="e.g. NCBA, Kenya"
                required
              />
            </div>
            <div className="form-group">
              <label>Bank Code</label>
              <input 
                type="text" 
                value={formData.bankCode} 
                onChange={e => setFormData({...formData, bankCode: e.target.value})} 
                placeholder="e.g. 07000"
              />
            </div>
            <div className="form-group">
              <label>Branch</label>
              <input 
                type="text" 
                value={formData.branch} 
                onChange={e => setFormData({...formData, branch: e.target.value})} 
                placeholder="e.g. Yaya Centre"
              />
            </div>
            <div className="form-group">
              <label>SWIFT Code</label>
              <input 
                type="text" 
                value={formData.swiftCode} 
                onChange={e => setFormData({...formData, swiftCode: e.target.value})} 
                placeholder="e.g. CBAFKENX"
              />
            </div>
            <div className="form-group">
              <label>Currency *</label>
              <select
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value})}
              >
                <option value="USD">USD (US Dollar)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Account Number *</label>
              <input 
                type="text" 
                value={formData.accountNumber} 
                onChange={e => setFormData({...formData, accountNumber: e.target.value})} 
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Account Name *</label>
              <input 
                type="text" 
                value={formData.accountName} 
                onChange={e => setFormData({...formData, accountName: e.target.value})} 
                placeholder="e.g. Ladina Travel Safaris Ltd"
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                />
                Set as default account
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Account' : 'Save Account'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {bankAccounts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="muted" style={{ marginBottom: '1rem' }}>No bank accounts yet</p>
            <button className="btn btn-primary" onClick={handleAdd}>Add Your First Account</button>
          </div>
        ) : (
          bankAccounts.map(account => (
            <div 
              key={account.id} 
              className="card" 
              style={{
                padding: '2rem',
                position: 'relative',
                borderTop: `5px solid ${currencyColors[account.currency] || '#666'}'
              }}
            >
              {account.isDefault && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: '#2E7D32',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  DEFAULT
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111' }}>
                    {account.bankName}
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#666', fontWeight: '400' }}>
                      ({account.currency})
                    </span>
                  </h3>
                  {account.branch && (
                    <p className="muted" style={{ margin: '0.25rem 0 0 0' }}>{account.branch}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => handleEdit(account)}>Edit</button>
                  <button className="btn" onClick={() => handleDelete(account.id)}>Delete</button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.95rem' }}>
                <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Bank Code:</span><strong>{account.bankCode || '—'}</strong></div>
                <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>SWIFT Code:</span><strong>{account.swiftCode || '—'}</strong></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Account Name:</span><br/>
                  <strong style={{ fontSize: '1.05rem' }}>{account.accountName}</strong>
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                  <span className="muted" style={{ fontSize: '0.875rem' }}>Account Number:</span><br/>
                  <strong style={{ fontSize: '1.5rem', letterSpacing: '1px' }}>{account.accountNumber}</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
