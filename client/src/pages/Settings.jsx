import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Settings() {
  const [endpoint, setEndpoint] = useState('');
  const [projectId, setProjectId] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [invoicesCollectionId, setInvoicesCollectionId] = useState('');
  const [receiptsCollectionId, setReceiptsCollectionId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .getData()
      .then((d) => {
        const s = d.settings || {};
        setEndpoint(s.endpoint || '');
        setProjectId(s.projectId || '');
        setDatabaseId(s.databaseId || '');
        setInvoicesCollectionId(s.invoicesCollectionId || '');
        setReceiptsCollectionId(s.receiptsCollectionId || '');
      })
      .catch((e) => setErr(e.message));
  }, []);

  async function save() {
    setErr('');
    setMsg('');
    try {
      await api.saveSettings({
        endpoint,
        projectId,
        databaseId,
        invoicesCollectionId,
        receiptsCollectionId,
        apiKey: apiKey || undefined,
      });
      setMsg('Settings saved. API key is stored only on the server.');
      setApiKey('');
    } catch (e) {
      setErr(e.message);
    }
  }

  async function sync() {
    setErr('');
    setMsg('');
    try {
      await api.syncAppwrite();
      setMsg('Sync completed successfully.');
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <>
      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}
      <section className="card">
        <h2>Configuration</h2>
        <label>Endpoint</label>
        <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://cloud.appwrite.io/v1" />
        <label>Project ID</label>
        <input value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        <label>Database ID</label>
        <input value={databaseId} onChange={(e) => setDatabaseId(e.target.value)} />
        <label>Invoices collection ID</label>
        <input value={invoicesCollectionId} onChange={(e) => setInvoicesCollectionId(e.target.value)} />
        <label>Receipts collection ID</label>
        <input value={receiptsCollectionId} onChange={(e) => setReceiptsCollectionId(e.target.value)} />
        <label>API key (server only — create in Appwrite with Databases write)</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Leave blank to keep existing key"
          autoComplete="off"
        />
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={save}>
            Save settings
          </button>
        </div>
      </section>
    </>
  );
}
