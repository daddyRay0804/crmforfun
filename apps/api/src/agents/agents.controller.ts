import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import type { AgentType } from './agents.types';
import { AgentsService } from './agents.service';

class CreateAgentDto {
  name!: string;
  type?: AgentType;
}

@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  @Roles('Admin', 'Finance')
  list() {
    return { data: this.agents.list() };
  }

  @Post()
  @Roles('Admin')
  create(@Body() body: CreateAgentDto) {
    return { data: this.agents.create(body) };
  }
}
