import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/database.module';
import type { CreditLimitRequestRecord, CreditLimitRequestStatus } from './credit-limit-requests.types';

@Injectable()
export class CreditLimitRequestsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listByAgentId(agentId: string): Promise<CreditLimitRequestRecord[]> {
    const res = await this.pool.query<CreditLimitRequestRecord>(
      `select
         id::text as id,
         agent_id::text as agent_id,
         requested_amount::text as requested_amount,
         note,
         status,
         created_by_user_id::text as created_by_user_id,
         decided_by_user_id::text as decided_by_user_id,
         decided_at::text as decided_at,
         created_at::text as created_at,
         updated_at::text as updated_at
       from credit_limit_requests
       where agent_id = $1
       order by created_at desc
       limit 50`,
      [agentId],
    );
    return res.rows;
  }

  async create(input: {
    agentId: string;
    requestedAmount: number;
    note?: string | null;
    createdByUserId?: string | null;
  }): Promise<CreditLimitRequestRecord> {
    // Ensure agent exists for cleaner error
    const agentRes = await this.pool.query<{ id: string }>('select id::text as id from agents where id = $1', [
      input.agentId,
    ]);
    if (!agentRes.rows[0]) throw new NotFoundException('agent not found');

    const res = await this.pool.query<CreditLimitRequestRecord>(
      `insert into credit_limit_requests (agent_id, requested_amount, note, status, created_by_user_id)
       values ($1, $2, $3, 'Pending', $4)
       returning
         id::text as id,
         agent_id::text as agent_id,
         requested_amount::text as requested_amount,
         note,
         status,
         created_by_user_id::text as created_by_user_id,
         decided_by_user_id::text as decided_by_user_id,
         decided_at::text as decided_at,
         created_at::text as created_at,
         updated_at::text as updated_at`,
      [input.agentId, input.requestedAmount, input.note ?? null, input.createdByUserId ?? null],
    );
    return res.rows[0]!;
  }

  async decide(input: {
    id: string;
    status: Exclude<CreditLimitRequestStatus, 'Pending'>;
    decidedByUserId?: string | null;
  }): Promise<CreditLimitRequestRecord> {
    // Update request
    const reqRes = await this.pool.query<CreditLimitRequestRecord>(
      `update credit_limit_requests
       set status = $2,
           decided_by_user_id = $3,
           decided_at = now(),
           updated_at = now()
       where id = $1 and status = 'Pending'
       returning
         id::text as id,
         agent_id::text as agent_id,
         requested_amount::text as requested_amount,
         note,
         status,
         created_by_user_id::text as created_by_user_id,
         decided_by_user_id::text as decided_by_user_id,
         decided_at::text as decided_at,
         created_at::text as created_at,
         updated_at::text as updated_at`,
      [input.id, input.status, input.decidedByUserId ?? null],
    );

    const row = reqRes.rows[0];
    if (!row) throw new NotFoundException('request not found (or already decided)');

    // If approved: apply to credit_limits (keep first_fee_amount as-is)
    if (input.status === 'Approved') {
      await this.pool.query(
        `insert into credit_limits (agent_id, credit_limit_amount, first_fee_amount, note)
         values ($1, $2, coalesce((select first_fee_amount from credit_limits where agent_id = $1), 0), 'auto: approved request')
         on conflict (agent_id)
         do update set
           credit_limit_amount = excluded.credit_limit_amount,
           updated_at = now()`,
        [row.agent_id, Number(row.requested_amount)],
      );
    }

    return row;
  }
}
