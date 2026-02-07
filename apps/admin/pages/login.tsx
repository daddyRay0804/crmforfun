import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiLogin, setToken } from '../lib/auth';
import { getApiBase } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const apiBase = getApiBase();

  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin() {
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await apiLogin(apiBase, email, password);
      setToken(access_token);
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>登录</h1>
      <p style={{ marginTop: 0, color: '#666' }}>CRM 后台管理系统</p>

      <section style={{ border: '1px solid #eee', padding: 16, borderRadius: 10 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>邮箱</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, width: '100%' }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>密码</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              style={{ padding: 10, width: '100%' }}
            />
          </label>

          <button onClick={onLogin} disabled={loading} style={{ padding: '10px 12px', cursor: 'pointer' }}>
            {loading ? '登录中…' : '登录'}
          </button>

          {error ? (
            <div style={{ color: 'crimson' }}>
              <strong>错误：</strong> {error}
            </div>
          ) : null}

          <div style={{ fontSize: 12, color: '#666' }}>
            API（代理）：<code>{apiBase}</code>
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            没有账号？先执行初始化：<code>docker compose exec api npm -w apps/api run seed:demo</code>
          </div>
        </div>
      </section>

      <p style={{ marginTop: 16 }}>
        <Link href="/">← 返回首页</Link>
      </p>
    </main>
  );
}
