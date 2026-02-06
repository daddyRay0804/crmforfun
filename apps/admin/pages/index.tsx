import { useEffect, useMemo, useState } from 'react';
import { Layout } from './_layout';

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';
}

type Stats = {
  ok: boolean;
  now: string;
  deposits?: {
    totalAmountCredited: number;
    countCredited: number;
    pendingCount: number;
  };
  withdrawals?: {
    totalAmountPaid: number;
    countPaid: number;
    pendingCount: number;
  };
  pnl?: {
    grossIn: number;
    grossOut: number;
    net: number;
    note: string;
  };
};

export default function Home() {
  const apiBase = useMemo(() => getApiBase(), []);
  const [token, setToken] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [agentsTop, setAgentsTop] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem('bet_crm_demo_token');
    if (saved) setToken(saved);
  }, []);

  async function load() {
    setError(null);
    try {
      const res = await fetch(`${apiBase}/stats/summary`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.message ?? `stats failed: ${res.status}`);
      setStats(json);
      // load top agents
      const res2 = await fetch(`${apiBase}/stats/agents-top`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });
      const json2 = (await res2.json()) as any;
      if (res2.ok) setAgentsTop(json2?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Layout
      title="Dashboard"
      right={
        <button
          onClick={load}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 12px',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      }
    >
      {!token ? (
        <Card>
          <div style={{ fontWeight: 600 }}>未登录</div>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>
            请先到 Agents/Users 页面点击 Login（会自动保存 token 到浏览器 LocalStorage）。
          </div>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <div style={{ color: 'var(--danger)', fontWeight: 600 }}>Error</div>
          <div style={{ marginTop: 6 }}>{error}</div>
        </Card>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        <StatCard title="充值入账（总额）" value={fmtMoney(stats?.deposits?.totalAmountCredited)} hint="Credited" />
        <StatCard title="提现出账（总额）" value={fmtMoney(stats?.withdrawals?.totalAmountPaid)} hint="Paid" />
        <StatCard title="净流入（粗算）" value={fmtMoney(stats?.pnl?.net)} hint={stats?.pnl?.note ?? '粗算'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
        <StatCard title="待处理充值单" value={fmtInt(stats?.deposits?.pendingCount)} hint="Created/Awaiting" />
        <StatCard title="待处理提现单" value={fmtInt(stats?.withdrawals?.pendingCount)} hint="Requested/Frozen" />
        <StatCard title="时间" value={stats?.now ? new Date(stats.now).toLocaleString() : '—'} hint="server" />
      </div>



      <Card style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Top Agents（净流入，粗算）</div>
        {!agentsTop ? (
          <div style={{ color: 'var(--muted)' }}>—</div>
        ) : agentsTop.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {agentsTop.slice(0, 10).map((a: any) => (
              <div
                key={a.agentId}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 12,
                  background: 'rgba(0,0,0,0.015)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{a.type}</div>
                </div>
                <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{fmtMoney(a.net)}</div>
                <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
                  入账 {fmtMoney(a.creditedIn)} · 出账 {fmtMoney(a.paidOut)} · 待处理 充{fmtInt(a.depositPending)}/提{fmtInt(a.withdrawPending)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--muted)' }}>(no data)</div>
        )}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600 }}>客损 / 盈利（下一步）</div>
        <div style={{ color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
          我先把「净流入 = 入账 - 出账」作为粗算面板。你说的“客损/盈利”一般需要明确规则（例如：
          按用户维度的输赢、代理分成、手续费、冲正/退款、时间窗口等）。
          你给我口径，我就把面板升级成真实 KPI。
        </div>
      </Card>
    </Layout>
  );
}

function Card({ children, style }: { children: any; style?: any }) {
  return (
    <section
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow)',
        padding: 16,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>{value}</div>
      <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>{hint ?? ' '}</div>
    </Card>
  );
}

function fmtMoney(n: any) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n: any) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return String(Math.trunc(n));
}
