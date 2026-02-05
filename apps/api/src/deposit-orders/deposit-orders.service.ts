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

type MarkPaidFromAtpNotifyInput = {
  outTradeNo: string;
  tradeNo?: string;
  status?: string;
  amount?: number;
  currency?: string;
  verified: boolean;
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

  async markPaidFromAtpNotify(input: MarkPaidFromAtpNotifyInput): Promise<{
    depositOrderId?: string;
    updated?: boolean;
    alreadyProcessed?: boolean;
  }> {
    const key = String(input.outTradeNo ?? '').trim();
    if (!key) throw new BadRequestException('Missing outTradeNo');

    // Try to update only when not already paid/credited.
    const upd = await this.pool.query<{ id: string; status: string }>(
      "update deposit_orders set status = 'Paid', atp_order_id = coalesce(atp_order_id, $2), updated_at = now() where (id::text = $1 or atp_order_id = $1) and status in ('Created','AwaitingPayment') returning id::text as id, status::text as status",
      [key, input.tradeNo ?? null],
    );

    if (upd.rowCount && upd.rows[0]) {
      return { depositOrderId: upd.rows[0].id, updated: true };
    }

    // Idempotency: if already paid/credited, we ACK.
    const existing = await this.pool.query<{ id: string; status: string }>(
      'select id::text as id, status::text as status from deposit_orders where id::text = $1 or atp_order_id = $1 limit 1',
      [key],
    );

    const row = existing.rows[0];
    if (!row) {
      // Do not leak too much detail to external callback; still 200.
      return { updated: false };
    }

    if (row.status === 'Paid' || row.status === 'Credited') {
      return { depositOrderId: row.id, alreadyProcessed: true };
    }

    // For other statuses (Failed/Cancelled/etc), do nothing but ACK.
    return { depositOrderId: row.id, updated: false };
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
