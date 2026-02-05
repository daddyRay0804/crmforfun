import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/database.module';
import type { Role } from '../auth/roles';

export type UserListRecord = {
  id: string;
  email: string;
  role: Role;
  agent_id: string | null;
};

@Injectable()
export class UsersAdminService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(): Promise<Array<{ id: string; email: string; role: Role; agentId: string | null }>> {
    const res = await this.pool.query<UserListRecord>(
      'select id::text as id, email, role, agent_id::text as agent_id from users order by created_at desc limit 200',
    );
    return res.rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      agentId: r.agent_id ?? null,
    }));
  }
}
