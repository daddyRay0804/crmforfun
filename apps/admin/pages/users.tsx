import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Role = 'Admin' | 'Agent_Normal' | 'Agent_Credit' | 'Finance';

type AgentType = 'Normal' | 'Credit';

type AgentRecord = {
  id: string;
  name: string;
  type: AgentType;
};

type UserRecord = {
  id: string;
  email: string;
  role: Role;
  agentId: string | null;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';
}

export default function UsersPage() {
  const apiBase = useMemo(() => getApiBase(), []);

  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('admin@example.com');
  const [password, setPassword] = useState<string>('admin123');

  const [items, setItems] = useState<UserRecord[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // create user form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('Agent_Normal');
  const [newAgentId, setNewAgentId] = useState<string>('');

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
    const res = await fetch(`${apiBase}/agents`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`list agents failed: ${res.status}`);
    const json = (await res.json()) as { data: AgentRecord[] };
    setAgents(json.data ?? []);
  }

  async function loadUsers() {
    const res = await fetch(`${apiBase}/users`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`list users failed: ${res.status}`);
    const json = (await res.json()) as { data: UserRecord[] };
    setItems(json.data ?? []);
  }

  async function refreshAll() {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([loadAgents(), loadUsers()]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function createUser() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/users`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
          agentId: newAgentId.trim() ? newAgentId.trim() : null,
        }),
      });
      if (!res.ok) throw new Error(`create user failed: ${res.status}`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('Agent_Normal');
      setNewAgentId('');
      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function setUserAgent(userId: string, agentId: string | null) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/users/${encodeURIComponent(userId)}/agent`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) throw new Error(`set user agent failed: ${res.status}`);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 1000 }}>
      <h1>Users</h1>
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
          <button onClick={refreshAll} disabled={loading || !token} style={{ padding: '8px 12px' }}>
            Refresh
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
        <h2 style={{ marginTop: 0 }}>Create user + bind agent</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user email"
            style={{ padding: 8, minWidth: 260 }}
          />
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="password"
            style={{ padding: 8, minWidth: 200 }}
          />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)} style={{ padding: 8 }}>
            <option value="Admin">Admin</option>
            <option value="Finance">Finance</option>
            <option value="Agent_Normal">Agent_Normal</option>
            <option value="Agent_Credit">Agent_Credit</option>
          </select>
          <select value={newAgentId} onChange={(e) => setNewAgentId(e.target.value)} style={{ padding: 8, minWidth: 220 }}>
            <option value="">(no agent)</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type})
              </option>
            ))}
          </select>
          <button
            onClick={createUser}
            disabled={
              loading ||
              !token ||
              !newEmail.trim() ||
              !newPassword.trim() ||
              !newRole
            }
            style={{ padding: '8px 12px' }}
          >
            Create
          </button>
        </div>
        <p style={{ marginTop: 8, marginBottom: 0, color: '#666' }}>
          Tip: create agent first in <Link href="/agents">/agents</Link>, then bind here.
        </p>
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
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Email</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Role</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Agent</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <UserRow key={u.id} user={u} agents={agents} loading={loading} onSetAgent={setUserAgent} />
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={5} style={{ padding: 8, color: '#666' }}>
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

function UserRow({
  user,
  agents,
  loading,
  onSetAgent,
}: {
  user: UserRecord;
  agents: AgentRecord[];
  loading: boolean;
  onSetAgent: (userId: string, agentId: string | null) => Promise<void>;
}) {
  const [agentId, setAgentId] = useState<string>(user.agentId ?? '');

  useEffect(() => {
    setAgentId(user.agentId ?? '');
  }, [user.agentId]);

  return (
    <tr>
      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
        <code>{user.id}</code>
      </td>
      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{user.email}</td>
      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{user.role}</td>
      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)} style={{ padding: 6, minWidth: 200 }}>
          <option value="">(no agent)</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.type})
            </option>
          ))}
        </select>
      </td>
      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
        <button
          onClick={() => onSetAgent(user.id, agentId.trim() ? agentId : null)}
          disabled={loading}
          style={{ padding: '6px 10px' }}
        >
          Save
        </button>
      </td>
    </tr>
  );
}
