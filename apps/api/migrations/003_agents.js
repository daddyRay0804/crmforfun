/**
 * Agents + user/agent relation.
 *
 * Two agent types for demo: Normal / Credit.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType('agent_type', ['Normal', 'Credit'], { ifNotExists: true });

  pgm.createTable(
    'agents',
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      type: { type: 'agent_type', notNull: true, default: 'Normal' },
      name: { type: 'text', notNull: true },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    { ifNotExists: true },
  );

  pgm.createIndex('agents', ['type', 'name'], { ifNotExists: true });

  // Users can optionally belong to an agent.
  pgm.addColumn('users', {
    agent_id: { type: 'uuid', references: 'agents', onDelete: 'set null', null: true },
  });

  pgm.createIndex('users', 'agent_id', { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropIndex('users', 'agent_id', { ifExists: true });
  pgm.dropColumn('users', 'agent_id', { ifExists: true });

  pgm.dropTable('agents', { ifExists: true, cascade: true });
  pgm.dropType('agent_type', { ifExists: true });
};
