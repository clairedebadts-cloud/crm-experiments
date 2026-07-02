import React from 'react';
import { CampaignWithMetrics } from '@/types/clevertap';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface Props {
  campaign: CampaignWithMetrics;
}

const IssuesTab: React.FC<Props> = ({ campaign }) => {
  if (campaign.issues.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-healthy/10">
          <CheckCircle className="w-6 h-6 text-healthy" />
        </div>
        <p className="font-medium text-sm">All Clear!</p>
        <p className="text-xs text-muted-foreground">No issues detected for this campaign</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaign.issues.map(issue => (
        <div key={issue.id} className="bg-muted rounded-xl p-4 space-y-2 border border-border/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{issue.icon}</span>
              <span className="font-medium text-sm">{issue.title}</span>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                issue.severity === 'critical'
                  ? 'bg-critical/10 text-critical border-critical/20'
                  : issue.severity === 'warning'
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : 'bg-healthy/10 text-healthy border-healthy/20'
              }`}
            >
              {issue.severity}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{issue.description}</p>
        </div>
      ))}
    </div>
  );
};

export default IssuesTab;
