import React from 'react';
import { useApp } from '@/context/AppContext';
import { CampaignWithMetrics, HealthStatus } from '@/types/clevertap';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Mail, Bell, MessageSquare, Smartphone } from 'lucide-react';

const channelIcons = {
  email: Mail,
  push: Bell,
  sms: MessageSquare,
  inapp: Smartphone,
};

const healthBadge = (s: HealthStatus) => {
  const map = {
    healthy: { label: '🟢 Healthy', cls: 'bg-healthy/10 text-healthy border-healthy/20' },
    warning: { label: '🟡 Warning', cls: 'bg-warning/10 text-warning border-warning/20' },
    critical: { label: '🔴 Critical', cls: 'bg-critical/10 text-critical border-critical/20' },
  };
  const { label, cls } = map[s];
  return <Badge variant="outline" className={`${cls} text-xs font-mono`}>{label}</Badge>;
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

const CampaignTable: React.FC = () => {
  const { campaigns, channelFilter, setSelectedCampaign, isLoading } = useApp();

  const filtered = campaigns
    .filter(c => channelFilter === 'all' || c.channel === channelFilter)
    .sort((a, b) => {
      const order: Record<HealthStatus, number> = { critical: 0, warning: 1, healthy: 2 };
      return order[a.healthScore] - order[b.healthScore];
    });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No campaigns found</p>
        <p className="text-sm mt-1">Try adjusting your filters or date range</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Campaign</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Channel</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground font-mono">Sent</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground font-mono">Delivered</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground font-mono">Open Rate</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground font-mono">CTR</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground font-mono">Bounce</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Health</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const Icon = channelIcons[c.channel];
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCampaign(c)}
                  className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs capitalize">{c.channel}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{c.date}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.sent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.delivered.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{pct(c.openRate)}</td>
                  <td className="px-4 py-3 text-right font-mono">{pct(c.ctr)}</td>
                  <td className="px-4 py-3 text-right font-mono">{pct(c.bounceRate)}</td>
                  <td className="px-4 py-3 text-center">{healthBadge(c.healthScore)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampaignTable;
