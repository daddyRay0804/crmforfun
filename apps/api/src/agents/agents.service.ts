import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/database.module';
import type { AgentRecord, AgentType } from './agents.types';

@Injectable()
export class AgentsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(): Promise<AgentRecord[]> {
    const res = await this.pool.query<AgentRecord>(
      'select id::text as id, type, name from agents order by created_at desc limit 200',
    );
    return res.rows;
  }

  async create(input: { name: string; type?: AgentType }): Promise<AgentRecord> {
    const name = input.name?.trim();
    if (!name) throw new Error('name is required');

    const res = await this.pool.query<AgentRecord>(
      'insert into agents (name, type) values ($1, $2) returning id::text as id, type, name',
      [name, input.type ?? 'Normal'],
    );
    return res.rows[0]!;
  }
}
