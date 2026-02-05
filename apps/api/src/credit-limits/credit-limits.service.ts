import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/database.module';
import type { CreditLimitRecord } from './credit-limits.types';

@Injectable()
export class CreditLimitsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getByAgentId(agentId: string): Promise<CreditLimitRecord | null> {
    const res = await this.pool.query<CreditLimitRecord>(
      `select
         id::text as id,
         agent_id::text as agent_id,
         credit_limit_amount::text as credit_limit_amount,
         first_fee_amount::text as first_fee_amount,
         note
       from credit_limits
       where agent_id = $1`,
      [agentId],
    );
    return res.rows[0] ?? null;
  }

  async upsertByAgentId(input: {
    agentId: string;
    creditLimitAmount: number;
    firstFeeAmount: number;
    note?: string | null;
  }): Promise<CreditLimitRecord> {
    // Ensure agent exists (and give cleaner error)
    const agentRes = await this.pool.query<{ id: string; type: string }>(
      'select id::text as id, type from agents where id = $1',
      [input.agentId],
    );
    if (!agentRes.rows[0]) throw new NotFoundException('agent not found');

    const res = await this.pool.query<CreditLimitRecord>(
      `insert into credit_limits (agent_id, credit_limit_amount, first_fee_amount, note)
       values ($1, $2, $3, $4)
       on conflict (agent_id)
       do update set
         credit_limit_amount = excluded.credit_limit_amount,
         first_fee_amount = excluded.first_fee_amount,
         note = excluded.note,
         updated_at = now()
       returning
         id::text as id,
         agent_id::text as agent_id,
         credit_limit_amount::text as credit_limit_amount,
         first_fee_amount::text as first_fee_amount,
         note`,
      [input.agentId, input.creditLimitAmount, input.firstFeeAmount, input.note ?? null],
    );

    return res.rows[0]!;
  }
}
