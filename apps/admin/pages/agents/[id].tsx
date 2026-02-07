import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AuthGate } from '../../components/AuthGate';
import { TopRightUser } from '../../components/TopRightUser';
import { getApiBase } from '../../lib/api';
import { Layout } from '../_layout';

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

function typeLabel(t: AgentType) {
  return t === 'Credit' ? '授信模式' : '普通模式';
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

      const aJson = await aRes.json().catch(() => ({}));
      const uJson = await uRes.json().catch(() => ({}));

      if (!aRes.ok) throw new Error(aJson?.message ?? `加载代理失败：${aRes.status}`);
      if (!uRes.ok) throw new Error(uJson?.message ?? `加载代理下用户失败：${uRes.status}`);

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
    <AuthGate>
      {(me) => (
        <Layout title="代理详情" right={<TopRightUser email={me.email} role={me.role} />}>
          <div style={{ marginBottom: 12 }}>
            <Link href="/agents">← 返回代理列表</Link>
          </div>

          <button onClick={load} disabled={loading || !id} style={{ padding: '8px 12px' }}>
            刷新
          </button>

          {error ? (
            <p style={{ color: 'crimson' }}>
              <strong>错误：</strong> {error}
            </p>
          ) : null}

          <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginTop: 16 }}>
            <h2 style={{ marginTop: 0 }}>基础信息</h2>
            {agent ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>
                  <strong>ID：</strong> <code>{agent.id}</code>
                </li>
                <li>
                  <strong>类型：</strong> {typeLabel(agent.type)}
                </li>
                <li>
                  <strong>名称：</strong> {agent.name}
                </li>
              </ul>
            ) : (
              <p style={{ margin: 0, color: '#666' }}>加载中…</p>
            )}
          </section>

          <section style={{ marginTop: 16 }}>
            <h2>该代理下的用户</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>邮箱</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>角色</th>
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
                      暂无用户
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
