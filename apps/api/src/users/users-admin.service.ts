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

  async create(input: {
    email: string;
    password: string;
    role: Role;
    agentId?: string | null;
  }): Promise<{ id: string; email: string; role: Role; agentId: string | null }> {
    const email = input.email?.trim().toLowerCase();
    if (!email) throw new Error('email is required');
    if (!input.password || input.password.length < 6) throw new Error('password must be >= 6 chars');

    const res = await this.pool.query<UserListRecord>(
      "insert into users (email, password_hash, role, agent_id) values ($1, crypt($2, gen_salt('bf')), $3, $4) returning id::text as id, email, role, agent_id::text as agent_id",
      [email, input.password, input.role, input.agentId ?? null],
    );
    const row = res.rows[0]!;
    return { id: row.id, email: row.email, role: row.role, agentId: row.agent_id ?? null };
  }

  async setAgent(userId: string, agentId: string | null): Promise<void> {
    await this.pool.query('update users set agent_id = $2, updated_at = now() where id = $1', [
      userId,
      agentId,
    ]);
  }
}
