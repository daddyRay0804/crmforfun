import { Injectable } from '@nestjs/common';
import type { Role } from '../auth/roles';

export type UserRecord = {
  id: string;
  email: string;
  password: string;
  role: Role;
};

@Injectable()
export class UsersService {
  private readonly users: UserRecord[];

  constructor() {
    // Demo-only bootstrap users (no DB yet).
    // IMPORTANT: never commit real secrets; use env in deployment.
    this.users = [
      {
        id: 'u_admin',
        email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
        password: process.env.ADMIN_PASSWORD ?? 'admin123',
        role: 'Admin',
      },
    ];
  }

  findByEmail(email: string): UserRecord | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
}
