import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
}
