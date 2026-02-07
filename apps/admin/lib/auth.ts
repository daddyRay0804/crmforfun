export type MeResponse = {
  user: {
    sub: string;
    email: string;
    role: string;
    agentId?: string | null;
  };
};

const TOKEN_KEY = 'bet_crm_demo_token';

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiLogin(apiBase: string, email: string, password: string) {
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? `登录失败：${res.status}`);
  return json as { access_token: string };
}

export async function apiMe(apiBase: string, token: string): Promise<MeResponse> {
  const res = await fetch(`${apiBase}/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? `获取当前用户失败：${res.status}`);
  return json as MeResponse;
}
