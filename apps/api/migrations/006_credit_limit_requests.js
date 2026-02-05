/**
 * Second credit limit application / approval flow.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType('credit_limit_request_status', ['Pending', 'Approved', 'Rejected'], {
    ifNotExists: true,
  });

  pgm.createTable(
    'credit_limit_requests',
    {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      agent_id: {
        type: 'uuid',
        notNull: true,
        references: 'agents',
        onDelete: 'cascade',
      },
      requested_amount: { type: 'numeric(20,2)', notNull: true },
      note: { type: 'text' },
      status: {
        type: 'credit_limit_request_status',
        notNull: true,
        default: 'Pending',
      },
      created_by_user_id: {
        type: 'uuid',
        references: 'users',
        onDelete: 'set null',
      },
      decided_by_user_id: {
        type: 'uuid',
        references: 'users',
        onDelete: 'set null',
      },
      decided_at: { type: 'timestamptz' },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    { ifNotExists: true },
  );

  pgm.createIndex('credit_limit_requests', 'agent_id', { ifNotExists: true });
  pgm.createIndex('credit_limit_requests', 'status', { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable('credit_limit_requests', { ifExists: true, cascade: true });
  pgm.dropType('credit_limit_request_status', { ifExists: true });
};
