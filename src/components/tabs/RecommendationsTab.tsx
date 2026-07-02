import React from 'react';
import { CampaignWithMetrics } from '@/types/clevertap';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, Power, Trash2, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { useAgentRecommendation } from '@/hooks/useAgentRecommendation';

interface Props {
  campaign: CampaignWithMetrics;
}

const actionIcons = {
  sunset: Users,
  deactivate: Power,
  listHygiene: Trash2,
  fixDnd: Clock,
};

const RecommendationsTab: React.FC<Props> = ({ campaign }) => {
  const { costGateState, setCostGateState } = useApp();
  const { results, loading, budgetExhausted } = useAgentRecommendation(
    campaign,
    costGateState,
    setCostGateState
  );

  const hasRecs = campaign.issues.some((i) => i.recommendation);

  if (!hasRecs) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="font-medium text-sm">No Recommendations</p>
        <p className="text-xs text-muted-foreground">This campaign is performing well — nothing to action</p>
      </div>
    );
  }

  const handleAction = (actionType: string, label: string) => {
    if (actionType === 'fixDnd') {
      window.open('https://docs.clevertap.com/docs/sms-quiet-hours', '_blank');
      return;
    }
    toast.success(`${label} action triggered`, {
      description: 'In production, this would call the CleverTap API.',
    });
  };

  return (
    <div className="space-y-3">
      {budgetExhausted && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-xs text-yellow-800 dark:text-yellow-200">
          Daily AI recommendation budget reached. Showing static recommendations.
        </div>
      )}
      {results.map((item, i) => {
        const rec = item.recommendation;
        const Icon = rec.actionType ? actionIcons[rec.actionType] : ExternalLink;

        if (item.loading) {
          return (
            <div key={i} className="bg-muted rounded-xl p-4 space-y-3 border border-border/50 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <div className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-2/3" />
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="bg-muted rounded-xl p-4 space-y-3 border border-border/50">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  {item.enhanced && (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                {rec.estimatedImpact && (
                  <p className="text-xs font-mono text-primary">{rec.estimatedImpact}</p>
                )}
              </div>
            </div>
            {rec.actionLabel && rec.actionType && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => handleAction(rec.actionType!, rec.actionLabel!)}
              >
                {rec.actionLabel}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecommendationsTab;
