import React from 'react';
import { WeeklyRecap, ChannelSummary } from '@/lib/alertEngine';
import { Channel } from '@/types/clevertap';

const channelEmoji: Record<Channel, string> = {
  email: '✉️', push: '📲', sms: '💬', inapp: '📱',
};

const healthEmoji: Record<string, string> = {
  healthy: '☀️', warning: '⛅', critical: '🌧️',
};

const healthLabel: Record<string, string> = {
  healthy: 'Clear skies', warning: 'Partly cloudy', critical: 'Stormy',
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

const DeltaBadge: React.FC<{ current: number; benchmark: number }> = ({ current, benchmark }) => {
  if (benchmark === 0) return null;
  const delta = ((current - benchmark) / benchmark) * 100;
  const isPositive = delta >= 0;
  return (
    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full ${
      isPositive ? 'bg-healthy/15 text-healthy' : 'bg-critical/15 text-critical'
    }`}>
      {isPositive ? '↑' : '↓'}{Math.abs(delta).toFixed(1)}%
    </span>
  );
};

const ChannelCard: React.FC<{ summary: ChannelSummary }> = ({ summary }) => {
  const { healthy, warning, critical } = summary.healthDistribution;
  const total = healthy + warning + critical;
  return (
    <div className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{channelEmoji[summary.channel]}</span>
          <span className="text-sm font-semibold capitalize">{summary.channel}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {summary.campaignCount} campaign{summary.campaignCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex gap-1">
          {healthy > 0 && <span className="w-2 h-2 rounded-full bg-healthy" title={`${healthy} healthy`} />}
          {warning > 0 && <span className="w-2 h-2 rounded-full bg-warning" title={`${warning} warning`} />}
          {critical > 0 && <span className="w-2 h-2 rounded-full bg-critical" title={`${critical} critical`} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sent</p>
          <p className="text-sm font-mono font-semibold">{summary.totalSent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Delivered</p>
          <p className="text-sm font-mono font-semibold">{pct(summary.avgDeliveryRate)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open Rate</p>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-mono font-semibold">{pct(summary.avgOpenRate)}</p>
            <DeltaBadge current={summary.avgOpenRate} benchmark={summary.benchmarkOpenRate} />
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CTR</p>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-mono font-semibold">{pct(summary.avgCtr)}</p>
            <DeltaBadge current={summary.avgCtr} benchmark={summary.benchmarkCtr} />
          </div>
        </div>
      </div>

      {summary.issueCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-warning">
          <span>⚡</span>
          <span>{summary.issueCount} issue{summary.issueCount !== 1 ? 's' : ''} detected</span>
        </div>
      )}

      {/* Mini health bar */}
      {total > 0 && (
        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
          {healthy > 0 && <div className="bg-healthy" style={{ width: `${(healthy / total) * 100}%` }} />}
          {warning > 0 && <div className="bg-warning" style={{ width: `${(warning / total) * 100}%` }} />}
          {critical > 0 && <div className="bg-critical" style={{ width: `${(critical / total) * 100}%` }} />}
        </div>
      )}
    </div>
  );
};

interface Props {
  recap: WeeklyRecap;
}

const WeeklyRecapPreview: React.FC<Props> = ({ recap }) => {
  const weatherIcon = healthEmoji[recap.overallHealth] || '☀️';
  const weatherText = healthLabel[recap.overallHealth] || 'Clear skies';

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden max-w-2xl mx-auto">
      {/* Header — Weather style */}
      <div className="px-6 py-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Campaign Weather Report</p>
            <h2 className="text-lg font-semibold mt-1">
              {recap.periodStart} → {recap.periodEnd}
            </h2>
          </div>
          <div className="text-center">
            <span className="text-4xl">{weatherIcon}</span>
            <p className="text-xs text-muted-foreground mt-1">{weatherText}</p>
          </div>
        </div>
      </div>

      {/* Overall forecast */}
      <div className="px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">This week's outlook</p>
            <p className="text-xl font-semibold font-mono">{recap.totalCampaigns}</p>
            <p className="text-xs text-muted-foreground">active campaigns across all channels</p>
          </div>
        </div>
      </div>

      {/* Channel cards */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider px-2">Channel Forecast</p>
        {recap.channelSummaries.map(s => (
          <ChannelCard key={s.channel} summary={s} />
        ))}
      </div>

      {/* Recent activity — last 48h */}
      {recap.recentActivity.length > 0 && (
        <div className="px-6 py-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            ⚡ Last 48 Hours
          </p>
          <div className="space-y-2">
            {recap.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{channelEmoji[a.channel]}</span>
                  <span className="truncate max-w-[200px]">{a.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {a.sent.toLocaleString()} sent
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    a.healthScore === 'healthy' ? 'bg-healthy' :
                    a.healthScore === 'warning' ? 'bg-warning' : 'bg-critical'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border/30 bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          No customer personal data included • Campaign Intelligence Dashboard • Auto-generated weekly recap
        </p>
      </div>
    </div>
  );
};

export default WeeklyRecapPreview;
