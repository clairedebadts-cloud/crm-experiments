import { Campaign, CampaignWithMetrics, ChannelBenchmark, Thresholds, Issue } from '@/types/clevertap';

export function computeMetrics(c: Campaign) {
  const deliveryRate = c.sent > 0 ? c.delivered / c.sent : 0;
  const openRate = c.delivered > 0 ? c.opens / c.delivered : 0;
  const ctr = c.delivered > 0 ? c.clicks / c.delivered : 0;
  const bounceRate = c.sent > 0 ? c.bounces / c.sent : 0;
  const unsubscribeRate = c.delivered > 0 ? c.unsubscribes / c.delivered : 0;
  return { openRate, ctr, bounceRate, deliveryRate, unsubscribeRate };
}

export function detectIssues(
  campaign: CampaignWithMetrics,
  benchmark: ChannelBenchmark | undefined,
  thresholds: Thresholds,
  allCampaigns: Campaign[]
): Issue[] {
  const issues: Issue[] = [];

  // Bot Traffic: CTR > 35% OR clicks > opens
  if (campaign.ctr > 0.35 || (campaign.clicks > campaign.opens && campaign.clicks > 0)) {
    issues.push({
      id: 'bot-traffic',
      title: '🤖 Bot Traffic Detected',
      description: `CTR of ${(campaign.ctr * 100).toFixed(1)}% is abnormally high, or clicks exceed opens — likely bot activity.`,
      severity: 'critical',
      icon: '🤖',
      recommendation: {
        title: 'Investigate Bot Filtering',
        description: 'Enable bot click filtering in your CleverTap settings and consider re-sending to verified openers only.',
      },
    });
  }

  // High Bounce
  if (campaign.channel === 'email' && campaign.bounceRate > (thresholds.email.bounce)) {
    issues.push({
      id: 'high-bounce',
      title: '📬 High Bounce Rate',
      description: `Bounce rate of ${(campaign.bounceRate * 100).toFixed(1)}% exceeds the ${(thresholds.email.bounce * 100)}% threshold.`,
      severity: 'critical',
      icon: '📬',
      recommendation: {
        title: 'List Hygiene',
        description: 'Remove hard bounced users from your lists to improve deliverability.',
        actionLabel: 'Clean Bounce List',
        actionType: 'listHygiene',
        estimatedImpact: `~${campaign.bounces.toLocaleString()} users affected`,
      },
    });
  }
  if (campaign.channel === 'push' && campaign.deliveryRate < (thresholds.push.delivery)) {
    issues.push({
      id: 'push-low-delivery',
      title: '📬 Low Push Delivery',
      description: `Delivery rate of ${(campaign.deliveryRate * 100).toFixed(1)}% is below ${(thresholds.push.delivery * 100)}% threshold.`,
      severity: 'warning',
      icon: '📬',
    });
  }

  // Setup Issue
  if (campaign.deliveryRate < 0.85) {
    issues.push({
      id: 'setup-issue',
      title: '⚙️ Setup Issue',
      description: `Delivery rate of ${(campaign.deliveryRate * 100).toFixed(1)}% suggests configuration problems.`,
      severity: 'warning',
      icon: '⚙️',
    });
  }

  // SMS Silent — Missing DND config
  if (campaign.channel === 'sms' && campaign.hasDndConfig === false) {
    issues.push({
      id: 'sms-silent',
      title: '🔇 SMS DND Missing',
      description: 'This SMS campaign has no DND/quiet hours configuration.',
      severity: 'warning',
      icon: '🔇',
      recommendation: {
        title: 'Fix SMS DND',
        description: 'Configure quiet hours and DND compliance in your CleverTap SMS settings.',
        actionLabel: 'View DND Docs',
        actionType: 'fixDnd',
      },
    });
  }

  // Low Engagement
  if (benchmark && benchmark.avgOpenRate > 0 && campaign.openRate < benchmark.avgOpenRate * 0.5) {
    issues.push({
      id: 'low-engagement',
      title: '📉 Low Engagement',
      description: `Open rate ${(campaign.openRate * 100).toFixed(1)}% is less than half the channel average of ${(benchmark.avgOpenRate * 100).toFixed(1)}%.`,
      severity: 'warning',
      icon: '📉',
      recommendation: {
        title: 'Sunset Journey',
        description: 'Add non-openers to a re-engagement journey to win them back or sunset them.',
        actionLabel: 'Create Sunset Segment',
        actionType: 'sunset',
        estimatedImpact: `~${Math.round(campaign.sent * (1 - campaign.openRate)).toLocaleString()} users affected`,
      },
    });
  }

  // Frequency Fatigue
  const sameSeg = allCampaigns.filter(c =>
    c.segmentId === campaign.segmentId && c.id !== campaign.id
  );
  const recentSameSeg = sameSeg.filter(c => {
    const diff = Math.abs(new Date(campaign.date).getTime() - new Date(c.date).getTime());
    return diff < thresholds.frequencyWindowDays * 86400000;
  });
  if (recentSameSeg.length >= thresholds.sunsetAfterCampaigns - 1) {
    issues.push({
      id: 'frequency-fatigue',
      title: '🔁 Frequency Fatigue',
      description: `${recentSameSeg.length + 1} campaigns sent to the same segment within ${thresholds.frequencyWindowDays} days.`,
      severity: 'warning',
      icon: '🔁',
      recommendation: {
        title: 'Deactivate Channel',
        description: 'Consider pausing communications to this segment to reduce fatigue.',
        actionLabel: 'Deactivate Channel',
        actionType: 'deactivate',
      },
    });
  }

  // No Conversion
  if (campaign.clicks > 0 && campaign.conversions === 0) {
    issues.push({
      id: 'no-conversion',
      title: '❌ No Conversions',
      description: `${campaign.clicks.toLocaleString()} clicks but zero conversions — check your landing page or conversion tracking.`,
      severity: 'critical',
      icon: '❌',
    });
  }

  return issues;
}
