import { useEffect, useMemo, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { Tag } from '../components/Tag';
import { toast } from '../components/Toast';
import { TopRightUser } from '../components/TopRightUser';
import { getApiBase } from '../lib/api';
import { withdrawalStatusColor, withdrawalStatusLabel } from '../lib/status';
import { Layout } from './_layout';

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

export default function WithdrawalsPage() {
  const apiBase = useMemo(() => getApiBase(), []);

  const [token, setToken] = useState<string>('');
  const [items, setItems] = useState<WithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // create request
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('CNY');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('crmforfun_token');
    if (saved) setToken(saved);
  }, []);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/withdrawal-requests`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message ?? `加载失败：${res.status}`);
      setItems(json.data ?? []);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setError(msg);
      toast.error(msg, '加载提现列表失败');
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message ?? `创建失败：${res.status}`);
      setMemo('');
      await load();
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setError(msg);
      toast.error(msg, '创建提现失败');
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message ?? `${action} 失败：${res.status}`);
      await load();
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setError(msg);
      toast.error(msg, '操作失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthGate>
      {(me) => (
        <Layout title="提现审核" right={<TopRightUser email={me.email} role={me.role} />}>
          <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>创建提现申请（代理角色）</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额" style={{ padding: 8, width: 120 }} />
              <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="币种" style={{ padding: 8, width: 120 }} />
              <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="备注（可选）" style={{ padding: 8, minWidth: 260 }} />
              <button onClick={createRequest} disabled={loading || !token} style={{ padding: '8px 12px' }}>
                创建
              </button>
              <button onClick={load} disabled={loading || !token} style={{ padding: '8px 12px' }}>
                刷新
              </button>
            </div>
            <p style={{ marginTop: 8, marginBottom: 0, color: '#666' }}>审核动作需要 Admin/Finance 权限。</p>
          </section>

          {/* Error is shown as top-right toast; keep state for debugging only. */}
          {error ? null : null}

          <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0 }}>提现列表</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID', '金额', '币种', '状态', '代理ID', '创建时间', '操作'].map((h) => (
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
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>
                      <Tag color={withdrawalStatusColor(it.status)}>{withdrawalStatusLabel(it.status)}</Tag>
                    </td>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>
                      <code>{it.agentId.slice(0, 8)}...</code>
                    </td>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>{new Date(it.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => act(it.id, 'freeze')} disabled={loading || !token || it.status !== 'Requested'}>
                          冻结
                        </button>
                        <button onClick={() => act(it.id, 'approve')} disabled={loading || !token || it.status !== 'Frozen'}>
                          通过
                        </button>
                        <button
                          onClick={() => act(it.id, 'reject')}
                          disabled={loading || !token || (it.status !== 'Requested' && it.status !== 'Frozen')}
                        >
                          拒绝
                        </button>
                        <button onClick={() => act(it.id, 'payout')} disabled={loading || !token || it.status !== 'Approved'}>
                          打款
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length ? <p style={{ color: '#666' }}>暂无数据</p> : null}
          </section>
        </Layout>
      )}
    </AuthGate>
  );
}
