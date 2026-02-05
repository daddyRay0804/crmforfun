import { BadRequestException, Inject, Injectable, ForbiddenException } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/database.module';

type DepositOrderRow = {
  id: string;
  agent_id: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
};

@Injectable()
export class DepositOrdersService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async createForUser(
    userId: string,
    input: { amount: number; currency?: string },
  ): Promise<{ id: string; agentId: string; amount: number; currency: string; status: string; createdAt: string }> {
    if (!userId) throw new BadRequestException('Missing user');

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }

    const currency = (input.currency ?? 'CNY').trim().toUpperCase();
    if (!currency) throw new BadRequestException('currency is required');

    const u = await this.pool.query<{ agent_id: string | null }>(
      'select agent_id::text as agent_id from users where id = $1',
      [userId],
    );
    const agentId = u.rows[0]?.agent_id ?? null;
    if (!agentId) {
      throw new ForbiddenException('User is not bound to an agent');
    }

    const res = await this.pool.query<DepositOrderRow>(
      "insert into deposit_orders (agent_id, amount, currency, status, created_by_user_id) values ($1, $2, $3, 'Created', $4) returning id::text as id, agent_id::text as agent_id, amount::text as amount, currency, status::text as status, created_at::text as created_at",
      [agentId, amount, currency, userId],
    );

    const row = res.rows[0]!;
    return {
      id: row.id,
      agentId: row.agent_id,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async listForUser(userId: string, role?: string) {
    if (!userId) throw new BadRequestException('Missing user');

    if (role === 'Admin' || role === 'Finance') {
      const res = await this.pool.query<DepositOrderRow>(
        'select id::text as id, agent_id::text as agent_id, amount::text as amount, currency, status::text as status, created_at::text as created_at from deposit_orders order by created_at desc limit 200',
      );
      return res.rows.map((r) => ({
        id: r.id,
        agentId: r.agent_id,
        amount: Number(r.amount),
        currency: r.currency,
        status: r.status,
        createdAt: r.created_at,
      }));
    }

    const u = await this.pool.query<{ agent_id: string | null }>(
      'select agent_id::text as agent_id from users where id = $1',
      [userId],
    );
    const agentId = u.rows[0]?.agent_id ?? null;
    if (!agentId) return [];

    const res = await this.pool.query<DepositOrderRow>(
      'select id::text as id, agent_id::text as agent_id, amount::text as amount, currency, status::text as status, created_at::text as created_at from deposit_orders where agent_id = $1 order by created_at desc limit 200',
      [agentId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      agentId: r.agent_id,
      amount: Number(r.amount),
      currency: r.currency,
      status: r.status,
      createdAt: r.created_at,
    }));
  }
}
