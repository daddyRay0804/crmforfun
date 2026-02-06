import { useEffect, useMemo, useState } from 'react';
import { Layout } from './_layout';

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';
}

type Stats = {
  ok: boolean;
  now: string;
  range?: { from: string | null; to: string | null };
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
  const [tz, setTz] = useState<string>('');

  const [rangeKey, setRangeKey] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [range, setRange] = useState<{ from?: string; to?: string }>({});

  const [stats, setStats] = useState<Stats | null>(null);
  const [agentsTop, setAgentsTop] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem('bet_crm_demo_token');
    if (saved) setToken(saved);
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  }, []);

  function calcRange(key: 'today' | 'week' | 'month' | 'all') {
    if (key === 'all') return {} as { from?: string; to?: string };

    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (key === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(24, 0, 0, 0);
    }

    if (key === 'week') {
      // Monday as start of week
      const day = (now.getDay() + 6) % 7;
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 7);
    }

    if (key === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(1);
      end.setHours(0, 0, 0, 0);
    }

    // NOTE: this is local-time boundary converted to UTC ISO.
    return { from: start.toISOString(), to: end.toISOString() };
  }

  async function load(r?: { from?: string; to?: string }) {
    setError(null);
    try {
      const qs = r?.from || r?.to ? `?from=${encodeURIComponent(r?.from ?? '')}&to=${encodeURIComponent(r?.to ?? '')}` : '';

      const res = await fetch(`${apiBase}/stats/summary-range${qs}`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.message ?? `stats failed: ${res.status}`);
      setStats(json);

      const res2 = await fetch(`${apiBase}/stats/agents-top${qs}`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });
      const json2 = (await res2.json()) as any;
      if (res2.ok) setAgentsTop(json2?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function loadFor(key: 'today' | 'week' | 'month' | 'all') {
    setRangeKey(key);
    const r = calcRange(key);
    setRange(r);
    await load(r);
  }

  useEffect(() => {
    if (token) loadFor(rangeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Layout
      title="Dashboard"
      right={
        <button
          onClick={() => load(range)}
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
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Time zone</div>
            <div style={{ color: 'var(--muted)', marginTop: 4 }}>{tz || '—'}（browser）</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <RangeBtn active={rangeKey === 'today'} onClick={() => loadFor('today')}>
              Today
            </RangeBtn>
            <RangeBtn active={rangeKey === 'week'} onClick={() => loadFor('week')}>
              This week
            </RangeBtn>
            <RangeBtn active={rangeKey === 'month'} onClick={() => loadFor('month')}>
              This month
            </RangeBtn>
            <RangeBtn active={rangeKey === 'all'} onClick={() => loadFor('all')}>
              All
            </RangeBtn>
          </div>
        </div>
        <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 12 }}>
          Range (UTC ISO): from={range.from ?? '—'} to={range.to ?? '—'}
        </div>
      </Card>

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
        <StatCard title="待处理充值单" value={fmtInt(stats?.deposits?.pendingCount)} hint="Created/Awaiting/Paid" />
        <StatCard title="待处理提现单" value={fmtInt(stats?.withdrawals?.pendingCount)} hint="Requested/Frozen/Approved" />
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
          目前先用「现金流口径」：净流入 = 入账(Credited) - 出账(Paid)。
          真实“客损/盈利”（用户输赢、代理分成、返水/手续费）需要新增下注/结算数据表（下一阶段会补）。
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

function RangeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        border: active ? '1px solid rgba(0,122,255,0.35)' : '1px solid var(--border)',
        background: active ? 'rgba(0,122,255,0.10)' : 'var(--card)',
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      {children}
    </button>
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
