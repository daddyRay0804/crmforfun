import Link from 'next/link';
import { ReactNode } from 'react';

// Next.js treats any file under pages/ as a route.
// We keep this helper here but also provide a default-exported component
// to satisfy Next build rules.
export default function _LayoutRoute() {
  return null;
}

type Props = {
  title: string;
  children: ReactNode;
  right?: ReactNode;
};

export function Layout({ title, children, right }: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 240,
          padding: 16,
          borderRight: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'saturate(180%) blur(16px)',
        }}
      >
        <div style={{ padding: 8, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, letterSpacing: -0.2 }}>CRM 后台</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>管理控制台</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <NavItem href="/">仪表盘</NavItem>
          <NavItem href="/agents">代理管理</NavItem>
          <NavItem href="/users">用户管理</NavItem>
          <NavItem href="/withdrawals">提现审核</NavItem>
        </nav>

        <div style={{ marginTop: 16, padding: 8, fontSize: 12, color: 'var(--muted)' }}>
          <div>提示：</div>
          <div>使用 Admin / Finance 角色登录可查看完整数据与审核权限。</div>
        </div>
      </aside>

      <div style={{ flex: 1, padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>{title}</div>
            <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>用于代理/用户/订单/提现的日常运营管理。</div>
          </div>
          <div>{right}</div>
        </header>

        {children}
      </div>
    </div>
  );
}

function NavItem({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid transparent',
        color: 'var(--text)',
      }}
    >
      {children}
    </Link>
  );
}
