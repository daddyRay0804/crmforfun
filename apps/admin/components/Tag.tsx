import { ReactNode } from 'react';

export function Tag({
  children,
  color,
}: {
  children: ReactNode;
  color: { bg: string; border: string; text: string };
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        border: `1px solid ${color.border}`,
        background: color.bg,
        color: color.text,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
