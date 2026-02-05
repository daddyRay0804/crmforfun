import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AgentType } from './agents.types';
import { AgentsService } from './agents.service';

class CreateAgentDto {
  name!: string;
  type?: AgentType;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  @Roles('Admin', 'Finance')
  async list() {
    return { data: await this.agents.list() };
  }

  @Post()
  @Roles('Admin')
  async create(@Body() body: CreateAgentDto) {
    return { data: await this.agents.create(body) };
  }

  @Get(':id')
  @Roles('Admin', 'Finance')
  async getOne(@Param('id') id: string) {
    const found = await this.agents.getById(id);
    if (!found) throw new NotFoundException('agent not found');
    return { data: found };
  }

  @Get(':id/users')
  @Roles('Admin', 'Finance')
  async listUsers(@Param('id') id: string) {
    // ensure agent exists (gives nicer error than empty list)
    const found = await this.agents.getById(id);
    if (!found) throw new NotFoundException('agent not found');
    return { data: await this.agents.listUsers(id) };
  }
}
