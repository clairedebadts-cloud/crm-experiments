import { CampaignWithMetrics, ChannelBenchmark, AlertSettings, Alert, Channel } from '@/types/clevertap';

/**
 * Detect deliverability drops that need IMMEDIATE alerting.
 * Triggers when delivery rate drops below X% of the channel average.
 */
export function detectDeliverabilityAlerts(
  campaigns: CampaignWithMetrics[],
  benchmarks: Record<string, ChannelBenchmark>,
  settings: AlertSettings
): Alert[] {
  const alerts: Alert[] = [];
  const threshold = settings.deliverabilityDropThreshold;

  campaigns.forEach(c => {
    const benchmark = benchmarks[c.channel];
    if (!benchmark || benchmark.avgDeliveryRate === 0) return;

    const drop = (benchmark.avgDeliveryRate - c.deliveryRate) / benchmark.avgDeliveryRate;
    if (drop >= threshold) {
      alerts.push({
        id: `del-drop-${c.id}`,
        type: 'deliverability_drop',
        priority: 'immediate',
        title: `⚠️ Deliverability Drop — ${c.channel.toUpperCase()}`,
        description: `Campaign delivery rate fell ${(drop * 100).toFixed(1)}% below channel average.`,
        channel: c.channel,
        campaignName: c.name,
        metric: 'Delivery Rate',
        currentValue: c.deliveryRate,
        benchmarkValue: benchmark.avgDeliveryRate,
        dropPercent: drop,
        createdAt: new Date().toISOString(),
        sent: false,
      });
    }
  });

  return alerts;
}

/**
 * Detect performance drops (open rate, CTR, etc.) — DELAYED alerting (3-5 days).
 * Only triggers if the campaign is older than the delay window.
 */
export function detectPerformanceAlerts(
  campaigns: CampaignWithMetrics[],
  benchmarks: Record<string, ChannelBenchmark>,
  settings: AlertSettings
): Alert[] {
  const alerts: Alert[] = [];
  const threshold = settings.performanceDropThreshold;
  const delayMs = settings.performanceDelayDays * 86400000;
  const now = Date.now();

  campaigns.forEach(c => {
    const benchmark = benchmarks[c.channel];
    if (!benchmark) return;

    const campaignAge = now - new Date(c.date).getTime();
    if (campaignAge < delayMs) return; // Too recent, wait

    const metrics: { name: string; current: number; avg: number }[] = [
      { name: 'Open Rate', current: c.openRate, avg: benchmark.avgOpenRate },
      { name: 'CTR', current: c.ctr, avg: benchmark.avgCtr },
    ];

    metrics.forEach(m => {
      if (m.avg === 0) return;
      const drop = (m.avg - m.current) / m.avg;
      if (drop >= threshold) {
        alerts.push({
          id: `perf-${m.name.toLowerCase().replace(/\s/g, '-')}-${c.id}`,
          type: 'performance_drop',
          priority: 'delayed',
          title: `📉 ${m.name} Below Average — ${c.channel.toUpperCase()}`,
          description: `${m.name} dropped ${(drop * 100).toFixed(1)}% below the channel average after ${settings.performanceDelayDays} days.`,
          channel: c.channel,
          campaignName: c.name,
          metric: m.name,
          currentValue: m.current,
          benchmarkValue: m.avg,
          dropPercent: drop,
          createdAt: new Date().toISOString(),
          sent: false,
        });
      }
    });
  });

  return alerts;
}

/**
 * Detect new domains with high hard-bounce rates — IMMEDIATE alerting.
 * In mock mode, simulates by analyzing bounce rates per campaign.
 */
export function detectHardBounceDomains(
  campaigns: CampaignWithMetrics[]
): Alert[] {
  const alerts: Alert[] = [];

  // Mock: detect campaigns with unusually high bounce rates as proxy for bad domains
  const highBounceCampaigns = campaigns.filter(
    c => c.channel === 'email' && c.bounceRate > 0.08
  );

  if (highBounceCampaigns.length > 0) {
    // Simulate detected problematic domains
    const mockDomains = ['tempmail.xyz', 'disposable.io', 'fakeinbox.net'];
    const affectedCount = highBounceCampaigns.reduce((sum, c) => sum + c.bounces, 0);

    alerts.push({
      id: `bounce-domain-${Date.now()}`,
      type: 'hard_bounce_domain',
      priority: 'immediate',
      title: '🚫 New Hard-Bounce Domains Detected',
      description: `${mockDomains.length} domains showing high bounce rates — possible disposable/invalid domains. ~${affectedCount.toLocaleString()} bounces affected.`,
      domains: mockDomains,
      createdAt: new Date().toISOString(),
      sent: false,
    });
  }

  return alerts;
}

