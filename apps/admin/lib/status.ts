export type WithdrawalStatus = 'Requested' | 'Frozen' | 'Approved' | 'Rejected' | 'Paid';

export type DepositStatus =
  | 'Created'
  | 'AwaitingPayment'
  | 'Pending'
  | 'Paid'
  | 'Credited'
  | 'Cancelled'
  | 'Expired'
  | 'Failed';

export function withdrawalStatusLabel(s: WithdrawalStatus) {
  const m: Record<WithdrawalStatus, string> = {
    Requested: '已申请',
    Frozen: '已冻结',
    Approved: '已通过',
    Rejected: '已拒绝',
    Paid: '已打款',
  };
  return m[s];
}

export function withdrawalStatusColor(s: WithdrawalStatus) {
  // simple semantic palette
  const m: Record<WithdrawalStatus, { bg: string; border: string; text: string }> = {
    Requested: { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.12)', text: 'rgba(0,0,0,0.75)' },
    Frozen: { bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.35)', text: 'rgba(146,64,14,1)' },
    Approved: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: 'rgba(30,64,175,1)' },
    Rejected: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: 'rgba(153,27,27,1)' },
    Paid: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: 'rgba(6,95,70,1)' },
  };
  return m[s];
}

export function depositStatusLabel(s: DepositStatus | string) {
  const m: Record<string, string> = {
    Created: '已创建',
    AwaitingPayment: '待支付',
    Pending: '待支付',
    Paid: '已支付（待入账）',
    Credited: '已入账',
    Cancelled: '已取消',
    Expired: '已过期',
    Failed: '失败',
  };
  return m[s] ?? s;
}

export function depositStatusColor(s: DepositStatus | string) {
  const key = String(s);
  const palette: Record<string, { bg: string; border: string; text: string }> = {
    Created: { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.12)', text: 'rgba(0,0,0,0.75)' },
    AwaitingPayment: { bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.35)', text: 'rgba(146,64,14,1)' },
    Pending: { bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.35)', text: 'rgba(146,64,14,1)' },
    Paid: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: 'rgba(30,64,175,1)' },
    Credited: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: 'rgba(6,95,70,1)' },
    Cancelled: { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.12)', text: 'rgba(0,0,0,0.75)' },
    Expired: { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.12)', text: 'rgba(0,0,0,0.75)' },
    Failed: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: 'rgba(153,27,27,1)' },
  };
  return palette[key] ?? { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.12)', text: 'rgba(0,0,0,0.75)' };
}
