import { describe, it, expect } from 'vitest';
import {
  containsPII,
  sanitizeForSlack,
  sanitizeForAgent,
  checkCostGate,
  groundingCheck,
} from '@/lib/agentEngine';
import type { CampaignWithMetrics, Issue } from '@/types/clevertap';
import type { AgentContext, AgentOutput, CostGateState, CostGateConfig } from '@/types/agent';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCampaign(overrides: Partial<CampaignWithMetrics> = {}): CampaignWithMetrics {
  return {
    id: 'c1',
    name: 'Test Campaign',
    channel: 'email',
    date: '2025-01-15',
    sent: 10000,
    delivered: 9500,
    opens: 2000,
    clicks: 500,
    bounces: 500,
    unsubscribes: 50,
    conversions: 100,
    openRate: 0.2105,
    ctr: 0.0526,
    bounceRate: 0.05,
    deliveryRate: 0.95,
    unsubscribeRate: 0.0053,
    healthScore: 'warning',
    issues: [],
    ...overrides,
  };
}

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'high-bounce',
    title: 'High Bounce Rate',
    description: 'Bounce rate exceeds threshold',
    severity: 'critical',
    icon: '📬',
    ...overrides,
  };
}

function makeContext(overrides: Partial<AgentContext> = {}): AgentContext {
  return {
    channel: 'email',
    metrics: {
      openRate: 0.21,
      ctr: 0.05,
      bounceRate: 0.05,
      deliveryRate: 0.95,
      unsubscribeRate: 0.005,
    },
    issueId: 'high-bounce',
    issueTitle: 'High Bounce Rate',
    severity: 'critical',
    segmentSizeBucket: '5k-50k',
    campaignAgeDays: 10,
    ...overrides,
  };
}

function makeOutput(overrides: Partial<AgentOutput> = {}): AgentOutput {
  return {
    recommendationTitle: 'Clean your bounce list',
    recommendationText: 'Your bounce rate of 5% exceeds the threshold. Remove hard bounces.',
    citedMetrics: ['bounceRate'],
    toolCallRequested: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// containsPII
// ---------------------------------------------------------------------------

describe('containsPII', () => {
  it('detects email addresses', () => {
    expect(containsPII('Contact john@example.com for details')).toBe(true);
  });

  it('detects phone numbers', () => {
    expect(containsPII('Call 555-123-4567 now')).toBe(true);
    expect(containsPII('Call (555) 123-4567')).toBe(true);
    expect(containsPII('Call +1-555-123-4567')).toBe(true);
  });

  it('returns false for clean text', () => {
    expect(containsPII('Your bounce rate is 5% which exceeds the threshold')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(containsPII('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeForSlack
// ---------------------------------------------------------------------------

describe('sanitizeForSlack', () => {
  it('redacts emails', () => {
    expect(sanitizeForSlack('Email admin@co.com for help')).toBe(
      'Email [EMAIL REDACTED] for help'
    );
  });

  it('redacts phone numbers', () => {
    expect(sanitizeForSlack('Call 555-123-4567')).toBe('Call [PHONE REDACTED]');
  });
});

// ---------------------------------------------------------------------------
// sanitizeForAgent
// ---------------------------------------------------------------------------

describe('sanitizeForAgent', () => {
  it('includes allowlisted fields', () => {
    const ctx = sanitizeForAgent(makeCampaign(), makeIssue());
    expect(ctx.channel).toBe('email');
    expect(ctx.metrics.openRate).toBeCloseTo(0.2105);
    expect(ctx.metrics.bounceRate).toBeCloseTo(0.05);
    expect(ctx.severity).toBe('critical');
  });

  it('excludes campaign name and segmentId', () => {
    const ctx = sanitizeForAgent(
      makeCampaign({ name: 'Secret Campaign', segmentId: 'seg-123' }),
      makeIssue()
    );
    const serialized = JSON.stringify(ctx);
    expect(serialized).not.toContain('Secret Campaign');
    expect(serialized).not.toContain('seg-123');
  });

  it('buckets segment size correctly', () => {
    expect(sanitizeForAgent(makeCampaign({ segmentSize: 100 }), makeIssue()).segmentSizeBucket).toBe('50-500');
    expect(sanitizeForAgent(makeCampaign({ segmentSize: 1000 }), makeIssue()).segmentSizeBucket).toBe('500-5k');
    expect(sanitizeForAgent(makeCampaign({ segmentSize: 10000 }), makeIssue()).segmentSizeBucket).toBe('5k-50k');
    expect(sanitizeForAgent(makeCampaign({ segmentSize: 100000 }), makeIssue()).segmentSizeBucket).toBe('50k+');
  });

  it('suppresses segment size below k-anonymity floor (<50)', () => {
    const ctx = sanitizeForAgent(makeCampaign({ segmentSize: 30 }), makeIssue());
    expect(ctx.segmentSizeBucket).toBeNull();
  });

  it('handles undefined segment size', () => {
    const ctx = sanitizeForAgent(makeCampaign({ segmentSize: undefined }), makeIssue());
    expect(ctx.segmentSizeBucket).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// groundingCheck
// ---------------------------------------------------------------------------

describe('groundingCheck', () => {
  it('approves when all citedMetrics exist in context', () => {
    const result = groundingCheck(
      makeOutput({ citedMetrics: ['bounceRate', 'deliveryRate'] }),
      makeContext()
    );
    expect(result.approved).toBe(true);
  });

  it('rejects ungrounded metric citations', () => {
    const result = groundingCheck(
      makeOutput({ citedMetrics: ['bounceRate', 'revenuePerUser'] }),
      makeContext()
    );
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('revenuePerUser');
  });

  it('rejects output containing PII', () => {
    const result = groundingCheck(
      makeOutput({ recommendationText: 'Contact admin@test.com to fix this' }),
      makeContext()
    );
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('PII');
  });

  it('rejects overly long text', () => {
    const result = groundingCheck(
      makeOutput({ recommendationText: 'x'.repeat(1501) }),
      makeContext()
    );
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('length');
  });
});

// ---------------------------------------------------------------------------
// checkCostGate
// ---------------------------------------------------------------------------

describe('checkCostGate', () => {
  const config: CostGateConfig = { maxDailyCalls: 50, haikuThreshold: 30 };
  const today = new Date().toISOString().split('T')[0];

  it('allows under limit with sonnet', () => {
    const state: CostGateState = { dailyCallCount: 5, dailyResetDate: today, totalTokensUsed: 0 };
    const result = checkCostGate(state, config);
    expect(result.allowed).toBe(true);
    expect(result.model).toBe('sonnet');
    expect(result.updatedState.dailyCallCount).toBe(6);
  });

  it('switches to haiku after threshold', () => {
    const state: CostGateState = { dailyCallCount: 30, dailyResetDate: today, totalTokensUsed: 0 };
    const result = checkCostGate(state, config);
    expect(result.allowed).toBe(true);
    expect(result.model).toBe('haiku');
  });

  it('blocks at daily limit', () => {
    const state: CostGateState = { dailyCallCount: 50, dailyResetDate: today, totalTokensUsed: 0 };
    const result = checkCostGate(state, config);
    expect(result.allowed).toBe(false);
  });

  it('resets counter on new day', () => {
    const state: CostGateState = { dailyCallCount: 50, dailyResetDate: '2020-01-01', totalTokensUsed: 100 };
    const result = checkCostGate(state, config);
    expect(result.allowed).toBe(true);
    expect(result.updatedState.dailyCallCount).toBe(1);
    expect(result.updatedState.totalTokensUsed).toBe(100);
  });
});
