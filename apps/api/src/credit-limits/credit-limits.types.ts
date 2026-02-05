export type CreditLimitRecord = {
  id: string;
  agent_id: string;
  credit_limit_amount: string; // numeric from pg
  first_fee_amount: string; // numeric from pg
  note: string | null;
};
