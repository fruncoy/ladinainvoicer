import { useEffect, useState } from 'react';
import { api } from '../api';

function money(n) {
  return `USD ${Number(n || 0).toFixed(2)}`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .getData()
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  const invoices = data?.invoices || [];
  
  const totalUSD = invoices
    .filter(i => (i.currency || 'USD') === 'USD')
    .reduce((s, i) => s + Number(i.total || 0), 0);

  const totalKES = invoices
    .filter(i => i.currency === 'KES')
    .reduce((s, i) => s + Number(i.total || 0), 0);

  return (
    <>
      {err && <p className="error">{err}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <section className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoices</h2>
          <p style={{ fontSize: '3.5rem', fontWeight: 800, margin: 0, color: 'var(--brand)', lineHeight: 1 }}>
            {invoices.length}
          </p>
        </section>
        <section className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>USD Invoiced</h2>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: 'var(--brand)', lineHeight: 1.2, wordBreak: 'break-word' }}>
            USD {Number(totalUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </section>
        <section className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>KES Invoiced</h2>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: 'var(--brand)', lineHeight: 1.2, wordBreak: 'break-word' }}>
            KES {Number(totalKES).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </section>
      </div>
    </>
  );
}
