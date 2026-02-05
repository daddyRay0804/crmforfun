import { Injectable } from '@nestjs/common';
import type { AgentRecord, AgentType } from './agents.types';

@Injectable()
export class AgentsService {
  private readonly agents: AgentRecord[];

  constructor() {
    // Demo-only in-memory store. DB will back this in later milestones.
    this.agents = [
      {
        id: 'a_demo_normal',
        type: 'Normal',
        name: 'Demo Normal Agent',
      },
    ];
  }

  list(): AgentRecord[] {
    return this.agents;
  }

  create(input: { name: string; type?: AgentType }): AgentRecord {
    const agent: AgentRecord = {
      id: `a_${Date.now()}`,
      name: input.name,
      type: input.type ?? 'Normal',
    };

    this.agents.push(agent);
    return agent;
  }
}
