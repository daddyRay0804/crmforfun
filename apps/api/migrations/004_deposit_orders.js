/**
 * Deposit orders (agent top-up) — M2.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType(
    'deposit_order_status',
    ['Created', 'AwaitingPayment', 'Paid', 'Credited', 'Failed', 'Cancelled'],
    { ifNotExists: true },
  );

  pgm.createTable(
    'deposit_orders',
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      agent_id: { type: 'uuid', notNull: true, references: 'agents', onDelete: 'cascade' },
      amount: { type: 'numeric(18,2)', notNull: true },
      currency: { type: 'text', notNull: true, default: 'CNY' },
      status: { type: 'deposit_order_status', notNull: true, default: 'Created' },

      // Optional external linkage (no secrets).
      atp_order_id: { type: 'text', null: true },
      atp_qrcode_url: { type: 'text', null: true },

      created_by_user_id: { type: 'uuid', null: true, references: 'users', onDelete: 'set null' },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    { ifNotExists: true },
  );

  pgm.createIndex('deposit_orders', ['agent_id', 'created_at'], { ifNotExists: true });
  pgm.createIndex('deposit_orders', ['status', 'created_at'], { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropIndex('deposit_orders', ['status', 'created_at'], { ifExists: true });
  pgm.dropIndex('deposit_orders', ['agent_id', 'created_at'], { ifExists: true });

  pgm.dropTable('deposit_orders', { ifExists: true, cascade: true });
  pgm.dropType('deposit_order_status', { ifExists: true });
};
