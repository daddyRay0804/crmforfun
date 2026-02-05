import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          // Fail fast at runtime. (Build should still pass.)
          throw new Error('DATABASE_URL is required');
        }
        return new Pool({ connectionString });
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor() {}

  async onModuleDestroy() {
    // Pool is global provider; Nest will dispose process anyway.
    // If you add explicit injection here later, call pool.end().
  }
}
