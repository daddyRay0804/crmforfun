import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/database.module';

type Range = { from?: string; to?: string };

function parseTs(s?: string): string | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

@Injectable()
export class StatsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async summary(_userId: string) {
    return this.summaryRange(_userId, {});
  }

  async summaryRange(_userId: string, range: Range) {
    const from = parseTs(range.from);
    const to = parseTs(range.to);

    const dep = await this.pool.query<{
      total_credited: string;
      count_credited: string;
      pending_count: string;
    }>(
      {
        text: "select\n          coalesce(sum(amount) filter (where status = 'Credited' and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2)), 0)::text as total_credited,\n          count(*) filter (where status = 'Credited' and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2))::text as count_credited,\n          count(*) filter (where status in ('Created','AwaitingPayment','Paid') and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2))::text as pending_count\n        from deposit_orders",
        values: [from ?? null, to ?? null],
      },
    );

    const w = await this.pool.query<{
      total_paid: string;
      count_paid: string;
      pending_count: string;
    }>(
      {
        text: "select\n          coalesce(sum(amount) filter (where status = 'Paid' and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2)), 0)::text as total_paid,\n          count(*) filter (where status = 'Paid' and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2))::text as count_paid,\n          count(*) filter (where status in ('Requested','Frozen','Approved') and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2))::text as pending_count\n        from withdrawal_requests",
        values: [from ?? null, to ?? null],
      },
    );

    const grossIn = Number(dep.rows[0]?.total_credited ?? 0);
    const grossOut = Number(w.rows[0]?.total_paid ?? 0);

    return {
      ok: true,
      now: new Date().toISOString(),
      range: { from: from ?? null, to: to ?? null },
      deposits: {
        totalAmountCredited: grossIn,
        countCredited: Number(dep.rows[0]?.count_credited ?? 0),
        pendingCount: Number(dep.rows[0]?.pending_count ?? 0),
      },
      withdrawals: {
        totalAmountPaid: grossOut,
        countPaid: Number(w.rows[0]?.count_paid ?? 0),
        pendingCount: Number(w.rows[0]?.pending_count ?? 0),
      },
      pnl: {
        grossIn,
        grossOut,
        net: grossIn - grossOut,
        note: 'gross in - gross out (cashflow, demo)',
      },
    };
  }

  async topAgents(_userId: string, input: Range & { limit?: number }) {
    const from = parseTs(input.from);
    const to = parseTs(input.to);
    const limit = Number.isFinite(input.limit as any) ? Math.min(Math.max(Number(input.limit), 1), 50) : 10;

    const res = await this.pool.query<{
      agent_id: string;
      agent_name: string;
      agent_type: string;
      credited_in: string;
      paid_out: string;
      net: string;
      deposit_pending: string;
      withdraw_pending: string;
    }>(
      {
        text: `
with dep as (
  select agent_id,
    coalesce(sum(amount) filter (where status = 'Credited' and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2)), 0) as credited_in,
    count(*) filter (where status in ('Created','AwaitingPayment','Paid') and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2)) as deposit_pending
  from deposit_orders
  group by agent_id
),
wd as (
  select agent_id,
    coalesce(sum(amount) filter (where status = 'Paid' and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2)), 0) as paid_out,
    count(*) filter (where status in ('Requested','Frozen','Approved') and ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2)) as withdraw_pending
  from withdrawal_requests
  group by agent_id
)
select 
  a.id::text as agent_id,
  a.name as agent_name,
  a.type::text as agent_type,
  coalesce(dep.credited_in, 0)::text as credited_in,
  coalesce(wd.paid_out, 0)::text as paid_out,
  (coalesce(dep.credited_in, 0) - coalesce(wd.paid_out, 0))::text as net,
  coalesce(dep.deposit_pending, 0)::text as deposit_pending,
  coalesce(wd.withdraw_pending, 0)::text as withdraw_pending
from agents a
left join dep on dep.agent_id = a.id
left join wd on wd.agent_id = a.id
order by (coalesce(dep.credited_in,0) - coalesce(wd.paid_out,0)) desc
limit ${limit}
        `,
        values: [from ?? null, to ?? null],
      },
    );

    return {
      ok: true,
      now: new Date().toISOString(),
      range: { from: from ?? null, to: to ?? null },
      items: res.rows.map((r) => ({
        agentId: r.agent_id,
        name: r.agent_name,
        type: r.agent_type,
        creditedIn: Number(r.credited_in),
        paidOut: Number(r.paid_out),
        net: Number(r.net),
        depositPending: Number(r.deposit_pending),
        withdrawPending: Number(r.withdraw_pending),
      })),
      note: 'cashflow net = credited_in - paid_out (demo)',
    };
  }
}
