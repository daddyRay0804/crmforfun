import { Client } from 'pg';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const databaseUrl = required('DATABASE_URL');

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');

    // Ensure extension + baseline admin.
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    const admin = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, crypt($2, gen_salt('bf')), 'Admin'::user_role)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
       RETURNING id, email, role`,
      [adminEmail, adminPassword],
    );

    // Create a couple agents.
    const agents: Array<{ id: string; name: string; type: string }> = [];
    for (const a of [
      { name: '默认代理A', type: 'Normal' },
      { name: '信用代理B', type: 'Credit' },
    ]) {
      const r = await client.query(
        `INSERT INTO agents (name, type)
         VALUES ($1, $2::agent_type)
         ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type
         RETURNING id, name, type`,
        [a.name, a.type],
      );
      agents.push(r.rows[0]);
    }

    // Create agent users (for login testing).
    const demoUsers = [
      { email: 'agent.normal@example.com', password: 'agent123', role: 'Agent_Normal', agentIdx: 0 },
      { email: 'agent.credit@example.com', password: 'agent123', role: 'Agent_Credit', agentIdx: 1 },
      { email: 'finance@example.com', password: 'finance123', role: 'Finance', agentIdx: null },
    ] as const;

    const createdUsers: any[] = [];
    for (const u of demoUsers) {
      const agentId = u.agentIdx === null ? null : agents[u.agentIdx].id;
      const r = await client.query(
        `INSERT INTO users (email, password_hash, role, agent_id)
         VALUES ($1, crypt($2, gen_salt('bf')), $3::user_role, $4)
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, agent_id = EXCLUDED.agent_id
         RETURNING id, email, role, agent_id`,
        [u.email, u.password, u.role, agentId],
      );
      createdUsers.push(r.rows[0]);
    }

    // Create some demo deposit orders + withdrawal requests.
    // Note: keep it simple and aligned with the existing stats queries.
    for (let i = 0; i < 5; i++) {
      const agent = agents[i % agents.length];
      const amount = randInt(50, 500);
      await client.query(
        `INSERT INTO deposit_orders (agent_id, amount, currency, status, created_by_user_id)
         VALUES ($1, $2, 'CNY', 'Credited'::deposit_order_status, $3)`,
        [agent.id, amount, admin.rows[0].id],
      );
    }

    for (let i = 0; i < 3; i++) {
      const agent = agents[i % agents.length];
      const amount = randInt(20, 200);
      await client.query(
        `INSERT INTO withdrawal_requests (agent_id, amount, currency, status, memo, created_by_user_id)
         VALUES ($1, $2, 'CNY', 'Requested'::withdrawal_request_status, $3, $4)`,
        [agent.id, amount, 'seed demo', admin.rows[0].id],
      );
    }

    await client.query('COMMIT');

    console.log(
      JSON.stringify(
        {
          ok: true,
          admin: { email: adminEmail, password: adminPassword },
          users: demoUsers.map((u) => ({ email: u.email, password: u.password, role: u.role })),
          agents: agents.map((a) => ({ id: a.id, name: a.name, type: a.type })),
        },
        null,
        2,
      ),
    );
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