/**
 * Generate weekly recap data for marketing team.
 * Only includes campaigns active in the last 7 days.
 */
export function generateWeeklyRecap(
  campaigns: CampaignWithMetrics[],
  benchmarks: Record<string, ChannelBenchmark>
): WeeklyRecap {
  const now = Date.now();
  const sevenDaysMs = 7 * 86400000;
  const fortyEightHoursMs = 48 * 3600000;

  const activeCampaigns = campaigns.filter(c => {
    const age = now - new Date(c.date).getTime();
    return age <= sevenDaysMs;
  });

  const channels: Channel[] = ['email', 'push', 'sms', 'inapp'];
  const channelSummaries: ChannelSummary[] = channels
    .map(ch => {
      const chCampaigns = activeCampaigns.filter(c => c.channel === ch);
      if (chCampaigns.length === 0) return null;

      const benchmark = benchmarks[ch];
      const totalSent = chCampaigns.reduce((s, c) => s + c.sent, 0);
      const totalDelivered = chCampaigns.reduce((s, c) => s + c.delivered, 0);
      const avgOpenRate = chCampaigns.reduce((s, c) => s + c.openRate, 0) / chCampaigns.length;
      const avgCtr = chCampaigns.reduce((s, c) => s + c.ctr, 0) / chCampaigns.length;
      const avgBounce = chCampaigns.reduce((s, c) => s + c.bounceRate, 0) / chCampaigns.length;
      const issues = chCampaigns.reduce((s, c) => s + c.issues.length, 0);

      return {
        channel: ch,
        campaignCount: chCampaigns.length,
        totalSent,
        totalDelivered,
        avgOpenRate,
        avgCtr,
        avgBounceRate: avgBounce,
        avgDeliveryRate: totalSent > 0 ? totalDelivered / totalSent : 0,
        benchmarkOpenRate: benchmark?.avgOpenRate || 0,
        benchmarkCtr: benchmark?.avgCtr || 0,
        issueCount: issues,
        healthDistribution: {
          healthy: chCampaigns.filter(c => c.healthScore === 'healthy').length,
          warning: chCampaigns.filter(c => c.healthScore === 'warning').length,
          critical: chCampaigns.filter(c => c.healthScore === 'critical').length,
        },
      };
    })
    .filter(Boolean) as ChannelSummary[];

  const recentActivity = activeCampaigns
    .filter(c => (now - new Date(c.date).getTime()) <= fortyEightHoursMs)
    .map(c => ({
      name: c.name,
      channel: c.channel,
      sent: c.sent,
      healthScore: c.healthScore,
    }));

  return {
    periodStart: new Date(now - sevenDaysMs).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    totalCampaigns: activeCampaigns.length,
    channelSummaries,
    recentActivity,
    overallHealth: activeCampaigns.some(c => c.healthScore === 'critical') ? 'critical'
      : activeCampaigns.some(c => c.healthScore === 'warning') ? 'warning' : 'healthy',
  };
}

export interface ChannelSummary {
  channel: Channel;
  campaignCount: number;
  totalSent: number;
  totalDelivered: number;
  avgOpenRate: number;
  avgCtr: number;
  avgBounceRate: number;
  avgDeliveryRate: number;
  benchmarkOpenRate: number;
  benchmarkCtr: number;
  issueCount: number;
  healthDistribution: { healthy: number; warning: number; critical: number };
}

export interface WeeklyRecap {
  periodStart: string;
  periodEnd: string;
  totalCampaigns: number;
  channelSummaries: ChannelSummary[];
  recentActivity: { name: string; channel: Channel; sent: number; healthScore: string }[];
  overallHealth: string;
}

/**
 * Run all alert checks and return combined alerts.
 */
export function runAlertChecks(
  campaigns: CampaignWithMetrics[],
  benchmarks: Record<string, ChannelBenchmark>,
  settings: AlertSettings
): Alert[] {
  return [
    ...detectDeliverabilityAlerts(campaigns, benchmarks, settings),
    ...detectPerformanceAlerts(campaigns, benchmarks, settings),
    ...(settings.hardBounceAlertEnabled ? detectHardBounceDomains(campaigns) : []),
  ];
}
