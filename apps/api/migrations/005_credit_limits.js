/**
 * Credit limits for Credit agents.
 *
 * Manual fields for demo:
 * - credit_limit_amount: max outstanding balance allowed
 * - first_fee_amount: initial/manual fee (for first charge)
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable(
    'credit_limits',
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
        onDelete: 'cascade',
      },
      credit_limit_amount: { type: 'numeric(20,2)', notNull: true, default: 0 },
      first_fee_amount: { type: 'numeric(20,2)', notNull: true, default: 0 },
      note: { type: 'text', null: true },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    { ifNotExists: true },
  );

  pgm.addConstraint('credit_limits', 'credit_limits_agent_unique', {
    unique: ['agent_id'],
  });

  pgm.createIndex('credit_limits', ['agent_id'], { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable('credit_limits', { ifExists: true, cascade: true });
};
