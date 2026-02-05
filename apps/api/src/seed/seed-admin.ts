import { Client } from 'pg';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const databaseUrl = required('DATABASE_URL');
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const role = process.env.ADMIN_ROLE ?? 'Admin';

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // Ensure pgcrypto exists (idempotent)
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Insert admin user if not exists. Hash using pgcrypto crypt + gen_salt.
    const sql = `
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, crypt($2, gen_salt('bf')), $3::user_role)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role
    `;

    const r = await client.query(sql, [email, password, role]);

    if (r.rowCount === 0) {
      const existing = await client.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
      console.log(JSON.stringify({ ok: true, created: false, user: existing.rows[0] ?? null }, null, 2));
    } else {
      console.log(JSON.stringify({ ok: true, created: true, user: r.rows[0] }, null, 2));
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
