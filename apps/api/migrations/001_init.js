/**
 * Initial schema for demo.
 *
 * Note: keep this minimal and evolvable; ledger tables will be added in later milestones.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Extensions
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  // Enums
  pgm.createType('user_role', ['Admin', 'Agent_Normal', 'Agent_Credit', 'Finance'], {
    ifNotExists: true,
  });

  // Tables
  pgm.createTable(
    'users',
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      email: { type: 'text', notNull: true },
      password_hash: { type: 'text', notNull: true },
      role: { type: 'user_role', notNull: true, default: 'Admin' },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    { ifNotExists: true },
  );

  pgm.createIndex('users', 'email', { unique: true, ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable('users', { ifExists: true, cascade: true });
  pgm.dropType('user_role', { ifExists: true });
};
