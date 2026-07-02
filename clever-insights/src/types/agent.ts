import type { Channel } from './clevertap';

export interface AgentContext {
  channel: Channel;
  metrics: {
    openRate: number;
    ctr: number;
    bounceRate: number;
    deliveryRate: number;
    unsubscribeRate: number;
  };
  issueId: string;
  issueTitle: string;
  severity: 'healthy' | 'warning' | 'critical';
  segmentSizeBucket: string | null;
  campaignAgeDays: number;
}

export interface AgentOutput {
  recommendationTitle: string;
  recommendationText: string;
  citedMetrics: string[];
  toolCallRequested: boolean;
}

export interface ReflectionResult {
  approved: boolean;
  reason?: string;
}

export interface CostGateState {
  dailyCallCount: number;
  dailyResetDate: string;
  totalTokensUsed: number;
}

export interface CostGateConfig {
  maxDailyCalls: number;
  haikuThreshold: number;
}

export const DEFAULT_COST_GATE_CONFIG: CostGateConfig = {
  maxDailyCalls: 50,
  haikuThreshold: 30,
};
