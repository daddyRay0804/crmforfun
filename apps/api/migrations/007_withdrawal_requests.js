/**
 * Withdrawal requests (manual review flow).
 *
 * Flow (demo):
 * Requested -> Frozen -> Approved -> Paid
 * Requested/Frozen -> Rejected (if Frozen, we unfreeze back to main)
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType(
    'withdrawal_request_status',
    ['Requested', 'Frozen', 'Approved', 'Rejected', 'Paid'],
    { ifNotExists: true },
  );

  pgm.createTable(
    'withdrawal_requests',
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      agent_id: {
        type: 'uuid',
        notNull: true,
        references: 'agents',
        onDelete: 'restrict',
      },
      created_by_user_id: {
        type: 'uuid',
        notNull: true,
        references: 'users',
        onDelete: 'restrict',
      },
      reviewed_by_user_id: {
        type: 'uuid',
        references: 'users',
        onDelete: 'set null',
      },
      amount: { type: 'numeric(18,2)', notNull: true },
      currency: { type: 'text', notNull: true, default: 'CNY' },
      status: { type: 'withdrawal_request_status', notNull: true, default: 'Requested' },
      memo: { type: 'text' },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    { ifNotExists: true },
  );

  pgm.createIndex('withdrawal_requests', ['status', 'created_at'], { ifNotExists: true });
  pgm.createIndex('withdrawal_requests', ['agent_id', 'created_at'], { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable('withdrawal_requests', { ifExists: true, cascade: true });
  pgm.dropType('withdrawal_request_status', { ifExists: true });
};
