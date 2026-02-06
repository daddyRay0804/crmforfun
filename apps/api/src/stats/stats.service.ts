import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/database.module';

@Injectable()
export class StatsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async summary(_userId: string) {
    // Deposits
    const dep = await this.pool.query<{
      total_credited: string;
      count_credited: string;
      pending_count: string;
    }>(
      "select\n        coalesce(sum(amount) filter (where status = 'Credited'), 0)::text as total_credited,\n        count(*) filter (where status = 'Credited')::text as count_credited,\n        count(*) filter (where status in ('Created','AwaitingPayment','Paid'))::text as pending_count\n      from deposit_orders",
    );

    // Withdrawals
    const w = await this.pool.query<{
      total_paid: string;
      count_paid: string;
      pending_count: string;
    }>(
      "select\n        coalesce(sum(amount) filter (where status = 'Paid'), 0)::text as total_paid,\n        count(*) filter (where status = 'Paid')::text as count_paid,\n        count(*) filter (where status in ('Requested','Frozen','Approved'))::text as pending_count\n      from withdrawal_requests",
    );

    const grossIn = Number(dep.rows[0]?.total_credited ?? 0);
    const grossOut = Number(w.rows[0]?.total_paid ?? 0);

    return {
      ok: true,
      now: new Date().toISOString(),
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
        note: 'gross in - gross out (demo)',
      },
    };
  }
}
