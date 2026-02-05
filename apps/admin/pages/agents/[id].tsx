import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type AgentType = 'Normal' | 'Credit';

type AgentRecord = {
  id: string;
  name: string;
  type: AgentType;
};

type AgentUserRecord = {
  id: string;
  email: string;
  role: string;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';
}

export default function AgentDetailPage() {
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const id = typeof router.query.id === 'string' ? router.query.id : '';

  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [users, setUsers] = useState<AgentUserRecord[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem('bet_crm_demo_token');
    if (saved) setToken(saved);
  }, []);

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const [aRes, uRes] = await Promise.all([
        fetch(`${apiBase}/agents/${id}`, {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        }),
        fetch(`${apiBase}/agents/${id}/users`, {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        }),
      ]);

      if (!aRes.ok) throw new Error(`load agent failed: ${aRes.status}`);
      if (!uRes.ok) throw new Error(`load agent users failed: ${uRes.status}`);

      const aJson = (await aRes.json()) as { data: AgentRecord };
      const uJson = (await uRes.json()) as { data: AgentUserRecord[] };

      setAgent(aJson.data);
      setUsers(uJson.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 960 }}>
      <h1>Agent Detail</h1>
      <p>
        <Link href="/agents">← Agents</Link>
      </p>

      <p style={{ marginTop: 0, color: '#666' }}>
        API: <code>{apiBase}</code>
      </p>
      <p style={{ marginTop: 0, color: '#666' }}>
        Token: <code>{token ? `${token.slice(0, 12)}...` : '(none)'}</code>
      </p>

      <button onClick={load} disabled={loading || !id} style={{ padding: '8px 12px' }}>
        Refresh
      </button>

      {error ? (
        <p style={{ color: 'crimson' }}>
          <strong>Error:</strong> {error}
        </p>
      ) : null}

      <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Info</h2>
        {agent ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              <strong>ID:</strong> <code>{agent.id}</code>
            </li>
            <li>
              <strong>Type:</strong> {agent.type}
            </li>
            <li>
              <strong>Name:</strong> {agent.name}
            </li>
          </ul>
        ) : (
          <p style={{ margin: 0, color: '#666' }}>(loading...)</p>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>Users under this agent</h2>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Email</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
                  <code>{u.id}</code>
                </td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{u.email}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{u.role}</td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td colSpan={3} style={{ padding: 8, color: '#666' }}>
                  (no users)
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
