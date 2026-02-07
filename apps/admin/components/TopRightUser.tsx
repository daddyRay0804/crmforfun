import { useRouter } from 'next/router';
import { clearToken } from '../lib/auth';

export function TopRightUser({ email, role }: { email: string; role: string }) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{role}</div>
        <div style={{ fontWeight: 700 }}>{email}</div>
      </div>
      <button
        onClick={() => {
          clearToken();
          router.replace('/login');
        }}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 12px',
          cursor: 'pointer',
        }}
      >
        退出登录
      </button>
    </div>
  );
}
