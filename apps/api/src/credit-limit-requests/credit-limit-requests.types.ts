export type CreditLimitRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export type CreditLimitRequestRecord = {
  id: string;
  agent_id: string;
  requested_amount: string; // numeric from pg
  note: string | null;
  status: CreditLimitRequestStatus;
  created_by_user_id: string | null;
  decided_by_user_id: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};
