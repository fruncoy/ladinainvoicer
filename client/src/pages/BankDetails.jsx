import { useEffect } from 'react';

export default function BankDetails() {
  const staticInfo = {
    bankName: 'NCBA, Kenya',
    bankCode: '07000',
    branch: 'Yaya Centre (Code-030)',
    accountName: 'Ladina Travel Safaris Ltd',
    swiftCode: 'CBAFKENX',
    accUSD: '5213170028',
    accKES: '5213170012'
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#111' }}>Payment Bank Accounts</h2>
        <p className="muted">These are your official bank details used for all outgoing invoices.</p>
      </header>

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
            <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Bank Name:</span><strong>{staticInfo.bankName}</strong></div>
            <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Bank Code:</span><strong>{staticInfo.bankCode}</strong></div>
            <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Branch:</span><strong>{staticInfo.branch}</strong></div>
            <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>SWIFT Code:</span><strong>{staticInfo.swiftCode}</strong></div>
          </div>
          
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fcfcfc', borderRadius: '8px' }}>
            <span className="muted" style={{ fontSize: '0.9rem' }}>Account Name:</span><br/>
            <strong style={{ fontSize: '1.1rem' }}>{staticInfo.accountName}</strong>
          </div>

          <div style={{ background: 'var(--accent)', color: 'white', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.9 }}>Account Number</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '4px', letterSpacing: '1px' }}>{staticInfo.accUSD}</div>
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
            <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Bank Name:</span><strong>{staticInfo.bankName}</strong></div>
            <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Bank Code:</span><strong>{staticInfo.bankCode}</strong></div>
            <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>Branch:</span><strong>{staticInfo.branch}</strong></div>
            <div><span className="muted" style={{ display: 'block', marginBottom: '4px' }}>SWIFT Code:</span><strong>{staticInfo.swiftCode}</strong></div>
          </div>

          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fcfcfc', borderRadius: '8px' }}>
            <span className="muted" style={{ fontSize: '0.9rem' }}>Account Name:</span><br/>
            <strong style={{ fontSize: '1.1rem' }}>{staticInfo.accountName}</strong>
          </div>

          <div style={{ background: '#3b82f6', color: 'white', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.9 }}>Account Number</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '4px', letterSpacing: '1px' }}>{staticInfo.accKES}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
