import { useEffect, useMemo, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { TopRightUser } from '../components/TopRightUser';
import { getApiBase } from '../lib/api';
import { Layout } from './_layout';

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

function roleLabel(r: Role) {
  if (r === 'Admin') return '管理员';
  if (r === 'Finance') return '财务';
  if (r === 'Agent_Normal') return '代理（普通）';
  if (r === 'Agent_Credit') return '代理（授信）';
  return r;
}

export default function UsersPage() {
  const apiBase = useMemo(() => getApiBase(), []);

  const [token, setToken] = useState<string>('');
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

  async function loadAgents() {
    const res = await fetch(`${apiBase}/agents`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message ?? `加载代理失败：${res.status}`);
    setAgents(json.data ?? []);
  }

  async function loadUsers() {
    const res = await fetch(`${apiBase}/users`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message ?? `加载用户失败：${res.status}`);
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message ?? `创建用户失败：${res.status}`);
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message ?? `绑定代理失败：${res.status}`);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthGate>
      {(me) => (
        <Layout title="用户管理" right={<TopRightUser email={me.email} role={me.role} />}>
          <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>创建用户 + 绑定代理</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="邮箱" style={{ padding: 8, minWidth: 260 }} />
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="密码"
                style={{ padding: 8, minWidth: 200 }}
              />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)} style={{ padding: 8 }}>
                <option value="Admin">管理员</option>
                <option value="Finance">财务</option>
                <option value="Agent_Normal">代理（普通）</option>
                <option value="Agent_Credit">代理（授信）</option>
              </select>
              <select value={newAgentId} onChange={(e) => setNewAgentId(e.target.value)} style={{ padding: 8, minWidth: 220 }}>
                <option value="">（不绑定代理）</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button onClick={createUser} disabled={loading || !token || !newEmail.trim() || !newPassword.trim()} style={{ padding: '8px 12px' }}>
                创建
              </button>
              <button onClick={refreshAll} disabled={loading || !token} style={{ padding: '8px 12px' }}>
                刷新
              </button>
            </div>
          </section>

          {error ? (
            <p style={{ color: 'crimson' }}>
              <strong>错误：</strong> {error}
            </p>
          ) : null}

          <section>
            <h2>用户列表</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>邮箱</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>角色</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>所属代理</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <UserRow key={u.id} user={u} agents={agents} loading={loading} onSetAgent={setUserAgent} />
                ))}
                {!items.length ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 8, color: '#666' }}>
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
      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{roleLabel(user.role)}</td>
      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)} style={{ padding: 6, minWidth: 200 }}>
          <option value="">（不绑定代理）</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </td>
      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
        <button onClick={() => onSetAgent(user.id, agentId.trim() ? agentId : null)} disabled={loading} style={{ padding: '6px 10px' }}>
          保存
        </button>
      </td>
    </tr>
  );
}
