import type { CampaignWithMetrics, Issue, Recommendation } from '@/types/clevertap';
import type {
  AgentContext,
  AgentOutput,
  ReflectionResult,
  CostGateState,
  CostGateConfig,
} from '@/types/agent';
import { DEFAULT_COST_GATE_CONFIG } from '@/types/agent';

// ---------------------------------------------------------------------------
// PII Detection & Sanitization
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

export function containsPII(text: string): boolean {
  if (!text) return false;
  return EMAIL_REGEX.test(text) || PHONE_REGEX.test(text);
}

export function sanitizeForSlack(text: string): string {
  return text
    .replace(EMAIL_REGEX, '[EMAIL REDACTED]')
    .replace(PHONE_REGEX, '[PHONE REDACTED]');
}

function bucketSegmentSize(size: number | undefined): string | null {
  if (size === undefined || size === null) return null;
  if (size < 50) return null; // k-anonymity suppression
  if (size < 500) return '50-500';
  if (size < 5000) return '500-5k';
  if (size < 50000) return '5k-50k';
  return '50k+';
}

export function sanitizeForAgent(
  campaign: CampaignWithMetrics,
  issue: Issue
): AgentContext {
  const now = new Date();
  const campaignDate = new Date(campaign.date);
  const campaignAgeDays = Math.max(
    0,
    Math.floor((now.getTime() - campaignDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    channel: campaign.channel,
    metrics: {
      openRate: campaign.openRate,
      ctr: campaign.ctr,
      bounceRate: campaign.bounceRate,
      deliveryRate: campaign.deliveryRate,
      unsubscribeRate: campaign.unsubscribeRate,
    },
    issueId: issue.id,
    issueTitle: issue.title,
    severity: issue.severity,
    segmentSizeBucket: bucketSegmentSize(campaign.segmentSize),
    campaignAgeDays,
  };
}

// ---------------------------------------------------------------------------
// Cost Gate
// ---------------------------------------------------------------------------

export function checkCostGate(
  state: CostGateState,
  config: CostGateConfig = DEFAULT_COST_GATE_CONFIG
): { allowed: boolean; model: 'sonnet' | 'haiku'; updatedState: CostGateState } {
  const today = new Date().toISOString().split('T')[0];

  // Reset counter on new day
  let currentState = state;
  if (state.dailyResetDate !== today) {
    currentState = { dailyCallCount: 0, dailyResetDate: today, totalTokensUsed: state.totalTokensUsed };
  }

  if (currentState.dailyCallCount >= config.maxDailyCalls) {
    return { allowed: false, model: 'haiku', updatedState: currentState };
  }

  const model = currentState.dailyCallCount >= config.haikuThreshold ? 'haiku' : 'sonnet';

  return {
    allowed: true,
    model,
    updatedState: {
      ...currentState,
      dailyCallCount: currentState.dailyCallCount + 1,
    },
  };
}

// ---------------------------------------------------------------------------
// API Call
// ---------------------------------------------------------------------------

export async function generateRecommendation(
  context: AgentContext,
  model: 'sonnet' | 'haiku'
): Promise<AgentOutput> {
  const res = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, model }),
  });

  if (!res.ok) {
    throw new Error(`Agent API returned ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Grounding & Reflection
// ---------------------------------------------------------------------------

const VALID_METRIC_NAMES = ['openRate', 'ctr', 'bounceRate', 'deliveryRate', 'unsubscribeRate'];
const MAX_RECOMMENDATION_LENGTH = 1500;

export function groundingCheck(output: AgentOutput, context: AgentContext): ReflectionResult {
  // Check cited metrics exist in context
  const contextMetricKeys = Object.keys(context.metrics);
  const invalidMetrics = output.citedMetrics.filter(m => !contextMetricKeys.includes(m));
  if (invalidMetrics.length > 0) {
    return { approved: false, reason: `Ungrounded metrics cited: ${invalidMetrics.join(', ')}` };
  }

  // Validate cited metrics are known metric names
  const unknownMetrics = output.citedMetrics.filter(m => !VALID_METRIC_NAMES.includes(m));
  if (unknownMetrics.length > 0) {
    return { approved: false, reason: `Unknown metrics cited: ${unknownMetrics.join(', ')}` };
  }

  // PII check on output text
  const fullText = `${output.recommendationTitle} ${output.recommendationText}`;
  if (containsPII(fullText)) {
    return { approved: false, reason: 'Output contains PII' };
  }

  // Length check
  if (output.recommendationText.length > MAX_RECOMMENDATION_LENGTH) {
    return { approved: false, reason: 'Recommendation text exceeds maximum length' };
  }

  return { approved: true };
}

export function reflectOnRecommendation(
  output: AgentOutput,
  context: AgentContext
): ReflectionResult {
  return groundingCheck(output, context);
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function enhanceWithAgent(
  campaign: CampaignWithMetrics,
  issue: Issue,
  existingRec: Recommendation,
  costGateState: CostGateState,
  config: CostGateConfig = DEFAULT_COST_GATE_CONFIG
): Promise<{ recommendation: Recommendation; enhanced: boolean; updatedCostGateState: CostGateState }> {
  try {
    // 1. Cost gate check
    const gate = checkCostGate(costGateState, config);
    if (!gate.allowed) {
      return { recommendation: existingRec, enhanced: false, updatedCostGateState: gate.updatedState };
    }

    // 2. Sanitize context
    const context = sanitizeForAgent(campaign, issue);

    // 3. Generate recommendation via API
    const output = await generateRecommendation(context, gate.model);

    // 4. Reflect / validate
    const reflection = reflectOnRecommendation(output, context);
    if (!reflection.approved) {
      console.warn(`Agent recommendation rejected: ${reflection.reason}`);
      return { recommendation: existingRec, enhanced: false, updatedCostGateState: gate.updatedState };
    }

    // 5. Merge with existing recommendation (preserve actionType/actionLabel)
    const enhanced: Recommendation = {
      ...existingRec,
      title: output.recommendationTitle,
      description: output.recommendationText,
    };

    return { recommendation: enhanced, enhanced: true, updatedCostGateState: gate.updatedState };
  } catch (err) {
    console.warn('Agent enhancement failed, falling back to static recommendation:', err);
    return { recommendation: existingRec, enhanced: false, updatedCostGateState: costGateState };
  }
}
