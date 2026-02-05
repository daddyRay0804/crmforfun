import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type AgentType = 'Normal' | 'Credit';

type AgentRecord = {
  id: string;
  name: string;
  type: AgentType;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';
}

export default function AgentsPage() {
  const apiBase = useMemo(() => getApiBase(), []);

  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('admin@example.com');
  const [password, setPassword] = useState<string>('admin123');

  const [items, setItems] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AgentType>('Normal');

  useEffect(() => {
    const saved = window.localStorage.getItem('bet_crm_demo_token');
    if (saved) setToken(saved);
  }, []);

  async function login() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(`login failed: ${res.status}`);
      const json = (await res.json()) as { access_token: string };
      setToken(json.access_token);
      window.localStorage.setItem('bet_crm_demo_token', json.access_token);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadAgents() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/agents`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`list agents failed: ${res.status}`);
      const json = (await res.json()) as { data: AgentRecord[] };
      setItems(json.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function createAgent() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/agents`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newName, type: newType }),
      });
      if (!res.ok) throw new Error(`create agent failed: ${res.status}`);
      setNewName('');
      await loadAgents();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 960 }}>
      <h1>Agents</h1>
      <p>
        <Link href="/">← Home</Link>
      </p>

      <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Auth</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            style={{ padding: 8, minWidth: 240 }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            type="password"
            style={{ padding: 8, minWidth: 240 }}
          />
          <button onClick={login} disabled={loading} style={{ padding: '8px 12px' }}>
            Login
          </button>
        </div>
        <p style={{ marginBottom: 0, color: '#666' }}>
          API: <code>{apiBase}</code>
        </p>
        <p style={{ marginTop: 8, marginBottom: 0, color: '#666' }}>
          Token: <code>{token ? `${token.slice(0, 12)}...` : '(none)'}</code>
        </p>
      </section>

      <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Create</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="agent name"
            style={{ padding: 8, minWidth: 240 }}
          />
          <select value={newType} onChange={(e) => setNewType(e.target.value as AgentType)} style={{ padding: 8 }}>
            <option value="Normal">Normal</option>
            <option value="Credit">Credit</option>
          </select>
          <button onClick={createAgent} disabled={loading || !newName.trim()} style={{ padding: '8px 12px' }}>
            Create
          </button>
          <button onClick={loadAgents} disabled={loading} style={{ padding: '8px 12px' }}>
            Refresh
          </button>
        </div>
      </section>

      {error ? (
        <p style={{ color: 'crimson' }}>
          <strong>Error:</strong> {error}
        </p>
      ) : null}

      <section>
        <h2>List</h2>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Type</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Name</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
                  <Link href={`/agents/${a.id}`}>
                    <code>{a.id}</code>
                  </Link>
                </td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{a.type}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{a.name}</td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={3} style={{ padding: 8, color: '#666' }}>
                  (no data)
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
