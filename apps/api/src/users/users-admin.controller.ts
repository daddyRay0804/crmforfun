import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersAdminService } from './users-admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersAdminController {
  constructor(private readonly users: UsersAdminService) {}

  @Get()
  @Roles('Admin', 'Finance')
  async list() {
    return { data: await this.users.list() };
  }
}
