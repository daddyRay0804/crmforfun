import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import type { Role } from '../auth/roles';
import { PG_POOL } from '../db/database.module';

export type DbUserRecord = {
  id: string;
  email: string;
  role: Role;
  password_hash: string;
  agent_id: string | null;
};

@Injectable()
export class UsersService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<
    | { id: string; email: string; role: Role; passwordHash: string; agentId: string | null }
    | undefined
  > {
    const normalized = email.trim().toLowerCase();
    const res = await this.pool.query<DbUserRecord>(
      'select id::text as id, email, role, password_hash, agent_id::text as agent_id from users where lower(email)= $1 limit 1',
      [normalized],
    );
    const row = res.rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      passwordHash: row.password_hash,
      agentId: row.agent_id ?? null,
    };
  }

  async verifyPassword(email: string, password: string): Promise<
    | { id: string; email: string; role: Role; agentId: string | null }
    | undefined
  > {
    // Use pgcrypto's crypt() so we don't add a new dependency.
    const normalized = email.trim().toLowerCase();
    const res = await this.pool.query<Omit<DbUserRecord, 'password_hash'>>(
      "select id::text as id, email, role, agent_id::text as agent_id from users where lower(email) = $1 and password_hash = crypt($2, password_hash) limit 1",
      [normalized, password],
    );
    const row = res.rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      agentId: row.agent_id ?? null,
    };
  }

  async create(input: {
    email: string;
    password: string;
    role: Role;
    agentId?: string | null;
  }): Promise<{ id: string; email: string; role: Role; agentId: string | null }> {
    const email = input.email.trim().toLowerCase();
    if (!email) throw new Error('email is required');
    if (!input.password || input.password.length < 6) throw new Error('password must be >= 6 chars');

    const res = await this.pool.query<Omit<DbUserRecord, 'password_hash'>>(
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
