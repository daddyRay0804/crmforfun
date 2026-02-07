import { ReactNode, useEffect, useState } from 'react';

type ToastKind = 'error' | 'success' | 'info';

type ToastItem = {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
  ttlMs: number;
};

let pushFn: ((t: Omit<ToastItem, 'id'>) => void) | null = null;

export const toast = {
  error(message: string, title = '错误') {
    pushFn?.({ kind: 'error', title, message, ttlMs: 4500 });
  },
  success(message: string, title = '成功') {
    pushFn?.({ kind: 'success', title, message, ttlMs: 2800 });
  },
  info(message: string, title = '提示') {
    pushFn?.({ kind: 'info', title, message, ttlMs: 3200 });
  },
};

function colors(kind: ToastKind) {
  if (kind === 'success') return { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: 'rgba(6,95,70,1)' };
  if (kind === 'info') return { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: 'rgba(30,64,175,1)' };
  return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: 'rgba(153,27,27,1)' };
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    pushFn = (t) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const item: ToastItem = { id, ...t };
      setItems((prev) => [item, ...prev].slice(0, 4));
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, t.ttlMs);
    };
    return () => {
      pushFn = null;
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 14,
        right: 14,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 360,
        maxWidth: 'calc(100vw - 28px)',
      }}
    >
      {items.map((it) => (
        <ToastCard key={it.id} kind={it.kind} title={it.title}>
          {it.message}
        </ToastCard>
      ))}
    </div>
  );
}

function ToastCard({ kind, title, children }: { kind: ToastKind; title?: string; children: ReactNode }) {
  const c = colors(kind);
  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.text,
        borderRadius: 12,
        padding: '10px 12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {title ? <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div> : null}
      <div style={{ color: 'rgba(0,0,0,0.75)' }}>{children}</div>
    </div>
  );
}
