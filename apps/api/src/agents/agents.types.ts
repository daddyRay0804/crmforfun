export type AgentType = 'Normal' | 'Credit';

export type AgentRecord = {
  id: string;
  type: AgentType;
  name: string;
};
