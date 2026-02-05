/**
 * Ledger schema: accounts + ledger_entries.
 *
 * Guardrails:
 * - balances are derived by summing ledger entries (no mutable balance column)
 * - never store secrets here
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Enums (minimal for demo; can be expanded later)
  pgm.createType(
    'ledger_entry_type',
    ['ManualAdjustment', 'Deposit', 'Withdraw', 'OrderDebit', 'OrderCredit'],
    { ifNotExists: true },
  );

  // Accounts: one logical balance bucket per owner+currency(+purpose)
  pgm.createTable(
    'accounts',
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      owner_user_id: {
        type: 'uuid',
        notNull: true,
        references: 'users',
        onDelete: 'cascade',
      },
      currency: { type: 'text', notNull: true, default: 'CNY' },
      name: { type: 'text', notNull: true, default: 'main' },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    { ifNotExists: true },
  );

  pgm.createIndex('accounts', ['owner_user_id', 'currency', 'name'], {
    unique: true,
    ifNotExists: true,
  });

  // Ledger entries: append-only events
  pgm.createTable(
    'ledger_entries',
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      account_id: {
        type: 'uuid',
        notNull: true,
        references: 'accounts',
        onDelete: 'cascade',
      },
      // signed amount; positive=in, negative=out
      amount: { type: 'numeric(18,2)', notNull: true },
      entry_type: { type: 'ledger_entry_type', notNull: true },
      ref_type: { type: 'text' },
      ref_id: { type: 'text' },
      memo: { type: 'text' },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    { ifNotExists: true },
  );

  pgm.createIndex('ledger_entries', ['account_id', 'created_at'], { ifNotExists: true });
  pgm.createIndex('ledger_entries', ['ref_type', 'ref_id'], { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable('ledger_entries', { ifExists: true, cascade: true });
  pgm.dropTable('accounts', { ifExists: true, cascade: true });
  pgm.dropType('ledger_entry_type', { ifExists: true });
};
