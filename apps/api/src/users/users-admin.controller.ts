import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { Role } from '../auth/roles';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersAdminService } from './users-admin.service';

class CreateUserDto {
  email!: string;
  password!: string;
  role!: Role;
  agentId?: string | null;
}

class SetUserAgentDto {
  agentId!: string | null;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersAdminController {
  constructor(private readonly users: UsersAdminService) {}

  @Get()
  @Roles('Admin', 'Finance')
  async list() {
    return { data: await this.users.list() };
  }

  @Post()
  @Roles('Admin')
  async create(@Body() body: CreateUserDto) {
    return { data: await this.users.create(body) };
  }

  @Patch(':id/agent')
  @Roles('Admin')
  async setAgent(@Param('id') id: string, @Body() body: SetUserAgentDto) {
    await this.users.setAgent(id, body.agentId);
    return { ok: true };
  }
}
