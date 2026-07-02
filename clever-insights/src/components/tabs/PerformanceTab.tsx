import React from 'react';
import { CampaignWithMetrics } from '@/types/clevertap';
import { useApp } from '@/context/AppContext';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  campaign: CampaignWithMetrics;
}

const PerformanceTab: React.FC<Props> = ({ campaign }) => {
  const { benchmarks } = useApp();
  const bench = benchmarks[campaign.channel];

  const metrics = [
    { name: 'Open Rate', campaign: campaign.openRate, benchmark: bench?.avgOpenRate || 0 },
    { name: 'CTR', campaign: campaign.ctr, benchmark: bench?.avgCtr || 0 },
    { name: 'Delivery', campaign: campaign.deliveryRate, benchmark: bench?.avgDeliveryRate || 0 },
    { name: 'Bounce', campaign: campaign.bounceRate, benchmark: bench?.avgBounceRate || 0 },
    { name: 'Unsub', campaign: campaign.unsubscribeRate, benchmark: bench?.avgUnsubscribeRate || 0 },
  ];

  const radarData = metrics.map(m => ({
    metric: m.name,
    Campaign: Math.round(m.campaign * 100),
    Benchmark: Math.round(m.benchmark * 100),
  }));

  const delta = (val: number, avg: number) => {
    const diff = ((val - avg) * 100).toFixed(1);
    const positive = val >= avg;
    return (
      <span className={`text-xs font-mono ${positive ? 'text-healthy' : 'text-critical'}`}>
        {positive ? '+' : ''}{diff}% vs avg
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar name="Campaign" dataKey="Campaign" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
            <Radar name="Benchmark" dataKey="Benchmark" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.1} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {metrics.map(m => (
          <div key={m.name} className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">{m.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-medium">{(m.campaign * 100).toFixed(1)}%</span>
              {delta(m.campaign, m.benchmark)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="text-lg font-mono font-bold">{campaign.sent.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Sent</div>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="text-lg font-mono font-bold">{campaign.clicks.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Clicks</div>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="text-lg font-mono font-bold">{campaign.conversions.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Conversions</div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTab;
