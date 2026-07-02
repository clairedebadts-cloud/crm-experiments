import { useState, useEffect, useRef } from 'react';
import type { CampaignWithMetrics, Issue, Recommendation } from '@/types/clevertap';
import type { CostGateState } from '@/types/agent';
import { enhanceWithAgent } from '@/lib/agentEngine';
import { DEFAULT_COST_GATE_CONFIG } from '@/types/agent';

export interface AgentRecommendation {
  issue: Issue;
  recommendation: Recommendation;
  enhanced: boolean;
  loading: boolean;
}

export function useAgentRecommendation(
  campaign: CampaignWithMetrics,
  costGateState: CostGateState,
  setCostGateState: (s: CostGateState) => void
) {
  const [results, setResults] = useState<AgentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const issuesWithRecs = campaign.issues.filter((i) => i.recommendation);

    if (issuesWithRecs.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Initialize with static recommendations in loading state
    setResults(
      issuesWithRecs.map((issue) => ({
        issue,
        recommendation: issue.recommendation!,
        enhanced: false,
        loading: true,
      }))
    );
    setLoading(true);

    let currentCostGateState = costGateState;

    // Process issues sequentially to respect rate limits
    (async () => {
      for (let idx = 0; idx < issuesWithRecs.length; idx++) {
        if (cancelledRef.current) return;

        const issue = issuesWithRecs[idx];
        const existingRec = issue.recommendation!;

        try {
          const result = await enhanceWithAgent(
            campaign,
            issue,
            existingRec,
            currentCostGateState,
            DEFAULT_COST_GATE_CONFIG
          );

          currentCostGateState = result.updatedCostGateState;

          if (cancelledRef.current) return;

          setResults((prev) =>
            prev.map((r, i) =>
              i === idx
                ? {
                    ...r,
                    recommendation: result.recommendation,
                    enhanced: result.enhanced,
                    loading: false,
                  }
                : r
            )
          );
        } catch {
          if (cancelledRef.current) return;

          setResults((prev) =>
            prev.map((r, i) =>
              i === idx ? { ...r, loading: false } : r
            )
          );
        }
      }

      if (!cancelledRef.current) {
        setCostGateState(currentCostGateState);
        setLoading(false);
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [campaign.id]);

  const budgetExhausted =
    costGateState.dailyCallCount >= DEFAULT_COST_GATE_CONFIG.maxDailyCalls;

  return { results, loading, budgetExhausted };
}
