/**
 * Ensure agents.name has a unique constraint to support seed upserts.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Make agent name unique.
  // (Seed scripts rely on ON CONFLICT (name) to be idempotent.)
  pgm.addConstraint('agents', 'agents_name_unique', {
    unique: ['name'],
    ifNotExists: true,
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('agents', 'agents_name_unique', { ifExists: true });
};
