import { BadRequestException, Inject, Injectable, ForbiddenException } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { PG_POOL } from '../db/database.module';

type WithdrawalRow = {
  id: string;
  agent_id: string;
  created_by_user_id: string;
  reviewed_by_user_id: string | null;
  amount: string;
  currency: string;
  status: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

function normCurrency(cur?: string) {
  const c = String(cur ?? 'CNY').trim().toUpperCase();
  if (!c) throw new BadRequestException('currency is required');
  return c;
}

function normAmount(amount: any) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('amount must be a positive number');
  return n;
}

@Injectable()
export class WithdrawalRequestsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async createForUser(
    userId: string,
    input: { amount: number; currency?: string; memo?: string },
  ): Promise<{ id: string; agentId: string; amount: number; currency: string; status: string; createdAt: string }> {
    if (!userId) throw new BadRequestException('Missing user');

    const amount = normAmount(input.amount);
    const currency = normCurrency(input.currency);
    const memo = input.memo ? String(input.memo).slice(0, 500) : null;

    const u = await this.pool.query<{ agent_id: string | null }>(
      'select agent_id::text as agent_id from users where id = $1',
      [userId],
    );
    const agentId = u.rows[0]?.agent_id ?? null;
    if (!agentId) throw new ForbiddenException('User is not bound to an agent');

    const res = await this.pool.query<WithdrawalRow>(
      "insert into withdrawal_requests (agent_id, created_by_user_id, amount, currency, status, memo) values ($1, $2, $3, $4, 'Requested', $5) returning id::text as id, agent_id::text as agent_id, created_by_user_id::text as created_by_user_id, reviewed_by_user_id::text as reviewed_by_user_id, amount::text as amount, currency, status::text as status, memo, created_at::text as created_at, updated_at::text as updated_at",
      [agentId, userId, amount, currency, memo],
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
      const res = await this.pool.query<WithdrawalRow>(
        'select id::text as id, agent_id::text as agent_id, created_by_user_id::text as created_by_user_id, reviewed_by_user_id::text as reviewed_by_user_id, amount::text as amount, currency, status::text as status, memo, created_at::text as created_at, updated_at::text as updated_at from withdrawal_requests order by created_at desc limit 200',
      );
      return res.rows.map((r) => ({
        id: r.id,
        agentId: r.agent_id,
        createdByUserId: r.created_by_user_id,
        reviewedByUserId: r.reviewed_by_user_id,
        amount: Number(r.amount),
        currency: r.currency,
        status: r.status,
        memo: r.memo,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }

    const u = await this.pool.query<{ agent_id: string | null }>(
      'select agent_id::text as agent_id from users where id = $1',
      [userId],
    );
    const agentId = u.rows[0]?.agent_id ?? null;
    if (!agentId) return [];

    const res = await this.pool.query<WithdrawalRow>(
      'select id::text as id, agent_id::text as agent_id, created_by_user_id::text as created_by_user_id, reviewed_by_user_id::text as reviewed_by_user_id, amount::text as amount, currency, status::text as status, memo, created_at::text as created_at, updated_at::text as updated_at from withdrawal_requests where agent_id = $1 order by created_at desc limit 200',
      [agentId],
    );

    return res.rows.map((r) => ({
      id: r.id,
      agentId: r.agent_id,
      createdByUserId: r.created_by_user_id,
      reviewedByUserId: r.reviewed_by_user_id,
      amount: Number(r.amount),
      currency: r.currency,
      status: r.status,
      memo: r.memo,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  private async ensureAccount(client: PoolClient, userId: string, currency: string, name: 'main' | 'frozen') {
    await client.query(
      'insert into accounts (owner_user_id, currency, name) values ($1, $2, $3) on conflict (owner_user_id, currency, name) do nothing',
      [userId, currency, name],
    );
    const acct = await client.query<{ id: string }>(
      'select id::text as id from accounts where owner_user_id::text = $1 and currency = $2 and name = $3 limit 1',
      [userId, currency, name],
    );
    const id = acct.rows[0]?.id;
    if (!id) throw new BadRequestException('failed to resolve account');
    return id;
  }

  private async getAccountBalance(client: PoolClient, accountId: string) {
    const res = await client.query<{ bal: string }>(
      'select coalesce(sum(amount), 0)::text as bal from ledger_entries where account_id::text = $1',
      [accountId],
    );
    return Number(res.rows[0]?.bal ?? 0);
  }

  async freeze(id: string, reviewerId: string, input?: { memo?: string }) {
    const reqId = String(id ?? '').trim();
    if (!reqId) throw new BadRequestException('Missing id');
    if (!reviewerId) throw new BadRequestException('Missing reviewer');

    const client = await this.pool.connect();
    try {
      await client.query('begin');

      const qr = await client.query<WithdrawalRow>(
        'select id::text as id, agent_id::text as agent_id, created_by_user_id::text as created_by_user_id, reviewed_by_user_id::text as reviewed_by_user_id, amount::text as amount, currency, status::text as status, memo, created_at::text as created_at, updated_at::text as updated_at from withdrawal_requests where id::text = $1 for update',
        [reqId],
      );
      const row = qr.rows[0];
      if (!row) throw new BadRequestException('withdrawal request not found');
      if (row.status !== 'Requested') {
        await client.query('rollback');
        return { skipped: true, reason: `status is ${row.status}` };
      }

      const amount = Number(row.amount);
      const currency = normCurrency(row.currency);
      const userId = row.created_by_user_id;

      const mainAccountId = await this.ensureAccount(client, userId, currency, 'main');
      const frozenAccountId = await this.ensureAccount(client, userId, currency, 'frozen');

      const bal = await this.getAccountBalance(client, mainAccountId);
      if (bal < amount) {
        await client.query('rollback');
        return { skipped: true, reason: `insufficient balance: ${bal} < ${amount}` };
      }

      // Freeze: move from main -> frozen.
      await client.query(
        "insert into ledger_entries (account_id, amount, entry_type, ref_type, ref_id, memo) values ($1, $2, 'Withdraw', 'withdrawal_request_freeze', $3, $4)",
        [mainAccountId, -amount, reqId, `freeze for withdrawal ${reqId}`],
      );
      await client.query(
        "insert into ledger_entries (account_id, amount, entry_type, ref_type, ref_id, memo) values ($1, $2, 'ManualAdjustment', 'withdrawal_request_freeze', $3, $4)",
        [frozenAccountId, amount, reqId, `frozen for withdrawal ${reqId}`],
      );

      const memo = input?.memo ? String(input.memo).slice(0, 500) : row.memo;
      await client.query(
        "update withdrawal_requests set status='Frozen', reviewed_by_user_id=$2, memo=$3, updated_at=now() where id::text=$1",
        [reqId, reviewerId, memo],
      );

      await client.query('commit');
      return { frozen: true };
    } catch (e) {
      try {
        await client.query('rollback');
      } catch {
        // ignore
      }
      throw e;
    } finally {
      client.release();
    }
  }

  async approve(id: string, reviewerId: string, input?: { memo?: string }) {
    const reqId = String(id ?? '').trim();
    if (!reqId) throw new BadRequestException('Missing id');
    if (!reviewerId) throw new BadRequestException('Missing reviewer');

    const memo = input?.memo ? String(input.memo).slice(0, 500) : null;

    const res = await this.pool.query(
      "update withdrawal_requests set status='Approved', reviewed_by_user_id=$2, memo=coalesce($3, memo), updated_at=now() where id::text=$1 and status='Frozen' returning id",
      [reqId, reviewerId, memo],
    );

    if (!res.rowCount) return { skipped: true, reason: 'not in Frozen status' };
    return { approved: true };
  }

  async reject(id: string, reviewerId: string, input?: { memo?: string }) {
    const reqId = String(id ?? '').trim();
    if (!reqId) throw new BadRequestException('Missing id');
    if (!reviewerId) throw new BadRequestException('Missing reviewer');

    const client = await this.pool.connect();
    try {
      await client.query('begin');

      const qr = await client.query<WithdrawalRow>(
        'select id::text as id, agent_id::text as agent_id, created_by_user_id::text as created_by_user_id, reviewed_by_user_id::text as reviewed_by_user_id, amount::text as amount, currency, status::text as status, memo, created_at::text as created_at, updated_at::text as updated_at from withdrawal_requests where id::text = $1 for update',
        [reqId],
      );
      const row = qr.rows[0];
      if (!row) throw new BadRequestException('withdrawal request not found');

      const nextMemo = input?.memo ? String(input.memo).slice(0, 500) : row.memo;

      if (row.status === 'Requested') {
        await client.query(
          "update withdrawal_requests set status='Rejected', reviewed_by_user_id=$2, memo=$3, updated_at=now() where id::text=$1",
          [reqId, reviewerId, nextMemo],
        );
        await client.query('commit');
        return { rejected: true };
      }

      if (row.status !== 'Frozen') {
        await client.query('rollback');
        return { skipped: true, reason: `status is ${row.status}` };
      }

      const amount = Number(row.amount);
      const currency = normCurrency(row.currency);
      const userId = row.created_by_user_id;

      const mainAccountId = await this.ensureAccount(client, userId, currency, 'main');
      const frozenAccountId = await this.ensureAccount(client, userId, currency, 'frozen');

      // Unfreeze: move from frozen -> main.
      await client.query(
        "insert into ledger_entries (account_id, amount, entry_type, ref_type, ref_id, memo) values ($1, $2, 'Withdraw', 'withdrawal_request_unfreeze', $3, $4)",
        [frozenAccountId, -amount, reqId, `unfreeze for withdrawal ${reqId}`],
      );
      await client.query(
        "insert into ledger_entries (account_id, amount, entry_type, ref_type, ref_id, memo) values ($1, $2, 'ManualAdjustment', 'withdrawal_request_unfreeze', $3, $4)",
        [mainAccountId, amount, reqId, `returned to main for withdrawal ${reqId}`],
      );

      await client.query(
        "update withdrawal_requests set status='Rejected', reviewed_by_user_id=$2, memo=$3, updated_at=now() where id::text=$1",
        [reqId, reviewerId, nextMemo],
      );

      await client.query('commit');
      return { rejected: true, unfrozen: true };
    } catch (e) {
      try {
        await client.query('rollback');
      } catch {
        // ignore
      }
      throw e;
    } finally {
      client.release();
    }
  }

  async payout(id: string, reviewerId: string, input?: { memo?: string }) {
    const reqId = String(id ?? '').trim();
    if (!reqId) throw new BadRequestException('Missing id');
    if (!reviewerId) throw new BadRequestException('Missing reviewer');

    const client = await this.pool.connect();
    try {
      await client.query('begin');

      const qr = await client.query<WithdrawalRow>(
        'select id::text as id, agent_id::text as agent_id, created_by_user_id::text as created_by_user_id, reviewed_by_user_id::text as reviewed_by_user_id, amount::text as amount, currency, status::text as status, memo, created_at::text as created_at, updated_at::text as updated_at from withdrawal_requests where id::text = $1 for update',
        [reqId],
      );
      const row = qr.rows[0];
      if (!row) throw new BadRequestException('withdrawal request not found');
      if (row.status !== 'Approved') {
        await client.query('rollback');
        return { skipped: true, reason: `status is ${row.status}` };
      }

      const amount = Number(row.amount);
      const currency = normCurrency(row.currency);
      const userId = row.created_by_user_id;

      const frozenAccountId = await this.ensureAccount(client, userId, currency, 'frozen');
      const bal = await this.getAccountBalance(client, frozenAccountId);
      if (bal < amount) {
        await client.query('rollback');
        return { skipped: true, reason: `insufficient frozen balance: ${bal} < ${amount}` };
      }

      // Final payout: money leaves the system from frozen.
      await client.query(
        "insert into ledger_entries (account_id, amount, entry_type, ref_type, ref_id, memo) values ($1, $2, 'Withdraw', 'withdrawal_request_payout', $3, $4)",
        [frozenAccountId, -amount, reqId, `payout for withdrawal ${reqId}`],
      );

      const memo = input?.memo ? String(input.memo).slice(0, 500) : row.memo;
      await client.query(
        "update withdrawal_requests set status='Paid', reviewed_by_user_id=$2, memo=$3, updated_at=now() where id::text=$1",
        [reqId, reviewerId, memo],
      );

      await client.query('commit');
      return { paid: true };
    } catch (e) {
      try {
        await client.query('rollback');
      } catch {
        // ignore
      }
      throw e;
    } finally {
      client.release();
    }
  }
}
