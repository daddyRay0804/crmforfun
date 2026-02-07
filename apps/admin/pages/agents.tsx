import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { TopRightUser } from '../components/TopRightUser';
import { getApiBase } from '../lib/api';
import { Layout } from './_layout';

type AgentType = 'Normal' | 'Credit';

type AgentRecord = {
  id: string;
  name: string;
  type: AgentType;
};

function typeLabel(t: AgentType) {
  return t === 'Credit' ? '授信模式' : '普通模式';
}

export default function AgentsPage() {
  const apiBase = useMemo(() => getApiBase(), []);

  const [token, setToken] = useState<string>('');
  const [items, setItems] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AgentType>('Normal');

  useEffect(() => {
    const saved = window.localStorage.getItem('bet_crm_demo_token');
    if (saved) setToken(saved);
  }, []);

  async function loadAgents() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/agents`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message ?? `加载代理失败：${res.status}`);
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message ?? `创建代理失败：${res.status}`);
      setNewName('');
      await loadAgents();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) void loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthGate>
      {(me) => (
        <Layout title="代理管理" right={<TopRightUser email={me.email} role={me.role} />}>
          <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>创建代理</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="代理名称"
                style={{ padding: 8, minWidth: 240 }}
              />
              <select value={newType} onChange={(e) => setNewType(e.target.value as AgentType)} style={{ padding: 8 }}>
                <option value="Normal">普通模式</option>
                <option value="Credit">授信模式</option>
              </select>
              <button onClick={createAgent} disabled={loading || !newName.trim()} style={{ padding: '8px 12px' }}>
                创建
              </button>
              <button onClick={loadAgents} disabled={loading} style={{ padding: '8px 12px' }}>
                刷新
              </button>
            </div>
            <p style={{ marginBottom: 0, marginTop: 8, color: '#666' }}>
              提示：如未初始化账号，请先执行 <code>docker compose exec api npm -w apps/api run seed:demo</code>
            </p>
          </section>

          {error ? (
            <p style={{ color: 'crimson' }}>
              <strong>错误：</strong> {error}
            </p>
          ) : null}

          <section>
            <h2>代理列表</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>类型</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>名称</th>
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
                    <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{typeLabel(a.type)}</td>
                    <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{a.name}</td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 8, color: '#666' }}>
                      暂无数据
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        </Layout>
      )}
    </AuthGate>
  );
}
