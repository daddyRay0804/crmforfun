import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Role = 'Admin' | 'Agent_Normal' | 'Agent_Credit' | 'Finance';

type WithdrawalRecord = {
  id: string;
  agentId: string;
  createdByUserId: string;
  reviewedByUserId: string | null;
  amount: number;
  currency: string;
  status: 'Requested' | 'Frozen' | 'Approved' | 'Rejected' | 'Paid';
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';
}

export default function WithdrawalsPage() {
  const apiBase = useMemo(() => getApiBase(), []);

  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('admin@example.com');
  const [password, setPassword] = useState<string>('admin123');

  const [items, setItems] = useState<WithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // create request
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('CNY');
  const [memo, setMemo] = useState('');

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

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/withdrawal-requests`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`list failed: ${res.status}`);
      const json = (await res.json()) as { data: WithdrawalRecord[] };
      setItems(json.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function createRequest() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/withdrawal-requests`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency,
          memo: memo.trim() ? memo.trim() : undefined,
        }),
      });
      if (!res.ok) throw new Error(`create failed: ${res.status}`);
      setMemo('');
      await load();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function act(id: string, action: 'freeze' | 'approve' | 'reject' | 'payout') {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/withdrawal-requests/${encodeURIComponent(id)}/${action}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ memo: `ui: ${action}` }),
      });
      if (!res.ok) throw new Error(`${action} failed: ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 1100 }}>
      <h1>Withdrawals</h1>
      <p>
        <Link href="/">← Home</Link>
      </p>

      <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Auth</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" style={{ padding: 8, minWidth: 240 }} />
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
          <button onClick={load} disabled={loading || !token} style={{ padding: '8px 12px' }}>
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
        <h2 style={{ marginTop: 0 }}>Create withdrawal request (Agent roles)</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="amount" style={{ padding: 8, width: 120 }} />
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="currency" style={{ padding: 8, width: 120 }} />
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="memo (optional)" style={{ padding: 8, minWidth: 260 }} />
          <button onClick={createRequest} disabled={loading || !token} style={{ padding: '8px 12px' }}>
            Create
          </button>
        </div>
        <p style={{ marginTop: 8, marginBottom: 0, color: '#666' }}>
          Review actions require Admin/Finance token.
        </p>
      </section>

      {error ? (
        <p style={{ color: 'crimson' }}>
          <strong>Error:</strong> {error}
        </p>
      ) : null}

      <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>List</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['id', 'amount', 'currency', 'status', 'agentId', 'createdAt', 'actions'].map((h) => (
                <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '8px 6px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>
                  <code>{it.id.slice(0, 8)}...</code>
                </td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>{it.amount}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>{it.currency}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>{it.status}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>
                  <code>{it.agentId.slice(0, 8)}...</code>
                </td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>{new Date(it.createdAt).toLocaleString()}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => act(it.id, 'freeze')} disabled={loading || !token || it.status !== 'Requested'}>
                      Freeze
                    </button>
                    <button onClick={() => act(it.id, 'approve')} disabled={loading || !token || it.status !== 'Frozen'}>
                      Approve
                    </button>
                    <button
                      onClick={() => act(it.id, 'reject')}
                      disabled={loading || !token || (it.status !== 'Requested' && it.status !== 'Frozen')}
                    >
                      Reject
                    </button>
                    <button onClick={() => act(it.id, 'payout')} disabled={loading || !token || it.status !== 'Approved'}>
                      Payout
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <p style={{ color: '#666' }}>No items.</p> : null}
      </section>
    </main>
  );
}
