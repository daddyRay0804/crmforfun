import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiMe, clearToken, getToken, MeResponse } from '../lib/auth';
import { getApiBase } from '../lib/api';

export function AuthGate({ children }: { children: (me: MeResponse['user']) => ReactNode }) {
  const router = useRouter();
  const apiBase = getApiBase();

  const [me, setMe] = useState<MeResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const r = await apiMe(apiBase, token);
        if (!cancelled) setMe(r.user);
      } catch (e: any) {
        // token invalid
        clearToken();
        if (!cancelled) {
          setError(e?.message ?? String(e));
          router.replace('/login');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [apiBase, router]);

  if (loading) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>加载中…</div>;
  if (error) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>登录状态异常：{error}</div>;
  if (!me) return null;
  return <>{children(me)}</>;
}
