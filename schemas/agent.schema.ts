
export type AgentFrequency = "manual" | "daily" | "weekly";

export interface AgentProposal {
  id: string;
  agentId: string;
  title: string;
  action: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

export interface Agent {
  id: string;
  name: string;
  type: 'Academic' | 'Market' | 'Synthesizer' | 'Advocate' | 'Briefing';
  status: 'Active' | 'Idle' | 'Scanning';
  frequency: AgentFrequency;
  lastRun?: number;
  description: string;
  tier: 'Explorer' | 'Researcher' | 'Strategist' | 'Architect';
}
